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
        // Redirection vers l'interface sécurisée de Stripe (ou fallback simulation)
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
        
        // Lancement de confettis festifs premium !
        confetti({
          particleCount: 180,
          spread: 90,
          origin: { y: 0.55 }
        });
        
        // Nettoyer les paramètres d'URL pour garder une adresse propre
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Rediriger automatiquement vers le suivi de livraison après 4 secondes d'émerveillement
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
          <div className="p-8 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm relative">
            <span className="text-xs font-bold text-teal-600 tracking-widest uppercase mb-1 block">Achat Patient</span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Trouver un Médicament</h3>
            
            <div className="relative mt-6">
              <Search className="absolute left-4 top-4 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleAutocomplete(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchMeds()}
                placeholder="Taper le nom d'un médicament (ex: Paracétamol, Doliprane...)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-semibold text-base bg-white"
              />
              
              {suggestions.length > 0 && (
                <div className="absolute top-16 left-0 w-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in duration-200">
                  {suggestions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => { handleSearchMeds(s.nom); }}
                      className="p-4 hover:bg-teal-50/50 cursor-pointer border-b border-slate-100 text-sm font-bold text-slate-800 flex justify-between items-center transition-colors"
                    >
                      <span>{s.nom}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full text-slate-500">{s.categorie}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {searchStocks.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* CATEGORIES CARD */}
              <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 p-6 rounded-[2rem] shadow-sm">
                <h4 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                  <span className="p-1.5 bg-teal-500/10 text-teal-600 rounded-xl"><ClipboardList size={18}/></span>
                  Explorer par Catégorie
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Antalgique", desc: "Soulagement des douleurs", color: "from-blue-500/10 to-blue-500/5 text-blue-700 hover:border-blue-300" },
                    { name: "Anti-inflammatoire", desc: "Traitement des inflammations", color: "from-red-500/10 to-red-500/5 text-red-700 hover:border-red-300" },
                    { name: "Antibiotique", desc: "Infections bactériennes", color: "from-amber-500/10 to-amber-500/5 text-amber-700 hover:border-amber-300" },
                    { name: "Gastro-entérologie", desc: "Maux d'estomac, transit", color: "from-teal-500/10 to-teal-500/5 text-teal-700 hover:border-teal-300" }
                  ].map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleSearchMeds(cat.name)}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${cat.color} border border-transparent hover:shadow-md text-left transition-all cursor-pointer flex flex-col gap-1`}
                    >
                      <b className="font-extrabold text-sm">{cat.name}</b>
                      <span className="text-[10px] opacity-75 font-bold leading-normal">{cat.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* POPULAR MEDICINES CARD */}
              <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 p-6 rounded-[2rem] shadow-sm">
                <h4 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                  <span className="p-1.5 bg-sky-500/10 text-sky-600 rounded-xl"><Pill size={18}/></span>
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
                      className="px-4 py-3 bg-white hover:bg-teal-50/50 hover:text-teal-700 hover:border-teal-200 border border-slate-200/50 rounded-2xl text-xs font-bold text-slate-700 transition-all flex items-center gap-3 cursor-pointer shadow-sm"
                    >
                      <span>{med.label}</span>
                      <span className="bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 text-[10px] text-teal-600 font-extrabold">{med.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              {/* RESULTS LIST */}
              <div className="xl:col-span-5 flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center px-2">
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Résultats ({searchStocks.length})</h4>
                  <button
                    onClick={() => {
                      setSearchStocks([]);
                      setSearchMedicaments([]);
                    }}
                    className="text-xs font-black text-slate-400 hover:text-teal-500 transition-all cursor-pointer"
                  >
                    Effacer
                  </button>
                </div>

                {/* MÉDICAMENTS IDENTIFIÉS */}
                {searchMedicaments.length > 0 && (
                  <div className="flex flex-col gap-3 border-b border-slate-200/30 pb-4 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Médicament(s) trouvé(s)</span>
                    {searchMedicaments.map(med => {
                      const stockAvailable = searchStocks.filter(s => s.medicamentId === med.id);
                      const totalStock = stockAvailable.reduce((acc, s) => acc + s.quantite, 0);
                      
                      return (
                        <div key={med.cis} className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl flex items-center justify-between gap-4 text-left hover:border-teal-500/35 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-slate-850 text-sm truncate">{med.nom}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">{med.forme} • {med.substanceActive || "Principe Actif N/A"}</p>
                            <p className="text-[10px] font-extrabold text-teal-600 mt-1">
                              {totalStock > 0 ? `🔥 En stock (${totalStock} boîtes dispos)` : "⚠️ Rupture réseau (Sur Commande 24h)"}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-sm font-black text-slate-850">{(med.prix || 0).toFixed(2)} €</span>
                            <button
                              onClick={() => {
                                if (cart.some(c => c.medicamentId === med.id)) {
                                  alert("Ce médicament est déjà dans votre panier.");
                                  return;
                                }
                                
                                // Trouver s'il y a du stock
                                const stockForMed = searchStocks.find(s => s.medicamentId === med.id);
                                if (stockForMed) {
                                  setCart([...cart, { ...stockForMed, qty: 1 }]);
                                  alert("Ajouté au panier ! Stock réservé à la pharmacie.");
                                } else {
                                  // Pré-commande / Sur commande
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
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase transition-colors cursor-pointer"
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Disponibilités physiques par officine :</span>
                <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
                  {searchStocks.map(stock => (
                    <div key={stock.id} className="p-5 bg-white/65 border border-slate-200/40 rounded-3xl shadow-sm flex flex-col gap-3 hover:border-teal-500/30 transition-colors text-left">
                      <div className="flex justify-between items-start gap-2">
                        <b className="text-base text-slate-800 leading-tight font-black">{stock.pharmacie.name}</b> 
                        <span className="text-xs text-teal-700 font-bold bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full shrink-0">Stock: {stock.quantite}</span>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                        <MapPin size={12} className="text-slate-450" />
                        Quartier : {stock.pharmacie.zone}
                      </p>

                      <div className="flex justify-between text-sm items-center mt-2 border-t border-slate-100 pt-3">
                        <b className="text-teal-600 text-lg font-black">{(stock.medicament.prix || 0).toFixed(2)} €</b>
                        <button
                          onClick={() => {
                            if (cart.some(c => c.id === stock.id)) {
                              alert("Ce produit de cette pharmacie est déjà dans votre panier.");
                              return;
                            }
                            setCart([...cart, { ...stock, qty: 1 }]);
                            alert("Produit ajouté au panier !");
                          }}
                          className="bg-slate-900 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                        >
                          <ShoppingCart size={16}/> Ajouter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* INTERACTIVE MAP */}
              <div className="xl:col-span-7 h-[550px] rounded-3xl overflow-hidden border border-slate-200/50 shadow-sm relative">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 p-4 border border-slate-200/40 rounded-2xl shadow-sm">
            <div className="text-left">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Réseau des Pharmacies agréées</h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Découvrez nos <strong className="text-teal-600 font-bold">{allPharmacies.length} pharmacies agréées</strong> réparties sur tout le réseau d'Antananarivo.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/40 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtrer par Zone :</span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-800 outline-none cursor-pointer border-none"
              >
                <option value="">-- Toutes les zones ({allPharmacies.length}) --</option>
                {Array.from(new Set(allPharmacies.map(p => p.zone).filter(Boolean))).sort().map(z => (
                  <option key={z} value={z}>{z} ({allPharmacies.filter(p => p.zone === z).length})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-0">
            {/* LISTE DES PHARMACIES A GAUCHE */}
            <div className="lg:col-span-4 flex flex-col h-full bg-white/50 backdrop-blur-md p-5 border border-slate-200/50 rounded-3xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left block mb-3">
                Pharmacies ({selectedZone ? allPharmacies.filter(p => p.zone === selectedZone).length : allPharmacies.length})
              </span>
              
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
                {(selectedZone ? allPharmacies.filter(p => p.zone === selectedZone) : allPharmacies).map(p => (
                  <div
                    key={p.id}
                    onClick={() => setPatientLocation({ lat: p.latitude, lng: p.longitude })}
                    className="p-4 bg-white/60 hover:bg-teal-50/50 hover:border-teal-200 cursor-pointer rounded-2xl border border-slate-200/40 transition-all flex flex-col gap-1 text-left"
                  >
                    <b className="text-sm text-slate-800 leading-tight font-black">{p.name}</b>
                    <p className="text-[11px] text-slate-500 font-semibold">Zone : <span className="font-bold text-teal-600">{p.zone || "N/A"}</span></p>
                    {p.phone && <p className="text-[10px] text-slate-400 font-bold mt-0.5">📞 Tél : {p.phone}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* CARTE DROITE */}
            <div className="lg:col-span-8 h-full rounded-3xl overflow-hidden border border-slate-200/50 shadow-sm relative">
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
          <div className="text-left bg-white/40 p-4 border border-slate-200/40 rounded-2xl shadow-sm">
            <h3 className="text-lg font-black text-slate-850">Mes Ordonnances Officielles</h3>
            <p className="text-xs text-slate-500 mt-1">Consultez l'historique de vos prescriptions validées par vos médecins agréés.</p>
          </div>

          {myPrescriptions.length === 0 ? (
            <div className="py-12 bg-white/45 backdrop-blur-md border border-slate-200/50 rounded-3xl text-center text-slate-450 flex flex-col items-center justify-center gap-2">
              <ClipboardList size={36} className="text-teal-500/40" />
              <p className="text-xs font-semibold">Aucune ordonnance n'a encore été rédigée à votre nom.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myPrescriptions.map(p => (
                <div key={p.id} className="bg-white/60 backdrop-blur-md border border-slate-200/40 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow text-left">
                  <div>
                    <span className="font-mono text-teal-600 font-bold text-base bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg">{p.code}</span>
                    <p className="text-slate-800 font-black mt-4 text-base">Dr. {p.medecinName}</p>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">{p.medecinSpec}</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => requestRenewal(p.id)}
                      className="flex-1 sm:flex-none px-5 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200/40 text-amber-700 text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
                    >
                      Renouveler
                    </button>
                    <button
                      onClick={() => setViewPdfOrdonnance(p)}
                      className="flex-1 sm:flex-none px-5 py-3 bg-slate-900 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileText size={14}/> Ouvrir
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
        <div className="max-w-3xl mx-auto h-[550px] flex flex-col bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2.5rem] shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="p-5 border-b border-slate-200/40 font-extrabold flex items-center gap-3 bg-white/40 text-slate-850 text-base">
            <div className="p-2 bg-teal-500/10 rounded-full text-teal-600"><MessageCircle size={18}/></div>
            Chat Sécurisé avec votre Médecin
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/20">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <MessageCircle size={48} className="mb-4 opacity-50 text-teal-500" />
                <p className="text-xs font-bold text-slate-600">Aucun message. Commencez la discussion.</p>
                <p className="text-[10px] text-slate-400/80 mt-1">Communiquez de manière sécurisée avec votre médecin traitant.</p>
              </div>
            ) : (
              chatMessages.map(m => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl max-w-[80%] text-xs font-semibold shadow-sm leading-relaxed ${
                    m.senderId === user.id
                      ? 'bg-teal-500 text-white self-end rounded-br-none'
                      : 'bg-white border border-slate-200/40 text-slate-800 self-start rounded-bl-none'
                  }`}
                >
                  {m.content}
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 bg-white/70 border-t border-slate-200/30 flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1 bg-slate-100 rounded-2xl px-5 text-xs outline-none font-semibold focus:ring-2 focus:ring-teal-500/20"
              placeholder="Écrivez votre message..."
            />
            <button
              onClick={sendMessage}
              className="w-12 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Send size={16}/>
            </button>
          </div>
        </div>
      )}

      {/* 5. SUIVI LIVRAISONS PATIENT */}
      {activeTab === 'patient_deliveries' && (
        <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300 text-left">
          <div className="text-left bg-white/40 p-5 border border-slate-200/40 rounded-2xl shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-850">Suivi en Temps Réel de mes Livraisons</h3>
              <p className="text-xs text-slate-500 mt-1">Suivez chaque étape de la préparation et de l'expédition de vos traitements.</p>
            </div>
            <button
              onClick={loadCommandesHistory}
              disabled={loadingHistory}
              className="p-2.5 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-teal-600 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingHistory && commandesHistory.length === 0 ? (
            <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={36} className="animate-spin text-teal-500/60" />
              <p className="text-xs font-semibold">Chargement de votre historique de livraison...</p>
            </div>
          ) : commandesHistory.length === 0 ? (
            <div className="py-16 bg-white/45 backdrop-blur-md border border-slate-200/50 rounded-3xl text-center text-slate-455 flex flex-col items-center justify-center gap-3">
              <Package size={42} className="text-teal-500/30" />
              <p className="text-sm font-extrabold text-slate-800">Aucune commande en cours</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Vous n'avez pas encore passé commande avec livraison. Recherchez vos médicaments pour composer votre panier et payez via Stripe !
              </p>
              <button
                onClick={() => setActiveTab('recherche')}
                className="mt-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer font-black"
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
                  <div key={cmd.id} className="p-6 bg-white/60 backdrop-blur-md border border-slate-200/40 rounded-[2rem] shadow-sm flex flex-col gap-6 text-left">
                    <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Commande ID: #{cmd.id.slice(0, 8)}</span>
                        <h4 className="text-base font-black text-slate-800 mt-1">Officine : {cmd.pharmacie.name}</h4>
                        <p className="text-[11px] text-slate-550 font-semibold flex items-center gap-1.5 mt-0.5">
                          <Clock size={12} className="text-slate-400" /> Passée le {dateText}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 self-end sm:self-start shrink-0">
                        <span className="text-base font-black text-teal-600">{(cmd.total || 0).toFixed(2)} €</span>
                        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 border border-teal-500/10 uppercase tracking-wider flex items-center gap-1">
                          💳 Stripe Validé
                        </span>
                      </div>
                    </div>

                    {/* DÉTAIL DES PRODUITS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items.map((it, idx) => (
                        <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs font-semibold">
                          <div className="truncate">
                            <p className="font-extrabold text-slate-800 truncate">{it.medicament.nom}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 truncate">Quantité : {it.qty || 1} boîte(s)</p>
                          </div>
                          <span className="text-slate-600 font-extrabold shrink-0">{((it.medicament.prix || 0) * (it.qty || 1)).toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>

                    {/* GRANDE BARRE DE PROGRESSION DE LIVRAISON */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 mt-2 relative overflow-hidden">
                      <div className="flex justify-between items-center relative z-10 gap-2 flex-wrap md:flex-nowrap">
                        
                        {/* ÉTAPE 1 */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-[70px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                            isPaid ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            1
                          </div>
                          <span className="text-[10px] font-black mt-2 text-slate-800 font-black">Paiement</span>
                          <span className="text-[8px] font-bold text-teal-600 mt-0.5 uppercase">Validé</span>
                        </div>

                        {/* CONNECTEUR 1-2 */}
                        <div className="hidden md:block flex-1 h-1 bg-slate-100 relative">
                          <div className={`absolute left-0 top-0 h-full bg-teal-500 transition-all duration-500 ${isPaid ? 'w-full' : 'w-0'}`} />
                        </div>

                        {/* ÉTAPE 2 */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-[70px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                            isPaid ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            2
                          </div>
                          <span className="text-[10px] font-black mt-2 text-slate-800 font-black">Préparation</span>
                          <span className="text-[8px] font-bold text-amber-600 mt-0.5 uppercase">
                            {cmd.status === "PAYEE" ? "En cours..." : "Prêt"}
                          </span>
                        </div>

                        {/* CONNECTEUR 2-3 */}
                        <div className="hidden md:block flex-1 h-1 bg-slate-100 relative">
                          <div className={`absolute left-0 top-0 h-full bg-teal-500 transition-all duration-500 ${isEnRoute ? 'w-full' : 'w-0'}`} />
                        </div>

                        {/* ÉTAPE 3 */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-[70px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                            isEnRoute ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            3
                          </div>
                          <span className="text-[10px] font-black mt-2 text-slate-800 font-black">Expédition</span>
                          <span className="text-[8px] font-bold text-blue-600 mt-0.5 uppercase">
                            {cmd.status === "EN_ROUTE" ? "En route 🛵" : isDelivered ? "Complété" : "En attente"}
                          </span>
                        </div>

                        {/* CONNECTEUR 3-4 */}
                        <div className="hidden md:block flex-1 h-1 bg-slate-100 relative">
                          <div className={`absolute left-0 top-0 h-full bg-teal-500 transition-all duration-500 ${isDelivered ? 'w-full' : 'w-0'}`} />
                        </div>

                        {/* ÉTAPE 4 */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-[70px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                            isDelivered ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            4
                          </div>
                          <span className="text-[10px] font-black mt-2 text-slate-800 font-black">Livraison</span>
                          <span className="text-[8px] font-bold text-emerald-600 mt-0.5 uppercase">
                            {isDelivered ? "Remis" : "En attente"}
                          </span>
                        </div>

                      </div>

                      {/* ANIMATED COURIER DISPLAY WHEN EN ROUTE */}
                      {cmd.status === "EN_ROUTE" && (
                        <div className="mt-6 border-t border-slate-200/50 pt-4 flex flex-col gap-2 relative">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span> 
                            Livreur en déplacement dans votre zone ({cmd.pharmacie.zone}...)
                          </p>
                          
                          <div className="h-10 bg-gradient-to-r from-sky-500/10 to-teal-500/5 rounded-xl border border-sky-500/10 relative overflow-hidden flex items-center">
                            {/* Animated Courier Icon */}
                            <div className="absolute animate-courier-ride flex items-center gap-2 font-black text-xs text-sky-700">
                              <span>🛵</span>
                              <span>Votre livreur Apteka est en route !</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DELIVERED DISP */}
                      {cmd.status === "LIVREE" && (
                        <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" /> Livraison effectuée avec succès !</span>
                          <span className="font-bold text-slate-400">Merci de votre confiance.</span>
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-4">
          <div className="p-8 bg-white/10 border border-white/20 rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl max-w-sm animate-pulse">
            <RefreshCw size={48} className="animate-spin text-teal-400 mb-4" />
            <h4 className="text-lg font-black text-white">Vérification du paiement...</h4>
            <p className="text-xs text-slate-300 mt-2 font-semibold">
              Nous interrogeons les serveurs sécurisés de Stripe pour valider votre transaction. Veuillez ne pas fermer cette page.
            </p>
          </div>
        </div>
      )}

      {verifiedSuccess && (
        <div className="fixed inset-0 bg-gradient-to-tr from-teal-950/95 to-slate-950/95 backdrop-blur-lg z-[9999] flex flex-col items-center justify-center p-4">
          <div className="p-10 bg-white/5 border border-white/15 rounded-[3rem] text-center shadow-2xl max-w-lg relative overflow-hidden flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 border-4 border-teal-400 rounded-full flex items-center justify-center text-3xl font-black bg-teal-500/20 text-teal-300 shadow-xl shadow-teal-500/20 mb-2">
              🎉
            </div>
            
            <div>
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest block mb-1">Apteka Express</span>
              <h3 className="text-2xl font-black text-white leading-tight">Paiement Stripe Validé !</h3>
              <p className="text-xs text-slate-300 mt-2 font-semibold leading-relaxed max-w-sm">
                Votre paiement a été traité avec succès par Stripe. Vos médicaments sont réservés et en cours de préparation en officine !
              </p>
            </div>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-left">Statut de livraison</span>
              <div className="flex items-center gap-3 mt-1 text-left">
                <span className="text-2xl">🛵</span>
                <div>
                  <p className="text-xs font-black text-teal-300">Votre traitement est en route !</p>
                  <p className="text-[10px] text-slate-300 mt-0.5 font-bold">Un livreur partenaire a été affecté à votre course.</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-extrabold mt-2 animate-pulse">
              Redirection vers votre tableau de bord dans quelques instants...
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

      {/* FLOATING CART FLOATING PANEL */}
      {cart.length > 0 && !showCheckout && (
        <button
          onClick={() => setShowCheckout(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-white px-8 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 hover:scale-105 transition-transform z-[150] cursor-pointer"
        >
          <ShoppingCart size={20}/> Panier d'achat ({cart.length})
        </button>
      )}

      {/* SHOPPING CART / CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 max-w-xl w-full relative shadow-2xl animate-in zoom-in duration-200">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
            >
              <X size={18}/>
            </button>
            
            {checkoutSuccess ? (
              <div className="py-8 text-center flex flex-col gap-3 items-center">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-emerald-500/20 mb-2">✓</div>
                <h4 className="text-xl font-black text-slate-800">Réservation Validée !</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm mt-1">
                  Votre demande a été transmise à l'officine. Les médicaments sont bloqués à votre attention sous le code de votre ordonnance.
                </p>
              </div>
            ) : (
              <div className="text-left flex flex-col gap-6">
                <div>
                  <h4 className="text-xl font-black text-slate-850">Mon Panier Officine</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Détail des boîtes réservées dans l'officine sélectionnée :</p>
                </div>

                <div className="max-h-[300px] overflow-y-auto flex flex-col gap-4">
                  {cart.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold">
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-800 truncate text-sm">{item.medicament.nom}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">Pharmacie : <span className="font-bold text-teal-600">{item.pharmacie.name}</span></p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                          <button
                            onClick={() => updateCartQty(index, (item.qty || 1) - 1)}
                            className="p-1.5 hover:bg-slate-50 text-slate-500"
                          >
                            <Minus size={12}/>
                          </button>
                          <span className="px-3 text-xs font-black text-slate-800">{item.qty || 1}</span>
                          <button
                            onClick={() => updateCartQty(index, (item.qty || 1) + 1)}
                            className="p-1.5 hover:bg-slate-50 text-slate-500"
                          >
                            <Plus size={12}/>
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200/60 pt-4 flex justify-between items-center text-sm font-black text-slate-850">
                  <span>Montant Total Estimé</span>
                  <span className="text-lg text-teal-600 font-black">
                    {cart.reduce((acc, c) => acc + (c.medicament.prix || 0) * (c.qty || 1), 0).toFixed(2)} €
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Option 1: Stripe Checkout (Direct payment + Delivery) */}
                  <button
                    onClick={handleStripeCheckout}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-teal-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 font-black"
                  >
                    <CreditCard size={14}/>
                    Payer par Carte (Stripe Checkout)
                  </button>

                  {/* Option 2: Reservation */}
                  <button
                    onClick={processFakeCheckout}
                    className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs tracking-wider uppercase hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200/50 font-extrabold"
                  >
                    <Clock size={14}/>
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl h-[85vh] rounded-3xl border border-white/40 relative flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <span className="font-mono text-xs font-bold tracking-widest text-teal-400">APERÇU OFFICIEL - {viewPdfOrdonnance.code}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-2"
                >
                  <Printer size={14}/> Imprimer
                </button>
                <button
                  onClick={() => setViewPdfOrdonnance(null)}
                  className="p-2 hover:bg-white/20 rounded-full cursor-pointer transition-colors"
                >
                  <X size={20}/>
                </button>
              </div>
            </div>
            
            <div id="print-prescription" className="p-10 flex-1 overflow-y-auto font-sans bg-white relative text-left" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <div className="absolute top-10 left-10 opacity-5 pointer-events-none"><HeartPulse size={200} /></div>

              <div className="flex justify-between items-start border-b-4 border-teal-500 pb-8 relative z-10 font-sans">
                <div>
                  <h1 className="text-3xl font-serif font-extrabold text-slate-900 leading-tight">Dr. {viewPdfOrdonnance.medecinName}</h1>
                  <p className="text-sm text-slate-500 mt-2 font-semibold">{viewPdfOrdonnance.medecinSpec}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-extrabold">Apteka • Antananarivo, Madagascar</p>
                </div>
                <div className="text-right text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
                  <div className="mb-2"><b className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Date d'émission</b><span className="font-bold text-slate-800">{new Date(viewPdfOrdonnance.dateEmission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                  <div><b className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Patient</b><span className="font-bold text-slate-800">{user.firstName} {user.lastName}</span></div>
                </div>
              </div>
              
              <div className="py-10 min-h-[300px] relative z-10">
                <h2 className="text-xl font-bold mb-8 italic text-teal-900 border-l-4 border-teal-500 pl-4">Prescription Médicale</h2>
                {viewPdfOrdonnance.medicaments.map((m, i) => (
                  <div key={i} className="mb-6 bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <p className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <span className="text-teal-500 font-serif text-2xl font-bold">Rx</span> {m.nom}
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">Qté: {m.quantite}</span>
                        {m.duree && <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Durée: {m.duree}</span>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs font-semibold">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Dosage unitaire</span>
                        <span className="font-bold text-slate-800">{m.dosage || "1 comprimé"}</span>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Instructions (Posologie)</span>
                        <span className="font-bold text-slate-800">{m.posologie}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-slate-100 pt-8 flex justify-between items-end relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">Document Certifié</p>
                  <p className="text-[11px] text-slate-400 font-medium">Généré et signé électroniquement par l'infrastructure Apteka.</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">Signature Numérique : <b className="text-slate-800 font-serif italic text-base">{viewPdfOrdonnance.medecinName}</b></p>
                </div>
                <div className="p-3 border border-slate-200/60 rounded-2xl bg-white shadow-sm flex flex-col items-center gap-2 shrink-0">
                  <QRCode value={viewPdfOrdonnance.code} size={100} />
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Scan Pharmacie</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
