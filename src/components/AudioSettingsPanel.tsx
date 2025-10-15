import React, { useState, useCallback, useEffect } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import Knob from './Knob';
import './AudioSettingsPanel.css';

interface AudioSettings {
  masterGain: number;
  instrumentVolume: number;
  limiterThreshold: number;
  synthAttack: number;
  synthDecay: number;
  synthSustain: number;
  synthRelease: number;
  filterFrequency: number;
  filterQ: number;
  drumVolume: number;
  pianoVolume: number;
}

const AudioSettingsPanel: React.FC = () => {
  const { engine } = useAudioEngine();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AudioSettings>({
    masterGain: 2.0,
    instrumentVolume: 0.5,
    limiterThreshold: -0.1,
    synthAttack: 0.01,
    synthDecay: 0.8,
    synthSustain: 0.2,
    synthRelease: 1.0,
    filterFrequency: 2000,
    filterQ: 1,
    drumVolume: 0.8,
    pianoVolume: 0.7
  });

  useEffect(() => {
    if (engine) {
      // Apply initial settings
      engine.updateMasterGain(settings.masterGain);
      engine.updateGlobalInstrumentVolume(settings.instrumentVolume);
      engine.updateLimiterThreshold(settings.limiterThreshold);
    }
  }, [engine, settings.masterGain, settings.instrumentVolume, settings.limiterThreshold]);

  const handleSettingChange = useCallback((key: keyof AudioSettings) => (value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    if (!engine) return;

    // Apply changes to audio engine
    switch (key) {
      case 'masterGain':
        engine.updateMasterGain(value);
        break;
      case 'instrumentVolume':
        engine.updateGlobalInstrumentVolume(value);
        break;
      case 'limiterThreshold':
        engine.updateLimiterThreshold(value);
        break;
      case 'drumVolume':
        engine.updateLayerVolume('drums', value);
        break;
      case 'pianoVolume':
        engine.updateLayerVolume('default-piano', value);
        break;
    }
  }, [engine]);

  const resetToDefaults = useCallback(() => {
    const defaults: AudioSettings = {
      masterGain: 2.0,
      instrumentVolume: 0.5,
      limiterThreshold: -0.1,
      synthAttack: 0.01,
      synthDecay: 0.8,
      synthSustain: 0.2,
      synthRelease: 1.0,
      filterFrequency: 2000,
      filterQ: 1,
      drumVolume: 0.8,
      pianoVolume: 0.7
    };
    
    setSettings(defaults);
    
    if (engine) {
      engine.updateMasterGain(defaults.masterGain);
      engine.updateGlobalInstrumentVolume(defaults.instrumentVolume);
      engine.updateLimiterThreshold(defaults.limiterThreshold);
      engine.updateLayerVolume('drums', defaults.drumVolume);
      engine.updateLayerVolume('default-piano', defaults.pianoVolume);
    }
  }, [engine]);

  const exportSettings = useCallback(() => {
    const settingsJson = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'musicpad-audio-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  const importSettings = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(prev => ({ ...prev, ...importedSettings }));
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('Failed to import settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  }, []);

  return (
    <div className={`audio-settings-panel ${isOpen ? 'open' : ''}`}>
      <button 
        className="settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Audio Settings"
      >
        🎛️
      </button>

      <div className="settings-content">
        <div className="settings-header">
          <h3>🎛️ Audio Settings</h3>
          <div className="settings-actions">
            <button onClick={resetToDefaults} className="reset-btn">
              🔄 Reset
            </button>
            <button onClick={exportSettings} className="export-btn">
              💾 Export
            </button>
            <label className="import-btn">
              📂 Import
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                style={{ display: 'none' }}
              />
            </label>
            <button onClick={() => setIsOpen(false)} className="close-btn">
              ✕
            </button>
          </div>
        </div>

        <div className="settings-grid">
          {/* Master Section */}
          <div className="settings-section">
            <h4>🔊 Master Output</h4>
            <div className="knob-row">
              <Knob
                label="Master Gain"
                value={settings.masterGain}
                min={0}
                max={5}
                step={0.1}
                unit=""
                color="#e74c3c"
                onChange={handleSettingChange('masterGain')}
              />
              <Knob
                label="Limiter"
                value={settings.limiterThreshold}
                min={-1}
                max={0}
                step={0.01}
                unit=" dB"
                color="#c0392b"
                onChange={handleSettingChange('limiterThreshold')}
              />
            </div>
          </div>

          {/* Instrument Levels */}
          <div className="settings-section">
            <h4>🎵 Instrument Levels</h4>
            <div className="knob-row">
              <Knob
                label="Global Volume"
                value={settings.instrumentVolume}
                min={0}
                max={1}
                step={0.01}
                unit=""
                color="#f39c12"
                onChange={handleSettingChange('instrumentVolume')}
              />
              <Knob
                label="Drums"
                value={settings.drumVolume}
                min={0}
                max={1}
                step={0.01}
                unit=""
                color="#e67e22"
                onChange={handleSettingChange('drumVolume')}
              />
              <Knob
                label="Piano"
                value={settings.pianoVolume}
                min={0}
                max={1}
                step={0.01}
                unit=""
                color="#d35400"
                onChange={handleSettingChange('pianoVolume')}
              />
            </div>
          </div>

          {/* Synthesizer Envelope */}
          <div className="settings-section">
            <h4>🎹 Synth Envelope</h4>
            <div className="knob-row">
              <Knob
                label="Attack"
                value={settings.synthAttack}
                min={0.001}
                max={2}
                step={0.001}
                unit="s"
                color="#3498db"
                onChange={handleSettingChange('synthAttack')}
              />
              <Knob
                label="Decay"
                value={settings.synthDecay}
                min={0.01}
                max={3}
                step={0.01}
                unit="s"
                color="#2980b9"
                onChange={handleSettingChange('synthDecay')}
              />
              <Knob
                label="Sustain"
                value={settings.synthSustain}
                min={0}
                max={1}
                step={0.01}
                unit=""
                color="#1f618d"
                onChange={handleSettingChange('synthSustain')}
              />
              <Knob
                label="Release"
                value={settings.synthRelease}
                min={0.01}
                max={5}
                step={0.01}
                unit="s"
                color="#154360"
                onChange={handleSettingChange('synthRelease')}
              />
            </div>
          </div>

          {/* Filter Section */}
          <div className="settings-section">
            <h4>🎚️ Filter</h4>
            <div className="knob-row">
              <Knob
                label="Frequency"
                value={settings.filterFrequency}
                min={100}
                max={20000}
                step={10}
                unit=" Hz"
                color="#27ae60"
                onChange={handleSettingChange('filterFrequency')}
              />
              <Knob
                label="Resonance"
                value={settings.filterQ}
                min={0.1}
                max={15}
                step={0.1}
                unit=""
                color="#229954"
                onChange={handleSettingChange('filterQ')}
              />
            </div>
          </div>
        </div>

        {/* Live Audio Info */}
        <div className="audio-info">
          <div className="info-item">
            <span className="info-label">Sample Rate:</span>
            <span className="info-value">48 kHz</span>
          </div>
          <div className="info-item">
            <span className="info-label">Buffer Size:</span>
            <span className="info-value">Interactive</span>
          </div>
          <div className="info-item">
            <span className="info-label">Latency:</span>
            <span className="info-value">~10ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioSettingsPanel;