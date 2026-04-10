
import React, { useRef, useMemo, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ExamMapping {
  orgao: string;
  status: 'normal' | 'alerta' | 'critico';
  exame_nome: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapeamento exame → regiões anatômicas afetadas
// ─────────────────────────────────────────────────────────────────────────────
function getRegionsForExam(examName: string): string[] {
  const n = examName.toUpperCase();

  if (n.includes('HEMOGRAMA') || n.includes('HEMÁCIAS') || n.includes('LEUCÓCIT') || n.includes('PLAQUETA')) return ['sangue'];
  if (n.includes('BIOQUIMICA') || n.includes('BIOQUÍMICA')) return ['figado', 'rins', 'pancreas', 'coracao'];
  if (n.includes('URIN') || n.includes('EAS') || n.includes('UROCULTURA')) return ['rins', 'bexiga'];
  if (n.includes('PARASIT') || n.includes('FEZES') || n.includes('COPRO') || n.includes('HELMINTO')) return ['intestinos'];
  if (n.includes('COLESTEROL') || n.includes('TRIGLICERI') || n.includes('CARDIO') || n.includes('ECG')) return ['coracao'];
  if (n.includes('GLICOSE') || n.includes('GLICEMIA') || n.includes('INSULINA') || n.includes('HBA1C')) return ['pancreas'];
  if (n.includes('TGO') || n.includes('TGP') || n.includes('AST') || n.includes('ALT') || n.includes('HEPAT') || n.includes('BILIRRUB')) return ['figado'];
  if (n.includes('CREATIN') || n.includes('UREIA') || n.includes('RENAL') || n.includes('FILTRAÇÃO')) return ['rins'];
  if (n.includes('TSH') || n.includes('T3') || n.includes('T4') || n.includes('TIREO')) return ['tireoide'];
  if (n.includes('PSA') || n.includes('PROSTAT')) return ['prostata'];
  if (n.includes('TESTOST') || n.includes('HORMÔ') || n.includes('LH') || n.includes('FSH')) return ['prostata'];
  if (n.includes('FERRO') || n.includes('FERRITIN') || n.includes('TRANSFERR')) return ['figado', 'sangue'];
  if (n.includes('COLTUR') || n.includes('SWAB')) return ['sangue'];
  return ['corpo']; // fallback: corpo inteiro
}

// ─────────────────────────────────────────────────────────────────────────────
// Posições anatômicas 3D (world space; modelo com scale=2, position=[0,-2,0])
// ─────────────────────────────────────────────────────────────────────────────
const ORGAN_CONFIG: Record<string, { pos: [number, number, number]; r: number; label: string }> = {
  cerebro:    { pos: [0, 3.55, 0.1],    r: 0.22, label: 'Cérebro' },
  tireoide:   { pos: [0, 3.1,  0.3],    r: 0.12, label: 'Tireoide' },
  coracao:    { pos: [-0.28, 2.25, 0.3], r: 0.18, label: 'Coração' },
  pulmao:     { pos: [0.35,  2.3,  0.2], r: 0.15, label: 'Pulmão' },
  figado:     { pos: [0.45,  1.6,  0.15],r: 0.2,  label: 'Fígado' },
  estomago:   { pos: [0,     1.5,  0.25],r: 0.14, label: 'Estômago' },
  pancreas:   { pos: [-0.2,  1.35, 0.1], r: 0.13, label: 'Pâncreas' },
  rins:       { pos: [0,     1.1, -0.2], r: 0.18, label: 'Rins' },
  intestinos: { pos: [0,     0.4,  0.2], r: 0.26, label: 'Intestinos' },
  bexiga:     { pos: [0,    -0.1,  0.2], r: 0.13, label: 'Bexiga' },
  prostata:   { pos: [0,    -0.2, -0.1], r: 0.11, label: 'Próstata' },
};

// Pontos distribuídos para hemograma (sangue)
const BLOOD_POINTS: [number, number, number][] = [
  [0, 3.55, 0.1], [-0.28, 2.25, 0.3], [0.45, 1.6, 0.15],
  [0, 1.1, -0.2], [0, 0.4, 0.2],
];

function statusColor(status: 'normal' | 'alerta' | 'critico') {
  return status === 'critico' ? '#ef4444' : status === 'alerta' ? '#facc15' : '#22c55e';
}

// ─────────────────────────────────────────────────────────────────────────────
// Esfera pulsante
// ─────────────────────────────────────────────────────────────────────────────
function OrganSphere({ position, color, radius, pulse }: {
  position: [number, number, number];
  color: string;
  radius: number;
  pulse: boolean;
  key?: any; // Aceitar key explicitamente se o compilador for rigoroso
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!pulse) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 3.5) * 0.12;
    coreRef.current?.scale.setScalar(s);
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.6 + Math.sin(t * 3.5) * 0.3);
      ((glowRef.current.material as THREE.MeshBasicMaterial)).opacity =
        0.18 + Math.sin(t * 3.5) * 0.08;
    }
  });

  const c = new THREE.Color(color);

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 1.55, 16, 16]} />
        <meshBasicMaterial color={c} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[radius, 22, 22]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9}
          roughness={0.15} metalness={0.4} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Conteúdo 3D principal
// ─────────────────────────────────────────────────────────────────────────────
function Scene({ exames, selectedExam }: { exames: ExamMapping[]; selectedExam: ExamMapping | null }) {
  const { scene } = useGLTF('/anatomiado corpo.glb');

  // Deixar o modelo cinza semitransparente para funcionar como "casca"
  useMemo(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const applyMat = (m: THREE.Material) => {
          const mat = m as THREE.MeshStandardMaterial;
          mat.color.set('#94a3b8');
          mat.opacity = 0.22;
          mat.transparent = true;
          mat.emissive.set('#1e293b');
          mat.emissiveIntensity = 0.05;
          mat.needsUpdate = true;
        };
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(m => { const c = (m as THREE.Material).clone(); applyMat(c); return c; });
        } else {
          mesh.material = (mesh.material as THREE.Material).clone();
          applyMat(mesh.material as THREE.Material);
        }
      }
    });
  }, [scene]);

  // Calcular o que mostrar
  const regions = selectedExam ? getRegionsForExam(selectedExam.exame_nome) : [];
  const isSangue = regions.includes('sangue');
  const isCorpo  = regions.includes('corpo');
  const hexSel   = selectedExam ? statusColor(selectedExam.status) : '#22c55e';

  return (
    <>
      <primitive object={scene} scale={2} position={[0, -2, 0]} />

      {/* ── Pontos no mesmo sistema de coordenadas do modelo ── */}
      <group position={[0, -2, 0]}>
        {/* ── Exame selecionado ── */}
        {selectedExam && isSangue &&
          BLOOD_POINTS.map((p, i) => (
            <OrganSphere key={i} position={p} color={hexSel} radius={0.13} pulse />
          ))}

        {selectedExam && isCorpo && Object.values(ORGAN_CONFIG).map((o, i) => (
          <OrganSphere key={i} position={o.pos} color={hexSel} radius={o.r * 0.7} pulse />
        ))}

        {selectedExam && !isSangue && !isCorpo && regions.map(region => {
          const o = ORGAN_CONFIG[region];
          return o ? <OrganSphere key={region} position={o.pos} color={hexSel} radius={o.r} pulse /> : null;
        })}

        {/* ── Sem exame selecionado: mostra todos com baixa opacidade ── */}
        {!selectedExam && exames.map((exam, i) => {
          const r = getRegionsForExam(exam.exame_nome);
          const col = statusColor(exam.status);
          const isSg = r.includes('sangue') || r.includes('corpo');
          if (isSg) return BLOOD_POINTS.map((p, j) => (
            <OrganSphere key={`bg-${i}-${j}`} position={p} color={col} radius={0.09} pulse={false} />
          ));
          return r.map(region => {
            const o = ORGAN_CONFIG[region];
            return o ? <OrganSphere key={`bg-${i}-${region}`} position={o.pos} color={col} radius={o.r * 0.7} pulse={false} /> : null;
          });
        })}
      </group>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary
// ─────────────────────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: React.ReactNode }, { err: boolean }> {
  state: { err: boolean };
  constructor(props: any) { 
    super(props); 
    this.state = { err: false }; 
  }
  static getDerivedStateFromError() { return { err: true }; }
  render() {
    if (this.state.err) return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-8 text-center">
        <i className="fas fa-exclamation-triangle text-amber-500 text-4xl mb-4"></i>
        <h3 className="text-lg font-black uppercase tracking-widest mb-2">Modelo 3D Indisponível</h3>
        <p className="text-sm text-slate-400">Arquivo não encontrado na pasta public/.</p>
      </div>
    );
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente exportado
// ─────────────────────────────────────────────────────────────────────────────
export default function Corpo3D({ exames, selectedExam }: {
  exames: ExamMapping[];
  selectedExam?: ExamMapping | null;
}) {
  const sel = selectedExam ?? null;
  const selRegions = sel ? getRegionsForExam(sel.exame_nome) : [];

  // Rótulo amigável das regiões afetadas
  const regionLabels = selRegions.includes('sangue') ? 'Sistema Sanguíneo' :
    selRegions.includes('corpo') ? 'Corpo Geral' :
    selRegions.map(r => ORGAN_CONFIG[r]?.label ?? r).join(', ');

  return (
    <div className="w-full h-[550px] bg-slate-900 rounded-[40px] overflow-hidden relative border border-white/10 shadow-2xl">

      {/* Header */}
      <div className="absolute top-8 left-8 z-10 space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
          <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">Live System</span>
        </div>
        <h3 className="text-white font-black uppercase tracking-widest text-lg leading-tight">Mapa Biométrico 3D</h3>
        {sel && (
          <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 space-y-1">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Visualizando</p>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                sel.status === 'critico' ? 'bg-red-500 animate-pulse' :
                sel.status === 'alerta' ? 'bg-yellow-400' : 'bg-emerald-400'
              }`}></span>
              <span className="text-[11px] font-black text-white uppercase tracking-wide">{sel.exame_nome}</span>
            </div>
            <p className="text-[9px] text-white/50 font-bold">{regionLabels}</p>
          </div>
        )}
        {!sel && (
          <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Selecione um exame →</p>
        )}
      </div>

      {/* Legenda */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-3 bg-black/20 backdrop-blur-md p-5 rounded-3xl border border-white/5">
        {([['#22c55e','Normal'],['#facc15','Alerta'],['#ef4444','Crítico']] as [string,string][]).map(([c,l]) => (
          <div key={l} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}88` }}></div>
            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{l}</span>
          </div>
        ))}
      </div>

      {/* Dica quando modelo sem exame selecionado */}
      {!sel && exames.length > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <p className="text-[9px] font-black text-white/25 uppercase tracking-widest animate-pulse whitespace-nowrap">
            ← Clique em um exame para visualizar
          </p>
        </div>
      )}

      <ErrorBoundary>
        <Canvas camera={{ position: [0, 0, 6], fov: 40 }} gl={{ antialias: true }}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <pointLight position={[0, 5, 5]} intensity={0.5} color="#60a5fa" />
          <React.Suspense fallback={
            <Html center>
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Renderizando...</p>
              </div>
            </Html>
          }>
            <Scene exames={exames} selectedExam={sel} />
            <Environment preset="night" />
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
          </React.Suspense>
          <OrbitControls
            enablePan={false}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 3}
            autoRotate
            autoRotateSpeed={0.4}
            enableZoom
          />
        </Canvas>
      </ErrorBoundary>

      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-[40px]"></div>
      <div className="absolute top-8 right-8 flex gap-2">
        <div className="w-8 h-1 bg-white/10 rounded-full"></div>
        <div className="w-2 h-1 bg-blue-500 rounded-full"></div>
        <div className="w-2 h-1 bg-white/10 rounded-full"></div>
      </div>
    </div>
  );
}
