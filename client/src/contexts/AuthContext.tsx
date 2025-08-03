import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authAPI } from '../utils/api';

// Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  userType: 'participant' | 'admin';
  schoolName?: string;
  role?: string;
  department?: string;
  registrationStatus?: string;
  totalScore?: number;
  rank?: number;
  profilePicture?: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (email: string, password: string, userType: 'participant' | 'admin') => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('climate_champion_token'),
  loading: false,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      localStorage.setItem('climate_champion_token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      localStorage.removeItem('climate_champion_token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      localStorage.removeItem('climate_champion_token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login function
  const login = async (email: string, password: string, userType: 'participant' | 'admin') => {
    try {
      dispatch({ type: 'AUTH_START' });

      const endpoint = userType === 'participant' ? '/auth/participant/login' : '/auth/admin/login';
      const response = await authAPI.post(endpoint, { email, password });

      const { token } = response.data;
      const userData = userType === 'participant' ? response.data.participant : response.data.admin;

      const user: User = {
        id: userData.id,
        fullName: userData.fullName,
        email: userData.email,
        userType,
        schoolName: userData.schoolName,
        role: userData.role,
        department: userData.department,
        registrationStatus: userData.registrationStatus,
        totalScore: userData.totalScore,
        rank: userData.rank,
        profilePicture: userData.profilePicture,
        permissions: userData.permissions,
      };

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (userData: any) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authAPI.post('/auth/participant/register', userData);
      const { token, participant } = response.data;

      const user: User = {
        id: participant.id,
        fullName: participant.fullName,
        email: participant.email,
        userType: 'participant',
        schoolName: participant.schoolName,
        registrationStatus: participant.registrationStatus,
        profilePicture: participant.profilePicture,
      };

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Update user function
  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check auth status
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('climate_champion_token');
    
    if (!token) {
      dispatch({ type: 'LOGOUT' });
      return;
    }

    try {
      dispatch({ type: 'AUTH_START' });

      // Try to get participant profile first
      let response;
      let userType: 'participant' | 'admin';
      
      try {
        response = await authAPI.get('/auth/participant/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        userType = 'participant';
      } catch {
        // If participant fails, try admin
        response = await authAPI.get('/auth/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        userType = 'admin';
      }

      const userData = userType === 'participant' ? response.data.participant : response.data.admin;

      const user: User = {
        id: userData._id || userData.id,
        fullName: userData.fullName,
        email: userData.email,
        userType,
        schoolName: userData.schoolName,
        role: userData.role,
        department: userData.department,
        registrationStatus: userData.registrationStatus,
        totalScore: userData.totalScore,
        rank: userData.rank,
        profilePicture: userData.profilePicture,
        permissions: userData.permissions,
      };

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Check auth status on mount
  useEffect(() => {
    if (state.token && !state.user) {
      checkAuthStatus();
    }
  }, [state.token]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};