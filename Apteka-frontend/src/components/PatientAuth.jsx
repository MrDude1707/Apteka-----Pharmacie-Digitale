import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Phone, MapPin, Building, ShieldCheck, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { API_URL } from '../config';

export default function PatientAuth({ onLoginSuccess, onToggleRegister, initialView = 'login', medecins = [], preselectedDoctorId = null }) {
  const [view, setView] = useState(initialView); // 'login', 'register', 'otp'
  const [role, setRole] = useState('PATIENT'); // 'PATIENT', 'MEDECIN', 'PHARMACIEN'
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('Analakely');
  const [pharmacieId, setPharmacieId] = useState('');

  // Choix "suivi par un médecin" (PATIENT uniquement)
  const [wantsMedecin, setWantsMedecin] = useState(!!preselectedDoctorId);
  const [medecinChoisiId, setMedecinChoisiId] = useState(preselectedDoctorId || '');

  // Se synchronise quand le parent (LandingPage) change explicitement de vue
  // (ex: clic sur "Se connecter" dans le menu du haut)
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  // Si la page d'accueil transmet un nouveau médecin présélectionné (clic sur une carte
  // dans le scroll horizontal), on synchronise l'état interne du formulaire.
  useEffect(() => {
    if (preselectedDoctorId) {
      setRole('PATIENT');
      setWantsMedecin(true);
      setMedecinChoisiId(preselectedDoctorId);
      setView('register');
    }
  }, [preselectedDoctorId]);
  
  // OTP Verification States
  const [userIdForOtp, setUserIdForOtp] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Mot de passe oublié
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  
  // Public Data
  const [pharmacies, setPharmacies] = useState([]);
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger la liste des pharmacies pour le sélecteur du Pharmacien
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/pharmacies`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setPharmacies(data);
          if (data.length > 0) setPharmacieId(data[0].id);
        }
      } catch (err) {
        console.error("Erreur de chargement des pharmacies:", err);
      }
    };
    fetchPharmacies();
  }, []);

  // Décompte pour empêcher de spammer le renvoi d'OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresOtp) {
          // Si le patient s'est inscrit mais n'a pas validé son OTP
          setUserIdForOtp(data.userId);
          setView('otp');
          setError(data.error);
        } else {
          setError(data.error || "Une erreur est survenue lors de la connexion.");
        }
      } else {
        setMessage(data.message);
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError("Impossible de contacter l'API. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const payload = {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      zone: role === 'MEDECIN' ? zone : null,
      pharmacieId: role === 'PHARMACIEN' ? pharmacieId : null,
      wantsMedecin: role === 'PATIENT' ? wantsMedecin : false,
      medecinChoisiId: role === 'PATIENT' && wantsMedecin ? (medecinChoisiId || null) : null
    };

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'inscription.");
      } else {
        setMessage(data.message);
        if (data.requiresOtp) {
          setUserIdForOtp(data.userId);
          setView('otp');
        } else {
          setView('login');
        }
      }
    } catch (err) {
      setError("Erreur réseau lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdForOtp, code: otpCode })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Code invalide.");
      } else {
        setMessage(data.message);
        setView('login');
        // Reset form
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdForOtp })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Impossible de renvoyer le code.");
      } else {
        setMessage(data.message);
        setResendCooldown(60);
      }
    } catch (err) {
      setError("Erreur réseau lors du renvoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
      } else {
        setMessage(data.message);
        if (data.userId) {
          setResetUserId(data.userId);
          setView('reset');
        }
      }
    } catch (err) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== newPasswordConfirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUserId, code: resetCode, newPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Code invalide ou expiré.");
      } else {
        setMessage(data.message);
        setView('login');
        setPassword('');
        setNewPassword('');
        setNewPasswordConfirm('');
        setResetCode('');
      }
    } catch (err) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-8 p-8 rounded-2xl bg-white shadow-appleCard border border-apple-border/30">
      
      {/* Messages d'erreur et d'info */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex items-center gap-2">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100 flex items-center gap-2">
          <span>🟢</span>
          <p>{message}</p>
        </div>
      )}

      {/* 1. ÉCRAN CONNEXION */}
      {view === 'login' && (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-apple-blue">Accès Portail</span>
            <h2 className="text-2xl font-bold tracking-tight text-apple-dark mt-1">Heureux de vous revoir</h2>
            <p className="text-xs text-apple-charcoal mt-1.5">Connectez-vous pour accéder à vos ordonnances et stocks</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-apple-charcoal uppercase tracking-wider">Email Professionnel ou Patient</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.mg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-sm text-apple-dark bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-apple-charcoal uppercase tracking-wider">Mot de passe</label>
                <span
                  onClick={() => { setForgotEmail(email); setView('forgot'); setError(''); setMessage(''); }}
                  className="text-[11px] text-apple-blue hover:underline cursor-pointer font-medium"
                >
                  Mot de passe oublié ?
                </span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-sm text-apple-dark bg-white transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-apple-blue hover:bg-apple-blue/95 text-white font-medium text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="text-center border-t border-apple-border/30 pt-4">
            <p className="text-xs text-apple-charcoal">
              Nouveau sur la plateforme ?{" "}
              <span
                onClick={() => setView('register')}
                className="text-apple-blue hover:underline font-medium cursor-pointer"
              >
                Créer un compte
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 2. ÉCRAN INSCRIPTION */}
      {view === 'register' && (
        <div className="flex flex-col gap-5">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-apple-blue flex items-center justify-center gap-1">
              <Sparkles size={12} />
              Rejoindre le Réseau
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-apple-dark mt-1">Créer un Compte</h2>
            <p className="text-xs text-apple-charcoal mt-1">Choisissez votre profil d'accès ci-dessous</p>
          </div>

          {/* Sélecteur de Rôle (Patient, Médecin, Pharmacien) */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-apple-lightGrey rounded-xl border border-apple-border/30">
            <button
              type="button"
              onClick={() => setRole('PATIENT')}
              className={`py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                role === 'PATIENT' ? 'bg-white text-apple-blue shadow-sm' : 'text-apple-charcoal'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole('MEDECIN')}
              className={`py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                role === 'MEDECIN' ? 'bg-white text-apple-blue shadow-sm' : 'text-apple-charcoal'
              }`}
            >
              Médecin
            </button>
            <button
              type="button"
              onClick={() => setRole('PHARMACIEN')}
              className={`py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                role === 'PHARMACIEN' ? 'bg-white text-apple-blue shadow-sm' : 'text-apple-charcoal'
              }`}
            >
              Pharmacien
            </button>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Jean"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs text-apple-dark bg-white transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Nom de famille</label>
                <input
                  type="text"
                  required
                  placeholder="Rabe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs text-apple-dark bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Email officiel</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.mg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs text-apple-dark bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs text-apple-dark bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Numéro de téléphone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                <input
                  type="text"
                  required
                  placeholder="+261 34 00 000 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs text-apple-dark bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Champs conditionnels selon le Rôle */}
            {role === 'MEDECIN' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Zone d'exercice à Antananarivo</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs text-apple-dark bg-white transition-all duration-200"
                  >
                    <option value="Analakely">Analakely / Centre</option>
                    <option value="Ivato">Ivato / Aéroport</option>
                    <option value="Ambohibao">Ambohibao / Nord</option>
                    <option value="Itaosy">Itaosy / Ouest</option>
                    <option value="Ambohimangakely">Ambohimangakely / Est</option>
                    <option value="Andoharanofotsy">Andoharanofotsy / Sud</option>
                  </select>
                </div>
              </div>
            )}

            {role === 'PHARMACIEN' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Sélectionnez votre Officine (parmi les 114 officielles)</label>
                <div className="relative">
                  <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                  <select
                    value={pharmacieId}
                    onChange={(e) => setPharmacieId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs text-apple-dark bg-white transition-all duration-200"
                  >
                    {pharmacies.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.zone})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Choix "suivi par un médecin" — PATIENT uniquement */}
            {role === 'PATIENT' && (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-apple-lightGrey border border-apple-border/30 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Souhaitez-vous être suivi par un médecin ?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWantsMedecin(true)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                      wantsMedecin ? 'bg-apple-blue text-white border-apple-blue' : 'bg-white text-apple-charcoal border-apple-border/40'
                    }`}
                  >
                    Oui, associer un médecin
                  </button>
                  <button
                    type="button"
                    onClick={() => { setWantsMedecin(false); setMedecinChoisiId(''); }}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                      !wantsMedecin ? 'bg-apple-blue text-white border-apple-blue' : 'bg-white text-apple-charcoal border-apple-border/40'
                    }`}
                  >
                    Non, juste des médicaments
                  </button>
                </div>

                {wantsMedecin && medecins.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Choisissez votre médecin</label>
                    <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {medecins.map(m => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setMedecinChoisiId(m.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-all duration-200 ${
                            medecinChoisiId === m.id ? 'bg-apple-blue/10 border-apple-blue text-apple-blue font-semibold' : 'bg-white border-apple-border/40 text-apple-charcoal'
                          }`}
                        >
                          <span>{m.nom}</span>
                          <span className="text-[9px] opacity-70">{m.specialite}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 rounded-xl bg-apple-blue hover:bg-apple-blue/95 text-white font-medium text-xs shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Création du compte..." : "Créer mon compte"}
              <ShieldCheck size={14} />
            </button>
          </form>

          <div className="text-center border-t border-apple-border/30 pt-3">
            <p className="text-xs text-apple-charcoal">
              Déjà inscrit ?{" "}
              <span
                onClick={() => setView('login')}
                className="text-apple-blue hover:underline font-medium cursor-pointer"
              >
                Se connecter
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 3. ÉCRAN VALIDATION OTP PATIENT */}
      {view === 'otp' && (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-apple-blue/10 text-apple-blue flex items-center justify-center mx-auto mb-2">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-apple-dark">Validation OTP</h2>
            <p className="text-xs text-apple-charcoal mt-2 px-2">
              Un email contenant un code de validation à 6 chiffres a été envoyé pour sécuriser votre accès.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider text-center">Saisir le code à 6 chiffres</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center px-4 py-3 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-2xl font-bold tracking-[8px] text-apple-dark bg-white transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-apple-blue hover:bg-apple-blue/95 text-white font-medium text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Activer mon compte"}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* DÉMO ONLY INSTRUCTION */}
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-800 text-[10px] border border-amber-100 flex flex-col gap-1">
            <p className="font-semibold uppercase tracking-wider">💡 Guide d'évaluation Démo</p>
            <p>
              Si vous utilisez les SMTP Mailtrap d'origine sans configuration réelle, le code OTP simulé a été imprimé directement dans la <strong>Console Terminal / Serveur</strong> de l'agent.
            </p>
          </div>

          <div className="text-center flex flex-col gap-2">
            <span
              onClick={handleResendOtp}
              className={`text-xs font-medium ${resendCooldown > 0 || loading ? 'text-apple-charcoal/40 cursor-not-allowed' : 'text-apple-blue hover:underline cursor-pointer'}`}
            >
              {resendCooldown > 0 ? `Renvoyer le code (${resendCooldown}s)` : "Je n'ai pas reçu le code — renvoyer"}
            </span>
            <span
              onClick={() => setView('login')}
              className="text-xs text-apple-charcoal hover:underline hover:text-apple-dark font-medium cursor-pointer"
            >
              Retour à l'écran de connexion
            </span>
          </div>
        </div>
      )}

      {/* 4. ÉCRAN MOT DE PASSE OUBLIÉ (demande du code) */}
      {view === 'forgot' && (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-apple-blue/10 text-apple-blue flex items-center justify-center mx-auto mb-2">
              <Lock size={22} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-apple-dark">Mot de passe oublié</h2>
            <p className="text-xs text-apple-charcoal mt-2 px-2">
              Indiquez votre email, nous vous envoyons un code de réinitialisation.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-apple-charcoal uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.mg"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-sm text-apple-dark bg-white transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-apple-blue hover:bg-apple-blue/95 text-white font-medium text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Recevoir le code"}
              <ArrowRight size={16} />
            </button>
          </form>

          {message && (
            <button
              onClick={() => setView('reset')}
              className="text-xs text-apple-blue hover:underline font-medium cursor-pointer text-center"
            >
              J'ai déjà reçu mon code → saisir le code
            </button>
          )}

          <div className="text-center">
            <span
              onClick={() => setView('login')}
              className="text-xs text-apple-charcoal hover:underline hover:text-apple-dark font-medium cursor-pointer"
            >
              Retour à l'écran de connexion
            </span>
          </div>
        </div>
      )}

      {/* 5. ÉCRAN RÉINITIALISATION (saisie du code + nouveau mot de passe) */}
      {view === 'reset' && (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-apple-blue/10 text-apple-blue flex items-center justify-center mx-auto mb-2">
              <ShieldCheck size={22} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-apple-dark">Nouveau mot de passe</h2>
            <p className="text-xs text-apple-charcoal mt-2 px-2">
              Saisissez le code à 6 chiffres reçu par email, puis votre nouveau mot de passe.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider text-center">Code reçu par email</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center px-4 py-3 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-2xl font-bold tracking-[8px] text-apple-dark bg-white transition-all duration-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-apple-charcoal uppercase tracking-wider">Nouveau mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-sm text-apple-dark bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-apple-charcoal uppercase tracking-wider">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-sm text-apple-dark bg-white transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-apple-blue hover:bg-apple-blue/95 text-white font-medium text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              <ShieldCheck size={16} />
            </button>
          </form>

          <div className="text-center">
            <span
              onClick={() => setView('login')}
              className="text-xs text-apple-charcoal hover:underline hover:text-apple-dark font-medium cursor-pointer"
            >
              Retour à l'écran de connexion
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
