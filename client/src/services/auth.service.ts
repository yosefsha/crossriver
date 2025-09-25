import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  RegisterResponse,
  User, 
  JWTPayload, 
  ApiError 
} from '../types/auth.types';

class AuthService {
  private readonly baseURL = '/auth'; // Traefik routes /auth to auth service
  private readonly TOKEN_KEY = 'myassistant_token';
  private readonly USER_KEY = 'myassistant_user';

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password } as LoginRequest),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token and user data
      this.setToken(data.access_token);
      this.setUser(data.user);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const registerData: RegisterResponse = await response.json();
      
      // Don't store token or user data - user needs to log in
      
      return registerData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user (clear local storage)
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set JWT token in localStorage
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Set user data in localStorage
   */
  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      const now = Date.now() / 1000;
      
      // Check if token is expired
      return payload.exp > now;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Decode JWT token to get payload
   */
  decodeToken(token: string): JWTPayload {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...options.headers,
      ...this.getAuthHeader(),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, clear stored auth data
    if (response.status === 401) {
      this.logout();
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  }

  /**
   * Refresh user data from token if available
   */
  initializeFromStorage(): { user: User | null; isAuthenticated: boolean } {
    try {
      const token = this.getToken();
      const user = this.getUser();
      const isAuthenticated = this.isAuthenticated();

      if (!isAuthenticated && (token || user)) {
        // Clean up expired/invalid data
        this.logout();
        return { user: null, isAuthenticated: false };
      }

      return { user, isAuthenticated };
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.logout();
      return { user: null, isAuthenticated: false };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;