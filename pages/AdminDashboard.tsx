
import React from 'react';
import { User } from '../types';

const AdminDashboard: React.FC<{user: User}> = ({ user }) => {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="bg-white p-20 rounded-3xl shadow-2xl text-center">
        <h1 className="text-4xl font-black text-red-600 mb-4">TESTE DE DEPLOY ATIVO</h1>
        <p className="text-xl font-bold text-gray-700">Versão: 14:15 (23/03)</p>
        <p className="mt-4 text-gray-500">Se você está vendo isso, o deploy está funcionando!</p>
        <button 
           onClick={() => window.location.reload()}
           className="mt-8 bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest"
        >
          Recarregar
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
