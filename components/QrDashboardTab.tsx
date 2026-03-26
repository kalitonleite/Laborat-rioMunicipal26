
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { jsPDF } from 'jspdf';
import { dbService } from '../services/apiService';
import { QrCode, Appointment } from '../types';
import { v4 as uuidv4 } from 'uuid';

const QrDashboardTab: React.FC = () => {
    const [atendimentoId, setAtendimentoId] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [prefixo, setPrefixo] = useState('ATD');
    const [inicio, setInicio] = useState(1);
    const [generatedQr, setGeneratedQr] = useState<string | null>(null);
    const [batchQrs, setBatchQrs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const data = await dbService.from('appointments').select({}, { column: 'created_at', ascending: false });
                const mapped = (data || []).map((item: any) => ({
                    id: item.id,
                    patientName: item.patient_name,
                    patientCpf: item.patient_cpf,
                    date: item.date,
                    time: item.time,
                    status: item.status
                }));
                setAppointments(mapped);
            } catch (err) {
                console.error("Erro ao buscar atendimentos:", err);
            }
        };
        fetchAppointments();
    }, []);

    const handleGenerateQr = async () => {
        if (!atendimentoId) {
            alert("Selecione ou informe um ID de atendimento");
            return;
        }
        setLoading(true);
        const token = uuidv4();
        try {
            await dbService.from('qr_codes').insert({
                token,
                atendimento_id: atendimentoId,
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
                         onClick={() => window.open('/#/atendimento/example', '_blank')}
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
                            {appointments.map(app => (
                                <option key={app.id} value={app.id}>
                                    {app.patientName?.toUpperCase() || 'PACIENTE S/ NOME'} | {app.patientCpf || 'S/ CPF'} | {app.date}
                                </option>
                            ))}
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
        </div>
    );
};

export default QrDashboardTab;
