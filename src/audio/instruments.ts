// Optimized instrument definitions with minimal memory footprint
export interface InstrumentConfig {
  id: string;
  name: string;
  type: 'sampler' | 'synth' | 'drum' | 'bass' | 'lead' | 'pad' | 'percussion' | 'strings' | 'winds';
  samples?: Record<string, string>;
  synthParams?: SynthParams;
  category: 'rhythm' | 'melody' | 'harmony' | 'effects';
}

export interface SynthParams {
  oscillator: {
    type: 'sine' | 'square' | 'sawtooth' | 'triangle';
    detune?: number;
    harmonicity?: number;
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filter?: {
    frequency: number;
    Q: number;
    type?: 'lowpass' | 'highpass' | 'bandpass';
  };
  modulation?: {
    frequency: number;
    depth: number;
    type: 'vibrato' | 'tremolo' | 'filter';
  };
  effects?: string[];
}

// === RHYTHM SECTION ===

export const DRUM_KIT: InstrumentConfig = {
  id: 'drum-kit',
  name: 'Electronic Drum Kit',
  type: 'drum',
  category: 'rhythm',
  samples: {
    kick: '/samples/kick.wav',
    snare: '/samples/snare.wav',
    hihat: '/samples/hihat.wav',
    openhat: '/samples/openhat.wav',
    crash: '/samples/crash.wav',
    ride: '/samples/ride.wav',
    tom1: '/samples/tom1.wav',
    tom2: '/samples/tom2.wav'
  }
};

export const PERCUSSION_KIT: InstrumentConfig = {
  id: 'percussion',
  name: 'Percussion Kit',
  type: 'percussion',
  category: 'rhythm',
  synthParams: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.2 }
  }
};

// === BASS SECTION ===

export const SUB_BASS: InstrumentConfig = {
  id: 'sub-bass',
  name: 'Sub Bass',
  type: 'bass',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 },
    filter: { frequency: 200, Q: 1, type: 'lowpass' }
  }
};

export const ACID_BASS: InstrumentConfig = {
  id: 'acid-bass',
  name: 'Acid Bass',
  type: 'bass',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4 },
    filter: { frequency: 300, Q: 15, type: 'lowpass' },
    modulation: { frequency: 8, depth: 0.8, type: 'filter' }
  }
};

export const BASS_808: InstrumentConfig = {
  id: 'bass-808',
  name: '808 Bass',
  type: 'bass',
  category: 'rhythm',
  synthParams: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.8 },
    filter: { frequency: 150, Q: 1, type: 'lowpass' }
  }
};

// === LEAD SECTION ===

export const SQUARE_LEAD: InstrumentConfig = {
  id: 'square-lead',
  name: 'Square Lead',
  type: 'lead',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
    filter: { frequency: 2000, Q: 2, type: 'lowpass' }
  }
};

export const SAW_LEAD: InstrumentConfig = {
  id: 'saw-lead',
  name: 'Saw Lead',
  type: 'lead',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4 },
    filter: { frequency: 1500, Q: 3, type: 'lowpass' },
    modulation: { frequency: 5, depth: 0.3, type: 'vibrato' }
  }
};

export const PLUCK_LEAD: InstrumentConfig = {
  id: 'pluck-lead',
  name: 'Pluck Lead',
  type: 'lead',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.8, sustain: 0, release: 0.1 },
    filter: { frequency: 3000, Q: 1, type: 'lowpass' }
  }
};

// === PAD SECTION ===

export const WARM_PAD: InstrumentConfig = {
  id: 'warm-pad',
  name: 'Warm Pad',
  type: 'pad',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'sine' },
    envelope: { attack: 1.0, decay: 0.5, sustain: 0.8, release: 2.0 },
    filter: { frequency: 800, Q: 1, type: 'lowpass' }
  }
};

export const STRING_PAD: InstrumentConfig = {
  id: 'string-pad',
  name: 'String Pad',
  type: 'pad',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 1.5, decay: 0.3, sustain: 0.9, release: 1.5 },
    filter: { frequency: 1200, Q: 2, type: 'lowpass' },
    modulation: { frequency: 2, depth: 0.2, type: 'vibrato' }
  }
};

// === MELODIC PERCUSSION ===

export const MARIMBA: InstrumentConfig = {
  id: 'marimba',
  name: 'Marimba',
  type: 'percussion',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 1.0, sustain: 0.2, release: 1.0 },
    filter: { frequency: 2000, Q: 1, type: 'lowpass' }
  }
};

export const XYLOPHONE: InstrumentConfig = {
  id: 'xylophone',
  name: 'Xylophone',
  type: 'percussion',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.5 },
    filter: { frequency: 4000, Q: 2, type: 'lowpass' }
  }
};

export const STEEL_DRUMS: InstrumentConfig = {
  id: 'steel-drums',
  name: 'Steel Drums',
  type: 'percussion',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sine', harmonicity: 2 },
    envelope: { attack: 0.01, decay: 0.8, sustain: 0.3, release: 1.2 },
    filter: { frequency: 1500, Q: 3, type: 'bandpass' }
  }
};

// === STRING INSTRUMENTS ===

export const VIOLIN_SYNTH: InstrumentConfig = {
  id: 'violin-synth',
  name: 'Synthetic Violin',
  type: 'strings',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 0.5 },
    filter: { frequency: 2500, Q: 2, type: 'lowpass' },
    modulation: { frequency: 6, depth: 0.4, type: 'vibrato' }
  }
};

export const GUITAR_SYNTH: InstrumentConfig = {
  id: 'guitar-synth',
  name: 'Synthetic Guitar',
  type: 'strings',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
    filter: { frequency: 1800, Q: 1, type: 'lowpass' }
  }
};

// === WIND INSTRUMENTS ===

export const FLUTE_SYNTH: InstrumentConfig = {
  id: 'flute-synth',
  name: 'Synthetic Flute',
  type: 'winds',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.3 },
    filter: { frequency: 3000, Q: 1, type: 'lowpass' },
    modulation: { frequency: 4, depth: 0.2, type: 'vibrato' }
  }
};

export const SAX_SYNTH: InstrumentConfig = {
  id: 'sax-synth',
  name: 'Synthetic Saxophone',
  type: 'winds',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'square' },
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.4 },
    filter: { frequency: 1000, Q: 3, type: 'bandpass' },
    modulation: { frequency: 5, depth: 0.3, type: 'vibrato' }
  }
};

// === ADDITIONAL INSTRUMENTS ===

// === ORGAN SECTION ===
export const HAMMOND_ORGAN: InstrumentConfig = {
  id: 'hammond-organ',
  name: 'Hammond Organ',
  type: 'synth',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'sine', harmonicity: 2 },
    envelope: { attack: 0.1, decay: 0.0, sustain: 1.0, release: 0.3 },
    filter: { frequency: 2000, Q: 1, type: 'lowpass' },
    modulation: { frequency: 6, depth: 0.1, type: 'tremolo' }
  }
};

export const CHURCH_ORGAN: InstrumentConfig = {
  id: 'church-organ',
  name: 'Church Organ',
  type: 'synth',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'sine', harmonicity: 4 },
    envelope: { attack: 0.3, decay: 0.0, sustain: 1.0, release: 1.0 },
    filter: { frequency: 1500, Q: 2, type: 'lowpass' }
  }
};

// === BRASS SECTION ===
export const TRUMPET_SYNTH: InstrumentConfig = {
  id: 'trumpet-synth',
  name: 'Synthetic Trumpet',
  type: 'winds',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.3 },
    filter: { frequency: 1200, Q: 4, type: 'bandpass' },
    modulation: { frequency: 5, depth: 0.2, type: 'vibrato' }
  }
};

export const TROMBONE_SYNTH: InstrumentConfig = {
  id: 'trombone-synth',
  name: 'Synthetic Trombone',
  type: 'winds',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 0.4 },
    filter: { frequency: 800, Q: 3, type: 'bandpass' },
    modulation: { frequency: 4, depth: 0.15, type: 'vibrato' }
  }
};

export const FRENCH_HORN: InstrumentConfig = {
  id: 'french-horn',
  name: 'French Horn',
  type: 'winds',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.15, decay: 0.2, sustain: 0.7, release: 0.5 },
    filter: { frequency: 1000, Q: 2, type: 'lowpass' }
  }
};

// === CHOIR & VOCAL ===
export const CHOIR_PAD: InstrumentConfig = {
  id: 'choir-pad',
  name: 'Choir Pad',
  type: 'pad',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 1.5, decay: 0.3, sustain: 0.8, release: 2.0 },
    filter: { frequency: 800, Q: 2, type: 'bandpass' },
    modulation: { frequency: 2, depth: 0.3, type: 'vibrato' }
  }
};

export const VOX_LEAD: InstrumentConfig = {
  id: 'vox-lead',
  name: 'Vocal Lead',
  type: 'lead',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.4 },
    filter: { frequency: 1200, Q: 3, type: 'bandpass' },
    modulation: { frequency: 6, depth: 0.4, type: 'vibrato' }
  }
};

// === ADVANCED SYNTHESIS ===
export const FM_BELL: InstrumentConfig = {
  id: 'fm-bell',
  name: 'FM Bell',
  type: 'percussion',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sine', harmonicity: 3.14 },
    envelope: { attack: 0.01, decay: 2.0, sustain: 0.1, release: 3.0 },
    filter: { frequency: 2000, Q: 1, type: 'lowpass' }
  }
};

export const GRANULAR_PAD: InstrumentConfig = {
  id: 'granular-pad',
  name: 'Granular Pad',
  type: 'pad',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'triangle', detune: 0.1 },
    envelope: { attack: 2.0, decay: 0.5, sustain: 0.9, release: 3.0 },
    filter: { frequency: 600, Q: 1.5, type: 'lowpass' },
    modulation: { frequency: 0.5, depth: 0.2, type: 'filter' }
  }
};

export const ADDITIVE_SYNTH: InstrumentConfig = {
  id: 'additive-synth',
  name: 'Additive Synth',
  type: 'synth',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sine', harmonicity: 1.618 },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.5 },
    filter: { frequency: 1500, Q: 2, type: 'lowpass' }
  }
};

// === ETHNIC & WORLD INSTRUMENTS ===
export const SITAR_SYNTH: InstrumentConfig = {
  id: 'sitar-synth',
  name: 'Synthetic Sitar',
  type: 'strings',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'sawtooth', detune: 0.2 },
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 1.5 },
    filter: { frequency: 1800, Q: 5, type: 'bandpass' },
    modulation: { frequency: 8, depth: 0.6, type: 'vibrato' }
  }
};

export const SHAMISEN: InstrumentConfig = {
  id: 'shamisen',
  name: 'Shamisen',
  type: 'strings',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 1.0 },
    filter: { frequency: 2500, Q: 3, type: 'highpass' }
  }
};

export const TABLA: InstrumentConfig = {
  id: 'tabla',
  name: 'Tabla',
  type: 'percussion',
  category: 'rhythm',
  synthParams: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.4 },
    filter: { frequency: 300, Q: 4, type: 'bandpass' }
  }
};

// === ELECTRONIC & MODERN ===
export const DUBSTEP_WOBBLE: InstrumentConfig = {
  id: 'dubstep-wobble',
  name: 'Dubstep Wobble',
  type: 'bass',
  category: 'effects',
  synthParams: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
    filter: { frequency: 200, Q: 20, type: 'lowpass' },
    modulation: { frequency: 16, depth: 1.0, type: 'filter' }
  }
};

export const CHIPTUNE_LEAD: InstrumentConfig = {
  id: 'chiptune-lead',
  name: 'Chiptune Lead',
  type: 'lead',
  category: 'melody',
  synthParams: {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.2 },
    filter: { frequency: 3000, Q: 1, type: 'lowpass' }
  }
};

export const AMBIENT_TEXTURE: InstrumentConfig = {
  id: 'ambient-texture',
  name: 'Ambient Texture',
  type: 'pad',
  category: 'effects',
  synthParams: {
    oscillator: { type: 'triangle', detune: 0.3 },
    envelope: { attack: 3.0, decay: 1.0, sustain: 0.7, release: 4.0 },
    filter: { frequency: 400, Q: 0.5, type: 'lowpass' },
    modulation: { frequency: 0.2, depth: 0.4, type: 'filter' }
  }
};

// === BASS COLLECTION ===
export const SLAP_BASS: InstrumentConfig = {
  id: 'slap-bass',
  name: 'Slap Bass',
  type: 'bass',
  category: 'rhythm',
  synthParams: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 },
    filter: { frequency: 400, Q: 3, type: 'lowpass' }
  }
};

// === MOOG_BASS ===
export const MOOG_BASS: InstrumentConfig = {
  id: 'moog-bass',
  name: 'Moog Bass',
  type: 'bass',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.4 },
    filter: { frequency: 250, Q: 8, type: 'lowpass' },
    modulation: { frequency: 1, depth: 0.3, type: 'filter' }
  }
};

// === ELECTRIC PIANO ===
export const ELECTRIC_PIANO: InstrumentConfig = {
  id: 'electric-piano',
  name: 'Electric Piano',
  type: 'synth',
  category: 'harmony',
  synthParams: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 1.0 },
    filter: { frequency: 2000, Q: 1, type: 'lowpass' }
  }
};

// === EFFECTS & SPECIAL ===

export const LASER_ZAP: InstrumentConfig = {
  id: 'laser-zap',
  name: 'Laser Zap',
  type: 'synth',
  category: 'effects',
  synthParams: {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 },
    filter: { frequency: 5000, Q: 10, type: 'lowpass' }
  }
};

// === INSTRUMENT CATEGORIES ===

export const INSTRUMENT_CATEGORIES = {
  rhythm: [DRUM_KIT, PERCUSSION_KIT, BASS_808, TABLA, SLAP_BASS],
  melody: [
    SQUARE_LEAD, SAW_LEAD, PLUCK_LEAD, VIOLIN_SYNTH, FLUTE_SYNTH, SAX_SYNTH, 
    MARIMBA, XYLOPHONE, STEEL_DRUMS, TRUMPET_SYNTH, TROMBONE_SYNTH, VOX_LEAD,
    FM_BELL, ADDITIVE_SYNTH, SITAR_SYNTH, SHAMISEN, CHIPTUNE_LEAD
  ],
  harmony: [
    SUB_BASS, ACID_BASS, WARM_PAD, STRING_PAD, GUITAR_SYNTH, ELECTRIC_PIANO,
    HAMMOND_ORGAN, CHURCH_ORGAN, FRENCH_HORN, CHOIR_PAD, GRANULAR_PAD, MOOG_BASS
  ],
  effects: [LASER_ZAP, DUBSTEP_WOBBLE, AMBIENT_TEXTURE]
};

export const ALL_INSTRUMENTS = [
  // Rhythm
  DRUM_KIT, PERCUSSION_KIT, BASS_808, TABLA, SLAP_BASS,
  // Bass
  SUB_BASS, ACID_BASS, MOOG_BASS,
  // Leads
  SQUARE_LEAD, SAW_LEAD, PLUCK_LEAD, VOX_LEAD, CHIPTUNE_LEAD,
  // Pads
  WARM_PAD, STRING_PAD, CHOIR_PAD, GRANULAR_PAD, AMBIENT_TEXTURE,
  // Melodic Percussion
  MARIMBA, XYLOPHONE, STEEL_DRUMS, FM_BELL,
  // Strings
  VIOLIN_SYNTH, GUITAR_SYNTH, SITAR_SYNTH, SHAMISEN,
  // Winds & Brass
  FLUTE_SYNTH, SAX_SYNTH, TRUMPET_SYNTH, TROMBONE_SYNTH, FRENCH_HORN,
  // Keyboards
  ELECTRIC_PIANO, HAMMOND_ORGAN, CHURCH_ORGAN,
  // Advanced Synthesis
  ADDITIVE_SYNTH,
  // Effects
  LASER_ZAP, DUBSTEP_WOBBLE
];