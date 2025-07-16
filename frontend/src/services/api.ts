const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ThemeGenerationRequest {
  theme: string;
  style: 'cartoon' | 'realistic' | 'simple';
}

export interface ThemeImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  altText: string;
  safetyScore: number;
  selected: boolean;
}

export interface ThemeGenerationResponse {
  generationId: string;
  status: 'processing' | 'completed' | 'failed';
  theme: string;
  images?: ThemeImage[];
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async generateTheme(request: ThemeGenerationRequest): Promise<ThemeGenerationResponse> {
    console.log('API_BASE_URL:', API_BASE_URL);
    const url = `${API_BASE_URL}/themes/generate`;
    console.log('Attempting to call:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Theme generation failed');
    }

    return response.json();
  }

  async getThemes() {
    const response = await fetch(`${API_BASE_URL}/themes`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch themes');
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    return data;
  }

  async register(email: string, password: string, userType: 'parent' | 'child', parentPin?: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userType, parentPin })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Registration failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    return data;
  }

  logout() {
    localStorage.removeItem('authToken');
  }
}

export const apiService = new ApiService();