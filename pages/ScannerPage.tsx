
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    const [ipBase, setIpBase] = useState('http://192.168.1.100:8080');
    const [ipCamActive, setIpCamActive] = useState(false);
    const [streamSrc, setStreamSrc] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hiddenImgRef = useRef<HTMLImageElement>(null);
    const ipScanInterval = useRef<any>(null);
    const processedRef = useRef(false);
    const alreadyProcessing = useRef(false);

    useEffect(() => {
        if (mode !== 'camera') return;

        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );
        scannerRef.current.render(onScanSuccess, () => { });

        const interval = setInterval(() => {
            document.getElementById('html5-qrcode-button-camera-permission')?.innerText === 'Grant permissions' &&
                (document.getElementById('html5-qrcode-button-camera-permission')!.innerText = 'Permitir Câmera');
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

    // Poll /shot.jpg from IP Webcam — works without CORS headers
    const pollFrame = useCallback(async () => {
        if (processedRef.current || alreadyProcessing.current) return;
        alreadyProcessing.current = true;

        const snapshotUrl = `${ipBase}/shot.jpg?t=${Date.now()}`;
        try {
            const res = await fetch(snapshotUrl, { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao buscar frame');

            const blob = await res.blob();
            const objUrl = URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) { URL.revokeObjectURL(objUrl); alreadyProcessing.current = false; return; }
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { URL.revokeObjectURL(objUrl); alreadyProcessing.current = false; return; }
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(objUrl);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code?.data && !processedRef.current) {
                    processedRef.current = true;
                    clearInterval(ipScanInterval.current);
                    onScanSuccess(code.data);
                }
                alreadyProcessing.current = false;
            };
            img.onerror = () => { URL.revokeObjectURL(objUrl); alreadyProcessing.current = false; };
            img.src = objUrl;
        } catch (e) {
            alreadyProcessing.current = false;
        }
    }, [ipBase]);

    useEffect(() => {
        if (!ipCamActive || mode !== 'ipcam') return;
        processedRef.current = false;
        alreadyProcessing.current = false;

        // Show live stream directly (no crossOrigin = no CORS issue)
        setStreamSrc(`${ipBase}/video?${Date.now()}`);

        // Poll /shot.jpg every 600ms for QR detection
        ipScanInterval.current = setInterval(pollFrame, 600);
        return () => clearInterval(ipScanInterval.current);
    }, [ipCamActive, mode, ipBase, pollFrame]);

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
                alreadyProcessing.current = false;
                if (ipCamActive) {
                    ipScanInterval.current = setInterval(pollFrame, 600);
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
            scannerRef.current.clear().catch(() => { });
            scannerRef.current = null;
        }
        setMode(newMode);
        setStatus('IDLE');
        setScannedResult(null);
        setStreamSrc('');
    };

    const handleConnect = () => {
        setIpCamActive(false);
        setStreamSrc('');
        setTimeout(() => setIpCamActive(true), 100);
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
                        <i className="fas fa-mobile-screen"></i> Celular como Câmera
                    </button>
                </div>

                {/* === PC CAMERA MODE === */}
                {mode === 'camera' && (
                    <div id="reader" className="w-full rounded-3xl overflow-hidden border border-gray-100 shadow-inner bg-slate-50 relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 animate-bounce z-10 opacity-30"></div>
                    </div>
                )}

                {/* === IP CAMERA MODE === */}
                {mode === 'ipcam' && (
                    <div className="w-full space-y-4">

                        {/* Instructions */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-left">
                            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <i className="fas fa-circle-info"></i> Configuração (Android)
                            </p>
                            <ol className="text-[10px] font-medium text-indigo-600 space-y-1 list-decimal list-inside leading-relaxed">
                                <li>Instale <strong>"IP Webcam"</strong> na Play Store</li>
                                <li>Abra e role até o final → toque em <strong>"Start server"</strong></li>
                                <li>Anote o endereço mostrado, ex: <code className="bg-white px-1 rounded font-mono">192.168.1.5:8080</code></li>
                                <li>PC e celular devem estar na <strong>mesma rede Wi-Fi</strong></li>
                                <li>Digite apenas o IP:PORTA abaixo e clique <strong>Conectar</strong></li>
                            </ol>
                        </div>

                        {/* URL Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left block">
                                Endereço IP do Celular
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 flex items-center bg-gray-50 border border-gray-100 rounded-xl overflow-hidden focus-within:border-indigo-400">
                                    <span className="pl-4 text-[10px] font-bold text-gray-300 whitespace-nowrap">http://</span>
                                    <input
                                        type="text"
                                        value={ipBase.replace('http://', '')}
                                        onChange={e => setIpBase('http://' + e.target.value)}
                                        placeholder="192.168.1.100:8080"
                                        className="flex-1 bg-transparent px-2 py-3 text-xs font-bold text-slate-700 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={ipCamActive ? () => { setIpCamActive(false); setStreamSrc(''); } : handleConnect}
                                    className={`px-5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${ipCamActive ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                >
                                    {ipCamActive ? <><i className="fas fa-stop mr-1"></i>Parar</> : <><i className="fas fa-plug mr-1"></i>Conectar</>}
                                </button>
                            </div>
                        </div>

                        {/* Live stream */}
                        {ipCamActive && streamSrc && (
                            <div className="relative w-full rounded-2xl overflow-hidden border-2 border-indigo-100 bg-slate-900 min-h-[200px] flex items-center justify-center">
                                <img
                                    src={streamSrc}
                                    alt="Live Camera"
                                    className="w-full object-contain"
                                    onError={() => {
                                        setErrorMsg('Não foi possível conectar. Verifique o endereço IP e certifique-se que PC e celular estão na mesma rede Wi-Fi.');
                                        setStatus('ERROR');
                                        setIpCamActive(false);
                                        setStreamSrc('');
                                    }}
                                />
                                {/* Scanning overlay */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-40 h-40 border-2 border-white/40 rounded-2xl relative">
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg"></div>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full inline-block"></span> AO VIVO
                                </div>
                                <div className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-black text-white/50 uppercase tracking-widest">
                                    Detectando QR automaticamente...
                                </div>
                            </div>
                        )}

                        {/* Hidden canvas for QR processing */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}

                {/* Scanned result display */}
                {scannedResult && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl w-full border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 text-left">Código Lido:</p>
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
                            <i className="fas fa-circle-exclamation text-xl mt-1 shrink-0"></i>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase">Erro de Conexão</p>
                                <p className="text-[10px] font-medium mt-1 leading-relaxed">{errorMsg}</p>
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
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 text-left">Ou insira o código manualmente:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="ATD-0001-abc123..."
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
