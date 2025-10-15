import { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import DrumMachine from './components/DrumMachine';
import AdvancedSynth from './components/AdvancedSynth';
import CustomInstrument from './components/CustomInstrument';
import InstrumentBrowser from './components/InstrumentBrowser';
import { WAVGeneratorPanel } from './components/WAVGeneratorPanel';
import RecordingPanel from './components/RecordingPanel';
import AudioSettingsPanel from './components/AudioSettingsPanel';
import AudioRepairPanel from './components/AudioRepairPanel';
import AudioRepairWorker from './audio/AudioRepairWorker';
import { HighPerformanceAudioEngine } from './audio/AudioEngine';
import { InstrumentManager, InstrumentLayer } from './audio/InstrumentManager';
import { DRUM_KIT, ELECTRIC_PIANO, InstrumentConfig } from './audio/instruments';
import './App.css';

function App() {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isWAVGeneratorOpen, setIsWAVGeneratorOpen] = useState(false);
  const [audioRepairWorker, setAudioRepairWorker] = useState<AudioRepairWorker | null>(null);
  const [instrumentLayers, setInstrumentLayers] = useState<InstrumentLayer[]>([
    {
      id: 'drums',
      name: 'Electronic Drums',
      instrumentConfig: DRUM_KIT,
      volume: 0.8,
      muted: false,
      solo: false,
      effects: []
    },
    {
      id: 'piano',
      name: 'Electric Piano',
      instrumentConfig: ELECTRIC_PIANO,
      volume: 0.6,
      muted: false,
      solo: false,
      effects: []
    }
  ]);

  const initializeAudio = useCallback(async () => {
    try {
      console.log('=== STARTING AUDIO INITIALIZATION ===');
      const engine = HighPerformanceAudioEngine.getInstance();
      const instrumentManager = InstrumentManager.getInstance();
      
      console.log('Initializing audio engine...');
      await engine.initialize();
      
      console.log('Preloading drum samples...');
      await engine.preloadDrumSamples();
      
      console.log('Adding instrument layers...');
      // Add instrument layers to both managers
      instrumentLayers.forEach(layer => {
        console.log(`Adding layer: ${layer.name}`);
        engine.addLayer(layer);
        instrumentManager.addInstrumentLayer(layer);
      });
      
      // Make audio engine globally accessible for sustained notes
      (window as any).audioEngine = engine;
      
      setIsAudioReady(true);
      console.log('=== AUDIO INITIALIZATION COMPLETE ===');
    } catch (error) {
      console.error('=== AUDIO INITIALIZATION FAILED ===', error);
      // Still set as ready to allow synthetic sounds
      setIsAudioReady(true);
    }
  }, [instrumentLayers]);

  useEffect(() => {
    // Initialize audio on user interaction
    const handleUserInteraction = async () => {
      if (!isAudioReady) {
        console.log('User interaction detected, initializing audio...');
        try {
          await initializeAudio();
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('touchstart', handleUserInteraction);
          document.removeEventListener('keydown', handleUserInteraction);
        } catch (error) {
          console.error('Audio initialization failed:', error);
        }
      }
    };

    document.addEventListener('click', handleUserInteraction, { passive: true });
    document.addEventListener('touchstart', handleUserInteraction, { passive: true });
    document.addEventListener('keydown', handleUserInteraction, { passive: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [initializeAudio, isAudioReady]);

  // Initialize audio repair worker when available
  useEffect(() => {
    const checkForRepairWorker = () => {
      const worker = (window as any).__audioRepairWorker;
      if (worker && !audioRepairWorker) {
        setAudioRepairWorker(worker);
        console.log('✅ AudioRepairPanel connected to worker');
      }
    };

    // Check immediately
    checkForRepairWorker();

    // Check periodically in case worker is created later
    const interval = setInterval(checkForRepairWorker, 1000);

    return () => clearInterval(interval);
  }, [audioRepairWorker]);

  const handleCustomInstrumentCreated = useCallback((instrument: InstrumentConfig) => {
    const newLayer: InstrumentLayer = {
      id: `layer-${Date.now()}`,
      name: instrument.name,
      instrumentConfig: instrument,
      volume: 0.7,
      muted: false,
      solo: false,
      effects: []
    };
    
    setInstrumentLayers(prev => [...prev, newLayer]);
    
    if (isAudioReady) {
      const engine = HighPerformanceAudioEngine.getInstance();
      const instrumentManager = InstrumentManager.getInstance();
      engine.addLayer(newLayer);
      instrumentManager.addInstrumentLayer(newLayer);
    }
  }, [isAudioReady]);

  const handleInstrumentFromBrowser = useCallback((instrument: InstrumentConfig) => {
    const newLayer: InstrumentLayer = {
      id: `layer-${Date.now()}`,
      name: instrument.name,
      instrumentConfig: instrument,
      volume: 0.7,
      muted: false,
      solo: false,
      effects: []
    };
    
    setInstrumentLayers(prev => [...prev, newLayer]);
    
    if (isAudioReady) {
      const engine = HighPerformanceAudioEngine.getInstance();
      const instrumentManager = InstrumentManager.getInstance();
      engine.addLayer(newLayer);
      instrumentManager.addInstrumentLayer(newLayer);
    }
  }, [isAudioReady]);

  const updateLayerVolume = useCallback((layerId: string, volume: number) => {
    setInstrumentLayers(prev => 
      prev.map(l => 
        l.id === layerId ? { ...l, volume } : l
      )
    );
    
    if (isAudioReady) {
      const engine = HighPerformanceAudioEngine.getInstance();
      const instrumentManager = InstrumentManager.getInstance();
      engine.updateLayerVolume(layerId, volume);
      instrumentManager.updateLayerVolume(layerId, volume);
    }
  }, [isAudioReady]);

  const toggleLayerMute = useCallback((layerId: string) => {
    setInstrumentLayers(prev => 
      prev.map(l => 
        l.id === layerId ? { ...l, muted: !l.muted } : l
      )
    );
    
    if (isAudioReady) {
      const engine = HighPerformanceAudioEngine.getInstance();
      const instrumentManager = InstrumentManager.getInstance();
      engine.toggleLayerMute(layerId);
      instrumentManager.toggleLayerMute(layerId);
    }
  }, [isAudioReady]);

  const removeLayer = useCallback((layerId: string) => {
    setInstrumentLayers(prev => prev.filter(l => l.id !== layerId));
    
    if (isAudioReady) {
      const engine = HighPerformanceAudioEngine.getInstance();
      const instrumentManager = InstrumentManager.getInstance();
      engine.clearLayer(layerId);
      instrumentManager.removeInstrumentLayer(layerId);
      
      // Ensure remaining layers are still active in the engine
      setInstrumentLayers(currentLayers => {
        const remainingLayers = currentLayers.filter(l => l.id !== layerId);
        remainingLayers.forEach(layer => {
          if (!engine.hasLayer(layer.id)) {
            console.log(`Re-adding layer after removal: ${layer.name}`);
            engine.addLayer(layer);
            instrumentManager.addInstrumentLayer(layer);
          }
        });
        return remainingLayers;
      });
    }
  }, [isAudioReady]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="title-section">
            <h1>MusicPad</h1>
            <p>High-Performance Music Creation Platform</p>
          </div>
          <div className="header-controls">
            <button 
              className="wav-generator-button"
              onClick={() => setIsWAVGeneratorOpen(true)}
              title="Generate WAV Samples"
            >
              📁 Generate Samples
            </button>
            {isAudioReady && (
              <button 
                className="test-audio-button"
                onClick={async () => {
                  console.log('🔊 === COMPREHENSIVE AUDIO TEST ===');
                  const engine = HighPerformanceAudioEngine.getInstance();
                  
                  // Run diagnostics first
                  engine.checkAudioChain();
                  
                  // Test 1: Basic Tone.js functionality
                  try {
                    console.log('🔊 Test 1: Basic Tone.js direct to destination...');
                    const testOsc = new Tone.Oscillator(440, 'sine').toDestination();
                    testOsc.start();
                    setTimeout(() => {
                      testOsc.stop();
                      testOsc.dispose();
                      console.log('🔊 Test 1 completed');
                    }, 300);
                  } catch (error) {
                    console.error('❌ Test 1 failed:', error);
                  }
                  
                  // Test 2: Engine's direct test
                  setTimeout(() => {
                    console.log('🔊 Test 2: Engine force test sound...');
                    engine.forceTestSound();
                  }, 400);
                  
                  // Test 3: Engine's built-in test
                  setTimeout(() => {
                    console.log('🔊 Test 3: Engine test audio...');
                    engine.testAudio();
                  }, 1000);
                  
                  // Test 4: Drum sample playback
                  setTimeout(() => {
                    console.log('🔊 Test 4: Kick drum sample...');
                    engine.playSample('kick', 'drums', 1.0);
                  }, 1500);
                  
                  // Test 5: Synthetic drum
                  setTimeout(() => {
                    console.log('🔊 Test 5: Synthetic snare...');
                    engine.playSample('nonexistent', 'drums', 1.0); // This should trigger synthetic
                  }, 2000);
                }}
                title="Comprehensive Audio Test"
                style={{
                  marginLeft: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔊 Test Audio
              </button>
            )}
          </div>
        </div>
        {!isAudioReady && (
          <div className="audio-prompt">
            <div className="audio-prompt-content">
              <h3>🎵 Audio Setup Required</h3>
              <p>Web browsers require user interaction to enable audio</p>
              <button 
                className="audio-enable-button"
                onClick={async () => {
                  try {
                    await initializeAudio();
                  } catch (error) {
                    console.error('Failed to initialize audio:', error);
                  }
                }}
              >
                🔊 Enable Audio & Start Creating
              </button>
            </div>
          </div>
        )}
      </header>

              {isAudioReady && (
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000,
            minWidth: '200px'
          }}>
            <div>🎵 Audio: Ready</div>
            <div>Context: {HighPerformanceAudioEngine.getInstance()?.getContextState() || 'Unknown'}</div>
            <div style={{ marginTop: '8px' }}>
              <button 
                onClick={() => {
                  const engine = HighPerformanceAudioEngine.getInstance();
                  engine.checkAudioChain();
                }}
                style={{
                  marginRight: '5px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  background: '#333',
                  color: 'white',
                  border: '1px solid #666',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Full Debug
              </button>
              <button 
                onClick={() => {
                  const engine = HighPerformanceAudioEngine.getInstance();
                  engine.forceTestSound();
                }}
                style={{
                  marginRight: '5px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  background: '#006600',
                  color: 'white',
                  border: '1px solid #666',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Force Test
              </button>
              <button 
                onClick={() => {
                  // Increase master volume
                  const engine = HighPerformanceAudioEngine.getInstance();
                  engine['masterGain'].gain.value = Math.min(engine['masterGain'].gain.value + 0.2, 2.0);
                  console.log('🔊 Master volume increased to:', engine['masterGain'].gain.value);
                }}
                style={{
                  padding: '2px 6px',
                  fontSize: '10px',
                  background: '#660000',
                  color: 'white',
                  border: '1px solid #666',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Vol+
              </button>
              <button 
                onClick={() => {
                  console.log('🔄 Attempting to fix audio routing...');
                  const engine = HighPerformanceAudioEngine.getInstance();
                  engine.refreshAudioRouting();
                }}
                style={{
                  padding: '2px 6px',
                  fontSize: '10px',
                  background: '#006600',
                  color: 'white',
                  border: '1px solid #666',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
                title="Refresh audio routing to speakers"
              >
                🔊 Fix Audio
              </button>
              <button 
                onClick={() => {
                  console.log('🚨 Running emergency audio test...');
                  const engine = HighPerformanceAudioEngine.getInstance();
                  engine.emergencyAudioTest();
                }}
                style={{
                  padding: '2px 6px',
                  fontSize: '10px',
                  background: '#cc0000',
                  color: 'white',
                  border: '1px solid #666',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
                title="Emergency test - bypass all routing, direct to speakers"
              >
                🚨 Emergency Test
              </button>
            </div>
          </div>
        )}

        <main className="app-main">
        <div className="instruments-grid">
          {/* Always show drum machine if there's at least one drum layer */}
          {instrumentLayers.filter(l => l.instrumentConfig.type === 'drum').map(layer => 
            <DrumMachine key={layer.id} layerId={layer.id} />
          )}
          
          {/* Show synth interfaces for all synth layers */}
          {instrumentLayers.filter(l => l.instrumentConfig.type !== 'drum').map(layer => (
            <AdvancedSynth 
              key={layer.id} 
              layerId={layer.id} 
              instrumentConfig={layer.instrumentConfig}
              onRemove={() => removeLayer(layer.id)}
            />
          ))}
          
          {/* Always show a default piano interface if no synth layers exist */}
          {instrumentLayers.filter(l => l.instrumentConfig.type !== 'drum').length === 0 && (() => {
            // Ensure default piano layer exists in audio engine
            if (isAudioReady) {
              const engine = HighPerformanceAudioEngine.getInstance();
              const instrumentManager = InstrumentManager.getInstance();
              
              if (!engine.hasLayer('default-piano')) {
                const defaultPianoLayer = {
                  id: 'default-piano',
                  name: 'Default Piano',
                  volume: 0.6,
                  muted: false,
                  solo: false,
                  effects: []
                };
                engine.addLayer(defaultPianoLayer);
                instrumentManager.addInstrumentLayer({
                  ...defaultPianoLayer,
                  instrumentConfig: ELECTRIC_PIANO
                });
              }
            }
            
            return (
              <AdvancedSynth 
                key="default-piano" 
                layerId="default-piano" 
                instrumentConfig={ELECTRIC_PIANO}
                onRemove={undefined} // No remove button for default piano
              />
            );
          })()}
        </div>

        {/* Recording Studio */}
        <RecordingPanel isAudioReady={isAudioReady} />

        <div className="controls-section">
          <InstrumentBrowser onInstrumentSelected={handleInstrumentFromBrowser} />
          <CustomInstrument onInstrumentCreated={handleCustomInstrumentCreated} />
          
          <div className="layer-controls">
            <h3>Instrument Layers ({instrumentLayers.length})</h3>
            <div className="layers-list">
              {instrumentLayers.map(layer => (
                <div key={layer.id} className="layer-item">
                  <div className="layer-info">
                    <span className="layer-name">{layer.name}</span>
                    <span className="layer-type">{layer.instrumentConfig.type}</span>
                  </div>
                  <div className="layer-controls-group">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={layer.volume}
                      onChange={(e) => updateLayerVolume(layer.id, parseFloat(e.target.value))}
                      className="volume-slider"
                      title={`Volume: ${Math.round(layer.volume * 100)}%`}
                    />
                    <button
                      onClick={() => toggleLayerMute(layer.id)}
                      className={`mute-button ${layer.muted ? 'muted' : ''}`}
                      title={layer.muted ? 'Unmute' : 'Mute'}
                    >
                      {layer.muted ? 'UNMUTE' : 'MUTE'}
                    </button>
                    <button
                      onClick={() => removeLayer(layer.id)}
                      className="remove-button"
                      title="Remove layer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <WAVGeneratorPanel
        isOpen={isWAVGeneratorOpen}
        onClose={() => setIsWAVGeneratorOpen(false)}
      />
      
      {/* Audio Settings Panel - Always available */}
      <AudioSettingsPanel />
      
      {/* Audio Repair Panel - Shows when worker is available */}
      {audioRepairWorker && <AudioRepairPanel worker={audioRepairWorker} />}
    </div>
  );
}

export default App;