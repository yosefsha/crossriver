import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthContextType, User, RegisterRequest, RegisterResponse } from '../types/auth.types';
import authService from '../services/auth.service';

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: { message: string } }
  | { type: 'REGISTER_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'INITIALIZE_AUTH'; payload: { user: User | null; isAuthenticated: boolean } };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true, // Start with loading true until initialization
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        // User is NOT logged in after registration
      };

    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'INITIALIZE_AUTH':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        token: action.payload.isAuthenticated ? authService.getToken() : null,
        loading: false,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const { user, isAuthenticated } = authService.initializeFromStorage();
    dispatch({
      type: 'INITIALIZE_AUTH',
      payload: { user, isAuthenticated },
    });
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.login(email, password);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage,
      });
      throw error; // Re-throw so components can handle it if needed
    }
  };

  // Register function
  const register = async (data: RegisterRequest): Promise<void> => {
    try {
      dispatch({ type: 'REGISTER_START' });
      
      const response = await authService.register(data);
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: {
          message: response.message,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({
        type: 'REGISTER_ERROR',
        payload: errorMessage,
      });
      throw error; // Re-throw so components can handle it if needed
    }
  };

  // Logout function
  const logout = (): void => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Context value
  const contextValue: AuthContextType = {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;