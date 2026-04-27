import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, Activity, Wifi } from 'lucide-react';

// Flashing red radar icon for active emergencies
const emergencyIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <div style="position: relative; width: 30px; height: 30px;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(239, 68, 68, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; top: 5px; left: 5px; width: 20px; height: 20px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px #ef4444;"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

function DispatchMapController({ emergencies }) {
  const map = useMap();
  useEffect(() => {
    if (emergencies.length > 0) {
      // Find the most recently added emergency by sorting or just taking the last one
      const latest = emergencies[emergencies.length - 1];
      if (latest && latest.location) {
        map.flyTo([latest.location.lat, latest.location.lng], 14, { animate: true, duration: 1.5 });
      }
    }
  }, [emergencies, map]);
  return null;
}

export default function Dispatch() {
  const [emergencies, setEmergencies] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "active_emergencies"), (snapshot) => {
      setIsConnected(true);
      const active = [];
      snapshot.forEach((doc) => {
        active.push({ id: doc.id, ...doc.data() });
      });
      setEmergencies(active);
    }, (error) => {
      console.error("Dispatch listener error:", error);
      setIsConnected(false);
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: 'white' }}>
      {/* Header */}
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldAlert size={32} color="#ef4444" />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', tracking: 'wide' }}>CENTRAL DISPATCH COMMAND</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isConnected ? '#10b981' : '#ef4444' }}>
            <Wifi className={isConnected ? "animate-pulse" : ""} />
            {isConnected ? "NETWORK SECURE" : "DISCONNECTED"}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
            <Activity color="#ef4444" />
            <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{emergencies.length} ACTIVE ALERTS</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex' }}>
        
        {/* Sidebar Log */}
        <div style={{ width: '350px', backgroundColor: '#1e293b', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '1rem', overflowY: 'auto' }}>
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#94a3b8' }}>INCOMING SIGNALS</h3>
          
          {emergencies.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', marginTop: '2rem', fontStyle: 'italic' }}>No active emergencies</div>
          ) : (
            emergencies.map(em => (
              <div key={em.id} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', animation: 'slide-up 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{em.type}</span>
                  <span style={{ fontSize: '0.75rem', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '1rem' }}>{em.status}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                  <strong>Device:</strong> {em.id}<br/>
                  <strong>Lat:</strong> {em.location?.lat.toFixed(6)}<br/>
                  <strong>Lng:</strong> {em.location?.lng.toFixed(6)}<br/>
                  {em.roomNumber && <><strong style={{ color: '#f59e0b' }}>Room/Office:</strong> <span style={{ color: '#f59e0b' }}>{em.roomNumber}</span><br/></>}
                  {em.medicalNotes && <><strong style={{ color: '#f59e0b' }}>Medical Notes:</strong> <span style={{ color: '#f59e0b' }}>{em.medicalNotes}</span><br/></>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Global Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer 
            center={[40.7128, -74.0060]} // Default NYC
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            {/* Dark mode tiles for HQ vibe */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            />
            <DispatchMapController emergencies={emergencies} />
            
            {emergencies.map(em => {
              if (!em.location) return null;
              return (
                <Marker key={`marker-${em.id}`} position={em.location} icon={emergencyIcon}>
                  <Popup>
                    <div style={{ color: 'black' }}>
                      <strong style={{ color: '#ef4444' }}>CRITICAL SOS ALERT</strong><br/>
                      <strong>Device:</strong> {em.id}<br/>
                      {em.roomNumber && <><strong>Room:</strong> {em.roomNumber}<br/></>}
                      {em.medicalNotes && <><strong>Medical:</strong> {em.medicalNotes}<br/></>}
                      Dispatching units immediately.
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}
