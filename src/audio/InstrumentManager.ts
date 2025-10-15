import { InstrumentConfig } from './instruments';

export interface InstrumentLayer {
  id: string;
  name: string;
  instrumentConfig: InstrumentConfig;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: string[];
}

export class InstrumentManager {
  private static instance: InstrumentManager;
  private layers: Map<string, InstrumentLayer> = new Map();
  private activeInstruments: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): InstrumentManager {
    if (!InstrumentManager.instance) {
      InstrumentManager.instance = new InstrumentManager();
    }
    return InstrumentManager.instance;
  }

  addInstrumentLayer(layer: InstrumentLayer): void {
    this.layers.set(layer.id, layer);
  }

  removeInstrumentLayer(layerId: string): void {
    this.layers.delete(layerId);
    const instrument = this.activeInstruments.get(layerId);
    if (instrument && instrument.dispose) {
      instrument.dispose();
    }
    this.activeInstruments.delete(layerId);
  }

  getLayer(layerId: string): InstrumentLayer | undefined {
    return this.layers.get(layerId);
  }

  getAllLayers(): InstrumentLayer[] {
    return Array.from(this.layers.values());
  }

  updateLayerVolume(layerId: string, volume: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.volume = volume;
    }
  }

  toggleLayerMute(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.muted = !layer.muted;
    }
  }

  createCustomInstrument(name: string, config: Partial<InstrumentConfig>): InstrumentConfig {
    return {
      id: `custom-${Date.now()}`,
      name,
      type: config.type || 'synth',
      category: config.category || 'melody',
      samples: config.samples,
      synthParams: config.synthParams || {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
      }
    };
  }

  cloneInstrument(instrumentId: string, newName: string): InstrumentConfig | null {
    const layer = Array.from(this.layers.values()).find(l => l.instrumentConfig.id === instrumentId);
    if (layer) {
      return {
        ...layer.instrumentConfig,
        id: `clone-${Date.now()}`,
        name: newName
      };
    }
    return null;
  }
}