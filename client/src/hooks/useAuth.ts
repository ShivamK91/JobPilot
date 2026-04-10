import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';
import { ApiError } from '../types';
import axios from 'axios';

const TOKEN_KEY = 'token';
const EMAIL_KEY = 'userEmail';

const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
};

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => getToken() !== null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as ApiError | undefined;
      return data?.message ?? err.message;
    }
    if (err instanceof Error) return err.message;
    return 'An unexpected error occurred.';
  };

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const { token } = await authApi.login(email, password);
        setToken(token);
        localStorage.setItem(EMAIL_KEY, email);
        setIsAuthenticated(true);
        navigate('/');
      } catch (err) {
        setError(extractErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const register = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await authApi.register(email, password);
        navigate('/login');
      } catch (err) {
        setError(extractErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback((): void => {
    removeToken();
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);

  return { isAuthenticated, isLoading, error, login, register, logout };
};
