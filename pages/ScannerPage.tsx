
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
            false
        );

        scannerRef.current.render(onScanSuccess, () => { });

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
        let token = decodedText.trim();
        const tokenMatch = decodedText.match(/[?&]token=([^&#\s]+)/);
        if (tokenMatch) token = tokenMatch[1];

        setScannedResult(token);
        setStatus('SCANNING');
        if (scannerRef.current) scannerRef.current.pause();

        try {
            const qrRecords = await dbService.from('qr_codes').select({ token });
            if (qrRecords && qrRecords.length > 0) {
                const qr = qrRecords[0];
                if (qr.atendimento_id) {
                    const appData = await dbService.from('appointments').select({ id: qr.atendimento_id });
                    const pName = appData && appData.length > 0 ? (appData[0].patient_name || 'Paciente') : 'Atendimento';
                    setPatientData({ name: pName });
                    setStatus('SUCCESS');
                    setTimeout(() => navigate(`/atendimento/${qr.atendimento_id}`), 2000);
                } else {
                    setStatus('IDLE');
                    alert(`⚠️ O código (${token}) é válido, mas não possui atendimento vinculado.`);
                    scannerRef.current?.resume();
                }
            } else {
                throw new Error(`❌ O código lido (${token}) não consta no banco de dados.`);
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

    const handleManualInput = (e: React.FormEvent) => {
        e.preventDefault();
        if (scannedResult) onScanSuccess(scannedResult);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-[20px] mb-6 flex items-center justify-center text-blue-600">
                    <i className="fas fa-barcode-read text-2xl"></i>
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-2">Validador QR</h1>
                <p className="text-[10px] font-black text-gray-400 mb-8 uppercase tracking-[0.2em] px-4">Scanner Oficial Laboratório Uarini</p>

                <div id="reader" className="w-full rounded-3xl overflow-hidden border border-gray-100 shadow-inner bg-slate-50 relative">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 animate-bounce z-10 opacity-30"></div>
                </div>

                {scannedResult && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl w-full border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 text-left">Código Escaneado:</p>
                        <p className="text-[11px] font-mono font-bold text-slate-600 break-all text-left">{scannedResult}</p>
                    </div>
                )}

                {status === 'SCANNING' && (
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-blue-500 text-3xl"></i>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Verificando segurança...</p>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="mt-8 flex flex-col items-center gap-4 w-full">
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl w-full flex items-start gap-3 text-rose-600">
                            <i className="fas fa-circle-exclamation text-xl mt-1"></i>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase">Falha de Validação</p>
                                <p className="text-[10px] font-medium leading-relaxed mt-1">{errorMsg}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setStatus('IDLE'); scannerRef.current?.resume(); }}
                            className="text-blue-600 font-black text-[10px] uppercase tracking-widest"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="mt-8 flex flex-col items-center gap-2 animate-in zoom-in duration-300">
                        <i className="fas fa-check-circle text-emerald-500 text-5xl"></i>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">{patientData?.name || 'Localizado!'}</p>
                        <p className="text-[9px] font-bold text-gray-400">Abrindo ficha em 2s...</p>
                    </div>
                )}

                {status === 'IDLE' && (
                    <form onSubmit={handleManualInput} className="mt-8 w-full">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Digite o código manual..."
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500"
                                value={scannedResult || ''}
                                onChange={(e) => setScannedResult(e.target.value)}
                            />
                            <button type="submit" className="bg-slate-800 text-white px-4 rounded-xl text-[9px] font-black uppercase">IR</button>
                        </div>
                    </form>
                )}

                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-12 text-gray-300 font-black text-[9px] uppercase tracking-widest hover:text-slate-800 transition-colors"
                >
                    <i className="fas fa-arrow-left mr-2"></i> Painel Administrativo
                </button>
            </div>

            <p className="mt-8 text-[9px] font-black text-gray-300 uppercase tracking-widest">Sistema Laboratorial de Uarini &copy; 2026</p>
        </div>
    );
};

export default ScannerPage;
