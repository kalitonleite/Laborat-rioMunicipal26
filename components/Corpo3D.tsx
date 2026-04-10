
import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Text, Float, Html } from '@react-three/drei';
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
            <p className="text-sm text-slate-400 font-medium">Não foi possível carregar o mapa anatômico. Verifique se o arquivo "anatomia do corpo.glb" está na pasta public/models/.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Model({ exames }: { exames: ExamMapping[] }) {
  // Ajustando para um caminho mais comum e seguro
  const { scene } = useGLTF('/models/anatomia do corpo.glb');

  useMemo(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const meshName = child.name.toLowerCase();
        
        let targetOrgao = '';
        if (meshName.includes('brain') || meshName.includes('cerebro')) targetOrgao = 'cerebro';
        else if (meshName.includes('liver') || meshName.includes('figado')) targetOrgao = 'figado';
        else if (meshName.includes('kidney') || meshName.includes('rim')) targetOrgao = 'rins';
        else if (meshName.includes('heart') || meshName.includes('coracao')) targetOrgao = 'coracao';
        else if (meshName.includes('pancreas')) targetOrgao = 'pancreas';

        const exame = exames.find(e => e.orgao === targetOrgao);
        
        if (exame && (child as THREE.Mesh).material) {
            const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (exame.status === 'critico') material.color.set('#ef4444');
            else if (exame.status === 'alerta') material.color.set('#facc15');
            else material.color.set('#22c55e');
            
            material.emissive = material.color.clone().multiplyScalar(0.2);
            material.opacity = 1;
            material.transparent = false;
        } else {
            if ((child as THREE.Mesh).material) {
                const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                material.color.set('#e2e8f0');
                material.opacity = 0.2;
                material.transparent = true;
                material.emissive.set('#000000');
            }
        }
      }
    });
  }, [scene, exames]);

  return <primitive object={scene} scale={2} position={[0, -2, 0]} />;
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

      <ErrorBoundary>
        <Canvas camera={{ position: [0, 0, 6], fov: 40 }} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.8} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
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
