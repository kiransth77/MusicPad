import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('MusicPad App', () => {
  it('renders the main title', () => {
    render(<App />);
    expect(screen.getByText('MusicPad')).toBeInTheDocument();
  });

  it('shows audio prompt when audio is not ready', () => {
    render(<App />);
    // Use a more specific query to avoid the duplicate text issue
    expect(screen.getByRole('button', { name: /🔊 Enable Audio & Start Creating/i })).toBeInTheDocument();
  });

  it('displays the WAV generator button', () => {
    render(<App />);
    expect(screen.getByText(/Generate Samples/i)).toBeInTheDocument();
  });

  it('shows high-performance music creation platform subtitle', () => {
    render(<App />);
    expect(screen.getByText('High-Performance Music Creation Platform')).toBeInTheDocument();
  });

  it('has audio setup required heading when audio is not ready', () => {
    render(<App />);
    expect(screen.getByText(/Audio Setup Required/i)).toBeInTheDocument();
  });
});