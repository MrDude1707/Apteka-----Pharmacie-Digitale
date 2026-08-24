import React, { useState } from 'react';
import { 
  Pill, 
  TrendingUp, 
  Truck, 
  AlertOctagon, 
  Layers, 
  ChevronRight, 
  ShieldCheck, 
  Boxes, 
  Activity, 
  Users, 
  BriefcaseMedical,
  Clock
} from 'lucide-react';

const SHOWCASE_ITEMS = [
  {
    id: 'stocks',
    label: 'Stocks & Médicaments',
    title: 'Gestion Centralisée des Stocks',
    description: 'Une visibilité instantanée sur les molécules actives. Chaque médicament est répertorié avec son dosage, son numéro de lot, sa date de péremption, et sa disponibilité exacte dans les rayons physiques.',
    icon: <Pill className="w-5 h-5 text-teal-400" />,
    stats: [
      { label: 'Références', value: '1 240+' },
      { label: 'Disponibilité', value: '96.4%' }
    ],
    mockup: (
      <div className="flex flex-col gap-4 animate-fadeIn">
        <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40 text-xs">
          <span className="text-zinc-300 font-bold flex items-center gap-1.5"><Boxes size={14} className="text-teal-400" /> Inventaire Officine</span>
          <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20 font-bold">À jour (il y a 2 min)</span>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {/* Row 1 */}
          <div className="bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-800/60 hover:border-teal-500/20 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                <Pill size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Paracétamol 1g (Biogaran)</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Lot #PA-9831 • Exp : 12/2028</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400 block">450 boîtes</span>
              <span className="text-[9px] text-zinc-500 font-semibold block">Rayon A-12</span>
            </div>
          </div>
          {/* Row 2 */}
          <div className="bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-800/60 hover:border-teal-500/20 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                <Pill size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Amoxicilline 500mg (Sandoz)</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Lot #AM-2304 • Exp : 09/2027</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-amber-500 block">84 boîtes</span>
              <span className="text-[9px] text-zinc-500 font-semibold block">Rayon B-03</span>
            </div>
          </div>
          {/* Row 3 */}
          <div className="bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-800/60 hover:border-teal-500/20 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                <Pill size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Ibuprofène 400mg (Mylan)</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Lot #IB-5011 • Exp : 05/2028</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400 block">210 boîtes</span>
              <span className="text-[9px] text-zinc-500 font-semibold block">Rayon A-04</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'ventes',
    label: 'Ventes & Réservations',
    title: 'Suivi des Ventes & Ordonnances',
    description: 'Suivez le cycle de vente complet, de la réservation en ligne par QR code au paiement final à l\'officine. Éliminez l\'erreur humaine grâce à la synchronisation automatique des transactions.',
    icon: <TrendingUp className="w-5 h-5 text-teal-400" />,
    stats: [
      { label: 'Commandes/Jour', value: '180+' },
      { label: 'Taux Retrait', value: '99.1%' }
    ],
    mockup: (
      <div className="flex flex-col gap-4 animate-fadeIn">
        <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40 text-xs">
          <span className="text-zinc-300 font-bold flex items-center gap-1.5"><Activity size={14} className="text-teal-400" /> Flux de Ventes</span>
          <span className="text-[10px] font-mono font-bold text-emerald-400">Total : 14 500 000 Ar</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Item 1 */}
          <div className="bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <div>
                <h4 className="text-xs font-bold text-white">Réservation #RES-4902</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Par : Rivo R. • Retiré en officine</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-zinc-100">45 000 Ar</span>
              <span className="text-[9px] text-zinc-500 block">Paiement Mobile</span>
            </div>
          </div>
          {/* Item 2 */}
          <div className="bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <div>
                <h4 className="text-xs font-bold text-white">Réservation #RES-4903</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Par : Lalao A. • Prêt au comptoir</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-zinc-100">18 500 Ar</span>
              <span className="text-[9px] text-teal-400 font-semibold block">Réservé</span>
            </div>
          </div>
          {/* Item 3 */}
          <div className="bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <div>
                <h4 className="text-xs font-bold text-white">Vente Directe #VNT-1290</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Par : Client Passage • Validée</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-zinc-100">124 000 Ar</span>
              <span className="text-[9px] text-zinc-500 block">Espèces</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'fournisseurs',
    label: 'Fournisseurs & Réassort',
    title: 'Réseau de Fournisseurs Agréés',
    description: 'Centralisez vos commandes auprès des distributeurs officiels de Madagascar. Automatisez le suivi des bons de livraison, les demandes de devis et la réception des molécules certifiées sans faille.',
    icon: <Truck className="w-5 h-5 text-teal-400" />,
    stats: [
      { label: 'Distributeurs', value: '12 Partenaires' },
      { label: 'Délai Réception', value: '24/48h' }
    ],
    mockup: (
      <div className="flex flex-col gap-4 animate-fadeIn">
        <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40 text-xs">
          <span className="text-zinc-300 font-bold flex items-center gap-1.5"><Truck size={14} className="text-teal-400" /> Bons de Commandes</span>
          <span className="text-[10px] font-bold text-teal-400">Salama / Opham / Pharma-Mad</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Dist 1 */}
          <div className="bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400">
                <BriefcaseMedical size={16} className="text-teal-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Centrale SALAMA</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Commande #BC-2026-08 • Reçue</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Livré</span>
          </div>
          {/* Dist 2 */}
          <div className="bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400">
                <BriefcaseMedical size={16} className="text-teal-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">OPHAM Madagascar</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Commande #BC-2026-12 • Transit</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1"><Clock size={10} /> En Route</span>
          </div>
          {/* Dist 3 */}
          <div className="bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400">
                <BriefcaseMedical size={16} className="text-teal-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">PHARMA-MAD</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Demande de Devis #DQ-9041</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">Envoyé</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'alertes',
    label: 'Alertes Temps Réel',
    title: 'Prévention des Ruptures',
    description: 'Ne soyez jamais pris de court. Le moteur d\'analyse intelligent d\'Apteka surveille le rythme d\'utilisation des stocks et envoie des notifications immédiates dès qu\'un seuil de sécurité est franchi.',
    icon: <AlertOctagon className="w-5 h-5 text-teal-400" />,
    stats: [
      { label: 'Seuils Configurés', value: '100% Automatique' },
      { label: 'Évite les Ruptures', value: '94% Réduction' }
    ],
    mockup: (
      <div className="flex flex-col gap-4 animate-fadeIn">
        <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl border border-rose-500/20 text-xs">
          <span className="text-rose-400 font-bold flex items-center gap-1.5"><AlertOctagon size={14} className="animate-pulse" /> Diagnostic Alertes</span>
          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse">1 Action Requise</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Alerte 1 */}
          <div className="bg-zinc-950/50 p-4 rounded-xl border border-rose-500/30 flex gap-3 items-start">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
              <AlertOctagon size={16} className="animate-pulse" />
            </div>
            <div className="text-xs">
              <h4 className="font-extrabold text-white">Stock critique : Amoxicilline 500mg</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Le stock actuel (8 boîtes) couvre moins de 2 jours de prescription. Recommandation : Passer commande d'un lot de <strong className="text-teal-400">100 boîtes</strong> auprès d'OPHAM.
              </p>
              <button className="mt-3 text-[10px] font-bold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1">
                Lancer l'approvisionnement automatique <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState('stocks');

  const selectedItem = SHOWCASE_ITEMS.find(item => item.id === activeTab) || SHOWCASE_ITEMS[0];

  return (
    <section className="py-24 sm:py-32 bg-[#09090b] text-white relative z-20 border-t border-zinc-900 overflow-hidden" id="dashboard-preview">
      
      {/* Aurora visual styles */}
      <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4 mb-20">
          <span className="text-teal-400 font-extrabold uppercase tracking-widest text-xs">Le Dashboard Intelligent</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-white">
            Un outil professionnel, conçu pour les pharmacies.
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mt-2" />
          <p className="text-zinc-400 font-medium leading-relaxed text-sm sm:text-base max-w-xl mt-2">
            Explorez les fonctionnalités clés qui transforment la gestion quotidienne de votre officine et connectent directement votre pharmacie au réseau de santé d'Antananarivo.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Menu / Selector (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {SHOWCASE_ITEMS.map((item) => {
              const isActive = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-zinc-900/60 border-teal-500/30 shadow-xl' 
                      : 'bg-transparent border-transparent hover:bg-zinc-900/20 hover:border-zinc-800/40'
                  }`}
                >
                  <div className={`p-3 rounded-xl border shrink-0 transition-all ${
                    isActive 
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
                      : 'bg-zinc-950/40 border-zinc-800/50 text-zinc-400'
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold transition-colors ${isActive ? 'text-teal-400' : 'text-zinc-200'}`}>
                      {item.label}
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold mt-1 line-clamp-1">
                      {item.title}
                    </p>
                  </div>
                  <ChevronRight size={16} className={`ml-auto text-zinc-500 shrink-0 self-center transition-transform duration-300 ${isActive ? 'translate-x-1 text-teal-400' : ''}`} />
                </button>
              );
            })}
          </div>

          {/* Right Preview Card / Mockup Screen (col-span-7) */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-900/40 border border-zinc-800/60 p-2 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
              <div className="bg-[#09090b] rounded-[2.3rem] p-6 sm:p-8 flex flex-col gap-6 text-left min-h-[440px] justify-between">
                
                {/* Header detail */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full">Module Officiel</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{selectedItem.title}</h3>
                  <p className="text-zinc-400 font-medium leading-relaxed text-xs sm:text-sm mt-1">
                    {selectedItem.description}
                  </p>
                </div>

                {/* Simulated Mockup Panel */}
                <div className="w-full bg-zinc-950/20 border border-zinc-800/50 p-4 rounded-2xl relative">
                  {selectedItem.mockup}
                </div>

                {/* Dynamic Stats footer */}
                <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-5 text-xs">
                  {selectedItem.stats.map((stat, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{stat.label}</span>
                      <span className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-1.5">
                        {stat.label.includes('Évite') || stat.label.includes('Taux') ? (
                          <ShieldCheck size={16} className="text-teal-400 shrink-0" />
                        ) : null}
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
