import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import MapRoute from './components/MapRoute';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacistDashboard from './components/PharmacistDashboard';
import { Search, CheckCircle, ClipboardList, ShoppingCart, MessageCircle, FileText, Send, X, CreditCard, HeartPulse, Printer, Pill, Users, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import { API_URL } from './config';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [welcomeUser, setWelcomeUser] = useState<any>(null);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [patientLocation, setPatientLocation] = useState({ lat: -18.913, lng: 47.525 });

  // RECHERCHE & AUTOCOMPLETE (Tâche 9)
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchStocks, setSearchStocks] = useState<any[]>([]);

  // CART & CHECKOUT (Tâche 5)
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const updateCartQty = (index: number, newQty: number) => {
    const newCart = [...cart];
    if (newQty < 1) return;
    if (newQty > newCart[index].quantite) {
      alert(`Désolé, seulement ${newCart[index].quantite} boîte(s) sont disponibles en stock.`);
      return;
    }
    newCart[index] = { ...newCart[index], qty: newQty };
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (newCart.length === 0) {
      setShowCheckout(false);
    }
  };

  // MESSAGERIE (Tâche 3)
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatDoctorId, setChatDoctorId] = useState('');

  // PRESCRIPTIONS & RENOUVELLEMENT (Tâche 2 & 4)
  const [myPrescriptions, setMyPrescriptions] = useState<any[]>([]);
  const [viewPdfOrdonnance, setViewPdfOrdonnance] = useState<any>(null);

  // ADMIN VITRINE (Tâche 1)
  const [adminVitrines, setAdminVitrines] = useState<any[]>([]);
  const [adminMedecins, setAdminMedecins] = useState<any[]>([]);
  const [allPharmacies, setAllPharmacies] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState('');

  // ADMIN COMPTES & SUPERVISION
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { 
          if(data && data.id) {
            setUser(data); 
            setActiveTab(data.role === 'MEDECIN' ? 'medecin_stocks' : data.role === 'PATIENT' ? 'recherche' : data.role === 'ADMINISTRATEUR' ? 'admin_vitrine' : 'pharmacien_deliver'); 
          } else {
            localStorage.removeItem('token');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleAutocomplete = async (val: string) => {
    setSearchQuery(val);
    if(val.length < 2) return setSuggestions([]);
    const res = await fetch(`${API_URL}/api/patient/medicaments/autocomplete?q=${val}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    setSuggestions(await res.json());
  };

  const handleSearchMeds = async (query = searchQuery) => {
    setSuggestions([]);
    setSearchQuery(query);
    const res = await fetch(`${API_URL}/api/patient/medicaments/recherche?query=${encodeURIComponent(query)}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    setSearchStocks(data.stocks || []);
  };

  const loadPrescriptions = async () => {
    const res = await fetch(`${API_URL}/api/patient/ordonnances/my-history`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    const parsedData = (data || []).map((p: any) => ({
      ...p,
      medicaments: typeof p.medicaments === 'string' ? JSON.parse(p.medicaments) : p.medicaments
    }));
    setMyPrescriptions(parsedData);
  };

  const requestRenewal = async (id: string) => {
    await fetch(`${API_URL}/api/patient/ordonnances/${id}/renew`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    alert("Demande de renouvellement envoyée au médecin traitant !");
    loadPrescriptions();
  };

  const loadChat = async () => {
    const res = await fetch(`${API_URL}/api/patient/messages`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    setChatMessages(data.messages || []);
    setChatDoctorId(data.doctorId);
  };

  const sendMessage = async () => {
    if(!newMessage.trim()) return;
    await fetch(`${API_URL}/api/patient/messages`, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ receiverId: chatDoctorId, content: newMessage }) });
    setNewMessage('');
    loadChat();
  };

  const processFakeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if(cart.length===0) return;
    const pharmacieId = cart[0].pharmacieId; 
    const total = cart.reduce((acc, c) => acc + (c.medicament.prix||0)*(c.qty||1), 0);
    await fetch(`${API_URL}/api/patient/commandes`, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ pharmacieId, items: cart.map(c=>({...c, qty: c.qty||1})), total }) });
    setCart([]);
    setCheckoutSuccess(true);
    setTimeout(() => { setShowCheckout(false); setCheckoutSuccess(false); }, 3000);
  };

  const loadVitrineData = async () => {
    const res = await fetch(`${API_URL}/api/auth/admin/vitrine`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    setAdminVitrines(data.vitrines); setAdminMedecins(data.medecins);
  };

  const linkVitrine = async (vitrineId: string, userId: string) => {
    await fetch(`${API_URL}/api/auth/admin/vitrine/${vitrineId}/link`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ userId }) });
    alert("Médecin lié à la vitrine !"); loadVitrineData();
  };

  const loadPendingUsers = async () => {
    setLoadingAdminData(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/pending`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      const data = await res.json();
      setPendingUsers(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const loadAllUsers = async () => {
    setLoadingAdminData(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/all-users`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      const data = await res.json();
      setAllUsers(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const loadAdminStats = async () => {
    setLoadingAdminData(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/stats`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      const data = await res.json();
      setAdminStats(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const handleApprovePro = async (profileId: string) => {
    const res = await fetch(`${API_URL}/api/auth/admin/approve/${profileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      loadPendingUsers();
    } else {
      alert(data.error || "Une erreur est survenue.");
    }
  };

  const handleRejectPro = async (profileId: string) => {
    if(!confirm("Voulez-vous vraiment rejeter et supprimer cette inscription ?")) return;
    const res = await fetch(`${API_URL}/api/auth/admin/reject/${profileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      loadPendingUsers();
    } else {
      alert(data.error || "Une erreur est survenue.");
    }
  };

  const handleToggleBlock = async (profileId: string) => {
    const res = await fetch(`${API_URL}/api/auth/admin/toggle-block/${profileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      loadAllUsers();
    } else {
      alert(data.error || "Une erreur est survenue.");
    }
  };

  useEffect(() => {
    if(activeTab === 'prescriptions') loadPrescriptions();
    if(activeTab === 'messagerie') loadChat();
    if(activeTab === 'admin_vitrine') loadVitrineData();
    if(activeTab === 'admin_users') loadPendingUsers();
    if(activeTab === 'admin_all_users') loadAllUsers();
    if(activeTab === 'admin_supervision') loadAdminStats();
    if(activeTab === 'pharmacies_map') fetch(`${API_URL}/api/public/pharmacies`).then(r=>r.json()).then(setAllPharmacies);
  }, [activeTab]);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div></div>;
  if (!user) {
    if (showWelcomeAnimation && welcomeUser) {
      return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center animate-fade-in" style={{ fontFamily: 'Georgia, "Playfair Display", "Times New Roman", serif' }}>
          <div className="text-center max-w-2xl px-6 flex flex-col gap-6 select-none">
            <p className="text-gray-400 font-serif italic text-sm tracking-[0.2em] uppercase mb-4">Apteka</p>
            <h1 className="text-4xl md:text-5xl font-light text-black leading-snug tracking-tight animate-slide-up">
              Bonjour, <span className="font-semibold">{welcomeUser.firstName} {welcomeUser.lastName}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-800 italic font-light tracking-wide mt-2 animate-slide-up delay-150">
              {welcomeUser.role === 'PATIENT' 
                ? "que la santé soit avec vous."
                : welcomeUser.role === 'MEDECIN'
                ? "merci pour votre dévouement aujourd'hui."
                : welcomeUser.role === 'PHARMACIEN'
                ? "votre dévouement est au cœur de notre service."
                : "ravi de vous revoir sur votre espace sécurisé."}
            </p>
            <div className="mt-12 flex justify-center">
              <div className="w-2 h-2 bg-black rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <LandingPage 
        onLoginSuccess={(u) => {
          setWelcomeUser(u);
          setShowWelcomeAnimation(true);
          setTimeout(() => {
            setUser(u);
            setActiveTab(u.role === 'MEDECIN' ? 'medecin_stocks' : u.role === 'PATIENT' ? 'recherche' : u.role === 'ADMINISTRATEUR' ? 'admin_vitrine' : 'pharmacien_deliver');
            setShowWelcomeAnimation(false);
            setWelcomeUser(null);
          }, 3500);
        }} 
        handleQuickDemoLogin={(e) => {}} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} onLogout={() => { localStorage.removeItem('token'); setUser(null); }} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full max-w-7xl mx-auto py-6">
        
        {/* RECHERCHE AVEC AUTOCOMPLETE */}
        {activeTab === 'recherche' && (
          <div className="px-4 flex flex-col gap-6">
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-emerald-100 relative">
              <span className="text-xs font-bold text-emerald-600 tracking-widest uppercase mb-1 block">Achat Patient</span>
              <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Trouver un Médicament</h3>
              <div className="relative mt-6">
                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                <input type="text" value={searchQuery} onChange={(e) => handleAutocomplete(e.target.value)} placeholder="Taper le nom d'un médicament (ex: Paracétamol, Doliprane...)" className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-lg" />
                
                {suggestions.length > 0 && (
                  <div className="absolute top-16 left-0 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 overflow-hidden">
                    {suggestions.map(s => (
                      <div key={s.id} onClick={() => { handleSearchMeds(s.nom); }} className="p-4 hover:bg-emerald-50 cursor-pointer border-b text-sm font-bold text-gray-800 flex justify-between items-center transition-colors">
                        <span>{s.nom}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full text-gray-500">{s.categorie}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {searchStocks.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {/* CATEGORIES CARD */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h4 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><ClipboardList size={18}/></span>
                    Explorer par Catégorie
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Antalgique", desc: "Soulagement des douleurs", color: "from-blue-500/10 to-blue-500/5 text-blue-700 hover:border-blue-300" },
                      { name: "Anti-inflammatoire", desc: "Traitement des inflammations", color: "from-red-500/10 to-red-500/5 text-red-700 hover:border-red-300" },
                      { name: "Antibiotique", desc: "Infections bactériennes", color: "from-amber-500/10 to-amber-500/5 text-amber-700 hover:border-amber-300" },
                      { name: "Gastro-entérologie", desc: "Maux d'estomac, transit", color: "from-emerald-500/10 to-emerald-500/5 text-emerald-700 hover:border-emerald-300" }
                    ].map(cat => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleSearchMeds(cat.name)}
                        className={`p-4 rounded-2xl bg-gradient-to-br ${cat.color} border border-transparent hover:shadow-sm text-left transition-all cursor-pointer flex flex-col gap-1`}
                      >
                        <b className="font-extrabold text-sm">{cat.name}</b>
                        <span className="text-[10px] opacity-75 font-semibold leading-normal">{cat.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* POPULAR MEDICINES CARD */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h4 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="p-1.5 bg-rose-50 text-rose-500 rounded-lg"><Pill size={18}/></span>
                    Médicaments les plus recherchés
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { name: "Doliprane", label: "Doliprane 1000 mg", price: "2.10 €" },
                      { name: "Paracétamol", label: "Paracétamol Biogaran", price: "1.95 €" },
                      { name: "Spasfon", label: "Spasfon 80 mg", price: "3.50 €" },
                      { name: "Ibuprofène", label: "Ibuprofène Biogaran", price: "2.50 €" },
                      { name: "Smecta", label: "Smecta 3 g", price: "4.50 €" },
                      { name: "Maalox", label: "Maalox suspension", price: "4.80 €" }
                    ].map(med => (
                      <button
                        key={med.name}
                        type="button"
                        onClick={() => handleSearchMeds(med.name)}
                        className="px-4 py-3 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 transition-all flex items-center gap-3 cursor-pointer shadow-sm"
                      >
                        <span>{med.label}</span>
                        <span className="bg-white px-2 py-0.5 rounded-lg border text-[10px] text-emerald-600 font-extrabold">{med.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center px-2">
                    <h4 className="font-extrabold text-gray-900">Résultats de stock ({searchStocks.length})</h4>
                    <button onClick={() => setSearchStocks([])} className="text-xs font-bold text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer">Effacer</button>
                  </div>
                  <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
                    {searchStocks.map(stock => (
                      <div key={stock.id} className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3 hover:border-emerald-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <b className="text-base text-gray-900 leading-tight">{stock.pharmacie.name}</b> 
                          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0">Stock: {stock.quantite}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center mt-2 border-t pt-3">
                          <b className="text-emerald-600 text-lg">{stock.medicament.prix} €</b>
                          <button
                            onClick={() => {
                              if (cart.some(c => c.id === stock.id)) {
                                alert("Ce produit de cette pharmacie est déjà dans votre panier.");
                                return;
                              }
                              setCart([...cart, { ...stock, qty: 1 }]);
                              alert("Produit ajouté au panier !");
                            }}
                            className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-500 transition-colors shadow-lg cursor-pointer"
                          >
                            <ShoppingCart size={16}/> Ajouter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-8 h-[550px]"><MapRoute pharmacies={searchStocks.map(s=>s.pharmacie)} stocks={searchStocks} patientLocation={patientLocation} onPatientLocationChange={setPatientLocation} /></div>
              </div>
            )}
          </div>
        )}

        {/* TOUTES LES PHARMACIES MAP */}
        {activeTab === 'pharmacies_map' && (
          <div className="px-4 h-[750px] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Réseau des Pharmacies</h2>
                <p className="text-xs text-gray-500 mt-1 font-medium">Découvrez nos <strong className="text-emerald-600 font-bold">{allPharmacies.length} pharmacies agréées</strong> réparties sur tout le réseau d'Antananarivo.</p>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtrer par Zone :</span>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-gray-800 outline-none cursor-pointer border-none"
                >
                  <option value="">-- Toutes les zones ({(Array.isArray(allPharmacies) ? allPharmacies.length : 0)}) --</option>
                  {Array.from(new Set((Array.isArray(allPharmacies) ? allPharmacies : []).map(p => p.zone).filter(Boolean))).sort().map(z => (
                    <option key={z} value={z}>{z} ({(Array.isArray(allPharmacies) ? allPharmacies : []).filter(p => p.zone === z).length})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-0">
              {/* LISTE DES PHARMACIES A GAUCHE */}
              <div className="lg:col-span-4 flex flex-col h-full bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Pharmacies ({selectedZone ? (Array.isArray(allPharmacies) ? allPharmacies.filter(p => p.zone === selectedZone).length : 0) : (Array.isArray(allPharmacies) ? allPharmacies.length : 0)})
                </span>
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
                  {(Array.isArray(allPharmacies) ? (selectedZone ? allPharmacies.filter(p => p.zone === selectedZone) : allPharmacies) : []).map(p => (
                    <div
                      key={p.id}
                      onClick={() => setPatientLocation({ lat: p.latitude, lng: p.longitude })}
                      className="p-4 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer rounded-2xl border border-gray-100 transition-all duration-200 flex flex-col gap-1 text-left"
                    >
                      <b className="text-sm text-gray-900 leading-tight font-extrabold">{p.name}</b>
                      <p className="text-[11px] text-gray-500 font-medium">Zone : <span className="font-bold text-emerald-600">{p.zone || "N/A"}</span></p>
                      {p.phone && <p className="text-[11px] text-gray-400 mt-0.5">Tél : {p.phone}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* CARTE GOOGLE MAPS / LEAFLET A DROITE */}
              <div className="lg:col-span-8 h-full rounded-3xl overflow-hidden border border-gray-100 shadow-md">
                <MapRoute
                  pharmacies={Array.isArray(allPharmacies) ? (selectedZone ? allPharmacies.filter(p => p.zone === selectedZone) : allPharmacies) : []}
                  stocks={[]}
                  patientLocation={patientLocation}
                  onPatientLocationChange={setPatientLocation}
                />
              </div>
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS (VRAI RENDU PDF) */}
        {activeTab === 'prescriptions' && (
          <div className="px-4 max-w-4xl mx-auto">
            <h3 className="text-3xl font-extrabold mb-8 text-gray-900">Mes Ordonnances Officielles</h3>
            <div className="grid gap-4">
              {(Array.isArray(myPrescriptions) ? myPrescriptions : []).map(p => (
                <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                  <div>
                    <span className="font-mono text-emerald-600 font-bold text-lg bg-emerald-50 px-3 py-1 rounded-lg">{p.code}</span>
                    <p className="text-gray-900 font-bold mt-3 text-lg">{p.medecinName}</p>
                    <p className="text-sm text-gray-500">{p.medecinSpec}</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => requestRenewal(p.id)} className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm rounded-xl font-bold transition-colors">Renouveler</button>
                    <button onClick={() => setViewPdfOrdonnance(p)} className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-900 hover:bg-emerald-500 text-white text-sm rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"><FileText size={16}/> Ouvrir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MESSAGERIE PATIENT */}
        {activeTab === 'messagerie' && (
          <div className="px-4 max-w-3xl mx-auto h-[600px] flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 font-extrabold flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-white text-emerald-900 text-lg">
              <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><MessageCircle size={20}/></div>
              Chat Sécurisé avec votre Médecin
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-gray-50/50">
              {chatMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400"><MessageCircle size={48} className="mb-4 opacity-50"/> <p>Aucun message. Commencez la discussion.</p></div>
              ) : (
                chatMessages.map(m => (
                  <div key={m.id} className={`p-4 rounded-2xl max-w-[75%] text-sm font-medium shadow-sm ${m.senderId === user.id ? 'bg-emerald-500 text-white self-end rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 self-start rounded-bl-none'}`}>
                    {m.content}
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
              <input type="text" value={newMessage} onChange={e=>setNewMessage(e.target.value)} onKeyDown={e=>e.key==='Enter' && sendMessage()} className="flex-1 bg-gray-100 rounded-2xl px-6 text-sm outline-none font-medium focus:ring-2 focus:ring-emerald-500/20" placeholder="Écrivez votre message..." />
              <button onClick={sendMessage} className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-colors"><Send size={20}/></button>
            </div>
          </div>
        )}

        {/* ADMIN: COMPTES EN ATTENTE D'APPROBATION */}
        {activeTab === 'admin_users' && (
          <div className="px-4 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2 mb-8 text-left">
              <span className="text-xs font-bold text-amber-500 tracking-widest uppercase">Contrôle de Sécurité</span>
              <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Comptes Professionnels en Attente</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium leading-relaxed">Vérifiez les pièces justificatives et approuvez les accès des médecins et pharmaciens avant qu'ils ne puissent se connecter.</p>
            </div>

            {loadingAdminData ? (
              <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mx-auto"></div><p className="text-xs text-gray-400 mt-4 font-bold uppercase tracking-wider">Chargement des comptes...</p></div>
            ) : pendingUsers.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-gray-100 p-12 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl font-bold border border-emerald-100">✓</div>
                <h4 className="text-xl font-black text-gray-900 tracking-tight">Tout est en ordre !</h4>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">Aucune demande de compte professionnel n'est actuellement en attente d'approbation administrative.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="uppercase text-[11px] font-bold text-gray-500 tracking-wider">
                      <th className="p-5">Professionnel</th>
                      <th className="p-5">Rôle</th>
                      <th className="p-5">Rattachement / Zone</th>
                      <th className="p-5">Date d'inscription</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-5">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-gray-900 text-base">{u.firstName} {u.lastName}</span>
                            <span className="text-xs text-gray-400 font-semibold mt-0.5">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'MEDECIN' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {u.role === 'MEDECIN' ? '🩺 Médecin' : '💊 Pharmacien'}
                          </span>
                        </td>
                        <td className="p-5 text-left">
                          <span className="text-gray-600 font-bold text-xs">
                            {u.role === 'MEDECIN' ? `Zone : ${u.zone}` : `Officine : ${u.pharmacieName}`}
                          </span>
                        </td>
                        <td className="p-5 text-xs text-gray-500 font-medium">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        </td>
                        <td className="p-5 text-right flex gap-2 justify-end">
                          <button
                            onClick={() => handleApprovePro(u.id)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            Approuver
                          </button>
                          <button
                            onClick={() => handleRejectPro(u.id)}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                          >
                            Rejeter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ADMIN: TOUS LES COMPTES */}
        {activeTab === 'admin_all_users' && (
          <div className="px-4 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2 mb-8 text-left">
              <span className="text-xs font-bold text-emerald-500 tracking-widest uppercase">Base de données</span>
              <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tous les Comptes Utilisateurs</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium leading-relaxed">Supervisez l'intégralité des comptes patients, professionnels et administrateurs enregistrés sur Apteka.</p>
            </div>

            {loadingAdminData ? (
              <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mx-auto"></div><p className="text-xs text-gray-400 mt-4 font-bold uppercase tracking-wider">Chargement des comptes...</p></div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="uppercase text-[11px] font-bold text-gray-500 tracking-wider">
                      <th className="p-5">Utilisateur</th>
                      <th className="p-5">Rôle</th>
                      <th className="p-5">Statut</th>
                      <th className="p-5">Inscrit le</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-5 flex flex-col text-left">
                          <span className="font-bold text-gray-900 text-base">{u.firstName} {u.lastName}</span>
                          <span className="text-xs text-gray-400 font-semibold mt-0.5">{u.email || "Non renseigné"}</span>
                        </td>
                        <td className="p-5">
                          <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            u.role === 'ADMINISTRATEUR' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                            u.role === 'MEDECIN' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            u.role === 'PHARMACIEN' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {u.role === 'ADMINISTRATEUR' ? '🛡️ Admin' :
                             u.role === 'MEDECIN' ? '🩺 Médecin' :
                             u.role === 'PHARMACIEN' ? '💊 Pharmacien' :
                             '👤 Patient'}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                            u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            u.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {u.status === 'ACTIVE' ? 'Actif' :
                             u.status === 'PENDING' ? 'En attente' :
                             'Bloqué'}
                          </span>
                        </td>
                        <td className="p-5 text-xs text-gray-500 font-semibold">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="p-5 text-right">
                          {u.role !== 'ADMINISTRATEUR' ? (
                            <button
                              onClick={() => handleToggleBlock(u.id)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
                                u.status === 'BLOCKED' 
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                  : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'
                              }`}
                            >
                              {u.status === 'BLOCKED' ? 'Débloquer' : 'Bloquer'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-semibold italic">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ADMIN: SUPERVISION & STATISTIQUES */}
        {activeTab === 'admin_supervision' && adminStats && (
          <div className="px-4 max-w-5xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-2 text-left">
              <span className="text-xs font-bold text-emerald-500 tracking-widest uppercase">Supervision en Temps Réel</span>
              <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tableau de bord d'activité</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium leading-relaxed">Supervisez l'état général du système de santé Apteka d'Antananarivo.</p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2 text-left">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pharmacies</span>
                <b className="text-3xl font-black text-gray-900">{adminStats.pharmaciesCount}</b>
                <span className="text-[10px] font-bold text-emerald-600">Officines rattachées</span>
              </div>
              <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2 text-left">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Professionnels</span>
                <b className="text-3xl font-black text-gray-900">{adminStats.activeProsCount}</b>
                <span className="text-[10px] font-bold text-emerald-600">Médecins & pharmaciens</span>
              </div>
              <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2 text-left">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Médicaments</span>
                <b className="text-3xl font-black text-gray-900">{adminStats.totalStockUnits}</b>
                <span className="text-[10px] font-bold text-emerald-600">Boîtes en stock réel</span>
              </div>
              <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2 text-left">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ordonnances</span>
                <b className="text-3xl font-black text-gray-900">{adminStats.ordonnancesDelivreesCount}</b>
                <span className="text-[10px] font-bold text-emerald-600">Délivrances certifiées</span>
              </div>
            </div>

            {/* Recent Orders / Ordonnances Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-left flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h4 className="font-extrabold text-gray-900 text-lg">Activité Récente des Ordonnances</h4>
                <p className="text-xs text-gray-500 mt-1 font-semibold leading-normal">Dernières transactions et émissions d'ordonnances sécurisées.</p>
              </div>

              {adminStats.recentOrdonnances?.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs font-bold">Aucune activité enregistrée pour le moment.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="uppercase text-[11px] font-bold text-gray-500 tracking-wider">
                      <th className="p-5">Code d'ordonnance</th>
                      <th className="p-5">Date d'émission</th>
                      <th className="p-5 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {adminStats.recentOrdonnances.map((o: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-5 font-mono font-bold text-emerald-600 text-sm">{o.code}</td>
                        <td className="p-5 text-xs text-gray-500 font-semibold">
                          {new Date(o.dateEmission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-5 text-right">
                          <span className={`inline-block px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                            o.status === 'DELIVREE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {o.status === 'DELIVREE' ? 'Délivrée' : 'En attente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ADMIN VITRINE */}
        {activeTab === 'admin_vitrine' && (
          <div className="px-4 max-w-5xl mx-auto">
            <h3 className="text-3xl font-extrabold mb-8 text-gray-900">Liaison Vitrine ↔ Compte Réel</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100"><tr className="uppercase text-[11px] font-bold text-gray-500 tracking-wider"><th className="p-5">Fiche Vitrine</th><th className="p-5">Compte Assigné</th><th className="p-5 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {(Array.isArray(adminVitrines) ? adminVitrines : []).map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="p-5 font-bold text-gray-900 text-base">{v.nom}</td>
                      <td className="p-5 text-gray-500 font-medium">{v.user ? v.user.email : "Non assigné"}</td>
                      <td className="p-5 text-right">
                        <select onChange={(e) => linkVitrine(v.id, e.target.value)} defaultValue={v.userId||""} className="p-3 border border-gray-200 rounded-xl text-xs font-bold outline-none bg-white cursor-pointer focus:border-emerald-500">
                          <option value="">-- Aucun --</option>
                          {(Array.isArray(adminMedecins) ? adminMedecins : []).map(m => <option key={m.id} value={m.id}>{m.email} ({m.profile?.firstName || "Médecin"})</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {user.role === 'MEDECIN' && <DoctorDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />}
        {user.role === 'PHARMACIEN' && <PharmacistDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />}
      </main>

      {/* FAKE CHECKOUT MODAL */}
      {cart.length > 0 && !showCheckout && (
        <button onClick={()=>setShowCheckout(true)} className="fixed bottom-8 right-8 bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 hover:scale-105 transition-transform z-50">
          <ShoppingCart size={20}/> Finaliser Achat ({cart.length})
        </button>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2.5rem] max-w-xl w-full relative shadow-2xl">
            <button onClick={()=>setShowCheckout(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer"><X size={20}/></button>
            {checkoutSuccess ? (
              <div className="text-center py-10"><CheckCircle size={64} className="text-emerald-500 mx-auto mb-6"/> <h3 className="text-2xl font-extrabold text-gray-900">Paiement Réussi !</h3><p className="text-sm mt-3 text-gray-500 font-medium">Votre commande est transmise à la pharmacie.</p></div>
            ) : (
              <form onSubmit={processFakeCheckout} className="flex flex-col gap-5">
                <h3 className="text-2xl font-extrabold text-gray-900 border-b border-gray-100 pb-4">Finaliser Votre Achat</h3>
                
                {/* LISTE DES ARTICLES DANS LE PANIER */}
                <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1 border-b border-gray-100 pb-4">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Récapitulatif de la commande</span>
                  {cart.map((c, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center gap-3 text-xs">
                      <div className="flex-1">
                        <p className="font-extrabold text-gray-900 text-sm">{c.medicament.nom}</p>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Pharmacie : <span className="font-bold text-emerald-600">{c.pharmacie.name}</span></p>
                        <p className="font-mono font-bold text-gray-700 mt-1">{(c.medicament.prix * (c.qty || 1)).toFixed(2)} €</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <button type="button" onClick={() => updateCartQty(idx, (c.qty || 1) - 1)} className="px-2.5 py-1.5 hover:bg-gray-50 font-bold text-gray-500 cursor-pointer">-</button>
                          <span className="px-3 font-mono font-bold text-gray-800 text-xs">{c.qty || 1}</span>
                          <button type="button" onClick={() => updateCartQty(idx, (c.qty || 1) + 1)} className="px-2.5 py-1.5 hover:bg-gray-50 font-bold text-gray-500 cursor-pointer">+</button>
                        </div>
                        <button type="button" onClick={() => removeFromCart(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"><X size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-50 text-emerald-900 p-5 rounded-2xl text-lg flex justify-between font-extrabold border border-emerald-100">
                  <span>Total à payer</span> 
                  <span>{cart.reduce((a,c)=>a+(c.medicament.prix||0)*(c.qty||1),0).toFixed(2)} €</span>
                </div>

                <div className="flex border border-gray-200 rounded-2xl overflow-hidden mt-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <div className="bg-gray-50 p-4 border-r border-gray-200"><CreditCard size={20} className="text-gray-500"/></div>
                  <input type="text" required placeholder="Numéro de carte (Fake)" className="flex-1 px-4 font-mono font-medium outline-none text-sm" maxLength={16} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="MM/YY" required className="border border-gray-200 p-4 rounded-2xl outline-none font-mono font-medium focus:border-emerald-500 text-sm" />
                  <input type="text" placeholder="CVC" required className="border border-gray-200 p-4 rounded-2xl outline-none font-mono font-medium focus:border-emerald-500 text-sm" maxLength={3} />
                </div>
                <button type="submit" className="bg-gray-900 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl mt-2 transition-all text-base shadow-lg cursor-pointer">
                  Payer {cart.reduce((a,c)=>a+(c.medicament.prix||0)*(c.qty||1),0).toFixed(2)} €
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PDF ORDONNANCE MODAL */}
      {viewPdfOrdonnance && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl h-[85vh] rounded-3xl relative flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
              <span className="font-mono text-sm font-bold tracking-widest text-emerald-400">APERÇU OFFICIEL - {viewPdfOrdonnance.code}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-2">
                  <Printer size={14}/> Imprimer
                </button>
                <button onClick={()=>setViewPdfOrdonnance(null)} className="p-2 hover:bg-white/20 rounded-full"><X size={20}/></button>
              </div>
            </div>
            
            <div id="print-prescription" className="p-10 flex-1 overflow-y-auto font-sans bg-white relative" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              
              <div className="absolute top-10 left-10 opacity-5"><HeartPulse size={200} /></div>

              <div className="flex justify-between items-start border-b-4 border-emerald-500 pb-8 relative z-10 font-sans">
                <div>
                  <h1 className="text-4xl font-serif font-extrabold text-gray-900 leading-tight">{viewPdfOrdonnance.medecinName}</h1>
                  <p className="text-base text-gray-500 mt-2 font-medium">{viewPdfOrdonnance.medecinSpec}</p>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Apteka • Antananarivo, Madagascar</p>
                </div>
                <div className="text-right text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="mb-2"><b className="text-gray-400 uppercase text-[10px] tracking-wider block">Date d'émission</b><span className="font-bold text-gray-900">{new Date(viewPdfOrdonnance.dateEmission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                  <div><b className="text-gray-400 uppercase text-[10px] tracking-wider block">Patient</b><span className="font-bold text-gray-900">{user.firstName} {user.lastName}</span></div>
                </div>
              </div>
              
              <div className="py-12 min-h-[300px] relative z-10">
                <h2 className="text-2xl font-bold mb-8 italic text-emerald-900 border-l-4 border-emerald-500 pl-4">Prescription Médicale</h2>
                {viewPdfOrdonnance.medicaments.map((m:any, i:number) => (
                  <div key={i} className="mb-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <p className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="text-emerald-500 font-serif text-3xl font-bold">Rx</span> {m.nom}
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">Qté: {m.quantite}</span>
                        {m.duree && <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Durée: {m.duree}</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-1">Dosage unitaire</span>
                        <span className="font-bold text-gray-800">{m.dosage || "1 comprimé"}</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-1">Instructions (Posologie)</span>
                        <span className="font-bold text-gray-800">{m.posologie}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-gray-100 pt-8 flex justify-between items-end relative z-10">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Document Certifié</p>
                  <p className="text-xs text-gray-400 font-medium">Généré et signé électroniquement par l'infrastructure Apteka.</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">Signature Numérique : <b className="text-gray-900 font-serif italic text-base">{viewPdfOrdonnance.medecinName}</b></p>
                </div>
                <div className="p-3 border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col items-center gap-2">
                  <QRCode value={viewPdfOrdonnance.code} size={100} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scan Pharmacie</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}