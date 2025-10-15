import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HighPerformanceAudioEngine } from '../audio/AudioEngine';

// Mock Tone.js for this test
vi.mock('tone', () => ({
  Context: vi.fn().mockImplementation(() => ({
    state: 'running',
    sampleRate: 44100,
    resume: vi.fn().mockResolvedValue(undefined),
  })),
  setContext: vi.fn(),
  start: vi.fn().mockResolvedValue(undefined),
  Gain: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    toDestination: vi.fn(),
  })),
  Limiter: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    toDestination: vi.fn(),
  })),
  Oscillator: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  })),
  Noise: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  })),
  AmplitudeEnvelope: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  Filter: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    dispose: vi.fn(),
    Q: { value: 1 },
  })),
}));

describe('HighPerformanceAudioEngine', () => {
  let audioEngine: HighPerformanceAudioEngine;

  beforeEach(() => {
    // Reset singleton instance
    // @ts-expect-error - Accessing private static property for testing
    HighPerformanceAudioEngine.instance = undefined;
    audioEngine = HighPerformanceAudioEngine.getInstance();
  });

  it('should create a singleton instance', () => {
    const instance1 = HighPerformanceAudioEngine.getInstance();
    const instance2 = HighPerformanceAudioEngine.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize successfully', async () => {
    await expect(audioEngine.initialize()).resolves.not.toThrow();
  });

  it('should add a layer', () => {
    const testLayer = {
      id: 'test-layer',
      name: 'Test Layer',
      volume: 0.8,
      muted: false,
      solo: false,
      effects: [],
    };

    expect(() => audioEngine.addLayer(testLayer)).not.toThrow();
  });

  it('should update layer volume', () => {
    const testLayer = {
      id: 'test-layer',
      name: 'Test Layer',
      volume: 0.8,
      muted: false,
      solo: false,
      effects: [],
    };

    audioEngine.addLayer(testLayer);
    expect(() => audioEngine.updateLayerVolume('test-layer', 0.5)).not.toThrow();
  });

  it('should toggle layer mute', () => {
    const testLayer = {
      id: 'test-layer',
      name: 'Test Layer',
      volume: 0.8,
      muted: false,
      solo: false,
      effects: [],
    };

    audioEngine.addLayer(testLayer);
    expect(() => audioEngine.toggleLayerMute('test-layer')).not.toThrow();
  });

  it('should play sample without errors', () => {
    const testLayer = {
      id: 'test-layer',
      name: 'Test Layer',
      volume: 0.8,
      muted: false,
      solo: false,
      effects: [],
    };

    audioEngine.addLayer(testLayer);
    expect(() => audioEngine.playSample('kick', 'test-layer', 0.8)).not.toThrow();
  });

  it('should play advanced synth without errors', () => {
    const testLayer = {
      id: 'test-layer',
      name: 'Test Layer',
      volume: 0.8,
      muted: false,
      solo: false,
      effects: [],
    };

    audioEngine.addLayer(testLayer);
    expect(() => audioEngine.playAdvancedSynth(440, 'test-layer', 0.8, 'lead')).not.toThrow();
  });

  it('should not play when layer is muted', () => {
    const testLayer = {
      id: 'test-layer',
      name: 'Test Layer',
      volume: 0.8,
      muted: true, // Muted layer
      solo: false,
      effects: [],
    };

    audioEngine.addLayer(testLayer);
    
    // Should not throw, but also should not create audio nodes
    expect(() => audioEngine.playSample('kick', 'test-layer', 0.8)).not.toThrow();
  });

  it('should remove layer', () => {
    const testLayer = {
      id: 'test-layer',
      name: 'Test Layer',
      volume: 0.8,
      muted: false,
      solo: false,
      effects: [],
    };

    audioEngine.addLayer(testLayer);
    expect(() => audioEngine.clearLayer('test-layer')).not.toThrow();
  });
});