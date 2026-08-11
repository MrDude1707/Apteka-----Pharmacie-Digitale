import React from 'react';
import QRCode from 'react-qr-code';
import { ShieldCheck, Calendar, MapPin, Phone, Mail, Award, FileText, User } from 'lucide-react';

export default function PrescriptionPreview({ 
  doctor = {}, 
  patient = null, 
  items = [], 
  code = "", 
  date = "", 
  signed = false 
}) {
  const currentDateStr = date || new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div 
      id="print-prescription"
      className="w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 relative overflow-hidden transition-all duration-500 flex flex-col justify-between"
      style={{
        aspectRatio: '1/1.414', // A4 Aspect Ratio
        background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #fafdfb 100%)',
      }}
    >
      {/* Discreet Medical Cross Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500">
          <path d="M19 10.5h-5.5V4.5c0-.83-.67-1.5-1.5-1.5h-1c-.83 0-1.5.67-1.5 1.5v5.5H4.5c-.83 0-1.5.67-1.5 1.5v1c0 .83.67 1.5 1.5 1.5h5.5V19.5c0 .83.67 1.5 1.5 1.5h1c.83 0 1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5v-1c0-.83-.67-1.5-1.5-1.5z" />
        </svg>
      </div>

      {/* Top Header Grid */}
      <div>
        <div className="flex justify-between items-start border-b border-emerald-500/10 pb-6">
          {/* Doctor / Clinic Information */}
          <div className="flex flex-col gap-1.5 text-left max-w-[65%]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <Award size={16} />
              </span>
              <h4 className="text-base font-black text-gray-900 leading-tight">
                Dr. {doctor.lastName || "Jean Razafy"}
              </h4>
            </div>
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider pl-9">
              {doctor.specialite || "Médecin conventionné - Analakely"}
            </p>
            <div className="text-[10px] text-gray-400 font-semibold pl-9 flex flex-col gap-0.5 mt-1">
              <span className="flex items-center gap-1"><MapPin size={10} /> Cabinet Analakely, Antananarivo 101</span>
              <span className="flex items-center gap-1"><Phone size={10} /> Tél : +261 20 22 345 67</span>
              <span className="flex items-center gap-1"><Mail size={10} /> {doctor.email || "dr.razafy@pharma.mg"}</span>
            </div>
          </div>

          {/* Logo / Brand Watermark */}
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 rounded-full">
              APTEKA DIGITAL
            </span>
            <span className="text-[9px] text-gray-400 font-semibold mt-1">
              Plateforme Agrée - Ministère de la Santé
            </span>
          </div>
        </div>

        {/* Patient and Date Header */}
        <div className="grid grid-cols-2 gap-4 my-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 text-left">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <User size={10} /> Patient Référent
            </span>
            {patient ? (
              <>
                <h5 className="text-xs font-extrabold text-gray-900 mt-1">
                  {patient.firstName} {patient.lastName}
                </h5>
                <span className="text-[10px] text-gray-500 font-medium">
                  {patient.email}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic mt-1">
                Aucun patient sélectionné
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 items-end justify-between text-right">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                <Calendar size={10} /> Date d'Émission
              </span>
              <span className="text-xs font-bold text-gray-800 mt-1">
                {currentDateStr}
              </span>
            </div>
            {code && (
              <span className="font-mono text-emerald-600 font-black text-xs bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded">
                Code: {code}
              </span>
            )}
          </div>
        </div>

        {/* Rx Symbol & Medication Body */}
        <div className="flex flex-col items-start gap-4">
          <span className="text-3xl font-serif font-extrabold text-emerald-600 tracking-tight">
            R<span className="text-xl font-sans font-light text-gray-400">x</span>
          </span>

          <div className="w-full flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl gap-2">
                <FileText size={24} className="text-gray-300" />
                <span className="text-xs text-gray-400 font-semibold italic">
                  Aucun médicament ajouté à l'ordonnance
                </span>
              </div>
            ) : (
              items.map((item, index) => (
                <div 
                  key={index} 
                  className="w-full flex justify-between items-start py-3 px-4 bg-white hover:bg-emerald-50/20 border border-gray-100 rounded-xl transition-colors duration-200 text-left"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-emerald-600 font-bold">
                        {index + 1}.
                      </span>
                      <b className="text-xs font-extrabold text-gray-900 leading-tight">
                        {item.nom}
                      </b>
                      {item.dosage && (
                        <span className="text-[10px] text-gray-500 font-medium">
                          ({item.dosage})
                        </span>
                      )}
                    </div>
                    {item.posologie && (
                      <p className="text-[10px] text-gray-500 font-medium pl-4">
                        Posologie : {item.posologie}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Qte: {item.quantite} bte(s)
                    </span>
                    {item.duree && (
                      <span className="text-[9px] font-bold text-gray-400">
                        Durée : {item.duree}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Signature and Verification Footer */}
      <div className="border-t border-gray-100 pt-6 mt-6 flex justify-between items-end relative min-h-[100px]">
        {/* Verification QR Code (Task 2: Cachet / QR code de vérification) */}
        <div className="flex items-center gap-3 text-left">
          {code ? (
            <div className="p-1.5 bg-white border border-gray-100 rounded-xl shadow-inner shrink-0">
              <QRCode 
                value={`https://apteka-digitale.site/verify/${code}`} 
                size={54}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
          ) : (
            <div className="w-[54px] h-[54px] bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[8px] text-gray-300 font-bold text-center">QR Code</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-500" /> Sécurité Blockchain
            </span>
            <p className="text-[9px] text-gray-400 leading-normal max-w-[170px] font-semibold">
              Ordonnance signée numériquement et certifiée par cryptographie. Flashez pour authentifier l'officine.
            </p>
          </div>
        </div>

        {/* Animated Digital Stamp / Seal */}
        <div className="flex flex-col items-center justify-center relative w-36 h-24">
          {signed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center border-3 border-emerald-500/80 rounded-full digital-seal-stamped text-emerald-600/95 uppercase p-2 font-black tracking-tight select-none">
              <div className="text-[8px] font-black tracking-widest">DR. {doctor.lastName ? doctor.lastName.toUpperCase() : "RAZAFY"}</div>
              <div className="text-[10px] font-extrabold my-0.5 flex items-center gap-0.5 justify-center"><ShieldCheck size={10}/> SIGNE</div>
              <div className="text-[7px] tracking-wide opacity-80 font-bold">APTEKA OFFICIEL</div>
              <div className="text-[6px] font-mono mt-0.5 leading-none opacity-60">
                {code || "ORD-PENDING"}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-gray-300 italic font-semibold border border-dashed border-gray-200 rounded-xl w-full h-full flex items-center justify-center">
              En attente de signature
            </div>
          )}
        </div>
      </div>
    </div>
  );
}