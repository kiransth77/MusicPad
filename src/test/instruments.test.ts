import { describe, it, expect } from 'vitest';
import { 
  DRUM_KIT, 
  ELECTRIC_PIANO, 
  ALL_INSTRUMENTS, 
  INSTRUMENT_CATEGORIES 
} from '../audio/instruments';

describe('Instruments Configuration', () => {
  describe('DRUM_KIT', () => {
    it('should have correct type and category', () => {
      expect(DRUM_KIT.type).toBe('drum');
      expect(DRUM_KIT.category).toBe('rhythm');
    });

    it('should have a name', () => {
      expect(DRUM_KIT.name).toBeDefined();
      expect(typeof DRUM_KIT.name).toBe('string');
    });

    it('should have samples instead of synthesis parameters', () => {
      expect(DRUM_KIT.samples).toBeDefined();
      expect(DRUM_KIT.synthParams).toBeUndefined(); // Drum kit uses samples, not synth params
      if (DRUM_KIT.samples) {
        expect(DRUM_KIT.samples.kick).toBeDefined();
        expect(DRUM_KIT.samples.snare).toBeDefined();
      }
    });
  });

  describe('ELECTRIC_PIANO', () => {
    it('should have correct type and category', () => {
      expect(ELECTRIC_PIANO.type).toBe('synth');
      expect(ELECTRIC_PIANO.category).toBe('harmony');
    });

    it('should have synthesis parameters', () => {
      expect(ELECTRIC_PIANO.synthParams).toBeDefined();
      if (ELECTRIC_PIANO.synthParams) {
        expect(ELECTRIC_PIANO.synthParams.oscillator).toBeDefined();
        expect(ELECTRIC_PIANO.synthParams.envelope).toBeDefined();
      }
    });
  });

  describe('ALL_INSTRUMENTS', () => {
    it('should contain multiple instruments', () => {
      expect(ALL_INSTRUMENTS.length).toBeGreaterThan(10);
    });

    it('should include drum kit and electric piano', () => {
      const drumKit = ALL_INSTRUMENTS.find(inst => inst.name === DRUM_KIT.name);
      const electricPiano = ALL_INSTRUMENTS.find(inst => inst.name === ELECTRIC_PIANO.name);
      
      expect(drumKit).toBeDefined();
      expect(electricPiano).toBeDefined();
    });

    it('should have instruments with required properties', () => {
      ALL_INSTRUMENTS.forEach(instrument => {
        expect(instrument.name).toBeDefined();
        expect(instrument.type).toBeDefined();
        expect(instrument.category).toBeDefined();
        
        expect(typeof instrument.name).toBe('string');
        expect(['drum', 'synth', 'sampler', 'pad', 'lead', 'bass', 'strings', 'winds', 'percussion'].includes(instrument.type)).toBe(true);
        
        // Some instruments use samples instead of synthParams (like drums)
        if (instrument.type === 'drum' || instrument.type === 'sampler') {
          expect(instrument.samples || instrument.synthParams).toBeDefined();
        } else {
          expect(instrument.synthParams).toBeDefined();
        }
      });
    });
  });

  describe('INSTRUMENT_CATEGORIES', () => {
    it('should have all required categories', () => {
      expect(INSTRUMENT_CATEGORIES.rhythm).toBeDefined();
      expect(INSTRUMENT_CATEGORIES.melody).toBeDefined();
      expect(INSTRUMENT_CATEGORIES.harmony).toBeDefined();
      expect(INSTRUMENT_CATEGORIES.effects).toBeDefined();
    });

    it('should have instruments in each category', () => {
      Object.values(INSTRUMENT_CATEGORIES).forEach(category => {
        expect(category.length).toBeGreaterThan(0);
      });
    });

    it('should match instruments in ALL_INSTRUMENTS', () => {
      const categoryInstruments = Object.values(INSTRUMENT_CATEGORIES).flat();
      expect(categoryInstruments.length).toBe(ALL_INSTRUMENTS.length);
    });
  });

  describe('Instrument Synthesis Parameters', () => {
    it('should have valid envelope parameters', () => {
      ALL_INSTRUMENTS.forEach(instrument => {
        if (instrument.synthParams) {
          const envelope = instrument.synthParams.envelope;
          expect(envelope.attack).toBeGreaterThanOrEqual(0);
          expect(envelope.decay).toBeGreaterThanOrEqual(0);
          expect(envelope.sustain).toBeGreaterThanOrEqual(0);
          expect(envelope.sustain).toBeLessThanOrEqual(1);
          expect(envelope.release).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should have valid oscillator types', () => {
      const validOscTypes = ['sine', 'sawtooth', 'square', 'triangle'];
      
      ALL_INSTRUMENTS.forEach(instrument => {
        if (instrument.synthParams) {
          const oscType = instrument.synthParams.oscillator.type;
          expect(validOscTypes.includes(oscType)).toBe(true);
        }
      });
    });

    it('should have filter parameters for some instruments', () => {
      const instrumentsWithFilters = ALL_INSTRUMENTS.filter(
        inst => inst.synthParams && inst.synthParams.filter
      );
      
      expect(instrumentsWithFilters.length).toBeGreaterThan(0);
      
      instrumentsWithFilters.forEach(instrument => {
        if (instrument.synthParams) {
          const filter = instrument.synthParams.filter!;
          expect(filter.frequency).toBeGreaterThan(0);
          expect(['lowpass', 'highpass', 'bandpass'].includes(filter.type || 'lowpass')).toBe(true);
          if (filter.Q) {
            expect(filter.Q).toBeGreaterThan(0);
          }
        }
      });
    });
  });
});