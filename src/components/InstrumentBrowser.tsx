import { useState, useCallback } from 'react';
import { InstrumentConfig, ALL_INSTRUMENTS, INSTRUMENT_CATEGORIES } from '../audio/instruments';
import './InstrumentBrowser.css';

interface InstrumentBrowserProps {
  onInstrumentSelected: (instrument: InstrumentConfig) => void;
}

type CategoryType = 'rhythm' | 'melody' | 'harmony' | 'effects';

const InstrumentBrowser: React.FC<InstrumentBrowserProps> = ({ onInstrumentSelected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('rhythm');
  const [previewingInstrument, setPreviewingInstrument] = useState<string | null>(null);

  const handleInstrumentSelect = useCallback((instrument: InstrumentConfig) => {
    onInstrumentSelected(instrument);
    setIsOpen(false);
  }, [onInstrumentSelected]);

  const handlePreview = useCallback((instrumentId: string) => {
    setPreviewingInstrument(instrumentId);
    // Preview would play a sample note
    setTimeout(() => setPreviewingInstrument(null), 1000);
  }, []);

  const getCategoryInstruments = (category: CategoryType): InstrumentConfig[] => {
    return INSTRUMENT_CATEGORIES[category] || [];
  };

  const getInstrumentIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'drum': '🥁',
      'bass': '🔉',
      'lead': '⚡',
      'pad': '🌊',
      'percussion': '🎵',
      'strings': '🎻',
      'winds': '🎺',
      'synth': '🎹'
    };
    return icons[type] || '🎼';
  };

  return (
    <div className="instrument-browser">
      <button 
        className="browse-instruments-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '× Close Browser' : '🎼 Browse Instruments'}
      </button>

      {isOpen && (
        <div className="browser-panel">
          <h3>Instrument Browser</h3>
          
          <div className="category-tabs">
            {(Object.keys(INSTRUMENT_CATEGORIES) as CategoryType[]).map(category => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
                <span className="category-count">
                  ({getCategoryInstruments(category).length})
                </span>
              </button>
            ))}
          </div>

          <div className="instruments-grid">
            {getCategoryInstruments(selectedCategory).map(instrument => (
              <div
                key={instrument.id}
                className={`instrument-card ${previewingInstrument === instrument.id ? 'previewing' : ''}`}
              >
                <div className="instrument-icon">
                  {getInstrumentIcon(instrument.type)}
                </div>
                <div className="instrument-info">
                  <h4 className="instrument-name">{instrument.name}</h4>
                  <span className="instrument-type">{instrument.type}</span>
                  {instrument.synthParams && (
                    <div className="synth-preview">
                      <span className="osc-type">
                        {instrument.synthParams.oscillator.type}
                      </span>
                      {instrument.synthParams.filter && (
                        <span className="filter-info">
                          {instrument.synthParams.filter.frequency}Hz
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="instrument-actions">
                  <button
                    className="preview-btn"
                    onClick={() => handlePreview(instrument.id)}
                    title="Preview sound"
                  >
                    ▶
                  </button>
                  <button
                    className="add-btn"
                    onClick={() => handleInstrumentSelect(instrument)}
                    title="Add to workspace"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="browser-footer">
            <div className="instrument-stats">
              <span>Total Instruments: {ALL_INSTRUMENTS.length}</span>
              <span>Current Category: {getCategoryInstruments(selectedCategory).length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstrumentBrowser;