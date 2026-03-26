
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/apiService';
import { Appointment, User } from '../types';
import ProfileTab from '../components/ProfileTab';

const AtendimentoPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAppointment = async () => {
            if (!id) return;
            try {
                const results = await dbService.from('appointments').select({ id });
                if (results && results.length > 0) {
                    const raw = results[0];
                    const mapped: Appointment = {
                        id: raw.id,
                        patientId: raw.patient_id,
                        patientName: raw.patient_name,
                        patientCpf: raw.patient_cpf,
                        patientAge: raw.patient_age,
                        patientGender: raw.patient_gender,
                        patientSusNumber: raw.patient_sus_number,
                        patientAddress: raw.patient_address || raw.endereco,
                        date: raw.date,
                        time: raw.time,
                        status: raw.status,
                        setor: raw.setor,
                        codigo_atendimento: raw.codigo_atendimento
                    };
                    setAppointment(mapped);
                } else {
                    setError("Atendimento não encontrado.");
                }
            } catch (err: any) {
                setError("Erro ao buscar dados: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointment();
    }, [id]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!id) return;
        try {
            setLoading(true);
            await dbService.from('appointments').update({ status: newStatus }, { id });
            setAppointment(prev => prev ? { ...prev, status: newStatus } : null);
            alert(`Status atualizado para: ${newStatus}`);
        } catch (err: any) {
            alert("Erro ao atualizar status: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
            <i className="fas fa-spinner fa-spin text-blue-800 text-4xl"></i>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processando...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8 animate-in slide-in-from-bottom duration-500">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-[20px] shadow-sm flex items-center justify-center text-blue-600 font-black text-xl">
                            {appointment?.patientName?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">{appointment?.patientName || 'Paciente não identificado'}</h1>
                            <div className="flex gap-4 mt-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                    appointment?.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-600' :
                                    appointment?.status === 'COLETADO' ? 'bg-blue-100 text-blue-600' :
                                    appointment?.status === 'CANCELADO' ? 'bg-rose-100 text-rose-600' :
                                    'bg-amber-50 text-amber-600'
                                }`}>
                                    {appointment?.status || 'PENDENTE'}
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-tag"></i> {appointment?.codigo_atendimento || appointment?.id.substring(0,8)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                         <button 
                            onClick={() => navigate('/dashboard')}
                            className="bg-gray-100 font-black text-[11px] uppercase tracking-widest text-[#1e40af] px-6 py-3 rounded-2xl shadow-lg shadow-blue-600/10 transition-all hover:bg-gray-200"
                        >
                            <i className="fas fa-house"></i> Voltar
                        </button>
                        <button 
                            onClick={() => window.print()}
                            className="bg-[#1e40af] font-black text-[11px] uppercase tracking-widest text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-800"
                        >
                            <i className="fas fa-print"></i> Imprimir Ficha
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Infos do Paciente */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <i className="fas fa-id-card text-blue-600"></i>
                          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Informações Pessoais</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <InfoField label="Nome Completo" value={appointment?.patientName} />
                            <div className="grid grid-cols-2 gap-4">
                               <InfoField label="CPF" value={appointment?.patientCpf} />
                               <InfoField label="Número SUS" value={appointment?.patientSusNumber} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                               <InfoField label="Idade" value={appointment?.patientAge ? `${appointment.patientAge} anos` : 'N/A'} />
                               <InfoField label="Mês Nasc." value={appointment?.patientBirthDate || 'N/A'} />
                               <InfoField label="Gênero" value={appointment?.patientGender || 'N/A'} />
                            </div>
                             <InfoField label="Endereço" value={appointment?.patientAddress || 'N/A'} />
                        </div>
                    </div>

                    {/* Infos do Atendimento */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <i className="fas fa-clock-rotate-left text-blue-600"></i>
                          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Controle de Atendimento</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Data Agendada" value={appointment?.date} />
                                <InfoField label="Horário" value={appointment?.time} />
                            </div>
                            <InfoField label="Setor de Destino" value={appointment?.setor || 'Triagem / Recepção'} />
                            <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-4">
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Alterar Status por Etapa</p>
                                 <div className="flex gap-2">
                                     <StatusBtn label="CONCLUIR" color="bg-emerald-100 text-emerald-600" onClick={() => handleStatusUpdate('CONCLUIDO')} />
                                     <StatusBtn label="COLETAR" color="bg-blue-100 text-blue-600" onClick={() => handleStatusUpdate('COLETADO')} />
                                     <StatusBtn label="CANCELAR" color="bg-rose-100 text-rose-600" onClick={() => handleStatusUpdate('CANCELADO')} />
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-8 bg-rose-50 border border-rose-100 rounded-[32px] text-center">
                        <i className="fas fa-triangle-exclamation text-rose-500 text-3xl mb-4"></i>
                        <p className="text-sm font-black text-rose-600 uppercase tracking-widest">{error}</p>
                    </div>
                )}

            </div>
            
            <p className="mt-12 text-[9px] font-black text-gray-300 uppercase tracking-widest mb-12">Laboratório Municipal de Uarini - Gestão de Atendimento 2026</p>
        </div>
    );
};

const InfoField = ({ label, value }: { label: string, value: any }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none ml-1">{label}</p>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-50 text-sm font-black text-slate-800">{value || '-'}</div>
    </div>
);

const StatusBtn = ({ label, color, onClick }: { label: string, color: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-transform active:scale-95 hover:brightness-95 ${color}`}
    >
        {label}
    </button>
);

export default AtendimentoPage;
