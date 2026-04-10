import axiosClient from './axiosClient';
import { AuthResponse } from '../types';

export const register = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const { data } = await axiosClient.post<AuthResponse>('/api/auth/register', {
    email,
    password,
  });
  return data;
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const { data } = await axiosClient.post<AuthResponse>('/api/auth/login', {
    email,
    password,
  });
  return data;
};
