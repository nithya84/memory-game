export interface User {
    id: string;
    email: string;
    userType: 'parent' | 'child';
    parentId?: string;
    createdAt: string;
    lastLoginAt?: string;
    settings: UserSettings;
}
export interface UserSettings {
    soundEnabled: boolean;
    soundVolume: number;
    colorTheme: 'calm' | 'dark' | 'high-contrast';
    fontSize: 'small' | 'medium' | 'large';
    animationsEnabled: boolean;
    autoSave: boolean;
}
export interface Theme {
    id: string;
    userId: string;
    name: string;
    images: ThemeImage[];
    createdAt: string;
    lastUsed?: string;
}
export interface ThemeImage {
    id: string;
    url: string;
    thumbnailUrl: string;
    altText: string;
    safetyScore: number;
    selected: boolean;
}
export interface Game {
    id: string;
    userId: string;
    name: string;
    themeId: string;
    selectedImages: string[];
    pairCount: number;
    settings: GameSettings;
    createdAt: string;
    timesPlayed: number;
    bestTime?: number;
    lastPlayed?: string;
}
export interface GameSettings {
    soundEnabled: boolean;
    removeMatched: boolean;
    showProgress: boolean;
}
export interface Session {
    id: string;
    userId: string;
    gameId: string;
    startTime: string;
    endTime?: string;
    completionTime?: number;
    totalMoves: number;
    matchedPairs: number;
    status: 'active' | 'paused' | 'completed';
    moves: Move[];
}
export interface Move {
    cardId: string;
    timestamp: string;
    matched?: boolean;
    pairId?: string;
}
export interface Card {
    id: string;
    imageId: string;
    imageUrl: string;
    altText: string;
    isFlipped: boolean;
    isMatched: boolean;
    pairId: string;
}
export interface GameState {
    cards: Card[];
    flippedCards: Card[];
    matchedPairs: number;
    totalPairs: number;
    moves: number;
    startTime?: number;
    endTime?: number;
    isComplete: boolean;
    isPaused: boolean;
}
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
    requestId: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    userType: 'parent' | 'child';
    parentPin?: string;
}
export interface ThemeGenerationRequest {
    theme: string;
    imageCount: number;
    style: 'cartoon' | 'realistic' | 'simple';
}
export interface ThemeGenerationResponse {
    generationId: string;
    status: 'processing' | 'completed' | 'failed';
    progress?: number;
    estimatedTime?: number;
    estimatedTimeRemaining?: number;
    images?: ThemeImage[];
}
