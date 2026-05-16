import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator
const LOCAL_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL;

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignored
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers = await this.getHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    
    return response.json();
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers = await this.getHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    
    return response.json();
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers = await this.getHeaders();
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    
    return response.json();
  }
}

export const api = new ApiClient();
