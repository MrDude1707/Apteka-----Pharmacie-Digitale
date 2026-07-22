import React from 'react';
import { ShieldCheck, LogOut, MapPin, Pill, ClipboardList, Settings, Users, MessageCircle, RefreshCw } from 'lucide-react';
import Logo from './Logo';

export default function Navbar({ user, onLogout, activeTab, setActiveTab }) {
  return (
    <nav className="sticky top-0 z-[1000] w-full bg-white/75 backdrop-blur-md border-b border-gray-200/40 px-6 py-3 flex items-center justify-between">
      <div className="cursor-pointer" onClick={() => { setActiveTab(user.role === 'MEDECIN' ? 'medecin_stocks' : user.role === 'PHARMACIEN' ? 'pharmacien_deliver' : user.role === 'ADMINISTRATEUR' ? 'admin_users' : 'recherche'); }}>
        <Logo size="sm" />
      </div>

      {user && (
        <div className="hidden lg:flex items-center gap-2 text-sm font-medium">
          {user.role === 'PATIENT' && (
            <>
              <button onClick={() => setActiveTab('recherche')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'recherche' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Pill size={16} className="inline mr-1" />Achat Médicaments</button>
              <button onClick={() => setActiveTab('pharmacies_map')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'pharmacies_map' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><MapPin size={16} className="inline mr-1" />Carte Réseau</button>
              <button onClick={() => setActiveTab('prescriptions')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'prescriptions' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><ClipboardList size={16} className="inline mr-1" />Mes Ordonnances</button>
              <button onClick={() => setActiveTab('messagerie')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'messagerie' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><MessageCircle size={16} className="inline mr-1" />Chat Docteur</button>
            </>
          )}

          {user.role === 'MEDECIN' && (
            <>
              <button onClick={() => setActiveTab('medecin_stocks')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'medecin_stocks' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><MapPin size={16} className="inline mr-1" />Zone & Stocks</button>
              <button onClick={() => setActiveTab('medecin_prescrire')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'medecin_prescrire' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><ClipboardList size={16} className="inline mr-1" />Rédiger</button>
              <button onClick={() => setActiveTab('medecin_history')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'medecin_history' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><ClipboardList size={16} className="inline mr-1" />Historique</button>
              <button onClick={() => setActiveTab('medecin_patients')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'medecin_patients' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Users size={16} className="inline mr-1" />Mes Patients</button>
              <button onClick={() => setActiveTab('medecin_renewals')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'medecin_renewals' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><RefreshCw size={14} className="inline mr-1" />Renouvellements</button>
            </>
          )}

          {user.role === 'PHARMACIEN' && (
            <>
              <button onClick={() => setActiveTab('pharmacien_deliver')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'pharmacien_deliver' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><ShieldCheck size={16} className="inline mr-1" />Délivrer</button>
              <button onClick={() => setActiveTab('pharmacien_stocks')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'pharmacien_stocks' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Pill size={16} className="inline mr-1" />Inventaire</button>
            </>
          )}

          {user.role === 'ADMINISTRATEUR' && (
            <>
              <button onClick={() => setActiveTab('admin_users')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'admin_users' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Settings size={16} className="inline mr-1" />Comptes en attente</button>
              <button onClick={() => setActiveTab('admin_all_users')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'admin_all_users' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Users size={16} className="inline mr-1" />Tous les comptes</button>
              <button onClick={() => setActiveTab('admin_vitrine')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'admin_vitrine' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Users size={16} className="inline mr-1" />Liaison Vitrines</button>
              <button onClick={() => setActiveTab('admin_supervision')} className={`px-4 py-2 rounded-full transition-all ${activeTab === 'admin_supervision' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><ClipboardList size={16} className="inline mr-1" />Supervision</button>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-xs">
              <span className="font-bold text-gray-900">{user.firstName} {user.lastName}</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase">{user.role}</span>
            </div>
            <button onClick={onLogout} className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition-all"><LogOut size={18} /></button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('login')} className="px-4 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 font-bold">Connexion</button>
            <button onClick={() => setActiveTab('register')} className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold">S'inscrire</button>
          </div>
        )}
      </div>
    </nav>
  );
}