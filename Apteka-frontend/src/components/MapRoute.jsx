import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { Navigation, Clock, MapPin, Trophy } from 'lucide-react';

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '16px' };
const defaultCenter = { lat: -18.913, lng: 47.525 };

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function MapRoute({ pharmacies, stocks, patientLocation, onPatientLocationChange }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY });
  const [directions, setDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedPharma, setSelectedPharma] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapType, setMapType] = useState('roadmap');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          if (onPatientLocationChange) {
            onPatientLocationChange(loc);
          }
        },
        (error) => {
          console.warn("Could not retrieve user location via geolocation: ", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [onPatientLocationChange]);

  const centerToUse = patientLocation || defaultCenter;

  const nearestPharmacy = useMemo(() => {
    if (!patientLocation || !pharmacies?.length) return null;
    let nearest = null; let minDist = Infinity;
    for (const pharma of pharmacies) {
      if (!pharma.latitude) continue;
      const dist = haversineDistanceKm(patientLocation.lat, patientLocation.lng, pharma.latitude, pharma.longitude);
      if (dist < minDist) { minDist = dist; nearest = pharma; }
    }
    return nearest ? { ...nearest, _dist: minDist } : null;
  }, [patientLocation, pharmacies]);

  useEffect(() => {
    if (!isLoaded || !window.google || !patientLocation || !selectedPharma) return setDirections(null);
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      { origin: patientLocation, destination: { lat: selectedPharma.latitude, lng: selectedPharma.longitude }, travelMode: 'DRIVING' },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          const leg = result.routes[0].legs[0];
          setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text });
        }
      }
    );
  }, [isLoaded, patientLocation, selectedPharma]);

  useEffect(() => {
    if (nearestPharmacy) setSelectedPharma(nearestPharmacy);
  }, [nearestPharmacy]);

  const onLoad = useCallback(function callback(map) { setMapInstance(map); }, []);
  const onUnmount = useCallback(function callback(map) { setMapInstance(null); }, []);

  if (!isLoaded) return <div className="w-full h-[550px] rounded-2xl bg-gray-100 animate-pulse" />;

  return (
    <div className="relative w-full h-[550px] rounded-2xl overflow-hidden border border-emerald-100 shadow-sm">
      {routeInfo && selectedPharma && (
        <div className="absolute top-4 left-4 z-[10] p-4 bg-white/95 backdrop-blur-md rounded-xl shadow-xl flex flex-col gap-2 max-w-xs">
          <span className="text-xs font-semibold uppercase text-emerald-600 flex items-center gap-1.5"><Navigation size={14} /> Itinéraire Trouvé</span>
          {nearestPharmacy?.id === selectedPharma.id && <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit flex items-center gap-1"><Trophy size={11} /> Recommandée</span>}
          <h4 className="text-sm font-bold text-gray-900">{selectedPharma.name}</h4>
          <div className="flex gap-4 mt-2"><div className="text-xs">Distance : <b>{routeInfo.distance}</b></div><div className="text-xs">Temps : <b>{routeInfo.duration}</b></div></div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-[10] flex gap-2">
        <button
          type="button"
          onClick={() => setMapType(mapType === 'hybrid' ? 'roadmap' : 'hybrid')}
          className="px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 text-xs font-extrabold text-gray-800 hover:bg-gray-100 transition-all cursor-pointer flex items-center gap-1.5"
        >
          {mapType === 'hybrid' ? '🌍 Mode Plan' : '🛰️ Mode Satellite'}
        </button>
      </div>

      <GoogleMap mapContainerStyle={mapContainerStyle} center={centerToUse} zoom={14} onLoad={onLoad} onUnmount={onUnmount} mapTypeId={mapType} options={{ streetViewControl: false, mapTypeControl: false }}>
        {patientLocation && (
          <Marker position={patientLocation} draggable={true} onDragEnd={(e) => onPatientLocationChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
            icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }} />
        )}

        {pharmacies?.map(pharma => {
          const hasStock = stocks?.some(s => s.pharmacieId === pharma.id && s.quantite > 0);
          const isNearest = nearestPharmacy?.id === pharma.id;
          let iconUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
          if (isNearest) iconUrl = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
          else if (!hasStock) iconUrl = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

          return (
            <Marker key={pharma.id} position={{ lat: pharma.latitude, lng: pharma.longitude }} icon={{ url: iconUrl }} onClick={() => setSelectedPharma(pharma)}>
              {selectedPharma?.id === pharma.id && (
                <InfoWindow onCloseClick={() => setSelectedPharma(null)}>
                  <div className="p-2 text-xs">
                    <b className="text-sm">{pharma.name}</b><br/>{pharma.zone}<br/>
                    {hasStock && <span className="text-emerald-600 font-bold mt-1 block">En Stock</span>}
                    <button onClick={() => setSelectedPharma(pharma)} className="mt-2 bg-emerald-500 text-white px-3 py-1 rounded w-full">Y aller</button>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })}
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#10b981', strokeWeight: 5 } }} />}
      </GoogleMap>
    </div>
  );
}