import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DrumMachine from '../components/DrumMachine';

// Mock the audio hook - the hook exports useAudioEngine as a named export
vi.mock('../hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    playSample: vi.fn(),
    loadSample: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('DrumMachine Component', () => {
  const mockLayerId = 'test-drum-layer';

  it('renders drum pads after loading', async () => {
    render(<DrumMachine layerId={mockLayerId} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading Drum Kit...')).not.toBeInTheDocument();
    });
    
    // Check if drum pads are rendered
    expect(screen.getByText('KICK')).toBeInTheDocument();
    expect(screen.getByText('SNARE')).toBeInTheDocument();
    expect(screen.getByText('HI-HAT')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });

  it('displays keyboard shortcuts after loading', async () => {
    render(<DrumMachine layerId={mockLayerId} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading Drum Kit...')).not.toBeInTheDocument();
    });
    
    // Check if keyboard shortcuts are displayed (they appear as "Q:KICK" format)
    expect(screen.getByText(/Q.*:.*KICK/)).toBeInTheDocument();
    expect(screen.getByText(/W.*:.*SNARE/)).toBeInTheDocument();
    expect(screen.getByText(/E.*:.*HI-HAT/)).toBeInTheDocument();
    expect(screen.getByText(/R.*:.*OPEN/)).toBeInTheDocument();
  });

  it('shows layer title after loading', async () => {
    render(<DrumMachine layerId={mockLayerId} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading Drum Kit...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Electronic Drum Kit')).toBeInTheDocument();
  });

  it('handles drum pad clicks after loading', async () => {
    render(<DrumMachine layerId={mockLayerId} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading Drum Kit...')).not.toBeInTheDocument();
    });

    const kickPad = screen.getByText('KICK').closest('button');
    expect(kickPad).toBeInTheDocument();

    if (kickPad) {
      fireEvent.click(kickPad);
      // In a real test, we could verify the playSample function was called
    }
  });

  it('shows loading state initially', () => {
    render(<DrumMachine layerId={mockLayerId} />);
    
    // Should show loading initially
    expect(screen.getByText('Loading Drum Kit...')).toBeInTheDocument();
  });
});