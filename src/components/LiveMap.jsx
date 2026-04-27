import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEmergency } from '../context/EmergencyContext';
import { calculateDistance } from '../utils/distance';
import { fetchOSRMRoute } from '../utils/routing';

const createCustomIcon = (color, label = '') => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">${label}</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const userIcon = createCustomIcon('#3b82f6'); // Blue User
const responderIcon = createCustomIcon('#10b981', '+'); // Green cross
const hospitalIcon = createCustomIcon('#6366f1', 'H'); // Indigo Hospital
const policeIcon = createCustomIcon('#3b82f6', 'P'); // Blue Police

const RISK_ZONES = [
  { id: 1, latOffset: 0.005, lngOffset: 0.005, radius: 100, name: 'Accident Prone Area', icon: createCustomIcon('#f59e0b', '⚠️') },
  { id: 2, latOffset: -0.008, lngOffset: 0.002, radius: 100, name: 'Road Work Ahead', icon: createCustomIcon('#f59e0b', '🚧') },
  { id: 3, latOffset: 0.003, lngOffset: -0.008, radius: 100, name: 'Dangerous Blind Turn', icon: createCustomIcon('#f59e0b', '🔄') },
];

function MapController({ center, simulating }) {
  const map = useMap();
  useEffect(() => {
    if (center && simulating) {
      map.setView(center, map.getZoom(), { animate: true });
    } else if (center && !simulating && map.getZoom() < 10) {
      map.setView(center, 14);
    }
  }, [center, simulating, map]);
  return null;
}

export default function LiveMap() {
  const { userLocation, setUserLocation, appState, setAppState, activeWarning, setActiveWarning, responder, responderRoute } = useEmergency();
  const [riskZones, setRiskZones] = useState([]);
  const [services, setServices] = useState([]);
  const [fetchingServices, setFetchingServices] = useState(false);
  
  const [simulating, setSimulating] = useState(false);
  const [simInterval, setSimInterval] = useState(null);
  const [userRoute, setUserRoute] = useState([]);

  // Fetch REAL world hospitals and police stations using Overpass API
  const fetchRealEmergencyServices = async (lat, lng) => {
    setFetchingServices(true);
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:5000, ${lat}, ${lng});
        node["amenity"="police"](around:5000, ${lat}, ${lng});
      );
      out body 5;
    `;
    try {
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      const realServices = data.elements.map(el => ({
        id: el.id,
        lat: el.lat,
        lng: el.lon, 
        name: el.tags.name || (el.tags.amenity === 'police' ? 'Local Police Station' : 'Local Hospital'),
        type: el.tags.amenity
      }));
      setServices(realServices);
    } catch(e) {
      console.error("Failed to fetch real emergency services", e);
    } finally {
      setFetchingServices(false);
    }
  };

  useEffect(() => {
    let watchId;
    let fallbackTimer;

    const setupMapData = (loc) => {
      setUserLocation(loc);
      if (riskZones.length === 0) {
        setRiskZones(RISK_ZONES.map(z => ({
          ...z,
          lat: loc.lat + z.latOffset,
          lng: loc.lng + z.lngOffset
        })));
      }
      if (services.length === 0 && !fetchingServices) {
        fetchRealEmergencyServices(loc.lat, loc.lng);
      }
    };

    const applyFallback = () => {
      if (!simulating) {
        // Fallback to London coordinates to ensure some data is found via Overpass
        const defaultLoc = { lat: 51.5074, lng: -0.1278 }; 
        setupMapData(defaultLoc);
      }
    };

    if (navigator.geolocation) {
      fallbackTimer = setTimeout(() => {
        if (!userLocation) applyFallback();
      }, 3000);

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          clearTimeout(fallbackTimer);
          if (!simulating) {
            setupMapData({ lat: position.coords.latitude, lng: position.coords.longitude });
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          clearTimeout(fallbackTimer);
          if (!userLocation) applyFallback();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
      
      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        clearTimeout(fallbackTimer);
      };
    } else {
      if (!userLocation) applyFallback();
    }
  }, [simulating, riskZones.length, services.length, setUserLocation, userLocation, fetchingServices]);

  useEffect(() => {
    if (!userLocation || riskZones.length === 0 || appState === 'EMERGENCY') return;

    let inDangerZone = null;
    for (const zone of riskZones) {
      const distKm = calculateDistance(userLocation.lat, userLocation.lng, zone.lat, zone.lng);
      if (distKm * 1000 < zone.radius) {
        inDangerZone = zone;
        break;
      }
    }

    if (inDangerZone && appState === 'NORMAL') {
      setActiveWarning(inDangerZone);
      setAppState('WARNING');
    } else if (!inDangerZone && appState === 'WARNING') {
      setActiveWarning(null);
      setAppState('NORMAL');
    }
  }, [userLocation, riskZones, appState, setAppState, setActiveWarning]);

  const toggleSimulation = async () => {
    if (simulating) {
      setSimulating(false);
      setUserRoute([]);
      clearInterval(simInterval);
    } else {
      if (!userLocation || riskZones.length === 0) return;
      
      // Target a random risk zone for simulation variety
      const target = riskZones[Math.floor(Math.random() * riskZones.length)];
      const routePoints = await fetchOSRMRoute(userLocation, target);
      setUserRoute(routePoints);
      setSimulating(true);

      // Overwrite risk zones to lie EXACTLY on the fetched road to guarantee an alert trigger
      if (routePoints.length > 10) {
        const p1 = routePoints[Math.floor(routePoints.length * 0.4)];
        const p2 = routePoints[Math.floor(routePoints.length * 0.8)];
        setRiskZones([
          { id: 1, lat: p1.lat, lng: p1.lng, radius: 50, name: 'Accident Prone Area', icon: createCustomIcon('#f59e0b', '⚠️') },
          { id: 2, lat: p2.lat, lng: p2.lng, radius: 50, name: 'Road Work Ahead', icon: createCustomIcon('#f59e0b', '🚧') }
        ]);
      }
      
      let stepIndex = 0;
      
      const interval = setInterval(() => {
        if (stepIndex >= routePoints.length) {
          clearInterval(interval);
          setSimulating(false);
          return;
        }
        setUserLocation(routePoints[stepIndex]);
        stepIndex++;
      }, 800);
      
      setSimInterval(interval);
    }
  };

  useEffect(() => {
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [simInterval]);

  if (!userLocation) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>Acquiring Live GPS & Real-world Services...</div>;
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <MapContainer 
        center={userLocation} 
        zoom={14} 
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={userLocation} simulating={simulating} />
        
        {userRoute.length > 0 && <Polyline positions={userRoute} color="#3b82f6" weight={4} opacity={0.8} />}
        {responderRoute && responderRoute.length > 0 && !responder?.hasArrived && (
          <Polyline positions={responderRoute} color="#10b981" weight={4} opacity={0.8} dashArray="10, 10" />
        )}
        
        <Marker position={userLocation} icon={userIcon}>
           <Tooltip direction="top" opacity={1}>You</Tooltip>
        </Marker>

        {riskZones.map(zone => (
          <Marker key={`risk-${zone.id}`} position={{ lat: zone.lat, lng: zone.lng }} icon={zone.icon}>
            <Tooltip direction="top" opacity={1}>{zone.name}</Tooltip>
          </Marker>
        ))}

        {services.map(srv => (
          <Marker key={`srv-${srv.id}`} position={{ lat: srv.lat, lng: srv.lng }} icon={srv.type === 'police' ? policeIcon : hospitalIcon}>
             <Tooltip direction="top" opacity={1}>{srv.name}</Tooltip>
          </Marker>
        ))}

        {responder && !responder.hasArrived && (
          <Marker position={responder.location} icon={responderIcon}>
             <Tooltip direction="top" opacity={1}>{responder.name}</Tooltip>
          </Marker>
        )}
      </MapContainer>

      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
        <button 
          onClick={toggleSimulation}
          className="btn btn-secondary"
          style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.9)', fontSize: '12px', border: '2px solid rgba(255,255,255,0.2)' }}
        >
          {simulating ? 'Stop Drive' : 'Simulate Route Drive'}
        </button>
      </div>
    </div>
  );
}
