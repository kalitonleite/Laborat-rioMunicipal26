
import React from 'react';
import { User } from '../types';

interface AdminDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  return (
    <div className="min-h-screen bg-red-600 flex items-center justify-center p-4">
      <div className="bg-white p-12 md:p-20 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.3)] text-center max-w-2xl border-8 border-red-500">
        <h1 className="text-4xl md:text-6xl font-black text-red-600 mb-6 uppercase tracking-tighter">
          DEPLOY ATIVO!
        </h1>
        <div className="space-y-4 mb-10">
          <p className="text-xl md:text-2xl font-black text-slate-800">
            Versão: <span className="bg-red-100 text-red-600 px-4 py-1 rounded-full">14:25</span>
          </p>
          <p className="text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
            Se você está vendo esta tela vermelha, significa que o Vercel ESTÁ recebendo as minhas atualizações.
          </p>
        </div>
        <button 
           onClick={() => window.location.reload()}
           className="w-full bg-red-600 text-white px-10 py-6 rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 text-sm"
        >
          Clique aqui para recarregar
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
