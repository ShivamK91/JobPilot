import axiosClient from './axiosClient';
import { Application, ParsedJob } from '../types';

export type ApplicationStatus = Application['status'];

export type CreateApplicationData = Omit<Application, '_id' | 'userId' | 'resumeSuggestions'>;
export type UpdateApplicationData = Partial<CreateApplicationData>;

export interface ParseJDResponse {
  parsedJob: ParsedJob;
  resumeSuggestions: string[];
}

export const getApplications = async (): Promise<Application[]> => {
  const { data } = await axiosClient.get<Application[]>('/api/applications');
  return data;
};

export const createApplication = async (
  payload: CreateApplicationData
): Promise<Application> => {
  const { data } = await axiosClient.post<Application>('/api/applications', payload);
  return data;
};

export const updateApplication = async (
  id: string,
  payload: UpdateApplicationData
): Promise<Application> => {
  const { data } = await axiosClient.put<Application>(`/api/applications/${id}`, payload);
  return data;
};

export const deleteApplication = async (id: string): Promise<void> => {
  await axiosClient.delete(`/api/applications/${id}`);
};

export const parseJD = async (jd: string): Promise<ParseJDResponse> => {
  const { data } = await axiosClient.post<ParseJDResponse>('/api/ai/parse', { jd });
  return data;
};
