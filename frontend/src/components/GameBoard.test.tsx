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
    expect(screen.getByText('0/3 Matched')).toBeInTheDocument();
    
    // Should have 6 cards (3 pairs)
    const cards = screen.getAllByTestId(/card-/);
    expect(cards).toHaveLength(6);
  });


  it('flips cards when clicked', () => {
    render(<GameBoard difficulty={3} />);
    
    const cards = screen.getAllByTestId(/card-/);
    
    // Click first card
    fireEvent.click(cards[0]);
    expect(cards[0]).toHaveAttribute('data-flipped', 'true');
    
    // Click second card  
    fireEvent.click(cards[1]);
    expect(cards[1]).toHaveAttribute('data-flipped', 'true');
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
      expect(screen.getByText('1/1 Matched')).toBeInTheDocument();
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
    
    // Click New Game
    const newGameButton = screen.getByText('🔄 New Game (Same Level)');
    fireEvent.click(newGameButton);
    
    // Game should reset
    expect(screen.getByText('0/3 Matched')).toBeInTheDocument();
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
    expect(screen.getByText('0/1 Matched')).toBeInTheDocument();
    expect(screen.queryByText('🎉 Congratulations!')).not.toBeInTheDocument();
  });


});