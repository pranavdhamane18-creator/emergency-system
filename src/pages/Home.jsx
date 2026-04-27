import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import LiveMap from '../components/LiveMap';
import { AlertTriangle, X, Navigation, UserCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Home() {
  const { appState, sosActive, triggerSOS, cancelSOS, alerts, responder, activeWarning, userProfile, setUserProfile } = useEmergency();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Map Container - fills available space */}
      <div style={{ flex: 1, minHeight: '350px', position: 'relative' }}>
        <LiveMap />
        
        {/* Warning Banner overlay */}
        {appState === 'WARNING' && (
          <div style={{ 
            position: 'absolute', top: 10, left: 10, right: 10, zIndex: 1000, 
            background: 'rgba(245, 158, 11, 0.9)', color: 'white', padding: '10px 15px', 
            borderRadius: '0.5rem', fontWeight: 'bold', display: 'flex', 
            alignItems: 'center', gap: '10px', backdropFilter: 'blur(4px)', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
          }}>
            <AlertTriangle className="animate-pulse" />
            WARNING: Approaching {activeWarning ? activeWarning.name : 'Risk Zone'}
          </div>
        )}
      </div>

      {/* SOS Panel - fixed at bottom of screen content */}
      <div style={{
        padding: '1.5rem',
        background: 'var(--bg-darker)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        zIndex: 1000,
        position: 'relative'
      }}>
        
        {/* Responder Status Card */}
        {responder && (
          <div className="card" style={{ marginBottom: '1rem', background: responder.hasArrived ? 'var(--accent-green)' : 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>{responder.name}</h4>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  {responder.hasArrived ? 'Responder has arrived' : `ETA: ${responder.eta} (${responder.distance}km)`}
                </div>
              </div>
              {!responder.hasArrived && <Navigation className="animate-pulse" size={24} />}
            </div>
          </div>
        )}

        {/* SOS Alerts Log */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {alerts.map((msg, i) => (
              <div key={i} style={{ 
                fontSize: '0.875rem', 
                color: i === alerts.length - 1 ? 'white' : 'var(--text-muted)',
                animation: 'fade-in 0.5s ease-out'
              }}>
                • {msg}
              </div>
            ))}
          </div>
        )}

        {/* Hospitality Guest Profile */}
        <div className="glass-panel" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
          <div 
            onClick={() => setShowProfile(!showProfile)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
              <UserCircle size={18} color="var(--accent-blue)" />
              Digital Safety Profile
            </div>
            {showProfile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          
          {showProfile && (
            <div style={{ marginTop: '1rem', animation: 'fade-in 0.3s ease-out' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room/Office Number (Optional)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Room 402"
                value={userProfile.roomNumber}
                onChange={(e) => setUserProfile({...userProfile, roomNumber: e.target.value})}
              />
              
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Critical Medical Notes</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Diabetic, Asthma, Wheelchair"
                value={userProfile.medicalNotes}
                onChange={(e) => setUserProfile({...userProfile, medicalNotes: e.target.value})}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', textAlign: 'center' }}>
                Profile will be securely transmitted to Dispatch upon SOS.
              </div>
            </div>
          )}
        </div>

        {/* Big Action Button */}
        {!sosActive ? (
          <div className="sos-radar-container">
            <div className="radar-ping"></div>
            <div className="radar-ping radar-ping-2"></div>
            <button 
              className="sos-button-front"
              onClick={triggerSOS}
            >
              <AlertTriangle size={32} />
              SOS EMERGENCY
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-secondary"
            onClick={cancelSOS}
            style={{ width: '100%', padding: '1rem', borderRadius: '1rem' }}
          >
            <X size={20} />
            Cancel Emergency
          </button>
        )}
      </div>
    </div>
  );
}
