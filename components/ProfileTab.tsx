import React, { useRef, useState } from 'react';
import { User } from '../types';
import { authService } from '../services/apiService';

interface ProfileTabProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, onUpdateUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdData, setPwdData] = useState({ new: '', confirm: '' });
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpdateUser({ ...user, avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInfo = () => {
    onUpdateUser({ ...user, name: tempName });
    setIsEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdData.new !== pwdData.confirm) {
      alert("As senhas não coincidem!");
      return;
    }

    try {
      await authService.updatePassword(pwdData.new);
      alert("Senha alterada com sucesso!");
      setShowPasswordModal(false);
      setPwdData({ new: '', confirm: '' });
    } catch (err: any) {
      console.error('Error changing password:', err);
      alert(`Erro ao alterar senha: ${err.message}`);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'ADMINISTRADOR';
      case 'MEDICAL': return 'MÉDICO';
      case 'RECEPTION': return 'RECEPÇÃO';
      case 'PATIENT': return 'PACIENTE';
      default: return role;
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#1e40af] to-[#1e3a8a]"></div>

        <div className="px-8 pb-8 -mt-16">
          <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="Foto de Perfil" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-gray-300 text-4xl"></i>
                )}
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-[#1e40af] text-white w-10 h-10 rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-white">
                <i className="fas fa-camera text-sm"></i>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="flex-grow mb-2">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <input type="text" className="text-2xl font-black text-slate-800 border-b-2 border-blue-500 outline-none bg-transparent py-1" value={tempName} onChange={(e) => setTempName(e.target.value)} autoFocus />
                ) : (
                  <h2 className="text-2xl font-black text-slate-800">{user.name}</h2>
                )}
                <button onClick={() => isEditing ? handleSaveInfo() : setIsEditing(true)} className="text-gray-400 hover:text-blue-600 transition-colors">
                  <i className={`fas ${isEditing ? 'fa-check-circle text-green-500' : 'fa-pen-to-square'}`}></i>
                </button>
              </div>
              <p className="text-sm text-gray-500 font-medium">CPF: {user.cpf}</p>
              {user.sus_number && <p className="text-sm text-emerald-600 font-bold">Cartão SUS: {user.sus_number}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <h3 className="text-xs font-black text-[#1e40af] uppercase tracking-widest mb-4">Informações da Conta</h3>
              <div className="space-y-4">
                <InfoRow icon="fa-id-card" label="ID do Sistema" value={user.id} />
                <InfoRow icon="fa-shield-halved" label="Nível de Acesso" value={getRoleLabel(user.role)} />
                {user.sus_number && <InfoRow icon="fa-address-card" label="Nº Cartão SUS" value={user.sus_number} />}
                <InfoRow icon="fa-envelope" label="Email de Recuperação" value="Não cadastrado" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <h3 className="text-xs font-black text-[#1e40af] uppercase tracking-widest mb-4">Segurança e Privacidade</h3>
              <div className="space-y-3">
                <button onClick={() => setShowPasswordModal(true)} className="w-full text-left p-3 rounded-xl bg-white border border-gray-100 text-sm font-bold text-slate-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                  <span>Alterar Senha de Acesso</span>
                  <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                </button>
                <button className="w-full text-left p-3 rounded-xl bg-white border border-gray-100 text-sm font-bold text-slate-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                  <span>Gerenciar Dispositivos</span>
                  <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                </button>
                <button className="w-full text-left p-3 rounded-xl bg-white border border-gray-100 text-sm font-bold text-slate-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                  <span>Privacidade de Dados</span>
                  <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Alterar Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">Alterar Senha</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-red-500"><i className="fas fa-times text-xl"></i></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nova Senha (6 dígitos)</label>
                <div className="relative">
                  <input required type={showNewPwd ? "text" : "password"} maxLength={6} placeholder="Ex: ab1234" className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none text-sm font-bold pr-12" value={pwdData.new} onChange={e => setPwdData({ ...pwdData, new: e.target.value })} />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
                    <i className={`fas ${showNewPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmar Nova Senha</label>
                <div className="relative">
                  <input required type={showConfirmPwd ? "text" : "password"} maxLength={6} placeholder="Repita a nova senha" className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none text-sm font-bold pr-12" value={pwdData.confirm} onChange={e => setPwdData({ ...pwdData, confirm: e.target.value })} />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
                    <i className={`fas ${showConfirmPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#1e40af] text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-blue-900 transition-all uppercase tracking-widest text-xs mt-4">Salvar Nova Senha</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 border border-gray-100">
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  </div>
);

export default ProfileTab;
