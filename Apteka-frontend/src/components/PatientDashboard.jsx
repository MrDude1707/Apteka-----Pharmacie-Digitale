import React, { useState, useEffect } from 'react';
import { Search, ClipboardList, ShoppingCart, MessageCircle, FileText, Send, X, CreditCard, HeartPulse, Printer, Pill, MapPin, CheckCircle, Trash2, Plus, Minus, ArrowLeft, RefreshCw, Package, Clock, ShieldAlert } from 'lucide-react';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';
import { API_URL } from '../config';
import MapRoute from './MapRoute';
import DashboardLayout from './dashboard/DashboardLayout';

export default function PatientDashboard({ user, activeTab, setActiveTab }) {
  // Autocomplete & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchStocks, setSearchStocks] = useState([]);
  const [searchMedicaments, setSearchMedicaments] = useState([]);

  // Cart & Checkout State
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  
  // Stripe Redirect States
  const [checkoutVerifying, setCheckoutVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Delivery & Tracking State
  const [commandesHistory, setCommandesHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatDoctorId, setChatDoctorId] = useState('');

  // Prescriptions State
  const [myPrescriptions, setMyPrescriptions] = useState([]);
  const [viewPdfOrdonnance, setViewPdfOrdonnance] = useState(null);

  // Pharmacies / Map State
  const [allPharmacies, setAllPharmacies] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [patientLocation, setPatientLocation] = useState({ lat: -18.913, lng: 47.525 });

  // Autocomplete fetch
  const handleAutocomplete = async (val) => {
    setSearchQuery(val);
    if (val.length < 2) return setSuggestions([]);
    try {
      const res = await fetch(`${API_URL}/api/patient/medicaments/autocomplete?q=${val}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setSuggestions(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  // Search medicines
  const handleSearchMeds = async (query = searchQuery) => {
    setSuggestions([]);
    setSearchQuery(query);
    try {
      const res = await fetch(`${API_URL}/api/patient/medicaments/recherche?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSearchStocks(data.stocks || []);
      setSearchMedicaments(data.medicaments || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Load prescriptions history
  const loadPrescriptions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/patient/ordonnances/my-history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const parsedData = data.map((p) => ({
          ...p,
          medicaments: typeof p.medicaments === 'string' ? JSON.parse(p.medicaments) : p.medicaments
        }));
        setMyPrescriptions(parsedData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Renewal request
  const requestRenewal = async (id) => {
    try {
      await fetch(`${API_URL}/api/patient/ordonnances/${id}/renew`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Demande de renouvellement envoyée au médecin traitant !");
      loadPrescriptions();
    } catch (err) {
      console.error(err);
    }
  };

  // Load chat messages
  const loadChat = async () => {
    try {
      const res = await fetch(`${API_URL}/api/patient/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setChatMessages(data.messages || []);
      setChatDoctorId(data.doctorId);
    } catch (err) {
      console.error(err);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await fetch(`${API_URL}/api/patient/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ receiverId: chatDoctorId, content: newMessage })
      });
      setNewMessage('');
      loadChat();
    } catch (err) {
      console.error(err);
    }
  };

  // Standard offline pharmacy reservation (Paiement sur place)
  const processFakeCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    try {
      const pharmacieId = cart[0].pharmacieId;
      const total = cart.reduce((acc, c) => acc + (c.medicament.prix || 0) * (c.qty || 1), 0);
      
      const res = await fetch(`${API_URL}/api/patient/commandes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          pharmacieId,
          items: cart.map(c => ({ ...c, qty: c.qty || 1 })),
          total
        })
      });
      
      if (res.ok) {
        setCart([]);
        setCheckoutSuccess(true);
        setTimeout(() => {
          setShowCheckout(false);
          setCheckoutSuccess(false);
        }, 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Une erreur est survenue lors de la réservation.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la réservation.");
    }
  };

  // Stripe Checkout Session Creation
  const handleStripeCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    try {
      const pharmacieId = cart[0].pharmacieId;
      const total = cart.reduce((acc, c) => acc + (c.medicament.prix || 0) * (c.qty || 1), 0);
      
      const res = await fetch(`${API_URL}/api/patient/commandes/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          pharmacieId,
          items: cart.map(c => ({ ...c, qty: c.qty || 1 })),
          total,
          frontendUrl: window.location.origin
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur de création de session.");
        return;
      }
      
      if (data.url) {
        // Redirection vers l'interface sécurisée de Stripe
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la redirection Stripe.");
    }
  };

  // Stripe Checkout Session Verification
  const verifyStripePayment = async (commandeId, sessionId) => {
    setCheckoutVerifying(true);
    try {
      const res = await fetch(`${API_URL}/api/patient/commandes/verify-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ commandeId, sessionId })
      });
      const data = await res.json();
      setCheckoutVerifying(false);
      
      if (res.ok) {
        setCart([]);
        setVerifiedSuccess(true);
        
        confetti({
          particleCount: 180,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#00f0ff', '#0044ff', '#ffffff']
        });
        
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setTimeout(() => {
          setVerifiedSuccess(false);
          setActiveTab('patient_deliveries');
        }, 4000);
      } else {
        alert(data.error || "Échec de la validation de paiement.");
      }
    } catch (err) {
      console.error(err.message);
      setCheckoutVerifying(false);
    }
  };

  // Load Orders & Deliveries tracking
  const loadCommandesHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/api/patient/commandes/my-history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCommandesHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Cart helper functions
  const updateCartQty = (index, newQty) => {
    const newCart = [...cart];
    if (newQty < 1) return;
    if (newQty > newCart[index].quantite) {
      alert(`Désolé, seulement ${newCart[index].quantite} boîte(s) sont disponibles en stock.`);
      return;
    }
    newCart[index] = { ...newCart[index], qty: newQty };
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (newCart.length === 0) {
      setShowCheckout(false);
    }
  };

  // Stripe redirection hook
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const commandeId = params.get('commande_id');
    const sessionId = params.get('session_id');

    if (payment === 'success' && commandeId && sessionId) {
      verifyStripePayment(commandeId, sessionId);
    } else if (payment === 'cancel') {
      alert("⚠️ Votre paiement Stripe a été annulé.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Hook tab loading triggers
  useEffect(() => {
    if (activeTab === 'prescriptions') loadPrescriptions();
    if (activeTab === 'patient_deliveries') loadCommandesHistory();
    if (activeTab === 'messagerie') {
      loadChat();
      const interval = setInterval(loadChat, 4000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'pharmacies_map') {
      fetch(`${API_URL}/api/public/pharmacies`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setAllPharmacies(data); })
        .catch(console.error);
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const menuItems = [
    { id: 'recherche', label: 'Achat Médicaments', icon: Pill },
    { id: 'patient_deliveries', label: 'Suivi Livraisons', icon: Package },
    { id: 'pharmacies_map', label: 'Carte Réseau', icon: MapPin },
    { id: 'prescriptions', label: 'Mes Ordonnances', icon: ClipboardList },
    { id: 'messagerie', label: 'Chat Docteur', icon: MessageCircle },
  ];

  return (
    <DashboardLayout
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      menuItems={menuItems}
      onLogout={handleLogout}
    >
      {/* 1. RECHERCHE AVEC AUTOCOMPLETE */}
      {activeTab === 'recherche' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="p-8 glass-premium-dark rounded-[24px] relative">
            <span className="text-[10px] font-black text-[#00f0ff] tracking-widest uppercase mb-1 block">Achat Patient</span>
            <h3 className="text-3xl font-light text-white tracking-tight">Trouver un Médicament</h3>
            
            <div className="relative mt-6">
              <Search className="absolute left-5 top-4 text-white/40" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleAutocomplete(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchMeds()}
                placeholder="Taper le nom d'un médicament (ex: Paracétamol, Doliprane...)"
                className="w-full pl-14 pr-4 py-4 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none transition-all font-medium text-white placeholder-white/40 cursor-none"
              />
              
              {suggestions.length > 0 && (
                <div className="absolute top-16 left-0 w-full glass-premium-dark border border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in duration-200">
                  {suggestions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => { handleSearchMeds(s.nom); }}
                      className="p-4 hover:bg-[#00f0ff]/10 cursor-none border-b border-white/5 text-sm font-bold text-white flex justify-between items-center transition-colors"
                      data-cursor-magnet
                    >
                      <span>{s.nom}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full text-white/50">{s.categorie}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {searchStocks.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* CATEGORIES CARD */}
              <div className="glass-premium-dark p-8 rounded-[24px]">
                <h4 className="text-xl font-light text-white mb-6 flex items-center gap-3">
                  <span className="p-2 bg-[#00f0ff]/10 text-[#00f0ff] rounded-xl"><ClipboardList size={20}/></span>
                  Explorer par Catégorie
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Antalgique", desc: "Soulagement des douleurs" },
                    { name: "Anti-inflammatoire", desc: "Traitement des inflammations" },
                    { name: "Antibiotique", desc: "Infections bactériennes" },
                    { name: "Gastro-entérologie", desc: "Maux d'estomac, transit" }
                  ].map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleSearchMeds(cat.name)}
                      className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-left transition-all cursor-none flex flex-col gap-1.5"
                      data-cursor-magnet
                    >
                      <b className="font-bold text-sm text-white">{cat.name}</b>
                      <span className="text-[10px] text-white/50 font-medium leading-normal">{cat.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* POPULAR MEDICINES CARD */}
              <div className="glass-premium-dark p-8 rounded-[24px]">
                <h4 className="text-xl font-light text-white mb-6 flex items-center gap-3">
                  <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl"><Pill size={20}/></span>
                  Médicaments les plus recherchés
                </h4>
                <div className="flex flex-wrap gap-3">
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
                      className="px-4 py-3 bg-white/5 hover:bg-[#00f0ff]/10 hover:text-[#00f0ff] hover:border-[#00f0ff]/30 border border-white/10 rounded-2xl text-xs font-bold text-white transition-all flex items-center gap-3 cursor-none shadow-sm"
                      data-cursor-magnet
                    >
                      <span>{med.label}</span>
                      <span className="bg-black/50 px-2.5 py-1 rounded-full border border-white/5 text-[10px] text-[#00f0ff] font-black">{med.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
              {/* RESULTS LIST */}
              <div className="xl:col-span-5 flex flex-col gap-5 text-left">
                <div className="flex justify-between items-center px-2">
                  <h4 className="font-black text-white text-sm uppercase tracking-widest">Résultats ({searchStocks.length})</h4>
                  <button
                    onClick={() => {
                      setSearchStocks([]);
                      setSearchMedicaments([]);
                    }}
                    className="text-xs font-bold text-white/50 hover:text-red-400 transition-all cursor-none"
                    data-cursor-magnet
                  >
                    Effacer la recherche
                  </button>
                </div>

                {/* MÉDICAMENTS IDENTIFIÉS */}
                {searchMedicaments.length > 0 && (
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5 mb-2">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Médicament(s) trouvé(s)</span>
                    {searchMedicaments.map(med => {
                      const stockAvailable = searchStocks.filter(s => s.medicamentId === med.id);
                      const totalStock = stockAvailable.reduce((acc, s) => acc + s.quantite, 0);
                      
                      return (
                        <div key={med.cis} className="p-5 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-2xl flex items-center justify-between gap-4 text-left">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-base truncate">{med.nom}</p>
                            <p className="text-[11px] text-white/60 font-medium mt-1 truncate">{med.forme} • {med.substanceActive || "Principe Actif N/A"}</p>
                            <p className="text-[10px] font-black text-[#00f0ff] mt-2">
                              {totalStock > 0 ? `🔥 En stock (${totalStock} boîtes dispos)` : "⚠️ Rupture réseau (Sur Commande 24h)"}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-lg font-light text-white">{(med.prix || 0).toFixed(2)} €</span>
                            <button
                              onClick={() => {
                                if (cart.some(c => c.medicamentId === med.id)) {
                                  alert("Ce médicament est déjà dans votre panier.");
                                  return;
                                }
                                
                                const stockForMed = searchStocks.find(s => s.medicamentId === med.id);
                                if (stockForMed) {
                                  setCart([...cart, { ...stockForMed, qty: 1 }]);
                                  alert("Ajouté au panier ! Stock réservé à la pharmacie.");
                                } else {
                                  const dummyStock = {
                                    id: `sur-commande-${med.id}`,
                                    medicamentId: med.id,
                                    pharmacieId: '4', // Pharmacie de Tana (Nirina Rabe)
                                    quantite: 100, // stock disponible virtuel
                                    medicament: med,
                                    pharmacie: { id: '4', name: "Pharmacie de Tana", zone: "Analakely" },
                                    isSurCommande: true
                                  };
                                  setCart([...cart, { ...dummyStock, qty: 1 }]);
                                  alert("Ajouté au panier ! Ce médicament en rupture réseau sera préparé sur commande spéciale.");
                                }
                              }}
                              className="px-5 py-2.5 bg-white hover:bg-[#00f0ff] text-black rounded-xl text-xs font-bold uppercase transition-colors cursor-none"
                              data-cursor-magnet
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Disponibilités physiques par officine :</span>
                <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2">
                  {searchStocks.map(stock => (
                    <div key={stock.id} className="p-6 glass-premium-dark rounded-3xl flex flex-col gap-4 hover:border-[#00f0ff]/30 transition-colors text-left">
                      <div className="flex justify-between items-start gap-2">
                        <b className="text-base text-white leading-tight font-bold">{stock.pharmacie.name}</b> 
                        <span className="text-xs text-[#00f0ff] font-black bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-3 py-1 rounded-full shrink-0">Stock: {stock.quantite}</span>
                      </div>
                      
                      <p className="text-[11px] text-white/60 flex items-center gap-2 font-medium">
                        <MapPin size={12} className="text-[#00f0ff]" />
                        Quartier : {stock.pharmacie.zone}
                      </p>

                      <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-4">
                        <b className="text-[#00f0ff] text-xl font-light">{(stock.medicament.prix || 0).toFixed(2)} €</b>
                        <button
                          onClick={() => {
                            if (cart.some(c => c.id === stock.id)) {
                              alert("Ce produit de cette pharmacie est déjà dans votre panier.");
                              return;
                            }
                            setCart([...cart, { ...stock, qty: 1 }]);
                            alert("Produit ajouté au panier !");
                          }}
                          className="bg-white/10 hover:bg-[#00f0ff] hover:text-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-none"
                          data-cursor-magnet
                        >
                          <ShoppingCart size={16}/> Ajouter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* INTERACTIVE MAP */}
              <div className="xl:col-span-7 h-[550px] rounded-3xl overflow-hidden glass-premium-dark p-2 relative">
                <MapRoute
                  pharmacies={searchStocks.map(s => s.pharmacie)}
                  stocks={searchStocks}
                  patientLocation={patientLocation}
                  onPatientLocationChange={setPatientLocation}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. TOUTES LES PHARMACIES MAP */}
      {activeTab === 'pharmacies_map' && (
        <div className="h-[650px] flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-premium-dark p-6 rounded-3xl">
            <div className="text-left">
              <h2 className="text-2xl font-light text-white tracking-tight">Réseau des Pharmacies agréées</h2>
              <p className="text-xs text-white/50 mt-1 font-medium">Découvrez nos <strong className="text-[#00f0ff] font-bold">{allPharmacies.length} pharmacies agréées</strong> réparties sur tout le réseau d'Antananarivo.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Filtrer par Zone :</span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none cursor-none border-none appearance-none"
              >
                <option value="" className="bg-zinc-900">Toutes les zones ({allPharmacies.length})</option>
                {Array.from(new Set(allPharmacies.map(p => p.zone).filter(Boolean))).sort().map(z => (
                  <option key={z} value={z} className="bg-zinc-900">{z} ({allPharmacies.filter(p => p.zone === z).length})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-0">
            {/* LISTE DES PHARMACIES A GAUCHE */}
            <div className="lg:col-span-4 flex flex-col h-full glass-premium-dark p-6 rounded-3xl">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest text-left block mb-4">
                Liste des Pharmacies
              </span>
              
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
                {(selectedZone ? allPharmacies.filter(p => p.zone === selectedZone) : allPharmacies).map(p => (
                  <div
                    key={p.id}
                    onClick={() => setPatientLocation({ lat: p.latitude, lng: p.longitude })}
                    className="p-5 bg-white/5 hover:bg-[#00f0ff]/10 cursor-none rounded-2xl border border-white/10 hover:border-[#00f0ff]/30 transition-all flex flex-col gap-1.5 text-left"
                    data-cursor-magnet
                  >
                    <b className="text-base text-white leading-tight font-bold">{p.name}</b>
                    <p className="text-xs text-white/60 font-medium">Zone : <span className="font-bold text-[#00f0ff]">{p.zone || "N/A"}</span></p>
                    {p.phone && <p className="text-[11px] text-white/40 font-medium mt-1">📞 Tél : {p.phone}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* CARTE DROITE */}
            <div className="lg:col-span-8 h-full rounded-3xl overflow-hidden glass-premium-dark p-2 relative">
              <MapRoute
                pharmacies={selectedZone ? allPharmacies.filter(p => p.zone === selectedZone) : allPharmacies}
                stocks={[]}
                patientLocation={patientLocation}
                onPatientLocationChange={setPatientLocation}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. PRESCRIPTIONS PATIENT */}
      {activeTab === 'prescriptions' && (
        <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="text-left glass-premium-dark p-6 rounded-[24px]">
            <h3 className="text-2xl font-light text-white tracking-tight">Mes Ordonnances Officielles</h3>
            <p className="text-xs text-white/50 mt-2 font-medium">Consultez l'historique de vos prescriptions validées par vos médecins agréés.</p>
          </div>

          {myPrescriptions.length === 0 ? (
            <div className="py-20 glass-premium-dark rounded-[24px] text-center text-white/40 flex flex-col items-center justify-center gap-4">
              <ClipboardList size={48} className="text-white/20" />
              <p className="text-sm font-medium">Aucune ordonnance n'a encore été rédigée à votre nom.</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {myPrescriptions.map(p => (
                <div key={p.id} className="glass-premium-dark p-6 rounded-[24px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 transition-all text-left">
                  <div>
                    <span className="font-mono text-[#00f0ff] font-bold text-sm bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-3 py-1.5 rounded-lg">{p.code}</span>
                    <p className="text-white font-light mt-4 text-xl">Dr. {p.medecinName}</p>
                    <p className="text-xs font-bold text-[#00f0ff] uppercase tracking-widest mt-1">{p.medecinSpec}</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => requestRenewal(p.id)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-colors cursor-none"
                      data-cursor-magnet
                    >
                      Renouveler
                    </button>
                    <button
                      onClick={() => setViewPdfOrdonnance(p)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-[#00f0ff] text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-none"
                      data-cursor-magnet
                    >
                      <FileText size={14}/> Ouvrir PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. MESSAGERIE PATIENT */}
      {activeTab === 'messagerie' && (
        <div className="max-w-3xl mx-auto h-[550px] flex flex-col glass-premium-dark rounded-[32px] overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-white/10 font-bold flex items-center gap-4 bg-white/5 text-white text-lg">
            <div className="p-3 bg-[#00f0ff]/20 rounded-xl text-[#00f0ff]"><MessageCircle size={20}/></div>
            Chat Sécurisé avec votre Médecin
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 bg-transparent">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/30">
                <MessageCircle size={64} className="mb-6 opacity-40 text-[#00f0ff]" />
                <p className="text-sm font-bold text-white/60">Aucun message. Commencez la discussion.</p>
                <p className="text-xs text-white/40 mt-2">Communiquez de manière sécurisée avec votre médecin traitant.</p>
              </div>
            ) : (
              chatMessages.map(m => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl max-w-[80%] text-sm font-medium shadow-lg leading-relaxed ${
                    m.senderId === user.id
                      ? 'bg-[#00f0ff] text-black self-end rounded-br-none'
                      : 'bg-white/10 border border-white/10 text-white self-start rounded-bl-none'
                  }`}
                >
                  {m.content}
                </div>
              ))
            )}
          </div>
          
          <div className="p-5 bg-white/5 border-t border-white/10 flex gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 text-sm text-white outline-none font-medium focus:border-[#00f0ff] transition-colors cursor-none placeholder-white/30"
              placeholder="Écrivez votre message..."
            />
            <button
              onClick={sendMessage}
              className="w-14 h-14 bg-white hover:bg-[#00f0ff] text-black rounded-2xl flex items-center justify-center shadow-lg transition-colors cursor-none"
              data-cursor-magnet
            >
              <Send size={18}/>
            </button>
          </div>
        </div>
      )}

      {/* 5. SUIVI LIVRAISONS PATIENT */}
      {activeTab === 'patient_deliveries' && (
        <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300 text-left">
          <div className="text-left glass-premium-dark p-6 rounded-[24px] flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-light text-white tracking-tight">Suivi en Temps Réel de mes Livraisons</h3>
              <p className="text-xs text-white/50 mt-2 font-medium">Suivez chaque étape de la préparation et de l'expédition de vos traitements.</p>
            </div>
            <button
              onClick={loadCommandesHistory}
              disabled={loadingHistory}
              className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white/70 transition-colors shrink-0 disabled:opacity-50 cursor-none"
              data-cursor-magnet
            >
              <RefreshCw size={18} className={loadingHistory ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingHistory && commandesHistory.length === 0 ? (
            <div className="py-20 text-center text-white/50 flex flex-col items-center justify-center gap-4">
              <RefreshCw size={48} className="animate-spin text-[#00f0ff]/60" />
              <p className="text-sm font-semibold">Chargement de votre historique de livraison...</p>
            </div>
          ) : commandesHistory.length === 0 ? (
            <div className="py-24 glass-premium-dark rounded-[32px] text-center flex flex-col items-center justify-center gap-4">
              <Package size={64} className="text-[#00f0ff]/30" />
              <p className="text-xl font-light text-white">Aucune commande en cours</p>
              <p className="text-xs text-white/50 max-w-sm mb-2">
                Vous n'avez pas encore passé commande avec livraison. Recherchez vos médicaments pour composer votre panier et payez via Stripe !
              </p>
              <button
                onClick={() => setActiveTab('recherche')}
                className="mt-2 px-6 py-3.5 bg-white text-black hover:bg-[#00f0ff] text-xs font-bold rounded-xl transition-colors cursor-none uppercase tracking-widest"
                data-cursor-magnet
              >
                Rechercher un médicament
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {commandesHistory.map(cmd => {
                const items = typeof cmd.items === 'string' ? JSON.parse(cmd.items) : cmd.items;
                const dateText = new Date(cmd.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                });
                
                // Calculer les états des étapes
                const isPaid = cmd.status === "PAYEE" || cmd.status === "EN_ROUTE" || cmd.status === "LIVREE";
                const isEnRoute = cmd.status === "EN_ROUTE" || cmd.status === "LIVREE";
                const isDelivered = cmd.status === "LIVREE";

                return (
                  <div key={cmd.id} className="p-8 glass-premium-dark rounded-[32px] flex flex-col gap-6 text-left">
                    <div className="flex flex-wrap justify-between items-start gap-4 border-b border-white/10 pb-5">
                      <div>
                        <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest">Commande ID: #{cmd.id.slice(0, 8)}</span>
                        <h4 className="text-xl font-light text-white mt-2">Officine : <span className="font-bold">{cmd.pharmacie.name}</span></h4>
                        <p className="text-xs text-white/50 font-medium flex items-center gap-2 mt-1">
                          <Clock size={14} className="text-white/40" /> Passée le {dateText}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 self-end sm:self-start shrink-0">
                        <span className="text-2xl font-light text-white">{(cmd.total || 0).toFixed(2)} €</span>
                        <span className="text-[9px] font-black px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest flex items-center gap-1.5">
                          💳 Stripe Validé
                        </span>
                      </div>
                    </div>

                    {/* DÉTAIL DES PRODUITS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {items.map((it, idx) => (
                        <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between gap-3 text-sm font-medium text-white">
                          <div className="truncate">
                            <p className="font-bold text-white truncate">{it.medicament.nom}</p>
                            <p className="text-[10px] text-white/50 mt-1 uppercase tracking-widest truncate">Quantité : {it.qty || 1} boîte(s)</p>
                          </div>
                          <span className="text-[#00f0ff] font-bold shrink-0">{((it.medicament.prix || 0) * (it.qty || 1)).toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>

                    {/* GRANDE BARRE DE PROGRESSION DE LIVRAISON */}
                    <div className="bg-black/40 border border-white/10 rounded-[24px] p-6 mt-4 relative overflow-hidden">
                      <div className="flex justify-between items-center relative z-10 gap-2 flex-wrap md:flex-nowrap">
                        
                        {/* ÉTAPE 1 */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-[70px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            isPaid ? 'bg-[#00f0ff] text-black shadow-lg shadow-[#00f0ff]/20' : 'bg-white/10 text-white/30'
                          }`}>
                            1
                          </div>
                          <span className="text-[11px] font-bold mt-3 text-white">Paiement</span>
                          <span className="text-[9px] font-black text-[#00f0ff] mt-1 uppercase tracking-widest">Validé</span>
                        </div>

                        {/* CONNECTEUR 1-2 */}
                        <div className="hidden md:block flex-1 h-1 bg-white/10 relative rounded-full">
                          <div className={`absolute left-0 top-0 h-full bg-[#00f0ff] rounded-full transition-all duration-700 ease-out ${isPaid ? 'w-full' : 'w-0'}`} />
                        </div>

                        {/* ÉTAPE 2 */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-[70px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            isPaid ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-white/10 text-white/30'
                          }`}>
                            2
                          </div>
                          <span className="text-[11px] font-bold mt-3 text-white">Préparation</span>
                          <span className="text-[9px] font-black text-orange-400 mt-1 uppercase tracking-widest">
                            {cmd.status === "PAYEE" ? "En cours..." : "Prêt"}
                          </span>
                        </div>

                        {/* CONNECTEUR 2-3 */}
                        <div className="hidden md:block flex-1 h-1 bg-white/10 relative rounded-full">
                          <div className={`absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-700 ease-out ${isEnRoute ? 'w-full' : 'w-0'}`} />
                        </div>

                        {/* ÉTAPE 3 */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-[70px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            isEnRoute ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white/30'
                          }`}>
                            3
                          </div>
                          <span className="text-[11px] font-bold mt-3 text-white">Expédition</span>
                          <span className="text-[9px] font-black text-blue-400 mt-1 uppercase tracking-widest">
                            {cmd.status === "EN_ROUTE" ? "En route 🛵" : isDelivered ? "Complété" : "En attente"}
                          </span>
                        </div>

                        {/* CONNECTEUR 3-4 */}
                        <div className="hidden md:block flex-1 h-1 bg-white/10 relative rounded-full">
                          <div className={`absolute left-0 top-0 h-full bg-green-500 rounded-full transition-all duration-700 ease-out ${isDelivered ? 'w-full' : 'w-0'}`} />
                        </div>

                        {/* ÉTAPE 4 */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-[70px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            isDelivered ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/10 text-white/30'
                          }`}>
                            4
                          </div>
                          <span className="text-[11px] font-bold mt-3 text-white">Livraison</span>
                          <span className="text-[9px] font-black text-green-400 mt-1 uppercase tracking-widest">
                            {isDelivered ? "Remis" : "En attente"}
                          </span>
                        </div>

                      </div>

                      {/* ANIMATED COURIER DISPLAY WHEN EN ROUTE */}
                      {cmd.status === "EN_ROUTE" && (
                        <div className="mt-8 border-t border-white/10 pt-5 flex flex-col gap-3 relative">
                          <p className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest flex items-center gap-2 animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping"></span> 
                            Livreur en déplacement dans votre zone ({cmd.pharmacie.zone}...)
                          </p>
                          
                          <div className="h-12 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden flex items-center">
                            {/* Animated Courier Icon */}
                            <div className="absolute animate-courier-ride flex items-center gap-3 font-bold text-sm text-white">
                              <span className="text-2xl">🛵</span>
                              <span>Votre livreur Apteka est en route !</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DELIVERED DISP */}
                      {cmd.status === "LIVREE" && (
                        <div className="mt-6 border-t border-white/10 pt-4 flex justify-between items-center text-sm font-medium text-white/70">
                          <span className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400" /> Livraison effectuée avec succès !</span>
                          <span className="font-bold text-white/40">Merci de votre confiance.</span>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STRIPE PAYMENT PROCESS OVERLAYS */}
      {checkoutVerifying && (
        <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-4">
          <div className="p-10 glass-premium-dark rounded-[32px] flex flex-col items-center justify-center text-center shadow-2xl max-w-sm animate-pulse">
            <RefreshCw size={56} className="animate-spin text-[#00f0ff] mb-6" />
            <h4 className="text-xl font-light text-white tracking-tight">Vérification du paiement...</h4>
            <p className="text-xs text-white/50 mt-3 font-medium leading-relaxed">
              Nous interrogeons les serveurs sécurisés de Stripe pour valider votre transaction. Veuillez ne pas fermer cette page.
            </p>
          </div>
        </div>
      )}

      {verifiedSuccess && (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-2xl z-[9999] flex flex-col items-center justify-center p-4">
          <div className="p-12 glass-premium-dark rounded-[40px] text-center shadow-2xl max-w-lg relative overflow-hidden flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500 ease-out">
            <div className="w-20 h-20 border-[6px] border-[#00f0ff] rounded-full flex items-center justify-center text-4xl bg-[#00f0ff]/20 text-white shadow-xl shadow-[#00f0ff]/30 mb-2">
              🎉
            </div>
            
            <div>
              <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest block mb-2">Apteka Express</span>
              <h3 className="text-3xl font-light text-white leading-tight tracking-tight">Paiement Stripe Validé !</h3>
              <p className="text-sm text-white/60 mt-3 font-medium leading-relaxed max-w-sm">
                Votre paiement a été traité avec succès. Vos médicaments sont réservés et en cours de préparation !
              </p>
            </div>

            <div className="w-full bg-black/40 border border-white/10 rounded-[24px] p-6 flex flex-col gap-3 relative overflow-hidden mt-2">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block text-left">Statut en direct</span>
              <div className="flex items-center gap-4 mt-1 text-left">
                <span className="text-3xl">🛵</span>
                <div>
                  <p className="text-sm font-bold text-[#00f0ff]">Votre traitement est en route !</p>
                  <p className="text-[11px] text-white/50 mt-1 font-medium">Un livreur partenaire a été affecté à votre course.</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-white/30 font-bold mt-4 uppercase tracking-widest animate-pulse">
              Redirection automatique...
            </p>
          </div>
        </div>
      )}

      {/* INJECT COURIER SCROLLING ANIMATION STYLES */}
      <style>{`
        @keyframes courierRide {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(260%); }
        }
        .animate-courier-ride {
          animation: courierRide 12s linear infinite;
        }
      `}</style>

      {/* FLOATING CART */}
      {cart.length > 0 && !showCheckout && (
        <button
          onClick={() => setShowCheckout(true)}
          className="fixed bottom-10 right-10 bg-white text-black hover:bg-[#00f0ff] px-8 py-5 rounded-[100px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] font-bold flex items-center gap-3 hover:scale-105 transition-all z-[150] cursor-none"
          data-cursor-magnet
        >
          <ShoppingCart size={22}/> Panier d'achat ({cart.length})
        </button>
      )}

      {/* SHOPPING CART / CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className="glass-premium-dark p-10 rounded-[40px] max-w-xl w-full relative shadow-2xl animate-in zoom-in duration-300">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full cursor-none transition-colors text-white/50 hover:text-white"
              data-cursor-magnet
            >
              <X size={20}/>
            </button>
            
            {checkoutSuccess ? (
              <div className="py-12 text-center flex flex-col gap-4 items-center">
                <div className="w-20 h-20 bg-[#00f0ff] text-black rounded-full flex items-center justify-center text-4xl font-extrabold shadow-lg shadow-[#00f0ff]/30 mb-2">✓</div>
                <h4 className="text-3xl font-light text-white tracking-tight">Réservation Validée !</h4>
                <p className="text-sm text-white/60 font-medium leading-relaxed max-w-sm mt-2">
                  Votre demande a été transmise à l'officine. Les médicaments sont bloqués à votre attention.
                </p>
              </div>
            ) : (
              <div className="text-left flex flex-col gap-6">
                <div>
                  <h4 className="text-3xl font-light text-white tracking-tight">Mon Panier Officine</h4>
                  <p className="text-sm text-white/50 mt-2 font-medium">Détail des boîtes réservées dans l'officine sélectionnée :</p>
                </div>

                <div className="max-h-[350px] overflow-y-auto flex flex-col gap-4 pr-2">
                  {cart.map((item, index) => (
                    <div key={index} className="p-5 bg-black/40 border border-white/10 rounded-[20px] flex items-center justify-between gap-4 text-sm font-medium">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate text-base">{item.medicament.nom}</p>
                        <p className="text-[10px] text-white/50 mt-1 uppercase tracking-widest truncate">Pharmacie : <span className="font-bold text-[#00f0ff]">{item.pharmacie.name}</span></p>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center border border-white/10 rounded-xl bg-white/5 overflow-hidden">
                          <button
                            onClick={() => updateCartQty(index, (item.qty || 1) - 1)}
                            className="p-2.5 hover:bg-white/10 text-white/70 transition-colors cursor-none"
                            data-cursor-magnet
                          >
                            <Minus size={14}/>
                          </button>
                          <span className="px-4 text-sm font-bold text-white">{item.qty || 1}</span>
                          <button
                            onClick={() => updateCartQty(index, (item.qty || 1) + 1)}
                            className="p-2.5 hover:bg-white/10 text-white/70 transition-colors cursor-none"
                            data-cursor-magnet
                          >
                            <Plus size={14}/>
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-3 bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors cursor-none"
                          data-cursor-magnet
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-6 flex justify-between items-center">
                  <span className="text-sm font-black text-white/50 uppercase tracking-widest">Montant Total Estimé</span>
                  <span className="text-3xl text-white font-light tracking-tight">
                    {cart.reduce((acc, c) => acc + (c.medicament.prix || 0) * (c.qty || 1), 0).toFixed(2)} €
                  </span>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  {/* Option 1: Stripe Checkout (Direct payment + Delivery) */}
                  <button
                    onClick={handleStripeCheckout}
                    className="w-full py-5 rounded-2xl bg-white hover:bg-[#00f0ff] text-black font-bold text-sm uppercase tracking-widest transition-all cursor-none flex items-center justify-center gap-3 shadow-xl"
                    data-cursor-magnet
                  >
                    <CreditCard size={18}/>
                    Payer par Carte (Stripe Checkout)
                  </button>

                  {/* Option 2: Reservation */}
                  <button
                    onClick={processFakeCheckout}
                    className="w-full py-4.5 rounded-2xl bg-transparent hover:bg-white/5 text-white font-bold text-xs uppercase tracking-widest transition-all cursor-none flex items-center justify-center gap-3 border border-white/20"
                    data-cursor-magnet
                  >
                    <Clock size={16}/>
                    Réserver & Récupérer en Officine
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF ORDONNANCE MODAL */}
      {viewPdfOrdonnance && (
        <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[32px] relative flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-[#050505] text-white p-5 flex justify-between items-center border-b border-white/10">
              <span className="font-mono text-xs font-bold tracking-widest text-[#00f0ff]">APERÇU OFFICIEL - {viewPdfOrdonnance.code}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-white text-black hover:bg-[#00f0ff] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-none mr-2 uppercase tracking-widest"
                  data-cursor-magnet
                >
                  <Printer size={14}/> Imprimer
                </button>
                <button
                  onClick={() => setViewPdfOrdonnance(null)}
                  className="p-2.5 hover:bg-white/10 rounded-full cursor-none transition-colors text-white/50 hover:text-white"
                  data-cursor-magnet
                >
                  <X size={20}/>
                </button>
              </div>
            </div>
            
            <div id="print-prescription" className="p-12 flex-1 overflow-y-auto font-sans bg-white relative text-left" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <div className="absolute top-12 left-12 opacity-5 pointer-events-none"><HeartPulse size={200} /></div>

              <div className="flex justify-between items-start border-b-[6px] border-black pb-8 relative z-10 font-sans">
                <div>
                  <h1 className="text-4xl font-serif font-black text-black leading-tight">Dr. {viewPdfOrdonnance.medecinName}</h1>
                  <p className="text-sm text-black/60 mt-2 font-bold tracking-wider uppercase">{viewPdfOrdonnance.medecinSpec}</p>
                  <p className="text-[10px] text-black/40 mt-1.5 uppercase tracking-widest font-black">Apteka • Antananarivo, Madagascar</p>
                </div>
                <div className="text-right text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200 shrink-0 shadow-sm">
                  <div className="mb-3"><b className="text-black/40 uppercase text-[9px] tracking-widest block mb-1">Date d'émission</b><span className="font-bold text-black text-sm">{new Date(viewPdfOrdonnance.dateEmission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                  <div><b className="text-black/40 uppercase text-[9px] tracking-widest block mb-1">Patient</b><span className="font-bold text-black text-sm">{user.firstName} {user.lastName}</span></div>
                </div>
              </div>
              
              <div className="py-12 min-h-[300px] relative z-10">
                <h2 className="text-xl font-bold mb-8 italic text-black border-l-[6px] border-black pl-5 uppercase tracking-widest">Prescription Médicale</h2>
                {viewPdfOrdonnance.medicaments.map((m, i) => (
                  <div key={i} className="mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <p className="text-xl font-bold text-black flex items-center gap-3">
                        <span className="text-black/40 font-serif text-3xl font-black">Rx</span> {m.nom}
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs font-black text-black bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 uppercase tracking-widest">Qté: {m.quantite}</span>
                        {m.duree && <span className="text-xs font-black text-black bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 uppercase tracking-widest">Durée: {m.duree}</span>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-sm font-medium">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-black text-black/40 block tracking-widest mb-1.5">Dosage unitaire</span>
                        <span className="font-bold text-black">{m.dosage || "1 comprimé"}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-black text-black/40 block tracking-widest mb-1.5">Instructions (Posologie)</span>
                        <span className="font-bold text-black">{m.posologie}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-slate-200 pt-10 flex justify-between items-end relative z-10">
                <div>
                  <p className="text-[11px] font-black text-black uppercase tracking-widest mb-2">Document Certifié</p>
                  <p className="text-xs text-black/60 font-medium">Généré et signé électroniquement par l'infrastructure Apteka.</p>
                  <p className="text-sm text-black/60 font-medium mt-1">Signature Numérique : <b className="text-black font-serif italic text-lg">{viewPdfOrdonnance.medecinName}</b></p>
                </div>
                <div className="p-4 border border-slate-200 rounded-3xl bg-white shadow-sm flex flex-col items-center gap-3 shrink-0">
                  <QRCode value={viewPdfOrdonnance.code} size={110} />
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">Scan Pharmacie</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}