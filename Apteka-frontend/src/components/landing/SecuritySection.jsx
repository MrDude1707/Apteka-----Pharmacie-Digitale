import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Users, 
  Key, 
  FileCheck, 
  ServerCrash, 
  CheckCircle 
} from 'lucide-react';

const SECURITY_CARDS = [
  {
    icon: <Lock className="w-6 h-6 text-teal-400" />,
    title: "Chiffrement AES-256",
    description: "Toutes les ordonnances médicales sont chiffrées de bout en bout à l'aide de clés cryptographiques symétriques. Aucune donnée clinique n'est jamais stockée en clair.",
    badge: "Confidentialité Totale"
  },
  {
    icon: <Users className="w-6 h-6 text-teal-400" />,
    title: "Gestion des Rôles (RBAC)",
    description: "Des espaces de travail strictement isolés pour les patients, médecins agréés et pharmaciens d'officine. Chaque profil est authentifié avec validation de ses habilitations.",
    badge: "Habilitations Certifiées"
  },
  {
    icon: <FileCheck className="w-6 h-6 text-teal-400" />,
    title: "Traçabilité & Audit Trail",
    description: "Chaque prescription, réservation et délivrance est scellée de manière immuable avec une signature numérique cryptographique unique pour garantir l'absence de falsifications.",
    badge: "Zéro Falsification"
  },
  {
    icon: <Database className="w-6 h-6 text-teal-400" />,
    title: "Sauvegarde & Haute Dispo",
    description: "Base de données répliquée en temps réel sur des infrastructures cloud de haute sécurité. Vos ordonnances et stocks restent disponibles 24h/27, même en cas de panne locale.",
    badge: "Disponibilité de 99.99%"
  }
];

export default function SecuritySection() {
  return (
    <section className="py-24 sm:py-32 bg-zinc-950 text-white relative z-20 border-t border-zinc-900 overflow-hidden" id="securite">
      
      {/* Aurora Ambient Gradients */}
      <div className="absolute top-[10%] left-[-10%] w-[45vw] h-[45vw] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-20">
          <div className="lg:col-span-7 text-left flex flex-col gap-4">
            <span className="text-teal-400 font-extrabold uppercase tracking-widest text-xs">Crédibilité & Confiance</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-white">
              Une infrastructure ultra-sécurisée conforme aux exigences médicales.
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mt-2" />
          </div>
          <div className="lg:col-span-5 text-left">
            <p className="text-zinc-400 font-medium leading-relaxed text-sm sm:text-base">
              Apteka protège la relation de soins de l'Ordre National de Madagascar. En intégrant des protocoles de sécurité de niveau bancaire, nous garantissons l'intégrité de la chaîne d'approvisionnement pharmaceutique d'Antananarivo.
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {SECURITY_CARDS.map((card, idx) => (
            <div 
              key={idx}
              className="p-8 sm:p-10 bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/60 rounded-[2rem] flex flex-col justify-between hover:border-teal-500/30 transition-all duration-500 hover:scale-[1.01] shadow-xl group"
            >
              <div className="flex flex-col gap-5 text-left">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-zinc-950 transition-all duration-500 shadow-md">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full">
                    {card.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-teal-400">
                    {card.title}
                  </h3>
                  <p className="text-zinc-400 font-medium text-xs sm:text-sm mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 pt-5 border-t border-zinc-800/40 text-xs font-bold text-zinc-500 group-hover:text-teal-400 transition-colors">
                <ShieldCheck size={14} className="text-teal-500/60 group-hover:text-teal-400" />
                <span>Protocole de sécurité certifié actif</span>
              </div>
            </div>
          ))}
        </div>

        {/* Audit Certification Box */}
        <div className="mt-12 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border border-teal-500/10 p-6 sm:p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-teal-500/20 text-teal-400 rounded-full shrink-0 border border-teal-500/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-base sm:text-lg">Audit de Conformité Réussi</h4>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-semibold">Toutes les transmissions de données sont auditées et vérifiées conformes aux directives de la DPLM de Madagascar.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full text-xs font-black uppercase tracking-wider shrink-0 shadow-sm">
            <CheckCircle size={14} />
            <span>Serveur Sécurisé Actif</span>
          </div>
        </div>

      </div>

    </section>
  );
}
