import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Login() {
  const { login } = useSettings();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (name.trim() && phone.trim() && password.trim()) {
      setLoading(true);
      try {
        // Save user to Firestore 'users' collection (using phone as ID for simplicity)
        await setDoc(doc(db, "users", phone), {
          name,
          phone,
          password, // In a real app, never store plaintext. This is for hackathon PoC.
          preferredLanguage: lang,
          createdAt: serverTimestamp()
        }, { merge: true });
        
        login(name, lang);
        navigate('/');
      } catch (err) {
        console.error("Failed to save user:", err);
        alert("Database connection failed, but logging you in locally.");
        login(name, lang);
        navigate('/');
      }
      setLoading(false);
    }
  };

  const handleGuest = () => {
    login("Guest User", lang);
    navigate('/');
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)', padding: '2rem' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem', animation: 'slide-up 0.5s ease-out' }}>
        <ShieldAlert size={80} color="var(--primary-red)" style={{ marginBottom: '1rem', animation: 'pulse-red 3s infinite', borderRadius: '50%' }} />
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>SafeSync</h1>
        <p style={{ color: 'var(--text-muted)' }}>Next-Gen Emergency Response</p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', animation: 'fade-in 0.8s ease-out' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Full Name</label>
            <input 
              type="text" 
              required
              className="input-field" 
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginBottom: 0, marginTop: '0.5rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mobile Number</label>
            <input 
              type="tel" 
              required
              className="input-field" 
              placeholder="e.g. +91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ marginBottom: 0, marginTop: '0.5rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              required
              className="input-field" 
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: 0, marginTop: '0.5rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Preferred Language / प्राधान्यकृत भाषा</label>
            <select 
              className="input-field" 
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{ marginBottom: 0, marginTop: '0.5rem', appearance: 'none', backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="es">Español (Spanish)</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '1rem', marginTop: '1rem', fontSize: '1.125rem' }}
          >
            {loading ? 'Creating Secure Profile...' : 'Create Profile & Enter'}
          </button>
          
          <button 
            type="button" 
            onClick={handleGuest}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}
          >
            Continue as Guest
          </button>
        </form>
      </div>

      <div style={{ marginTop: '3rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
        Hospitality Sector Ready • GDPR Compliant • Cloud Synced
      </div>
    </div>
  );
}
