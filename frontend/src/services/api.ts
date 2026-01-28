const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
const FETCH_TIMEOUT = 3000; // 3 seconds

// Helper function to add timeout to fetch requests
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

class ApiService {
  private themesCache: any = null;
  private themeImagesCache: Map<string, any> = new Map();

  async getThemes() {
    // Return cached themes if available
    if (this.themesCache) {
      return this.themesCache;
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/themes`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch themes');
    }

    const data = await response.json();
    this.themesCache = data; // Cache the result
    return data;
  }

  async getThemeImages(themeId: string) {
    // Return cached theme images if available
    if (this.themeImagesCache.has(themeId)) {
      return this.themeImagesCache.get(themeId);
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/themes/${themeId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch theme images');
    }

    const data = await response.json();
    this.themeImagesCache.set(themeId, data); // Cache the result
    return data;
  }

  // Method to clear cache if needed
  clearCache() {
    this.themesCache = null;
    this.themeImagesCache.clear();
  }
}

export const apiService = new ApiService();