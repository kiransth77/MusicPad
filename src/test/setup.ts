import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Audio API
const mockAudioContext = {
  state: 'running',
  sampleRate: 44100,
  currentTime: 0,
  destination: {},
  createOscillator: vi.fn(),
  createGain: vi.fn(),
  createAnalyser: vi.fn(),
  createBiquadFilter: vi.fn(),
  createBuffer: vi.fn(),
  createBufferSource: vi.fn(),
  resume: vi.fn().mockResolvedValue(undefined),
  suspend: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
};

// @ts-expect-error - Mocking global AudioContext
global.AudioContext = vi.fn(() => mockAudioContext);
// @ts-expect-error - Mocking global webkitAudioContext
global.webkitAudioContext = vi.fn(() => mockAudioContext);

// Mock Tone.js
vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  setContext: vi.fn(),
  getContext: vi.fn(() => mockAudioContext),
  context: mockAudioContext,
  Gain: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    dispose: vi.fn(),
    volume: { value: 0 },
  })),
  Oscillator: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    dispose: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440 },
  })),
  Player: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    dispose: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    volume: { value: 0 },
  })),
  Limiter: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    dispose: vi.fn(),
    toDestination: vi.fn(),
  })),
  Context: vi.fn(() => mockAudioContext),
}));

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock URL.createObjectURL
(globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock-url');
(globalThis as any).URL.revokeObjectURL = vi.fn();