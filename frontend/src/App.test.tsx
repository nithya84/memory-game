import { describe, it, expect } from 'vitest';
import { render, screen } from './test/test-utils';
import App from './App';

describe('App', () => {
  it('renders home page by default', () => {
    render(<App />);
    expect(screen.getByText('Memory Game')).toBeInTheDocument();
    expect(screen.getByText('Play Game')).toBeInTheDocument();
  });

  it('displays navigation links', () => {
    render(<App />);
    expect(screen.getByText('Play Game')).toBeInTheDocument();
    expect(screen.getByText('Create Custom Game')).toBeInTheDocument();
    expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
  });
});