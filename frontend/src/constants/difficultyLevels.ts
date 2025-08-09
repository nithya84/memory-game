export interface DifficultyLevel {
  pairs: number;
  label: string;
  description: string;
  estimatedTime: string;
  color: string;
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    pairs: 3,
    label: 'Easy',
    description: '6 cards total',
    estimatedTime: '1-2 minutes',
    color: '#7b9f8a' // Muted sage green
  },
  {
    pairs: 6,
    label: 'Medium',
    description: '12 cards total',
    estimatedTime: '3-5 minutes',
    color: '#c4a569' // Warm gold
  },
  {
    pairs: 12,
    label: 'Hard',
    description: '24 cards total',
    estimatedTime: '5-8 minutes',
    color: '#a67b5b' // Muted brown
  },
  {
    pairs: 16,
    label: 'Expert',
    description: '32 cards total',
    estimatedTime: '8-12 minutes',
    color: '#8a7ca8' // Muted purple
  }
];

// Helper functions
export const getDifficultyByPairs = (pairs: number): DifficultyLevel | undefined => {
  return DIFFICULTY_LEVELS.find(level => level.pairs === pairs);
};

export const getDifficultyIndex = (pairs: number): number => {
  return DIFFICULTY_LEVELS.findIndex(level => level.pairs === pairs);
};

export const getNextDifficulty = (currentPairs: number): DifficultyLevel | null => {
  const currentIndex = getDifficultyIndex(currentPairs);
  if (currentIndex >= 0 && currentIndex < DIFFICULTY_LEVELS.length - 1) {
    return DIFFICULTY_LEVELS[currentIndex + 1];
  }
  return null;
};

export const getPreviousDifficulty = (currentPairs: number): DifficultyLevel | null => {
  const currentIndex = getDifficultyIndex(currentPairs);
  if (currentIndex > 0) {
    return DIFFICULTY_LEVELS[currentIndex - 1];
  }
  return null;
};