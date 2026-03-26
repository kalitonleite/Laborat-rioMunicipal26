
import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/apiService';
import jsQR from 'jsqr';

const ScannerPage: React.FC = () => {
    const navigate = useNavigate();
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'ERROR' | 'SUCCESS'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [patientData, setPatientData] = useState<any>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    // IP Camera states
    const [mode, setMode] = useState<'camera' | 'ipcam'>('camera');
    const [ipCamUrl, setIpCamUrl] = useState('http://192.168.1.100:8080/video');
    const [ipCamActive, setIpCamActive] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ipScanInterval = useRef<any>(null);
    const processedRef = useRef(false);

    useEffect(() => {
        if (mode !== 'camera') return;

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
            const link = document.querySelector('div#reader a[href*="scanapp.org"]');
            if (link) (link as HTMLElement).style.display = 'none';
        }, 300);

        return () => {
            clearInterval(interval);
            scannerRef.current?.clear().catch(() => { });
        };
    }, [mode]);

    // IP Cam scanning loop
    useEffect(() => {
        if (!ipCamActive || mode !== 'ipcam') return;
        processedRef.current = false;

        ipScanInterval.current = setInterval(() => {
            const img = imgRef.current;
            const canvas = canvasRef.current;
            if (!img || !canvas || processedRef.current) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.naturalWidth || 640;
            canvas.height = img.naturalHeight || 480;
            try {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code && code.data) {
                    processedRef.current = true;
                    clearInterval(ipScanInterval.current);
                    onScanSuccess(code.data);
                }
            } catch (_) { }
        }, 500);

        return () => clearInterval(ipScanInterval.current);
    }, [ipCamActive, mode]);

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
                throw new Error(`❌ Código (${token}) não encontrado no banco de dados.`);
            }
        } catch (err: any) {
            setStatus('ERROR');
            setErrorMsg(err.message);
            setTimeout(() => {
                setStatus('IDLE');
                scannerRef.current?.resume();
                processedRef.current = false;
                if (ipCamActive) {
                    setIpCamActive(false);
                    setTimeout(() => setIpCamActive(true), 300);
                }
            }, 5000);
        }
    };

    const handleManualInput = (e: React.FormEvent) => {
        e.preventDefault();
        if (scannedResult) onScanSuccess(scannedResult);
    };

    const switchMode = (newMode: 'camera' | 'ipcam') => {
        setIpCamActive(false);
        clearInterval(ipScanInterval.current);
        if (newMode === 'ipcam' && scannerRef.current) {
            scannerRef.current.clear().catch(() => {});
            scannerRef.current = null;
        }
        setMode(newMode);
        setStatus('IDLE');
        setScannedResult(null);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-[20px] mb-4 flex items-center justify-center text-blue-600">
                    <i className="fas fa-barcode-read text-2xl"></i>
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-1">Validador QR</h1>
                <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">Scanner Oficial Laboratório Uarini</p>

                {/* Mode toggle */}
                <div className="w-full flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                    <button
                        onClick={() => switchMode('camera')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'camera' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <i className="fas fa-camera"></i> Câmera do PC
                    </button>
                    <button
                        onClick={() => switchMode('ipcam')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'ipcam' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <i className="fas fa-mobile-screen"></i> Câmera do Celular (IP)
                    </button>
                </div>

                {/* Camera mode */}
                {mode === 'camera' && (
                    <div id="reader" className="w-full rounded-3xl overflow-hidden border border-gray-100 shadow-inner bg-slate-50 relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 animate-bounce z-10 opacity-30"></div>
                    </div>
                )}

                {/* IP Camera mode */}
                {mode === 'ipcam' && (
                    <div className="w-full space-y-4">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-left space-y-2">
                            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-circle-info"></i> Como usar:
                            </p>
                            <ol className="text-[10px] font-medium text-indigo-600 space-y-1 list-decimal list-inside">
                                <li>Instale <strong>"IP Webcam"</strong> no Android (Play Store)</li>
                                <li>Abra o app e toque em <strong>"Start server"</strong></li>
                                <li>O app mostrará um IP, ex: <code className="bg-white px-1 rounded">192.168.1.5:8080</code></li>
                                <li>Certifique-se que PC e celular estão na <strong>mesma rede Wi-Fi</strong></li>
                                <li>Digite o endereço abaixo e clique em <strong>Conectar</strong></li>
                            </ol>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={ipCamUrl}
                                onChange={e => setIpCamUrl(e.target.value)}
                                placeholder="http://192.168.1.100:8080/video"
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"
                            />
                            <button
                                onClick={() => setIpCamActive(!ipCamActive)}
                                className={`px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${ipCamActive ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
                            >
                                {ipCamActive ? 'Parar' : 'Conectar'}
                            </button>
                        </div>

                        {ipCamActive && (
                            <div className="relative w-full rounded-2xl overflow-hidden border border-indigo-100 bg-slate-900">
                                <img
                                    ref={imgRef}
                                    src={ipCamUrl}
                                    alt="IP Camera Feed"
                                    className="w-full"
                                    crossOrigin="anonymous"
                                    onError={() => {
                                        setErrorMsg('Não foi possível conectar. Verifique o IP e se o celular está na mesma rede Wi-Fi.');
                                        setStatus('ERROR');
                                        setIpCamActive(false);
                                    }}
                                />
                                <div className="absolute top-2 right-2 bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full inline-block"></span> AO VIVO
                                </div>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-black text-white/60 uppercase tracking-widest whitespace-nowrap">
                                    Aponte o QR Code para a câmera
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        )}
                    </div>
                )}

                {/* Scanned result display */}
                {scannedResult && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl w-full border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 text-left">Código Escaneado:</p>
                        <p className="text-[11px] font-mono font-bold text-slate-600 break-all text-left">{scannedResult}</p>
                    </div>
                )}

                {status === 'SCANNING' && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-blue-500 text-3xl"></i>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Verificando segurança...</p>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="mt-6 flex flex-col items-center gap-4 w-full">
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl w-full flex items-start gap-3 text-rose-600">
                            <i className="fas fa-circle-exclamation text-xl mt-1"></i>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase">Falha de Validação</p>
                                <p className="text-[10px] font-medium mt-1">{errorMsg}</p>
                            </div>
                        </div>
                        <button onClick={() => { setStatus('IDLE'); scannerRef.current?.resume(); }} className="text-blue-600 font-black text-[10px] uppercase tracking-widest">
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="mt-6 flex flex-col items-center gap-2 animate-in zoom-in duration-300">
                        <i className="fas fa-check-circle text-emerald-500 text-5xl"></i>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">{patientData?.name || 'Localizado!'}</p>
                        <p className="text-[9px] font-bold text-gray-400">Abrindo ficha em 2s...</p>
                    </div>
                )}

                {status === 'IDLE' && (
                    <form onSubmit={handleManualInput} className="mt-6 w-full">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Digite o código manual..."
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                value={scannedResult || ''}
                                onChange={e => setScannedResult(e.target.value)}
                            />
                            <button type="submit" className="bg-slate-800 text-white px-4 rounded-xl text-[9px] font-black uppercase">IR</button>
                        </div>
                    </form>
                )}

                <button onClick={() => navigate('/dashboard')} className="mt-10 text-gray-300 font-black text-[9px] uppercase tracking-widest hover:text-slate-800 transition-colors">
                    <i className="fas fa-arrow-left mr-2"></i> Painel Administrativo
                </button>
            </div>
            <p className="mt-8 text-[9px] font-black text-gray-300 uppercase tracking-widest">Sistema Laboratorial de Uarini &copy; 2026</p>
        </div>
    );
};

export default ScannerPage;
