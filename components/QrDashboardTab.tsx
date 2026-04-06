
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { jsPDF } from 'jspdf';
import { dbService } from '../services/apiService';
import { QrCode, Appointment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useSettings } from '../contexts/SettingsContext';

const QrDashboardTab: React.FC = () => {
    const [atendimentoId, setAtendimentoId] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [prefixo, setPrefixo] = useState('ATD');
    const [inicio, setInicio] = useState(1);
    const [generatedQr, setGeneratedQr] = useState<string | null>(null);
    const [batchQrs, setBatchQrs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const { appLogo } = useSettings();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Appointments
                const appData = await dbService.from('appointments').select({}, { column: 'created_at', ascending: false });
                const mappedApps = (appData || []).map((item: any) => ({
                    id: item.id,
                    patientName: item.patient_name,
                    patientCpf: item.patient_cpf,
                    patientSusNumber: item.patient_sus_number,
                    date: item.date,
                    time: item.time,
                    status: item.status
                }));
                setAppointments(mappedApps);

                // Fetch Profiles (Patients)
                const profileData = await dbService.from('profiles').select({ role: 'PATIENT' });
                setPatients(profileData || []);

            } catch (err) {
                console.error("Erro ao carregar dados do dashboard QR:", err);
            }
        };
        fetchData();
    }, []);

    const handleGenerateQr = async () => {
        if (!atendimentoId) {
            alert("Selecione ou informe um ID de atendimento");
            return;
        }
        setLoading(true);
        let finalAtendimentoId = atendimentoId;

        try {
            // Se for um novo paciente selecionado (sem atendimento prévio)
            if (atendimentoId.startsWith('new:')) {
                const profileId = atendimentoId.replace('new:', '');
                const patient = patients.find(p => p.id === profileId);
                
                if (patient) {
                    const today = new Date();
                    const formattedDate = today.toLocaleDateString('pt-BR');
                    const formattedTime = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    const newAppResult = await dbService.from('appointments').insert({
                        patient_id: patient.id,
                        patient_name: patient.name,
                        patient_cpf: patient.cpf,
                        date: formattedDate,
                        time: formattedTime,
                        status: 'PENDENTE'
                    });

                    if (newAppResult && newAppResult[0]) {
                        finalAtendimentoId = newAppResult[0].id;
                        // Atualiza a lista local de atendimentos para incluir o novo
                        setAppointments(prev => [{
                            id: newAppResult[0].id,
                            patientName: patient.name,
                            patientCpf: patient.cpf,
                            date: formattedDate,
                            time: formattedTime,
                            status: 'PENDENTE'
                        }, ...prev]);
                    }
                }
            }

            const token = uuidv4();
            await dbService.from('qr_codes').insert({
                token,
                atendimento_id: finalAtendimentoId,
                status: 'active'
            });
            const fullUrl = `${window.location.origin}/#/scanner?token=${token}`;
            setGeneratedQr(fullUrl);
            alert("QR Code gerado com sucesso!");
        } catch (err: any) {
            alert("Erro ao salvar QR Code: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBatchQr = async () => {
        setLoading(true);
        const fullUrls: string[] = [];
        try {
            for (let i = 0; i < quantidade; i++) {
                const token = `${prefixo}-${(inicio + i).toString().padStart(4, '0')}-${uuidv4().substring(0, 8)}`;
                await dbService.from('qr_codes').insert({
                    token,
                    status: 'active'
                });
                const fullUrl = `${window.location.origin}/#/scanner?token=${token}`;
                fullUrls.push(fullUrl);
            }
            setBatchQrs(fullUrls);
            alert(`${quantidade} QR Codes gerados no lote!`);
        } catch (err: any) {
            alert("Erro no lote: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPatientsCSV = async () => {
        try {
            const data = await dbService.from('appointments').select({}, { column: 'created_at', ascending: false });
            const rows = (data || []).map((a: any) => ({
                nome: a.patient_name || '-',
                cpf: a.patient_cpf || '-',
                sus: a.patient_sus_number || '-',
                idade: a.patient_age || '-',
                genero: a.patient_gender || '-',
                data_agendada: a.date || '-',
                horario: a.time || '-',
                status: a.status || '-',
                setor: a.setor || '-',
                codigo: a.codigo_atendimento || a.id?.substring(0, 8) || '-',
            }));
            const header = Object.keys(rows[0] || {});
            const csv = [header, ...rows.map(r => header.map(k => `"${(r as any)[k]}"`))]
                .map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pacientes_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert('Erro ao exportar CSV: ' + err.message);
        }
    };

    const handleExportPatientsJSON = async () => {
        try {
            const data = await dbService.from('appointments').select({}, { column: 'created_at', ascending: false });
            const rows = (data || []).map((a: any) => ({
                nome: a.patient_name || '-',
                cpf: a.patient_cpf || '-',
                sus: a.patient_sus_number || '-',
                idade: a.patient_age || '-',
                genero: a.patient_gender || '-',
                data_agendada: a.date || '-',
                horario: a.time || '-',
                status: a.status || '-',
                setor: a.setor || '-',
                codigo: a.codigo_atendimento || a.id?.substring(0, 8) || '-',
            }));
            const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pacientes_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert('Erro ao exportar JSON: ' + err.message);
        }
    };

    const handleExportPatientsPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        if (appLogo) {
            try {
                doc.addImage(appLogo, 'JPEG', 15, 10, 25, 25);
            } catch (e) {
                console.error("Erro ao incluir logo no PDF", e);
            }
        }
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("LABORATÓRIO MUNICIPAL DE UARINI", 50, 20);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Relatório Geral de Pacientes / Atendimentos", 50, 26);
        doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 50, 31);
        
        doc.setLineWidth(0.5);
        doc.line(15, 40, pageWidth - 15, 40);
        
        // Table Header
        let y = 50;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("NOME", 15, y);
        doc.text("CPF", 85, y);
        doc.text("CARTÃO SUS", 125, y);
        doc.text("DATA", 165, y);
        doc.text("STATUS", 185, y);
        
        doc.setLineWidth(0.1);
        doc.line(15, y + 2, pageWidth - 15, y + 2);
        
        y += 8;
        doc.setFont("helvetica", "normal");
        
        // Table Rows
        appointments.forEach((app, index) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            
            doc.text(app.patientName?.substring(0, 35) || '-', 15, y);
            doc.text(app.patientCpf || '-', 85, y);
            doc.text(app.patientSusNumber || '-', 125, y);
            doc.text(app.date || '-', 165, y);
            doc.text(app.status?.substring(0, 10) || 'PENDENTE', 185, y);
            
            y += 7;
        });

        doc.save(`relatorio_pacientes_${new Date().toISOString().split('T')[0]}.pdf`);
        setShowPreview(false);
    };

    const handleExportPdf = () => {
        if (batchQrs.length === 0) {
            alert("Gere um lote primeiro");
            return;
        }
        const doc = new jsPDF();
        const qrSize = 40;
        const margin = 15;
        const perPageWidth = 3;
        const perPageHeight = 4;
        const totalPerPage = perPageWidth * perPageHeight;

        batchQrs.forEach((url, index) => {
            let token = url;
            if (url.includes('token=')) {
                token = url.split('token=')[1].split('&')[0];
            }

            if (index > 0 && index % totalPerPage === 0) {
                doc.addPage();
            }
            const pageIndex = index % totalPerPage;
            const col = pageIndex % perPageWidth;
            const row = Math.floor(pageIndex / perPageWidth);

            const x = margin + col * (qrSize + 20);
            const y = margin + row * (qrSize + 20);

            doc.setFontSize(8);
            doc.text(token.substring(0, 15), x, y - 5, { align: 'left' });
            // In a browser we can use canvas to get img data. 
            // For now, let's just use the doc.rect as placeholder or assuming we can use canvas
            const canvas = document.createElement('canvas');
            const svg = document.getElementById(`qr-batch-${index}`);
            if (svg) {
                // To do: convert SVG to Canvas then to dataURL
                // Simplified for this task
            }
            doc.rect(x, y, qrSize, qrSize);
            doc.text("[QR]", x + qrSize/2, y + qrSize/2, { align: 'center' });
        });
        doc.save('lote_qr_codes.pdf');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">

            {/* Card Exportar Cadastros */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <i className="fas fa-file-export text-lg"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Exportar Cadastros de Pacientes</h2>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">Exporte todos os atendimentos e dados dos pacientes cadastrados no sistema</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExportPatientsCSV}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-file-csv"></i> Exportar CSV
                    </button>
                    <button
                        onClick={handleExportPatientsJSON}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-file-code"></i> Exportar JSON
                    </button>
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-eye"></i> Visualizar PDF
                    </button>
                </div>
            </div>

            {/* Card Gerar Individual */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <i className="fas fa-qrcode text-lg"></i>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Gerar QR Individual</h2>
                </div>
                
                <div className="mb-8 flex gap-4">
                    <button 
                         onClick={() => window.open('/#/scanner', '_blank')}
                         className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-camera"></i> ABRIR SCANNER (CELULAR / WEBCAM)
                    </button>
                    <button 
                         onClick={() => {
                             if (atendimentoId) {
                                 window.open(`/#/atendimento/${atendimentoId}`, '_blank');
                             } else {
                                 alert("Por favor, selecione um ID de atendimento na lista abaixo para visualizar o painel.");
                             }
                         }}
                         className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-eye"></i> PREVIEW PAINEL
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ID do Atendimento / Paciente</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                            value={atendimentoId}
                            onChange={(e) => setAtendimentoId(e.target.value)}
                        >
                            <option value="">Selecione um atendimento...</option>
                            
                            {appointments.length > 0 && (
                                <optgroup label="Agendamentos Recentes / Em Aberto">
                                    {appointments.map(app => (
                                        <option key={app.id} value={app.id}>
                                            {app.patientName?.toUpperCase() || 'PACIENTE S/ NOME'} | {app.patientCpf || 'S/ CPF'} | {app.date}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {patients.length > 0 && (
                                <optgroup label="Pacientes Cadastrados (Aguardando Atendimento)">
                                    {patients
                                        .filter(p => !appointments.some(a => a.patientCpf === p.cpf))
                                        .map(p => (
                                            <option key={p.id} value={`new:${p.id}`}>
                                                {p.name?.toUpperCase() || 'PACIENTE S/ NOME'} | {p.cpf || 'S/ CPF'} | (CADASTRO RECENTE)
                                            </option>
                                        ))
                                    }
                                </optgroup>
                            )}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateQr}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                        GERAR QR CODE
                    </button>
                </div>

                {generatedQr && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-[28px] border border-gray-100 flex flex-col items-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Preview do Código</p>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <QRCode value={generatedQr} size={200} viewBox={`0 0 256 256`} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                        </div>
                        <p className="mt-4 font-black text-slate-800 text-xs">{generatedQr}</p>
                        <button 
                            onClick={() => window.print()}
                            className="mt-6 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:underline"
                        >
                            <i className="fas fa-print"></i> Imprimir Etiqueta
                        </button>
                    </div>
                )}
            </div>

            {/* Card Gerar Lote */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <i className="fas fa-layer-group text-lg"></i>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Gerar QR em Lote (Pré-Atendimento)</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantidade</label>
                        <input 
                            type="number" 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                            value={quantidade}
                            onChange={(e) => setQuantidade(parseInt(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prefixo</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                            value={prefixo}
                            onChange={(e) => setPrefixo(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número Inicial</label>
                        <input 
                            type="number" 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                            value={inicio}
                            onChange={(e) => setInicio(parseInt(e.target.value))}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    <button
                        onClick={handleGenerateBatchQr}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-gears"></i>}
                        GERAR LOTE
                    </button>
                    <button
                        onClick={handleExportPdf}
                        disabled={batchQrs.length === 0}
                        className="bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <i className="fas fa-file-pdf"></i> EXPORTAR PARA PDF (A4)
                    </button>
                </div>

                {batchQrs.length > 0 && (
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {batchQrs.map((url, idx) => {
                            let displayToken = url;
                            if (url.includes('token=')) {
                                displayToken = url.split('token=')[1];
                            }
                            return (
                                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center gap-2 overflow-hidden">
                                    <QRCode id={`qr-batch-${idx}`} value={url} size={60} viewBox={`0 0 256 256`} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                                    <span className="text-[8px] font-black text-gray-400 truncate w-full text-center">{displayToken.split('-')[1] || displayToken.substring(0,8)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Preview PDF */}
            {showPreview && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-800 p-8 text-white relative">
                            <h2 className="text-2xl font-black">Visualização do Relatório</h2>
                            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Confira a lista antes de exportar</p>
                        </div>

                        <div className="p-8 space-y-6 relative overflow-y-auto flex-1">
                            <button onClick={() => setShowPreview(false)} className="absolute top-4 right-6 text-gray-400 hover:text-red-500 transition-all z-10">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                            
                            <div className="bg-gray-50 rounded-[32px] border border-gray-100 p-8">
                                <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-8">
                                    <div className="flex items-center gap-4">
                                        <img src={appLogo || "/assets/logo-uarini.png"} className="h-16 object-contain" alt="Logo" />
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800">LABORATÓRIO MUNICIPAL DE UARINI</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Relatório de Atendimentos Cadastrados</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gerado em:</p>
                                        <p className="text-[11px] font-black text-slate-800">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-gray-100">
                                                <th className="py-4 px-2">Nome Completo</th>
                                                <th className="py-4 px-2">CPF</th>
                                                <th className="py-4 px-2">SUS</th>
                                                <th className="py-4 px-2">Data</th>
                                                <th className="py-4 px-2 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {appointments.map((app, i) => (
                                                <tr key={i} className="text-[11px] font-bold text-slate-600">
                                                    <td className="py-3 px-2 uppercase">{app.patientName}</td>
                                                    <td className="py-3 px-2">{app.patientCpf}</td>
                                                    <td className="py-3 px-2">{app.patientSusNumber || '-'}</td>
                                                    <td className="py-3 px-2">{app.date}</td>
                                                    <td className="py-3 px-2 text-center">
                                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[9px] font-black uppercase">{app.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="flex-1 bg-white border border-gray-200 text-slate-500 font-black py-4 rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-[11px]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExportPatientsPDF}
                                className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-download"></i> Baixar Relatório PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QrDashboardTab;

