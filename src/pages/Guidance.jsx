import React, { useState } from 'react';
import { ShieldAlert, HeartPulse, Flame, Wind, AlertCircle, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const EMERGENCY_PROTOCOLS = [
  {
    id: 'medical',
    title: 'Medical Emergency (Trauma & CPR)',
    icon: <HeartPulse color="#ef4444" size={24} />,
    color: '#ef4444',
    steps: [
      {
        subtitle: 'Assess the Situation',
        content: 'Ensure the scene is safe for you before approaching. Do not move the victim unless they are in immediate, life-threatening danger (e.g., fire).'
      },
      {
        subtitle: 'Check Responsiveness',
        content: 'Tap the person\'s shoulder and shout, "Are you okay?" If no response, check for breathing for no more than 10 seconds.'
      },
      {
        subtitle: 'Perform Hands-Only CPR',
        content: 'If the adult is unresponsive and not breathing normally: push hard and fast in the center of the chest. Aim for 100-120 compressions per minute at a depth of 2 inches. Do not stop until help arrives.'
      },
      {
        subtitle: 'Severe Bleeding',
        content: 'Apply firm, direct pressure over the wound using a clean cloth or sterile dressing. Maintain pressure continuously.'
      }
    ]
  },
  {
    id: 'fire',
    title: 'Fire & Structural Hazards',
    icon: <Flame color="#f59e0b" size={24} />,
    color: '#f59e0b',
    steps: [
      {
        subtitle: 'Evacuate Immediately',
        content: 'Do not attempt to gather personal belongings. Use the nearest unblocked stairway. NEVER use elevators during a fire.'
      },
      {
        subtitle: 'Avoid Smoke Inhalation',
        content: 'Smoke is highly toxic and rises. Drop to your hands and knees and crawl to the exit. Cover your nose and mouth with a wet cloth if possible.'
      },
      {
        subtitle: 'If Trapped',
        content: 'Close all doors between you and the fire. Seal door cracks and vents with wet towels or clothing to prevent smoke from entering. Signal for help from a window using a brightly colored cloth or flashlight.'
      }
    ]
  },
  {
    id: 'natural',
    title: 'Natural Disaster (Earthquake)',
    icon: <Wind color="#3b82f6" size={24} />,
    color: '#3b82f6',
    steps: [
      {
        subtitle: 'Drop, Cover, and Hold On',
        content: 'Drop to your hands and knees. Cover your head and neck under a sturdy table or desk. Hold on until the shaking stops.'
      },
      {
        subtitle: 'If Indoors',
        content: 'Stay inside. Do not run outside while the ground is shaking. Stay away from glass, windows, and anything that could fall.'
      },
      {
        subtitle: 'If Outdoors',
        content: 'Move away from buildings, streetlights, and utility wires. Drop to the ground and stay there until the shaking stops.'
      }
    ]
  }
];

export default function Guidance() {
  const [expandedId, setExpandedId] = useState('medical');
  const { speak } = useSettings();

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      
      {/* Header */}
      <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-darker)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
          <ShieldAlert color="var(--primary-red)" />
          Survival Playbook
        </h2>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Official offline-ready protocols for critical emergencies. Follow these steps carefully to ensure maximum safety.
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {EMERGENCY_PROTOCOLS.map((protocol) => {
            const isExpanded = expandedId === protocol.id;
            
            return (
              <div 
                key={protocol.id} 
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderRadius: '1rem', 
                  border: `1px solid ${isExpanded ? protocol.color : 'rgba(255,255,255,0.05)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Accordion Header */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : protocol.id)}
                  style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? `rgba(${protocol.color === '#ef4444' ? '239,68,68' : protocol.color === '#f59e0b' ? '245,158,11' : '59,130,246'}, 0.05)` : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      backgroundColor: `rgba(${protocol.color === '#ef4444' ? '239,68,68' : protocol.color === '#f59e0b' ? '245,158,11' : '59,130,246'}, 0.1)`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      {protocol.icon}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{protocol.title}</h3>
                  </div>
                  {isExpanded ? <ChevronUp color="var(--text-muted)" /> : <ChevronDown color="var(--text-muted)" />}
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', animation: 'fade-in 0.3s ease-out' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                      {protocol.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <div style={{ 
                            minWidth: '24px', height: '24px', borderRadius: '50%', 
                            backgroundColor: protocol.color, color: 'white', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.875rem', fontWeight: 'bold'
                          }}>
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: '0 0 0.25rem 0', color: 'white' }}>{step.subtitle}</h4>
                              <button 
                                onClick={(e) => { e.stopPropagation(); speak(step.content); }}
                                style={{ background: 'none', border: 'none', color: protocol.color, cursor: 'pointer', padding: '0 0.5rem' }}
                              >
                                <Volume2 size={16} />
                              </button>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                              {step.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <AlertCircle color="#ef4444" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.875rem' }}>
                        <strong>Disclaimer:</strong> This is an informational playbook. In a real emergency, always attempt to contact professional emergency services immediately.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
        </div>
      </div>
    </div>
  );
}
