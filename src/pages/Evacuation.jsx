import React, { useState, useEffect, useMemo } from 'react';
import { Flame, User, DoorOpen, RotateCcw, AlertTriangle, Navigation, MapPin, Volume2 } from 'lucide-react';
import { db } from '../firebase';
import { useSettings } from '../context/SettingsContext';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';

// R: Room, H: Hallway, W: Wall, E1: Main Exit, E2: Stairs, L: Lift
const INITIAL_GRID = [
  ['W', 'W', 'E2', 'W', 'W', 'W', 'E1', 'W', 'W', 'W'],
  ['R', 'R', 'H', 'H', 'H', 'H', 'H', 'H', 'R', 'R'],
  ['R', 'R', 'H', 'W', 'W', 'W', 'W', 'H', 'R', 'R'],
  ['W', 'W', 'H', 'W', 'R', 'R', 'W', 'H', 'W', 'W'],
  ['R', 'R', 'H', 'W', 'R', 'R', 'W', 'H', 'R', 'R'],
  ['R', 'R', 'H', 'H', 'H', 'H', 'H', 'H', 'R', 'R'],
  ['W', 'W', 'W', 'H', 'W', 'W', 'H', 'W', 'W', 'W'],
  ['R', 'R', 'R', 'H', 'R', 'R', 'H', 'R', 'R', 'R'],
  ['R', 'R', 'R', 'H', 'R', 'R', 'H', 'R', 'R', 'R'],
  ['W', 'W', 'W', 'H', 'W', 'W', 'H', 'W', 'L', 'W'],
];

const GRID_ROWS = INITIAL_GRID.length;
const GRID_COLS = INITIAL_GRID[0].length;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export default function Evacuation() {
  const [userLoc, setUserLoc] = useState(null); 
  const [hazards, setHazards] = useState([]);
  
  const [path, setPath] = useState([]); 
  const [isWarningPath, setIsWarningPath] = useState(false);
  const [statusText, setStatusText] = useState('Step 1: Set Your Current Location'); 
  const [aiInstruction, setAiInstruction] = useState('');
  const [useFirebase, setUseFirebase] = useState(true);
  const { speak } = useSettings();

  const gridData = useMemo(() => {
    let roomCounter = 101;
    return INITIAL_GRID.map(row => row.map(cell => {
      if (cell === 'R') return { type: 'R', label: `${roomCounter++}` };
      return { type: cell };
    }));
  }, []);

  const getExits = () => {
    const exits = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (INITIAL_GRID[r][c] === 'E1' || INITIAL_GRID[r][c] === 'E2') {
          exits.push({ r, c });
        }
      }
    }
    return exits;
  };
  const exitLocs = getExits();

  const isSame = (loc1, loc2) => loc1 && loc2 && loc1.r === loc2.r && loc1.c === loc2.c;
  const isHazard = (r, c) => hazards.some(h => h.r === r && h.c === c);

  // ALWAYS listen to Firebase
  useEffect(() => {
    if (!useFirebase) return;
    
    const q = query(collection(db, "building_hazards"), orderBy("timestamp", "asc"), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const activeHazards = [];
      snapshot.forEach(doc => {
        activeHazards.push({ r: doc.data().r, c: doc.data().c });
      });
      setHazards(activeHazards);
    }, (err) => {
      console.warn("Firebase read failed, using local arrays", err);
      setUseFirebase(false);
    });

    return () => unsub();
  }, [useFirebase]);

  const handleCellClick = async (r, c) => {
    const type = INITIAL_GRID[r][c];
    if (type === 'W' || type === 'E1' || type === 'E2' || type === 'L') return; 

    if (!userLoc) {
      setUserLoc({ r, c });
      setStatusText('Step 2: Report Fire/Hazards to Calculate Safe Route');
    } else {
      if (isSame({r, c}, userLoc) || isHazard(r, c)) return;
      
      try {
        if (useFirebase) {
          await addDoc(collection(db, "building_hazards"), { r, c, timestamp: serverTimestamp() });
        } else {
          setHazards(prev => [...prev, {r, c}]);
        }
      } catch (e) { 
        setUseFirebase(false);
        setHazards(prev => [...prev, {r, c}]);
      }
    }
  };

  const reset = () => {
    setUserLoc(null);
    setPath([]);
    setIsWarningPath(false);
    setStatusText('Step 1: Set Your Current Location');
    setAiInstruction('');
  };

  const clearGlobalHazards = async () => {
    if (useFirebase) {
      try {
        const snap = await getDocs(collection(db, "building_hazards"));
        snap.forEach(d => deleteDoc(doc(db, "building_hazards", d.id)));
      } catch (e) { console.error(e); }
    } else {
      setHazards([]);
    }
  };

  const generateAIInstruction = (uLoc) => {
    const cellType = INITIAL_GRID[uLoc.r][uLoc.c];
    const cellObj = gridData[uLoc.r][uLoc.c];
    
    // Find nearest hazard
    let closestDist = Infinity;
    hazards.forEach(h => {
      const d = Math.abs(uLoc.r - h.r) + Math.abs(uLoc.c - h.c);
      if (d < closestDist) closestDist = d;
    });

    let baseMsg = `AI SURVIVAL ANALYSIS: Tracking ${hazards.length} active hazard(s). `;

    if (closestDist <= 2) {
      return baseMsg + "EXTREME DANGER. A hazard is immediately adjacent. Drop below the smoke layer immediately. Seal door gaps with wet clothing and signal for rescue from the nearest exterior window.";
    }
    
    if (cellType === 'R') {
      return baseMsg + `You are currently isolated in Room ${cellObj.label}. DO NOT attempt to enter the corridor. Shelter in place. First responders have locked onto your exact room coordinates.`;
    }
    
    return baseMsg + "You are trapped in a transit corridor. Visibility may rapidly deteriorate. Follow the closest wall to the nearest unblocked room, enter it, and barricade the door against smoke ingress.";
  };

  useEffect(() => {
    if (userLoc && hazards.length > 0) {
      calculatePath();
    } else if (userLoc && hazards.length === 0) {
      // Safe path without hazards
      calculatePath();
    }
  }, [userLoc, hazards]);

  const calculatePath = () => {
    if (!userLoc) return;

    const hazardAdjacent = [];
    hazards.forEach(h => {
      for (let [dr, dc] of DIRS) {
        const nr = h.r + dr, nc = h.c + dc;
        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
          hazardAdjacent.push(`${nr},${nc}`);
        }
      }
    });

    const pq = []; 
    pq.push({ r: userLoc.r, c: userLoc.c, cost: 0, p: [{ r: userLoc.r, c: userLoc.c }] });
    
    const costs = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(Infinity));
    costs[userLoc.r][userLoc.c] = 0;

    let foundPath = null;

    while (pq.length > 0) {
      pq.sort((a, b) => a.cost - b.cost); 
      const curr = pq.shift();

      if (exitLocs.some(e => e.r === curr.r && e.c === curr.c)) {
        foundPath = curr;
        break;
      }

      for (let [dr, dc] of DIRS) {
        const nr = curr.r + dr;
        const nc = curr.c + dc;

        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
          const cellType = INITIAL_GRID[nr][nc];
          
          if (cellType === 'W' || cellType === 'L') continue; // Block walls & lifts
          if (hazards.some(h => h.r === nr && h.c === nc)) continue; // Block exact fires
          
          const isAdjacent = hazardAdjacent.includes(`${nr},${nc}`);
          const moveCost = isAdjacent ? 50 : 1; 
          const newCost = curr.cost + moveCost;

          if (newCost < costs[nr][nc]) {
            costs[nr][nc] = newCost;
            pq.push({ r: nr, c: nc, cost: newCost, p: [...curr.p, { r: nr, c: nc }] });
          }
        }
      }
    }

    if (foundPath) {
      setPath(foundPath.p);
      setAiInstruction('');
      if (foundPath.cost >= 50) {
        setIsWarningPath(true);
        setStatusText('WARNING: Route passes near hazard! Proceed with caution.');
        speak("Warning. Safest route passes near a hazard. Proceed with caution.");
      } else {
        setIsWarningPath(false);
        setStatusText('Safest route found. Follow the green path.');
        speak("Safest route generated. Follow the green path.");
      }
    } else {
      setPath([]);
      setIsWarningPath(false);
      setStatusText('NO SAFE ROUTE. ALL EXITS BLOCKED.');
      if (hazards.length > 0) {
        const instruction = generateAIInstruction(userLoc);
        setAiInstruction(instruction);
        speak(instruction);
      }
    }
  };

  const getCellStyles = (r, c, type) => {
    let bg = 'var(--bg-darker)';
    let border = '1px solid rgba(255,255,255,0.05)';
    
    if (type === 'W') {
      bg = '#1e293b'; 
      border = '1px solid #0f172a';
    } else if (type === 'R') {
      bg = 'var(--bg-card)';
    } else if (type === 'E1' || type === 'E2') {
      bg = 'var(--accent-green)';
    } else if (type === 'L') {
      bg = '#475569';
    }

    const isPath = path.some(p => p.r === r && p.c === c);
    if (isPath) {
      bg = isWarningPath ? 'var(--warning-orange)' : 'var(--accent-green)';
    }

    if (isHazard(r, c)) {
      bg = 'var(--primary-red)';
    } else if (isSame({r, c}, userLoc)) {
      bg = 'var(--accent-blue)';
    }

    return {
      background: bg,
      border,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      aspectRatio: '1',
      cursor: type !== 'W' && type !== 'E1' && type !== 'E2' && type !== 'L' ? 'pointer' : 'default',
      borderRadius: '0.15rem',
      position: 'relative',
      transition: 'all 0.3s ease'
    };
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-dark)' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>Emergency Evacuation</h2>
        <div style={{
          background: statusText.includes('Safest route') ? 'rgba(16, 185, 129, 0.2)' : 
                     statusText.includes('WARNING') ? 'rgba(245, 158, 11, 0.2)' :
                     statusText.includes('NO SAFE') ? 'rgba(230, 57, 70, 0.2)' : 'var(--bg-card)',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          color: statusText.includes('Safest route') ? 'var(--accent-green)' : 
                 statusText.includes('WARNING') ? 'var(--warning-orange)' :
                 statusText.includes('NO SAFE') ? 'var(--primary-red)' : 'var(--text-main)',
          fontWeight: 'bold',
          transition: 'all 0.3s'
        }}>
          {statusText}
        </div>
      </div>

      <div style={{ 
        display: 'grid', gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: '3px',
        flex: 1, maxHeight: '420px', marginBottom: '1rem', padding: '0.5rem',
        background: 'var(--bg-darker)', borderRadius: '0.5rem',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {gridData.map((row, r) => (
          row.map((cell, c) => (
            <div 
              key={`${r}-${c}`}
              style={getCellStyles(r, c, cell.type)}
              onClick={() => handleCellClick(r, c)}
            >
              {cell.type === 'R' && !isHazard(r, c) && !isSame({r, c}, userLoc) && (
                <span style={{ position: 'absolute', fontSize: '9px', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                  {cell.label}
                </span>
              )}
              {isHazard(r, c) && <Flame size={16} color="white" className="animate-pulse" />}
              {isSame({r, c}, userLoc) && <User size={16} color="white" />}
              {exitLocs.some(e => e.r === r && e.c === c) && !isHazard(r, c) && !isSame({r, c}, userLoc) && <DoorOpen size={16} color="white" />}
              {cell.type === 'L' && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>LIFT</span>}
            </div>
          ))
        ))}
      </div>

      {aiInstruction && (
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--accent-blue)', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '1rem', animation: 'slide-up 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
            <Navigation size={16} /> AI SURVIVAL ANALYSIS
          </div>
          {aiInstruction}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={reset} style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <RotateCcw size={16} /> Reset My Location
        </button>
        <button className="btn btn-secondary" onClick={clearGlobalHazards} style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5' }}>
          <Flame size={16} /> Clear All Hazards
        </button>
      </div>

      <div style={{ marginTop: 'auto', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: 10, height: 10, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }} /> Room
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: 10, height: 10, background: 'var(--accent-green)' }} /> Exit/Route
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: 10, height: 10, background: '#475569' }} /> Lift
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: 10, height: 10, background: 'var(--warning-orange)' }} /> Risky Route
          </div>
        </div>
      </div>
    </div>
  );
}
