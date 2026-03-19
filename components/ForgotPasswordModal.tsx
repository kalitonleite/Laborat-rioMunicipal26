import React, { useState } from 'react';
import { UserRole } from '../types';
import { authService } from '../services/apiService';

interface ForgotPasswordModalProps {
    role: UserRole;
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ role, onClose }) => {
    const [cpf, setCpf] = useState('');
    const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
    const [loading, setLoading] = useState(false);

    const maskCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14);
    };

    // Passo 1: Iniciar Reset
    const handleStartReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCPF = cpf.replace(/\D/g, '');
        if (cleanCPF.length !== 11) {
            alert('Por favor, insira um CPF válido.');
            return;
        }

        setStep('confirm');
    };

    // Passo 2: Executar Reset Real
    const handleFinalReset = async () => {
        setLoading(true);
        try {
            await authService.resetByCpf(cpf.replace(/\D/g, ''), role);
            setStep('success');
        } catch (err: any) {
            if (err.message.includes('not found')) {
                alert('CPF não encontrado para este acesso.');
                setStep('input');
            } else {
                alert('Erro inesperado: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const bgHeader = role === UserRole.ADMIN ? 'bg-purple-600' : role === UserRole.MEDICAL ? 'bg-emerald-600' : 'bg-[#1e3a8a]';
    const focusRing = role === UserRole.ADMIN ? 'focus:ring-purple-500' : role === UserRole.MEDICAL ? 'focus:ring-emerald-500' : 'focus:ring-blue-500';
    const btnBg = role === UserRole.ADMIN ? 'bg-purple-900' : role === UserRole.MEDICAL ? 'bg-emerald-700' : 'bg-[#1e3a8a]';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className={`${bgHeader} p-8 text-white relative`}>
                    <h2 className="text-2xl font-black">Recuperar Acesso</h2>
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Redefinição Simplificada</p>
                </div>

                <div className="p-8 relative">
                    <button onClick={onClose} className="absolute top-4 right-6 text-gray-300 hover:text-red-500 transition-all z-10">
                        <i className="fas fa-times text-xl"></i>
                    </button>

                    {step === 'input' && (
                        <form onSubmit={handleStartReset} className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-800">Informe seu CPF</h3>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                    Para redefinir sua conta, precisamos apenas confirmar seu CPF cadastrado.
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                                <div className="relative">
                                    <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                                    <input
                                        required
                                        type="text"
                                        placeholder="000.000.000-00"
                                        className={`w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none ${focusRing} focus:ring-2 transition-all text-sm font-bold text-slate-700`}
                                        value={cpf}
                                        onChange={(e) => setCpf(maskCPF(e.target.value))}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`w-full ${btnBg} text-white font-black py-5 rounded-[24px] shadow-xl transition-all uppercase tracking-widest text-xs mt-2 flex items-center justify-center gap-2`}
                            >
                                Continuar para Redefinição
                                <i className="fas fa-arrow-right"></i>
                            </button>
                        </form>
                    )}

                    {step === 'confirm' && (
                        <div className="space-y-6 text-center animate-in slide-in-from-right-4">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                                <i className="fas fa-exclamation-triangle text-2xl"></i>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-800">Atenção!</h3>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">
                                    Deseja realmente resetar sua conta vinculada ao CPF <span className="font-bold text-slate-700">{cpf}</span>? <br /><br />
                                    Seus dados de exames serão preservados, mas seu acesso atual será removido para que você crie uma nova senha.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleFinalReset}
                                    disabled={loading}
                                    className={`w-full ${btnBg} text-white font-black py-5 rounded-[24px] shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2`}
                                >
                                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-can"></i>}
                                    Confirmar e Resetar Agora
                                </button>
                                <button
                                    disabled={loading}
                                    onClick={() => setStep('input')}
                                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-slate-600"
                                >
                                    Mudar CPF
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-6 py-4 animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                                <i className="fas fa-check text-3xl"></i>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-800">Conta Resetada!</h3>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">
                                    Seu acesso antigo foi removido com sucesso.
                                    <br /><br />
                                    **Cadastre-se novamente** agora com sua nova senha definitiva.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    const path = role === UserRole.ADMIN ? '/admin/register' :
                                        role === UserRole.MEDICAL ? '/medical/register' :
                                            role === UserRole.RECEPTION ? '/reception/register' : '/register';
                                    window.location.hash = `#${path}`;
                                }}
                                className={`w-full ${btnBg} text-white font-black py-5 rounded-[24px] shadow-xl transition-all uppercase tracking-widest text-xs`}
                            >
                                Criar Nova Senha Agora
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
