
import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/apiService';

const ScannerPage: React.FC = () => {
    const navigate = useNavigate();
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'ERROR' | 'SUCCESS'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [patientData, setPatientData] = useState<any>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scannerRef.current.render(onScanSuccess, onScanFailure);

        const interval = setInterval(() => {
            const btnCam = document.getElementById('html5-qrcode-button-camera-permission');
            if (btnCam) btnCam.innerText = 'Permitir Uso da Câmera';
            
            const btnStart = document.getElementById('html5-qrcode-button-camera-start');
            if (btnStart) btnStart.innerText = 'Iniciar Câmera';

            const btnStop = document.getElementById('html5-qrcode-button-camera-stop');
            if (btnStop) btnStop.innerText = 'Parar Câmera';

            const labRequest = document.querySelector('#reader__dashboard_section_csr span');
            if (labRequest) labRequest.innerHTML = 'Solicitando permissão para usar câmera';

            const labSelection = document.querySelector('#reader__header_message');
            if (labSelection) labSelection.innerHTML = 'Selecione uma câmera';

            // Remover o link do site da biblioteca para ficar mais limpo
            const link = document.querySelector('div#reader a[href*="scanapp.org"]');
            if (link) (link as HTMLElement).style.display = 'none';
        }, 300);

        return () => {
            clearInterval(interval);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Falha ao limpar scanner:", err));
            }
        };
    }, []);

    const onScanSuccess = async (decodedText: string) => {
        console.log(`Scan result: ${decodedText}`);
        let token = decodedText;
        
        // Se o resultado for uma URL completa, extrai apenas o token
        if (decodedText.includes('token=')) {
            const url = new URL(decodedText.replace('/#/', '/')); // Ajuste para hash router se necessário
            token = url.searchParams.get('token') || decodedText;
        }

        setScannedResult(token);
        setStatus('SCANNING');
        
        if (scannerRef.current) {
            scannerRef.current.pause();
        }

        try {
            // Busca o QR no banco usando apenas o token
            const qrRecords = await dbService.from('qr_codes').select({ token });
            if (qrRecords && qrRecords.length > 0) {
                const qr = qrRecords[0];
                if (qr.atendimento_id) {
                    setStatus('SUCCESS');
                    setTimeout(() => navigate(`/atendimento/${qr.atendimento_id}`), 500);
                } else {
                    setStatus('IDLE');
                    alert("⚠️ Código válido, mas não está vinculado a um atendimento.");
                    scannerRef.current?.resume();
                }
            } else {
                throw new Error("❌ Código INVÁLIDO ou não cadastrado no sistema");
            }
        } catch (err: any) {
            setStatus('ERROR');
            setErrorMsg(err.message);
            setTimeout(() => {
                setStatus('IDLE');
                scannerRef.current?.resume();
            }, 5000);
        }
    };

    const onScanFailure = (error: any) => {
        // console.warn(`Code scan error: ${error}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-[20px] mb-6 flex items-center justify-center text-blue-600">
                    <i className="fas fa-camera text-2xl"></i>
                </div>
                
                <h1 className="text-2xl font-black text-slate-800 mb-2">Modo Scanner</h1>
                <p className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest px-4">Use o celular para escanear o QR Code da Ficha</p>
                
                <div id="reader" className="w-full rounded-3xl overflow-hidden border border-gray-100 shadow-inner bg-slate-50"></div>

                {status === 'SCANNING' && (
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-blue-500 text-3xl"></i>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Buscando Atendimento...</p>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl w-full flex items-center gap-3 text-rose-600">
                        <i className="fas fa-circle-exclamation text-xl"></i>
                        <p className="text-[10px] font-black uppercase text-left leading-tight">{errorMsg}</p>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <i className="fas fa-check-circle text-emerald-500 text-3xl"></i>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sucesso! Redirecionando...</p>
                    </div>
                )}

                <button 
                    onClick={() => navigate('/dashboard')}
                    className="mt-12 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-800 transition-colors"
                >
                    <i className="fas fa-arrow-left mr-2"></i> Voltar ao Painel
                </button>
            </div>
            
            <p className="mt-8 text-[9px] font-black text-gray-300 uppercase tracking-widest">Sistema Laboratorial de Uarini &copy; 2026</p>
        </div>
    );
};

export default ScannerPage;
