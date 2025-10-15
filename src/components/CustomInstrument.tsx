import { useState, useCallback } from 'react';
import { InstrumentConfig, SynthParams } from '../audio/instruments';
import { InstrumentManager } from '../audio/InstrumentManager';
import './CustomInstrument.css';

interface CustomInstrumentProps {
  onInstrumentCreated: (instrument: InstrumentConfig) => void;
}

const CustomInstrument: React.FC<CustomInstrumentProps> = ({ onInstrumentCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [instrumentName, setInstrumentName] = useState('');
  const [instrumentType, setInstrumentType] = useState<'synth' | 'sampler' | 'drum'>('synth');
  const [synthParams, setSynthParams] = useState<SynthParams>({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 },
    filter: { frequency: 1000, Q: 1 }
  });

  const handleCreateInstrument = useCallback(() => {
    if (!instrumentName.trim()) {
      alert('Please enter an instrument name');
      return;
    }

    const instrumentManager = InstrumentManager.getInstance();
    const newInstrument = instrumentManager.createCustomInstrument(instrumentName, {
      type: instrumentType,
      synthParams: instrumentType === 'synth' ? synthParams : undefined
    });

    onInstrumentCreated(newInstrument);
    setInstrumentName('');
    setIsOpen(false);
  }, [instrumentName, instrumentType, synthParams, onInstrumentCreated]);

  const updateSynthParam = useCallback((category: keyof SynthParams, param: string, value: any) => {
    setSynthParams(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [param]: value
      }
    }));
  }, []);

  return (
    <div className="custom-instrument">
      <button 
        className="create-instrument-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '× Close' : '+ Create Custom Instrument'}
      </button>

      {isOpen && (
        <div className="instrument-creator">
          <h3>Create Custom Instrument</h3>
          
          <div className="form-group">
            <label>Instrument Name:</label>
            <input
              type="text"
              value={instrumentName}
              onChange={(e) => setInstrumentName(e.target.value)}
              placeholder="Enter instrument name"
              className="text-input"
            />
          </div>

          <div className="form-group">
            <label>Instrument Type:</label>
            <select
              value={instrumentType}
              onChange={(e) => setInstrumentType(e.target.value as any)}
              className="select-input"
            >
              <option value="synth">Synthesizer</option>
              <option value="sampler">Sampler</option>
              <option value="drum">Drum Kit</option>
            </select>
          </div>

          {instrumentType === 'synth' && (
            <div className="synth-params">
              <h4>Synthesizer Parameters</h4>
              
              <div className="param-group">
                <label>Oscillator Type:</label>
                <select
                  value={synthParams.oscillator.type}
                  onChange={(e) => updateSynthParam('oscillator', 'type', e.target.value)}
                  className="select-input"
                >
                  <option value="sine">Sine</option>
                  <option value="square">Square</option>
                  <option value="sawtooth">Sawtooth</option>
                  <option value="triangle">Triangle</option>
                </select>
              </div>

              <div className="param-group">
                <label>Attack: {synthParams.envelope.attack}s</label>
                <input
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={synthParams.envelope.attack}
                  onChange={(e) => updateSynthParam('envelope', 'attack', parseFloat(e.target.value))}
                  className="range-input"
                />
              </div>

              <div className="param-group">
                <label>Decay: {synthParams.envelope.decay}s</label>
                <input
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={synthParams.envelope.decay}
                  onChange={(e) => updateSynthParam('envelope', 'decay', parseFloat(e.target.value))}
                  className="range-input"
                />
              </div>

              <div className="param-group">
                <label>Sustain: {synthParams.envelope.sustain}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={synthParams.envelope.sustain}
                  onChange={(e) => updateSynthParam('envelope', 'sustain', parseFloat(e.target.value))}
                  className="range-input"
                />
              </div>

              <div className="param-group">
                <label>Release: {synthParams.envelope.release}s</label>
                <input
                  type="range"
                  min="0.01"
                  max="3"
                  step="0.01"
                  value={synthParams.envelope.release}
                  onChange={(e) => updateSynthParam('envelope', 'release', parseFloat(e.target.value))}
                  className="range-input"
                />
              </div>

              {synthParams.filter && (
                <>
                  <div className="param-group">
                    <label>Filter Frequency: {synthParams.filter.frequency}Hz</label>
                    <input
                      type="range"
                      min="20"
                      max="20000"
                      step="1"
                      value={synthParams.filter.frequency}
                      onChange={(e) => updateSynthParam('filter', 'frequency', parseInt(e.target.value))}
                      className="range-input"
                    />
                  </div>

                  <div className="param-group">
                    <label>Filter Q: {synthParams.filter.Q}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={synthParams.filter.Q}
                      onChange={(e) => updateSynthParam('filter', 'Q', parseFloat(e.target.value))}
                      className="range-input"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="form-actions">
            <button 
              className="create-btn"
              onClick={handleCreateInstrument}
            >
              Create Instrument
            </button>
            <button 
              className="cancel-btn"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomInstrument;