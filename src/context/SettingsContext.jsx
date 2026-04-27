import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const translations = {
  en: {
    sos: 'SOS EMERGENCY',
    cancelSOS: 'Cancel Emergency',
    evacuation: 'Evacuation',
    guidance: 'Guidance',
    settings: 'Settings',
    home: 'SOS & Map',
    room: 'Room/Office Number (Optional)',
    notes: 'Critical Medical Notes',
    addContact: 'Add Contact',
    contacts: 'Emergency Contacts',
    voice: 'Voice Assistance',
    language: 'Language',
    login: 'Enter Safety Portal'
  },
  hi: {
    sos: 'आपातकालीन (SOS)',
    cancelSOS: 'आपातकाल रद्द करें',
    evacuation: 'निकासी',
    guidance: 'मार्गदर्शन',
    settings: 'सेटिंग्स',
    home: 'एसओएस और नक्शा',
    room: 'कमरा/कार्यालय नंबर (वैकल्पिक)',
    notes: 'महत्वपूर्ण चिकित्सा जानकारी',
    addContact: 'संपर्क जोड़ें',
    contacts: 'आपातकालीन संपर्क',
    voice: 'आवाज़ सहायता',
    language: 'भाषा',
    login: 'पोर्टल दर्ज करें'
  },
  es: {
    sos: 'EMERGENCIA SOS',
    cancelSOS: 'Cancelar Emergencia',
    evacuation: 'Evacuación',
    guidance: 'Orientación',
    settings: 'Ajustes',
    home: 'SOS y Mapa',
    room: 'Número de Habitación',
    notes: 'Notas Médicas Críticas',
    addContact: 'Añadir Contacto',
    contacts: 'Contactos de Emergencia',
    voice: 'Asistencia de Voz',
    language: 'Idioma',
    login: 'Ingresar al Portal'
  },
  mr: {
    sos: 'आणीबाणी (SOS)',
    cancelSOS: 'आणीबाणी रद्द करा',
    evacuation: 'बाहेर पडा',
    guidance: 'मार्गदर्शन',
    settings: 'सेटिंग्ज',
    home: 'एसओएस आणि नकाशा',
    room: 'खोली क्रमांक',
    notes: 'वैद्यकीय नोंदी',
    addContact: 'संपर्क जोडा',
    contacts: 'आणीबाणी संपर्क',
    voice: 'आवाज सहाय्य',
    language: 'भाषा',
    login: 'पोर्टल प्रविष्ट करा'
  },
  bn: {
    sos: 'জরুরী (SOS)',
    cancelSOS: 'জরুরী বাতিল করুন',
    evacuation: 'উদ্ধার',
    guidance: 'নির্দেশনা',
    settings: 'সেটিংস',
    home: 'এসওএস এবং মানচিত্র',
    room: 'রুম নম্বর',
    notes: 'মেডিকেল নোট',
    addContact: 'যোগাযোগ যোগ করুন',
    contacts: 'জরুরী যোগাযোগ',
    voice: 'ভয়েস সহায়তা',
    language: 'ভাষা',
    login: 'পোর্টালে প্রবেশ করুন'
  },
  te: {
    sos: 'అత్యవసరం (SOS)',
    cancelSOS: 'అత్యవసరాన్ని రద్దు చేయండి',
    evacuation: 'తరలింపు',
    guidance: 'మార్గదర్శకత్వం',
    settings: 'సెట్టింగులు',
    home: 'SOS & మ్యాప్',
    room: 'గది సంఖ్య',
    notes: 'వైద్య గమనికలు',
    addContact: 'పరిచయాన్ని జోడించండి',
    contacts: 'అత్యవసర పరిచయాలు',
    voice: 'వాయిస్ సహాయం',
    language: 'భాష',
    login: 'పోర్టల్ నమోదు చేయండి'
  },
  ta: {
    sos: 'அவசரம் (SOS)',
    cancelSOS: 'ரத்து செய்',
    evacuation: 'வெளியேற்றம்',
    guidance: 'வழிகாட்டுதல்',
    settings: 'அமைப்புகள்',
    home: 'SOS & வரைபடம்',
    room: 'அறை எண்',
    notes: 'மருத்துவ குறிப்புகள்',
    addContact: 'தொடர்பைச் சேர்',
    contacts: 'அவசர தொடர்புகள்',
    voice: 'குரல் உதவி',
    language: 'மொழி',
    login: 'உள்நுழைய'
  },
  gu: {
    sos: 'કટોકટી (SOS)',
    cancelSOS: 'કટોકટી રદ કરો',
    evacuation: 'ખાલી કરાવવું',
    guidance: 'માર્ગદર્શન',
    settings: 'સેટિંગ્સ',
    home: 'SOS અને નકશો',
    room: 'રૂમ નંબર',
    notes: 'તબીબી નોંધો',
    addContact: 'સંપર્ક ઉમેરો',
    contacts: 'કટોકટી સંપર્કો',
    voice: 'વૉઇસ સહાય',
    language: 'ભાષા',
    login: 'પ્રવેશ કરો'
  }
};

export function SettingsProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [language, setLanguage] = useState('en');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [contacts, setContacts] = useState([]);

  // Load from local storage
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setIsLoggedIn(true);
      setUserName(savedName);
      setLanguage(localStorage.getItem('language') || 'en');
      setVoiceEnabled(localStorage.getItem('voiceEnabled') !== 'false');
      const savedContacts = localStorage.getItem('contacts');
      if (savedContacts) setContacts(JSON.parse(savedContacts));
    }
  }, []);

  const login = (name, lang) => {
    setIsLoggedIn(true);
    setUserName(name);
    setLanguage(lang);
    localStorage.setItem('userName', name);
    localStorage.setItem('language', lang);
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('userName');
  };

  const saveSettings = (lang, voice, newContacts) => {
    setLanguage(lang);
    setVoiceEnabled(voice);
    setContacts(newContacts);
    localStorage.setItem('language', lang);
    localStorage.setItem('voiceEnabled', voice);
    localStorage.setItem('contacts', JSON.stringify(newContacts));
  };

  const t = (key) => {
    return translations[language][key] || translations['en'][key];
  };

  const speak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select voice based on language
    const voices = window.speechSynthesis.getVoices();
    if (language === 'hi') {
      const hiVoice = voices.find(v => v.lang.includes('hi'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else if (language === 'es') {
      const esVoice = voices.find(v => v.lang.includes('es'));
      if (esVoice) utterance.voice = esVoice;
      utterance.lang = 'es-ES';
    } else {
      utterance.lang = 'en-US';
    }
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <SettingsContext.Provider value={{
      isLoggedIn, login, logout,
      userName,
      language, voiceEnabled, contacts,
      saveSettings,
      t, speak
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
