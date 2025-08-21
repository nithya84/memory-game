const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiService {
  async getThemes() {
    const response = await fetch(`${API_BASE_URL}/themes`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch themes');
    }

    return response.json();
  }

  async getThemeImages(themeId: string) {
    const response = await fetch(`${API_BASE_URL}/themes/${themeId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch theme images');
    }

    return response.json();
  }
}

export const apiService = new ApiService();