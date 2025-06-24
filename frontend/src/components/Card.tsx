import React from 'react';
import './Card.css';

export interface CardData {
  id: string;
  imageUrl: string;
  altText: string;
  isMatched: boolean;
}

interface CardProps {
  card: CardData;
  isFlipped: boolean;
  isDisabled: boolean;
  onClick: (cardId: string) => void;
}

const Card: React.FC<CardProps> = ({ card, isFlipped, isDisabled, onClick }) => {
  const handleClick = () => {
    if (!isDisabled && !isFlipped && !card.isMatched) {
      onClick(card.id);
    }
  };

  const cardClasses = [
    'memory-card',
    isFlipped ? 'flipped' : '',
    card.isMatched ? 'matched' : '',
    isDisabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={(isFlipped && !card.isMatched)? card.altText : 'Memory card (face down)'}
    >
      <div className="card-inner">
        {/* Card Back */}
        <div className="card-face card-back">
          <div className="card-pattern">
            <div className="pattern-dots"></div>
          </div>
        </div>
        
        {/* Card Front */}
        <div className="card-face card-front">
          <img 
            src={card.imageUrl} 
            alt={card.altText}
            className="card-image"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Card;