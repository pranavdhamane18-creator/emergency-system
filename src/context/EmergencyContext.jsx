import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { fetchOSRMRoute } from '../utils/routing';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const EmergencyContext = createContext();

export function useEmergency() {
  return useContext(EmergencyContext);
}

// Generate a random ID for this device session
const DEVICE_ID = Math.random().toString(36).substring(2, 15);

export function EmergencyProvider({ children }) {
  const [appState, setAppState] = useState('NORMAL'); // 'NORMAL', 'WARNING', 'EMERGENCY'
  const [activeWarning, setActiveWarning] = useState(null); // specific hazard info
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [sosActive, setSosActive] = useState(false);
  const [alerts, setAlerts] = useState([]);
  
  const [responder, setResponder] = useState(null); 
  const [responderRoute, setResponderRoute] = useState([]); 

  // Hospitality Feature: Guest Profile
  const [userProfile, setUserProfile] = useState({
    roomNumber: '',
    medicalNotes: ''
  });

  const responderIntervalRef = useRef(null);

  const triggerSOS = async () => {
    if (sosActive) return;
    
    setAppState('EMERGENCY');
    setSosActive(true);
    setAlerts(['Emergency detected', 'Syncing to global dispatch network...']);

    // Send real-time SOS to Firebase Dispatch Center
    if (userLocation) {
      try {
        await setDoc(doc(db, "active_emergencies", DEVICE_ID), {
          location: userLocation,
          timestamp: serverTimestamp(),
          status: 'CRITICAL',
          type: 'General Emergency',
          device_id: DEVICE_ID,
          roomNumber: userProfile.roomNumber,
          medicalNotes: userProfile.medicalNotes
        });
        setAlerts(prev => [...prev, 'Dispatch received signal!']);
      } catch (e) {
        console.error("Firebase sync failed:", e);
      }
    }

    // Trigger Automatic SMS API Alert and open Native SMS App
    if (userLocation) {
       const message = `SOS! I need immediate assistance. My location is: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}. Room: ${userProfile.roomNumber}. Notes: ${userProfile.medicalNotes}`;
       
       // 1. Open native SMS app with all contacts
       const savedContacts = localStorage.getItem('contacts');
       let phoneNumbers = ['+919022023689']; // Default dispatch
       if (savedContacts) {
         try {
           const parsed = JSON.parse(savedContacts);
           parsed.forEach(c => phoneNumbers.push(c.phone));
         } catch(e) {}
       }
       const smsLink = `sms:${phoneNumbers.join(',')}?body=${encodeURIComponent(message)}`;
       window.open(smsLink, '_blank');

       // Log SMS History
       const currentHistory = JSON.parse(localStorage.getItem('sms_history') || '[]');
       currentHistory.unshift({
         timestamp: new Date().toLocaleString(),
         message: "Emergency SOS Sent",
         recipients: phoneNumbers.length
       });
       localStorage.setItem('sms_history', JSON.stringify(currentHistory.slice(0, 10))); // keep last 10

       // 2. Fallback silent API call
       fetch('https://textbelt.com/text', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           phone: '+919022023689',
           message: message,
           key: 'textbelt',
         })
       }).catch(err => console.error("SMS API Error:", err));
    }

    // Simulate finding responder (Local AI responder)
    setTimeout(async () => {
      setAlerts(prev => [...prev, 'Nearby responder unit dispatched']);
      
      if (userLocation) {
        // Spawn responder closer for quick demo
        const initialResponderLoc = {
          lat: userLocation.lat + 0.003,
          lng: userLocation.lng + 0.003
        };
        
        const route = await fetchOSRMRoute(initialResponderLoc, userLocation);
        setResponderRoute(route);

        setResponder({
          name: "Unit-7 (Paramedic)",
          location: initialResponderLoc,
          distance: 0.5,
          eta: "2 mins",
          hasArrived: false,
          routeIndex: 0
        });
      }
    }, 2000);

    setTimeout(() => {
      setAlerts(prev => [...prev, 'Emergency contacts alerted via SMS']);
    }, 4000);

    setTimeout(() => {
      setAlerts(prev => [...prev, 'Help is approaching your location']);
    }, 5500);
  };

  const cancelSOS = async () => {
    setAppState('NORMAL');
    setSosActive(false);
    setAlerts([]);
    setResponder(null);
    setResponderRoute([]);
    if (responderIntervalRef.current) clearInterval(responderIntervalRef.current);

    // Remove from Firebase Dispatch
    try {
      await deleteDoc(doc(db, "active_emergencies", DEVICE_ID));
    } catch(e) {
      console.error(e);
    }
  };

  // Move responder along the fetched OSRM route path
  useEffect(() => {
    if (responder && !responder.hasArrived && responderRoute.length > 0) {
      responderIntervalRef.current = setInterval(() => {
        setResponder(prev => {
          if (!prev || prev.hasArrived) return prev;

          let nextIndex = prev.routeIndex + 1;
          
          if (nextIndex >= responderRoute.length) {
            clearInterval(responderIntervalRef.current);
            return {
              ...prev,
              location: responderRoute[responderRoute.length - 1],
              distance: 0,
              eta: "Arrived",
              hasArrived: true
            };
          }

          const remainingPoints = responderRoute.length - nextIndex;
          const distanceKm = remainingPoints * 0.01; 
          
          return {
            ...prev,
            location: responderRoute[nextIndex],
            routeIndex: nextIndex,
            distance: distanceKm.toFixed(2),
            eta: remainingPoints > 10 ? '2 mins' : '1 min'
          };
        });
      }, 800); 
    }

    return () => {
      if (responderIntervalRef.current) clearInterval(responderIntervalRef.current);
    };
  }, [responder, responderRoute]);

  // Keep Firebase updated with live user location while SOS is active
  useEffect(() => {
    if (sosActive && userLocation) {
      setDoc(doc(db, "active_emergencies", DEVICE_ID), {
        location: userLocation,
        timestamp: serverTimestamp(),
        status: 'CRITICAL',
        type: 'General Emergency',
        device_id: DEVICE_ID,
        roomNumber: userProfile.roomNumber,
        medicalNotes: userProfile.medicalNotes
      }, { merge: true }).catch(console.error);
    }
  }, [userLocation, sosActive]);

  return (
    <EmergencyContext.Provider value={{
      appState, setAppState,
      activeWarning, setActiveWarning,
      userLocation, setUserLocation,
      sosActive, triggerSOS, cancelSOS,
      alerts, responder, responderRoute,
      userProfile, setUserProfile
    }}>
      {children}
    </EmergencyContext.Provider>
  );
}
