import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import Card, { CardData } from './Card';

const mockCard: CardData = {
  id: 'test-card-1',
  imageUrl: 'https://example.com/test-image.jpg',
  altText: 'Test Animal',
  isMatched: false
};

describe('Card Component', () => {
  it('renders card in face-down state by default', () => {
    const onClick = vi.fn();
    render(
      <Card
        card={mockCard}
        isFlipped={false}
        isDisabled={false}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('memory-card');
    expect(card).not.toHaveClass('flipped');
    expect(card).toHaveAttribute('aria-label', 'Memory card (face down)');
  });

  it('renders card in flipped state when isFlipped is true', () => {
    const onClick = vi.fn();
    render(
      <Card
        card={mockCard}
        isFlipped={true}
        isDisabled={false}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('flipped');
    expect(card).toHaveAttribute('aria-label', mockCard.altText);
    
    const image = screen.getByAltText(mockCard.altText);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockCard.imageUrl);
  });

  it('renders matched card with correct styling', () => {
    const matchedCard = { ...mockCard, isMatched: true };
    const onClick = vi.fn();
    
    render(
      <Card
        card={matchedCard}
        isFlipped={true}
        isDisabled={false}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('matched');
  });

  it('calls onClick when card is clicked and not disabled', () => {
    const onClick = vi.fn();
    render(
      <Card
        card={mockCard}
        isFlipped={false}
        isDisabled={false}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(onClick).toHaveBeenCalledWith(mockCard.id);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when card is disabled', () => {
    const onClick = vi.fn();
    render(
      <Card
        card={mockCard}
        isFlipped={false}
        isDisabled={true}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('disabled');
    
    fireEvent.click(card);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when card is already flipped', () => {
    const onClick = vi.fn();
    render(
      <Card
        card={mockCard}
        isFlipped={true}
        isDisabled={false}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when card is already matched', () => {
    const matchedCard = { ...mockCard, isMatched: true };
    const onClick = vi.fn();
    
    render(
      <Card
        card={matchedCard}
        isFlipped={false}
        isDisabled={false}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('handles keyboard navigation', () => {
    const onClick = vi.fn();
    render(
      <Card
        card={mockCard}
        isFlipped={false}
        isDisabled={false}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith(mockCard.id);
    
    // Reset mock
    onClick.mockClear();
    
    // Test Space key
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledWith(mockCard.id);
    
    // Reset mock
    onClick.mockClear();
    
    // Test other keys are ignored
    fireEvent.keyDown(card, { key: 'Escape' });
    expect(onClick).not.toHaveBeenCalled();
  });
});