import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Settings, UserPlus, Volume2, VolumeX, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { language, voiceEnabled, contacts, saveSettings, t, logout, userName } = useSettings();
  
  const [localLang, setLocalLang] = useState(language);
  const [localVoice, setLocalVoice] = useState(voiceEnabled);
  const [localContacts, setLocalContacts] = useState(contacts);
  
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [smsHistory, setSmsHistory] = useState([]);

  useEffect(() => {
    try {
      const hist = localStorage.getItem('sms_history');
      if (hist) setSmsHistory(JSON.parse(hist));
    } catch (e) {
      console.error("Failed to parse SMS history", e);
    }
  }, []);

  const addContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      const updated = [...localContacts, { name: newContactName, phone: newContactPhone }];
      setLocalContacts(updated);
      saveSettings(localLang, localVoice, updated);
      setNewContactName('');
      setNewContactPhone('');
    }
  };

  const removeContact = (index) => {
    const updated = localContacts.filter((_, i) => i !== index);
    setLocalContacts(updated);
    saveSettings(localLang, localVoice, updated);
  };

  const handleLangChange = (e) => {
    setLocalLang(e.target.value);
    saveSettings(e.target.value, localVoice, localContacts);
  };

  const handleVoiceToggle = () => {
    const newVal = !localVoice;
    setLocalVoice(newVal);
    saveSettings(localLang, newVal, localContacts);
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      
      {/* Header */}
      <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-darker)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
          <Settings color="var(--accent-blue)" />
          {t('settings')}
        </h2>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Welcome, {userName}. Configure your emergency parameters.
        </p>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        
        {/* Localization & Accessibility */}
        <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.125rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            Localization & Accessibility
          </h3>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('language')}</label>
            <select 
              className="input-field" 
              value={localLang}
              onChange={handleLangChange}
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', appearance: 'none' }}
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{t('voice')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Read instructions aloud</div>
            </div>
            <button 
              onClick={handleVoiceToggle}
              style={{ 
                background: localVoice ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)', 
                border: 'none', padding: '0.5rem', borderRadius: '50%', color: 'white',
                cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              {localVoice ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.125rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            {t('contacts')}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {localContacts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No contacts added. SOS will only alert authorities.</div>
            ) : (
              localContacts.map((contact, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{contact.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{contact.phone}</div>
                  </div>
                  <button onClick={() => removeContact(i)} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            <input type="text" className="input-field" placeholder="Name" value={newContactName} onChange={e => setNewContactName(e.target.value)} style={{ marginBottom: 0 }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="tel" className="input-field" placeholder="Phone (+1...)" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} style={{ marginBottom: 0 }} />
              <button onClick={addContact} className="btn btn-secondary" style={{ padding: '0 1rem' }}>
                <UserPlus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* SMS History Section */}
        <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.125rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            SOS Dispatch History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {smsHistory.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No alerts sent yet.</div>
            ) : (
              smsHistory.map((log, i) => (
                <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '0.5rem', borderLeft: '3px solid var(--primary-red)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'white', fontWeight: 'bold' }}>{log.message}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {log.timestamp} • Delivered to {log.recipients} contact(s)
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', padding: '1rem', color: 'var(--primary-red)' }}>
          Logout / Exit Profile
        </button>
      </div>
    </div>
  );
}
