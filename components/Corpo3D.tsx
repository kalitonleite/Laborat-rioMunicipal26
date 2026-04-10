
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ExamMapping {
  orgao: string;
  status: 'normal' | 'alerta' | 'critico';
  exame_nome: string;
}

// Error Boundary minimalista para o Canvas
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-8 text-center">
            <i className="fas fa-exclamation-triangle text-amber-500 text-4xl mb-4"></i>
            <h3 className="text-lg font-black uppercase tracking-widest mb-2">Modelo 3D Indisponível</h3>
            <p className="text-sm text-slate-400 font-medium">Não foi possível carregar o mapa anatômico. Verifique se o arquivo está na pasta public/.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Determina o pior status geral de uma lista de exames
function getOverallStatus(exames: ExamMapping[]): 'normal' | 'alerta' | 'critico' {
  if (exames.some(e => e.status === 'critico')) return 'critico';
  if (exames.some(e => e.status === 'alerta')) return 'alerta';
  return 'normal';
}

function statusToColor(status: 'normal' | 'alerta' | 'critico'): string {
  if (status === 'critico') return '#ef4444';
  if (status === 'alerta') return '#facc15';
  return '#22c55e';
}

function Model({ exames }: { exames: ExamMapping[] }) {
  const { scene } = useGLTF('/anatomiado corpo.glb');
  const overallStatus = getOverallStatus(exames);
  const overallColor = statusToColor(overallStatus);

  useMemo(() => {
    if (!scene) return;

    // Mapeamento de palavras-chave do nome do mesh para órgão
    const keywordMap: Record<string, string> = {
      brain: 'cerebro', cerebro: 'cerebro', cabeca: 'cerebro', head: 'cerebro',
      liver: 'figado', figado: 'figado',
      kidney: 'rins', rim: 'rins', rins: 'rins',
      heart: 'coracao', coracao: 'coracao',
      pancreas: 'pancreas',
      lung: 'pulmao', pulmao: 'pulmao',
      stomach: 'estomago', estomago: 'estomago',
    };

    // Monta um mapa de órgão -> status, incluindo 'corpo' como fallback
    const orgaoStatus: Record<string, 'normal' | 'alerta' | 'critico'> = {};
    exames.forEach(e => {
      const existing = orgaoStatus[e.orgao];
      if (!existing || (e.status === 'critico') || (e.status === 'alerta' && existing === 'normal')) {
        orgaoStatus[e.orgao] = e.status;
      }
    });

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshName = (mesh.name || '').toLowerCase();
        const parentName = (mesh.parent?.name || '').toLowerCase();
        const combinedName = meshName + ' ' + parentName;

        // Detecta qual órgão este mesh representa
        let matchedOrgao: string | null = null;
        for (const [keyword, orgao] of Object.entries(keywordMap)) {
          if (combinedName.includes(keyword)) {
            matchedOrgao = orgao;
            break;
          }
        }

        // Material clone para não contaminar outros usos do mesh
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(m => m.clone());
        } else if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
        }

        const applyColor = (mat: THREE.MeshStandardMaterial, color: string, opacity: number, transparent: boolean) => {
          mat.color.set(color);
          mat.opacity = opacity;
          mat.transparent = transparent;
          mat.emissive = new THREE.Color(color).multiplyScalar(transparent ? 0 : 0.15);
          mat.needsUpdate = true;
        };

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        if (matchedOrgao && orgaoStatus[matchedOrgao]) {
          // Mesh de órgão específico com exame mapeado
          const color = statusToColor(orgaoStatus[matchedOrgao]);
          materials.forEach(mat => applyColor(mat as THREE.MeshStandardMaterial, color, 1, false));
        } else if (exames.length > 0) {
          // Nenhum mapeamento específico: colorir com cor geral mas semi-transparente
          materials.forEach(mat => applyColor(mat as THREE.MeshStandardMaterial, overallColor, 0.55, true));
        } else {
          // Sem exames: mostrar modelo cinza transparente
          materials.forEach(mat => applyColor(mat as THREE.MeshStandardMaterial, '#94a3b8', 0.2, true));
        }
      }
    });
  }, [scene, exames, overallStatus, overallColor]);

  return <primitive object={scene} scale={2} position={[0, -2, 0]} />;
}

// Painel de diagnóstico flutuante sobre o modelo
function DiagnosticoOverlay({ exames }: { exames: ExamMapping[] }) {
  const hasAlert = exames.some(e => e.status !== 'normal');
  const overall = getOverallStatus(exames);

  if (exames.length === 0) return null;

  return (
    <div className="absolute top-1/2 left-6 -translate-y-1/2 z-10 space-y-2 max-w-[140px]">
      {exames.slice(0, 4).map((e, i) => (
        <div key={i} className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            e.status === 'critico' ? 'bg-red-500 animate-pulse' :
            e.status === 'alerta' ? 'bg-yellow-400' : 'bg-emerald-500'
          }`}></span>
          <span className="text-[9px] font-black text-white/70 uppercase tracking-wide truncate">{e.exame_nome}</span>
        </div>
      ))}
    </div>
  );
}

export default function Corpo3D({ exames }: { exames: ExamMapping[] }) {
  return (
    <div className="w-full h-[550px] bg-slate-900 rounded-[40px] overflow-hidden relative border border-white/10 shadow-2xl group">
      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-3 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">Live System</span>
        </div>
        <h3 className="text-white font-black uppercase tracking-widest text-lg">
            Mapa Biométrico 3D
        </h3>
      </div>
      
      {/* Legenda de status */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-3 bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Normal</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.4)]"></div>
            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Alerta</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Crítico</span>
        </div>
      </div>

      {/* Overlay de diagnóstico lateral */}
      <DiagnosticoOverlay exames={exames} />

      <ErrorBoundary>
        <Canvas camera={{ position: [0, 0, 6], fov: 40 }} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={1.2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.8} />
          <pointLight position={[0, 5, 5]} intensity={0.6} color="#60a5fa" />
          <React.Suspense fallback={
            <Html center>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Renderizando...</p>
                </div>
            </Html>
          }>
            <Model exames={exames} />
            <Environment preset="night" />
            <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={10} blur={2} far={4} />
          </React.Suspense>
          <OrbitControls 
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.8} 
            minPolarAngle={Math.PI / 3}
            autoRotate
            autoRotateSpeed={0.5}
            enableZoom={true}
          />
        </Canvas>
      </ErrorBoundary>
      
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-[40px] shadow-inner"></div>
      
      {/* UI Overlay decorativo */}
      <div className="absolute top-8 right-8 flex gap-2">
         <div className="w-8 h-1 bg-white/10 rounded-full"></div>
         <div className="w-2 h-1 bg-blue-500 rounded-full"></div>
         <div className="w-2 h-1 bg-white/10 rounded-full"></div>
      </div>
    </div>
  );
}
