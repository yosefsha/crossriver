// Authentication Types and Interfaces

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    roles: string[];
  };
}

export interface User {
  id: string;
  email: string;
  username?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// JWT Token payload interface (for decoding)
export interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// API Error interface
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}