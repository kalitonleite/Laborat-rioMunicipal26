
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, UserRole } from '../types';
import { dbService } from '../services/apiService';
import { useSettings } from '../contexts/SettingsContext';
import { jsPDF } from 'jspdf';
import Tesseract from 'tesseract.js';
import { Search, Camera, FileText, Image, Save, History, Clock, CheckCircle2, AlertCircle, Download, Plus, RotateCcw, RotateCw, Eye, Edit2, Trash2, User as UserIcon } from 'lucide-react';

type Tab = 'nova' | 'historico' | 'pendentes' | 'laudos';

interface ExtractedField {
  nome: string;
  valor: string;
  unidade: string;
  referencia: string | null;
  confianca: number;
}

interface OCRResult {
  tipo_exame: string | null;
  paciente_nome: string | null;
  paciente_idade: string | null;
  paciente_sexo: string | null;
  data_exame: string | null;
  laboratorio: string | null;
  campos: ExtractedField[];
  texto_completo: string;
  confianca_geral: number;
  observacoes: string;
}

interface ScannerScan {
  id: string;
  patient_id: string | null;
  patient_name: string | null;
  patient_cpf: string | null;
  original_image_url: string | null;
  image_type: string | null;
  ocr_text: string | null;
  extracted_data: any;
  confidence_score: number;
  status: string;
  scan_date: string;
  user_id: string | null;
  user_name: string | null;
  approved_by: string | null;
  approved_at: string | null;
  pdf_url: string | null;
  created_at: string;
}

const ScannerInteligentePage: React.FC<{ user: User }> = ({ user }) => {
  const { appLogo } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('nova');

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);

  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editedFields, setEditedFields] = useState<ExtractedField[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; cpf: string } | null>(null);

  const [scans, setScans] = useState<ScannerScan[]>([]);
  const [pendingScans, setPendingScans] = useState<ScannerScan[]>([]);
  const [generatedLaudos, setGeneratedLaudos] = useState<ScannerScan[]>([]);

  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'conferido' | 'liberado'>('todos');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadScans = useCallback(async () => {
    try {
      const data = await dbService.from('scanner_scans').select({}, { column: 'created_at', ascending: false });
      const allScans = (data || []) as ScannerScan[];
      setScans(allScans);
      setPendingScans(allScans.filter(s => s.status === 'PENDENTE'));
      setGeneratedLaudos(allScans.filter(s => s.status === 'LIBERADO' && s.pdf_url));
    } catch (err) {
      console.error('Error loading scans:', err);
    }
  }, []);

  useEffect(() => {
    loadScans();
  }, [loadScans, activeTab]);

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);

  const handlePatientSearch = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPatientSearch(val);
    if (val.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await dbService.from('profiles').select({ cpf: val });
      if (data && data.length > 0) {
        setSearchResults(data.slice(0, 10).map((p: any) => ({
          id: p.id,
          name: p.name,
          cpf: p.cpf
        })));
      } else {
        const data2 = await dbService.from('profiles').select({});
        const filtered = (data2 || []).filter((p: any) => p.name && p.name.toLowerCase().includes(val.toLowerCase()));
        setSearchResults(filtered.slice(0, 10).map((p: any) => ({
          id: p.id,
          name: p.name,
          cpf: p.cpf
        })));
      }
    } catch (err) {
      console.error('Patient search error:', err);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Seu navegador não suporta acesso à câmera. Use upload de arquivo.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setVideoStream(stream);
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Permissão da câmera não concedida. Permita o acesso e tente novamente.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('Nenhuma câmera encontrada neste dispositivo. Use upload de arquivo.');
      } else {
        alert('Não foi possível acessar a câmera. Use upload de arquivo.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    setVideoStream(null);
    setCameraActive(false);
  }, [videoStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((imageRotation * Math.PI) / 180);
      ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2);
      ctx.restore();
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));
      setImageType('image/jpeg');
      stopCamera();
    }
  }, [imageRotation, stopCamera]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      alert('Tipo de arquivo não permitido. Use JPG, JPEG, PNG ou PDF.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string);
      setImageType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setCapturedImage(null);
    setImageType(null);
    setOcrResult(null);
    setEditedFields([]);
    setSelectedPatient(null);
    setImageRotation(0);
  };

  const rotateLeft = () => setImageRotation((r) => (r - 90 + 360) % 360);
  const rotateRight = () => setImageRotation((r) => (r + 90) % 360);

  const processOCR = async () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    try {
      const { data } = await Tesseract.recognize(capturedImage, 'por', {
        langPath: 'https://tesseract.projectnaptha.com/langdata',
        corePath: 'https://tesseract.projectnaptha.com/wasm/core.wasm',
      });

      const textoCompleto = data.text || '';

      // Tenta extrair linhas que parecem campos de exame (nome: valor unidade)
      const linhas = textoCompleto.split('\n').filter(l => l.trim().length > 0);
      const camposExtraidos: ExtractedField[] = linhas.map((linha) => {
        const partes = linha.split(/\s+/);
        const nome = partes.slice(0, -2).join(' ') || linha;
        const valor = partes[partes.length - 2] || '';
        const unidade = partes[partes.length - 1] || '';
        return {
          nome: nome.trim(),
          valor: valor.trim(),
          unidade: unidade.trim(),
          referencia: null,
          confianca: 0.7,
        };
      }).filter(c => c.nome.length > 0);

      const ocrResult: OCRResult = {
        tipo_exame: null,
        paciente_nome: null,
        paciente_idade: null,
        paciente_sexo: null,
        data_exame: null,
        laboratorio: null,
        campos: camposExtraidos.length > 0 ? camposExtraidos : [{
          nome: 'Texto extraído',
          valor: textoCompleto.substring(0, 100),
          unidade: '',
          referencia: null,
          confianca: 0.5,
        }],
        texto_completo: textoCompleto,
        confianca_geral: 0.7,
        observacoes: 'OCR processado localmente com Tesseract.js. Revise e corrija os campos manualmente.',
      };

      setOcrResult(ocrResult);
      setEditedFields(ocrResult.campos);
    } catch (err: any) {
      console.error('OCR error:', err);
      alert('Erro ao processar OCR: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveScan = async () => {
    if (!capturedImage) {
      alert('Nenhuma imagem capturada.');
      return;
    }
    setIsUploading(true);
    try {
      const form = new FormData();
      const blob = await (await fetch(capturedImage)).blob();
      const ext = imageType === 'application/pdf' ? '.pdf' : '.jpg';
      const file = new File([blob], `scanner-${Date.now()}${ext}`, { type: imageType || 'image/jpeg' });
      form.append('file', file);

      const uploadResp = await fetch('/api/scanner/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: form
      });

      if (!uploadResp.ok) {
        const errData = await uploadResp.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro no upload');
      }

      const { url } = await uploadResp.json();

      const scanData = {
        patient_id: selectedPatient?.id || null,
        patient_name: selectedPatient?.name || ocrResult?.paciente_nome || null,
        patient_cpf: selectedPatient?.cpf || null,
        original_image_url: url,
        image_type: imageType || null,
        ocr_text: ocrResult?.texto_completo || null,
        extracted_data: ocrResult ? {
          tipo_exame: ocrResult.tipo_exame,
          campos: editedFields,
          texto_completo: ocrResult.texto_completo,
          confianca_geral: ocrResult.confianca_geral,
          observacoes: ocrResult.observacoes
        } : null,
        confidence_score: ocrResult?.confianca_geral || 0,
        status: 'PENDENTE',
        user_id: user.id,
        user_name: user.name
      };

      const result = await dbService.from('scanner_scans').insert(scanData);

      if (result && result.length > 0) {
        alert('Digitalização salva com sucesso!');
        clearImage();
        loadScans();
        setActiveTab('historico');
      }
    } catch (err: any) {
      console.error('Save scan error:', err);
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const updateFieldValue = (index: number, key: keyof ExtractedField, value: any) => {
    const newFields = [...editedFields];
    newFields[index] = { ...newFields[index], [key]: value };
    setEditedFields(newFields);
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.85) return 'text-emerald-600 border-emerald-100 bg-emerald-50';
    if (conf >= 0.6) return 'text-amber-600 border-amber-100 bg-amber-50';
    return 'text-rose-600 border-rose-100 bg-rose-50';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.85) return 'Alta';
    if (conf >= 0.6) return 'Média';
    return 'Baixa';
  };

  const approveScan = async (scan: ScannerScan) => {
    if (!window.confirm('Confirmar aprovação desta digitalização? Esta ação não poderá ser desfeita.')) return;
    try {
      await dbService.from('scanner_scans').update(
        { status: 'CONFERIDO' },
        { id: scan.id }
      );
      await dbService.from('scanner_scan_history').insert({
        scan_id: scan.id,
        field_name: 'status',
        old_value: 'PENDENTE',
        new_value: 'CONFERIDO',
        changed_by: user.id,
        reason: 'Aprovação profissional'
      });
      loadScans();
      alert('Digitalização aprovada!');
    } catch (err: any) {
      alert('Erro ao aprovar: ' + err.message);
    }
  };

  const generateLaudoPDF = (scan: ScannerScan) => {
    const extracted = scan.extracted_data || {};
    const campos = extracted.campos || [];

    const doc = new jsPDF('p', 'mm', 'a4');
    const primaryColor = [30, 58, 138];
    const secondaryColor = [59, 130, 246];
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 55, 'F');

    if (appLogo) {
      try {
        doc.addImage(appLogo, 'JPEG', 148.5 - 12.5, 8, 25, 25);
      } catch (e) {
        console.error('Erro ao adicionar logo:', e);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUDO LABORATORIAL', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Laboratório Municipal de Uarini', pageWidth / 2, 38, { align: 'center' });
    doc.text('Uarini / AM - Sistema de Análises Clínicas', pageWidth / 2, 44, { align: 'center' });

    let yPos = 70;
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PACIENTE:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(scan.patient_name || 'Não informado', 45, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text('CPF:', 120, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(scan.patient_cpf || '-', 140, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('EXAME:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(extracted.tipo_exame || 'Não identificado', 45, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA:', 120, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(scan.scan_date).toLocaleDateString('pt-BR'), 140, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('RESPONSÁVEL:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(scan.user_name || 'Sistema', 45, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUS:', 120, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(getStatusLabel(scan.status), 140, yPos);

    yPos += 16;
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(14, yPos - 5, pageWidth - 28, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ANALITO', 14, yPos + 1);
    doc.text('VALOR', 70, yPos + 1);
    doc.text('UNIDADE', 110, yPos + 1);
    doc.text('REFERÊNCIA', 150, yPos + 1);

    yPos += 10;
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    (campos as any[]).forEach((campo, index) => {
      if (yPos + 8 > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, yPos - 5, pageWidth - 28, 7, 'F');
      }
      doc.text(String(campo.nome || '-'), 14, yPos + 1);
      doc.text(String(campo.valor || '-'), 70, yPos + 1);
      doc.text(String(campo.unidade || '-'), 110, yPos + 1);
      doc.text(String(campo.referencia || '-'), 150, yPos + 1);
      yPos += 7;
    });

    if (extracted.observacoes) {
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      const obsLines = doc.splitTextToSize(String(extracted.observacoes), pageWidth - 28);
      doc.text(obsLines, 14, yPos + 5);
      yPos += obsLines.length * 5 + 8;
    }

    const sigY = pageHeight - 40;
    doc.setDrawColor(100, 100, 100);
    doc.line(14, sigY, pageWidth - 14, sigY);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text('Laudo gerado a partir de digitalização com auxílio de OCR.', 14, sigY + 6);
    doc.text(`Digitalizado em: ${new Date(scan.scan_date).toLocaleDateString('pt-BR')} às ${new Date(scan.scan_date).toLocaleTimeString('pt-BR')}`, 14, sigY + 12);
    doc.text(`Responsável: ${scan.user_name || 'Sistema'}`, 14, sigY + 18);
    doc.line(pageWidth / 2 - 30, sigY + 24, pageWidth / 2 + 30, sigY + 24);
    doc.text('Assinatura do Profissional', pageWidth / 2, sigY + 28, { align: 'center' });

    const filename = `laudo_${scan.id.substring(0, 8)}_${(scan.patient_name || 'paciente').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'CONFERIDO': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'LIBERADO': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'CONFERIDO': return 'Conferido';
      case 'LIBERADO': return 'Liberado';
      default: return status;
    }
  };

  const tabs = [
    { id: 'nova', label: 'NOVA DIGITALIZAÇÃO', icon: 'fa-camera', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'historico', label: 'HISTÓRICO', icon: 'fa-history', color: 'bg-gray-50 text-gray-600 border-gray-100' },
    { id: 'pendentes', label: 'PENDENTES DE CONFERÊNCIA', icon: 'fa-clock', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { id: 'laudos', label: 'LAUDOS GERADOS', icon: 'fa-file-pdf', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
  ];

  const filteredScans = scans.filter(s => {
    if (statusFilter === 'todos') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-1">Scanner Inteligente</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
            OCR de Resultados Laboratoriais - Laboratório Municipal de Uarini
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('nova')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2 ${activeTab === 'nova' ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
          >
            <Camera size={14} /> Nova Digitalização
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border flex items-center gap-2 min-w-[140px] text-center transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20' : tab.color} ${activeTab !== tab.id ? 'hover:bg-gray-50' : ''}`}
          >
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'nova' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Image size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Capturar Resultado</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Fotografe ou importe o exame impresso</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-600 mb-4">
                <Camera size={24} />
              </div>
              <h3 className="font-black text-slate-700 mb-2">Câmera</h3>
              <p className="text-[10px] text-gray-400 text-center mb-6 leading-tight">Fotografe o resultado impresso usando a câmera do celular ou computador.</p>
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-blue-600/20 transition-all"
                >
                  Ativar Câmera
                </button>
              ) : (
                <div className="w-full space-y-3">
                  <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden relative mb-2 border border-gray-200">
                    <video
                      ref={videoRef}
                      srcObject={videoStream}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ transform: `rotate(${imageRotation}deg)` }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={rotateLeft} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold text-[10px]">↺</button>
                    <button onClick={capturePhoto} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-[10px] uppercase">Capturar Foto</button>
                    <button onClick={rotateRight} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold text-[10px]">↻</button>
                  </div>
                  <button onClick={stopCamera} className="w-full text-red-500 font-bold text-[10px] uppercase hover:underline">Desativar Câmera</button>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-50 rounded-[20px] flex items-center justify-center text-purple-600 mb-4">
                <FileText size={24} />
              </div>
              <h3 className="font-black text-slate-700 mb-2">Importar Arquivo</h3>
              <p className="text-[10px] text-gray-400 text-center mb-6 leading-tight">JPG, JPEG, PNG ou PDF do resultado laboratorial.</p>
              <label className="w-full bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer transition-all group hover:border-blue-500">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="space-y-2">
                  <div className="text-gray-600 font-bold text-[11px]">Clique para selecionar</div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-widest">JPG • JPEG • PNG • PDF</div>
                </div>
              </label>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600 mb-4">
                <Eye size={24} />
              </div>
              <h3 className="font-black text-slate-700 mb-2">Pré-visualização</h3>
              {capturedImage ? (
                <div className="w-full max-w-xs space-y-3">
                  <div className="relative aspect-square">
                    {imageType === 'application/pdf' ? (
                      <div className="w-full h-full bg-gray-100 rounded-2xl flex flex-col items-center justify-center border border-gray-200">
                        <FileText size={48} className="text-gray-400 mb-2" />
                        <span className="text-[10px] font-bold text-gray-600">PDF</span>
                      </div>
                    ) : (
                      <img
                        src={capturedImage}
                        alt="Pré-visualização"
                        className="w-full h-full rounded-2xl object-cover border border-gray-100"
                        style={{ transform: `rotate(${imageRotation}deg)` }}
                      />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={rotateLeft} className="bg-white/90 backdrop-blur p-1.5 rounded-lg hover:bg-white text-gray-600">↺</button>
                      <button onClick={rotateRight} className="bg-white/90 backdrop-blur p-1.5 rounded-lg hover:bg-white text-gray-600">↻</button>
                      <button onClick={clearImage} className="bg-white/90 backdrop-blur p-1.5 rounded-lg hover:bg-white text-red-500">×</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Nenhuma imagem</span>
                </div>
              )}
            </div>
          </div>

          {capturedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <Image size={16} className="text-blue-600" />
                  <span className="font-black text-slate-700 text-sm">Resultado da IA (OCR)</span>
                </div>
                <button
                  onClick={processOCR}
                  disabled={isProcessing}
                  className={`bg-blue-600 hover:bg-blue-700 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase shadow-blue-600/20 transition-all`}
                >
                  {isProcessing ? 'Processando...' : 'Processar OCR'}
                </button>
              </div>

              {ocrResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Tipo de Exame</p>
                      <p className="font-bold text-slate-700">{ocrResult.tipo_exame || 'Não identificado'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Confiança Geral</p>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getConfidenceColor(ocrResult.confianca_geral)}`}>
                          {(ocrResult.confianca_geral * 100).toFixed(0)}%
                        </span>
                        <span className="text-[10px] text-gray-500">{getConfidenceLabel(ocrResult.confianca_geral)}</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Campos Encontrados</p>
                      <p className="font-bold text-slate-700">{editedFields.length}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                      <span className="font-black text-xs text-slate-700 uppercase tracking-widest">Campos Extraídos</span>
                      <span className="text-[9px] text-gray-500 font-bold">Clique para editar • {editedFields.filter((f: ExtractedField) => f.confianca < 0.6).length} de baixa confiança</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {editedFields.map((field, index) => (
                        <div key={index} className="p-4 flex justify-between items-center group hover:bg-gray-50/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-bold text-slate-700 text-sm ${field.confianca < 0.6 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {field.nome}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${getConfidenceColor(field.confianca)}`}>
                                {getConfidenceLabel(field.confianca)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Valor</label>
                                <input
                                  type="text"
                                  value={field.valor}
                                  onChange={(e) => updateFieldValue(index, 'valor', e.target.value)}
                                  className="w-full p-2 rounded-lg border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Unidade</label>
                                <input
                                  type="text"
                                  value={field.unidade}
                                  onChange={(e) => updateFieldValue(index, 'unidade', e.target.value)}
                                  className="w-full p-2 rounded-lg border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Referência</label>
                                <input
                                  type="text"
                                  value={field.referencia || ''}
                                  onChange={(e) => updateFieldValue(index, 'referencia', e.target.value || null)}
                                  className="w-full p-2 rounded-lg border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  onClick={() => { }}
                                  className="text-blue-600 font-bold text-[9px] hover:underline"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold ${getConfidenceColor(field.confianca)}`}>
                            {(field.confianca * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                      {editedFields.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                          <p className="text-[10px] font-bold uppercase">Nenhum campo extraído</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {ocrResult.observacoes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-[9px] font-black text-amber-700 uppercase mb-1">Observações da IA</p>
                      <p className="text-sm text-amber-600">{ocrResult.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserIcon size={18} className="text-blue-600" />
              <h3 className="font-black text-slate-700">Associar Paciente</h3>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Buscar paciente por nome ou CPF..."
                value={patientSearch}
                onChange={handlePatientSearch}
                className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              />
              {searchResults.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl max-h-60 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatient({ id: p.id, name: p.name, cpf: p.cpf })}
                      className={`w-full text-left p-3 border-b border-gray-50 hover:bg-blue-50 transition-colors ${selectedPatient?.id === p.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                    >
                      <div className="font-bold text-sm text-slate-700">{p.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{p.cpf}</div>
                    </button>
                  ))}
                  {!selectedPatient && searchResults.length > 0 && (
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="w-full text-left p-3 border-b border-gray-50 text-gray-500 text-[10px] font-bold uppercase hover:bg-gray-50"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>
              )}
              {selectedPatient && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-700 text-sm">{selectedPatient.name}</div>
                    <div className="text-[10px] text-emerald-600 font-mono">{selectedPatient.cpf}</div>
                  </div>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-emerald-600 font-bold text-[10px] hover:underline"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveScan}
              disabled={isUploading || !capturedImage}
              className={`bg-emerald-600 hover:bg-emerald-700 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''} text-white px-8 py-4 rounded-[30px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2`}
            >
              {isUploading ? (
                'Salvando...'
              ) : (
                <>
                  <Save size={18} /> Salvar Digitalização
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'historico' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <History size={20} className="text-gray-600" /> Histórico de Digitalizações
            </h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="todos">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="CONFERIDO">Conferido</option>
              <option value="LIBERADO">Liberado</option>
            </select>
          </div>
          {filteredScans.length === 0 ? (
            <div className="text-center py-16">
              <History size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold text-sm">Nenhuma digitalização encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Data</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">CPF</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Exame</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Confiança</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredScans.map((scan) => {
                    const extracted = scan.extracted_data || {};
                    return (
                      <tr key={scan.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-slate-700">
                          {new Date(scan.scan_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{scan.patient_name || '-'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-[10px] text-gray-500">{scan.patient_cpf || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">
                          {extracted.tipo_exame || scan.ocr_text?.substring(0, 30) || '-'}{scan.ocr_text?.length > 30 ? '...' : ''}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${getConfidenceColor(scan.confidence_score)}`}>
                            {(scan.confidence_score * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${getStatusBadge(scan.status)}`}>
                            {getStatusLabel(scan.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {scan.status === 'PENDENTE' && (
                              <button
                                onClick={() => approveScan(scan)}
                                className="text-blue-600 font-bold text-[9px] hover:underline"
                              >
                                Conferir
                              </button>
                            )}
                            {scan.pdf_url && (
                              <a href={scan.pdf_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold text-[9px] hover:underline">
                                Ver PDF
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pendentes' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-10">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-amber-600" /> Pendentes de Conferência
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Resultados que precisam de revisão e aprovação de um profissional autorizado antes da liberação do laudo.
          </p>
          {pendingScans.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 size={48} className="text-emerald-300 mx-auto mb-4" />
              <p className="text-emerald-600 font-bold text-sm">Nenhuma pendência de conferência.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingScans.map((scan) => {
                const extracted = scan.extracted_data || {};
                const lowConfFields = (extracted.campos || []).filter((f: any) => f.confianca < 0.6);
                return (
                  <div key={scan.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold text-slate-700 text-sm">{scan.patient_name || 'Paciente não identificado'}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{scan.patient_cpf || '-'}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${getStatusBadge(scan.status)}`}>
                        {getStatusLabel(scan.status)}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Tipo de Exame</div>
                      <div className="font-medium text-slate-700">{extracted.tipo_exame || 'Não identificado'}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Campos Extraídos ({extracted.campos?.length || 0})</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(extracted.campos || []).map((f: any, idx: number) => (
                          <div key={idx} className={`p-3 rounded-xl border flex justify-between items-start ${f.confianca < 0.6 ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex-1">
                              <div className="text-[9px] font-bold text-gray-500 uppercase mb-0.5">{f.nome}</div>
                              <div className="font-medium text-slate-700 text-sm">{f.valor} {f.unidade}</div>
                              {f.referencia && (
                                <div className="text-[9px] text-gray-500 mt-0.5">Ref: {f.referencia}</div>
                              )}
                            </div>
                            <span className={`text-[9px] font-bold ${getConfidenceColor(f.confianca)}`}>
                              {(f.confianca * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                      {lowConfFields.length > 0 && (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-xl">
                          <p className="text-[10px] font-bold text-rose-700 mb-1">⚠ Campos com baixa confiança:</p>
                          <ul className="text-sm text-rose-600 list-disc list-inside space-y-1">
                            {lowConfFields.map((f: any) => (
                              <li key={f.nome}>{f.nome}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => approveScan(scan)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold text-[10px] uppercase shadow-emerald-600/20"
                      >
                        Aprovar Digitalização
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'laudos' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-10">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <FileText size={20} className="text-emerald-600" /> Laudos Gerados
          </h2>
          {generatedLaudos.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold text-sm">Nenhum laudo gerado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedLaudos.map((scan) => (
                <div key={scan.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-slate-700 text-sm">{scan.patient_name || 'Paciente não identificado'}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{scan.patient_cpf || '-'}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
                      Liberado
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Digitalizado em</div>
                    <div className="font-medium text-slate-700">
                      {new Date(scan.scan_date).toLocaleDateString('pt-BR')} às {new Date(scan.scan_date).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Responsável pela liberação</div>
                    <div className="font-medium text-slate-700">{scan.approved_by || scan.user_name || 'Sistema'}</div>
                  </div>
                  <div className="flex gap-2">
                    {scan.pdf_url && (
                      <a href={scan.pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-[10px] uppercase text-center shadow-emerald-600/20">
                        <Download size={14} className="mr-1" /> Baixar PDF
                      </a>
                    )}
                    <button
                      onClick={() => generateLaudoPDF(scan)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-[10px] uppercase text-center shadow-blue-600/20"
                    >
                      <Download size={14} className="mr-1" /> Reimprimir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScannerInteligentePage;
