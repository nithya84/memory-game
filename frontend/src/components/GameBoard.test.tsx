import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import GameBoard from './GameBoard';

// Mock the Card component to simplify testing
vi.mock('./Card', () => ({
  default: ({ card, isFlipped, isDisabled, onClick }: any) => (
    <button
      data-testid={`card-${card.id}`}
      data-flipped={isFlipped}
      data-disabled={isDisabled}
      onClick={() => !isDisabled && !isFlipped && !card.isMatched && onClick(card.id)}
      className={`card ${isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
    >
      {isFlipped ? card.altText : 'Card Back'}
    </button>
  )
}));

describe('GameBoard Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders game board with correct number of cards', () => {
    render(<GameBoard difficulty={3} />);
    
    expect(screen.getByText('Memory Match')).toBeInTheDocument();
    expect(screen.getByText('Pairs: 0/3')).toBeInTheDocument();
    expect(screen.getByText('Moves: 0')).toBeInTheDocument();
    
    // Should have 6 cards (3 pairs)
    const cards = screen.getAllByTestId(/card-/);
    expect(cards).toHaveLength(6);
  });

  it('renders game board with different difficulty levels', () => {
    const { rerender } = render(<GameBoard difficulty={5} />);
    
    let cards = screen.getAllByTestId(/card-/);
    expect(cards).toHaveLength(10); // 5 pairs = 10 cards
    expect(screen.getByText('Pairs: 0/5')).toBeInTheDocument();
    
    rerender(<GameBoard difficulty={8} />);
    cards = screen.getAllByTestId(/card-/);
    expect(cards).toHaveLength(16); // 8 pairs = 16 cards
    expect(screen.getByText('Pairs: 0/8')).toBeInTheDocument();
  });

  it('starts game on first card click', () => {
    render(<GameBoard difficulty={3} />);
    
    const cards = screen.getAllByTestId(/card-/);
    fireEvent.click(cards[0]);
    
    expect(screen.getByText('Moves: 0')).toBeInTheDocument(); // Move count updates after pair attempt
    expect(cards[0]).toHaveAttribute('data-flipped', 'true');
  });

  it('flips two cards and checks for match', async () => {
    render(<GameBoard difficulty={3} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Click first card
    fireEvent.click(cards[0]);
    expect(cards[0]).toHaveAttribute('data-flipped', 'true');
    
    // Click second card
    fireEvent.click(cards[1]);
    expect(cards[1]).toHaveAttribute('data-flipped', 'true');
    
    // Moves should increment
    await waitFor(() => {
      expect(screen.getByText('Moves: 1')).toBeInTheDocument();
    });
  });

  it('keeps matched cards flipped', async () => {
    const onGameComplete = vi.fn();
    render(<GameBoard difficulty={1} onGameComplete={onGameComplete} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // For difficulty 1, we have exactly 2 cards that must match
    fireEvent.click(cards[0]);
    fireEvent.click(cards[1]);
    
    // Cards should remain flipped and marked as matched
    await waitFor(() => {
      expect(cards[0]).toHaveClass('matched');
      expect(cards[1]).toHaveClass('matched');
      expect(screen.getByText('Pairs: 1/1')).toBeInTheDocument();
    });
  });

  it('flips non-matching cards back after delay', async () => {
    render(<GameBoard difficulty={2} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Click first card
    fireEvent.click(cards[0]);
    
    // Click third card (different pair)
    fireEvent.click(cards[2]);
    
    // Both cards should be flipped initially
    expect(cards[0]).toHaveAttribute('data-flipped', 'true');
    expect(cards[2]).toHaveAttribute('data-flipped', 'true');
    
    // Advance timer by 1 second
    vi.advanceTimersByTime(1000);
    
    // Cards should flip back
    await waitFor(() => {
      expect(cards[0]).toHaveAttribute('data-flipped', 'false');
      expect(cards[2]).toHaveAttribute('data-flipped', 'false');
    });
  });

  it('prevents clicking more than 2 cards at once', async () => {
    render(<GameBoard difficulty={3} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Click first two cards
    fireEvent.click(cards[0]);
    fireEvent.click(cards[1]);
    
    // Wait for state to update
    await waitFor(() => {
      // After 2 cards are flipped, other cards should be disabled
      expect(cards[2]).toHaveAttribute('data-disabled', 'true');
    });
  });

  it('prevents clicking already flipped cards', () => {
    render(<GameBoard difficulty={3} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Click first card
    fireEvent.click(cards[0]);
    expect(cards[0]).toHaveAttribute('data-flipped', 'true');
    
    // Try to click the same card again - should not change anything
    fireEvent.click(cards[0]);
    expect(cards[0]).toHaveAttribute('data-flipped', 'true');
  });

  it('prevents clicking matched cards', async () => {
    render(<GameBoard difficulty={2} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Find and match two cards
    fireEvent.click(cards[0]);
    const firstCardText = cards[0].textContent;
    
    for (let i = 1; i < cards.length; i++) {
      fireEvent.click(cards[i]);
      if (cards[i].textContent === firstCardText) {
        // Wait for match to be processed
        await waitFor(() => {
          expect(cards[0]).toHaveClass('matched');
          expect(cards[i]).toHaveClass('matched');
        });
        
        // Try clicking matched cards - should not respond
        fireEvent.click(cards[0]);
        fireEvent.click(cards[i]);
        
        // Cards should remain matched and flipped
        expect(cards[0]).toHaveClass('matched');
        expect(cards[i]).toHaveClass('matched');
        break;
      }
    }
  });

  it('completes game when all pairs are matched', async () => {
    const onGameComplete = vi.fn();
    render(<GameBoard difficulty={1} onGameComplete={onGameComplete} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Match the single pair
    fireEvent.click(cards[0]);
    fireEvent.click(cards[1]);
    
    await waitFor(() => {
      expect(screen.getByText('🎉 Congratulations!')).toBeInTheDocument();
      expect(screen.getByText(/You completed the game in \d+ moves!/)).toBeInTheDocument();
      expect(onGameComplete).toHaveBeenCalled();
    });
  });

  it('calls onGameComplete with correct stats', async () => {
    const onGameComplete = vi.fn();
    render(<GameBoard difficulty={1} onGameComplete={onGameComplete} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Match the single pair
    fireEvent.click(cards[0]);
    fireEvent.click(cards[1]);
    
    await waitFor(() => {
      expect(onGameComplete).toHaveBeenCalledWith({
        moves: 1,
        time: expect.any(Number)
      });
    });
  });

  it('resets game when New Game button is clicked', () => {
    render(<GameBoard difficulty={3} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Make some moves
    fireEvent.click(cards[0]);
    fireEvent.click(cards[1]);
    
    expect(screen.getByText('Moves: 1')).toBeInTheDocument();
    
    // Click New Game
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    
    // Game should reset
    expect(screen.getByText('Moves: 0')).toBeInTheDocument();
    expect(screen.getByText('Pairs: 0/3')).toBeInTheDocument();
  });

  it('resets game when Play Again button is clicked after completion', async () => {
    render(<GameBoard difficulty={1} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Complete the game
    fireEvent.click(cards[0]);
    fireEvent.click(cards[1]);
    
    await waitFor(() => {
      expect(screen.getByText('🎉 Congratulations!')).toBeInTheDocument();
    });
    
    // Click Play Again
    const playAgainButton = screen.getByText('Play Again');
    fireEvent.click(playAgainButton);
    
    // Game should reset
    expect(screen.getByText('Moves: 0')).toBeInTheDocument();
    expect(screen.getByText('Pairs: 0/1')).toBeInTheDocument();
    expect(screen.queryByText('🎉 Congratulations!')).not.toBeInTheDocument();
  });


  it('updates difficulty when prop changes', () => {
    const { rerender } = render(<GameBoard difficulty={3} />);
    
    expect(screen.getByText('Pairs: 0/3')).toBeInTheDocument();
    let cards = screen.getAllByTestId(/card-/);
    expect(cards).toHaveLength(6);
    
    rerender(<GameBoard difficulty={5} />);
    
    expect(screen.getByText('Pairs: 0/5')).toBeInTheDocument();
    cards = screen.getAllByTestId(/card-/);
    expect(cards).toHaveLength(10);
  });
});