import { HttpClient } from '@/lib/http-client';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';

export interface IntakeForm {
  id: string;
  title: string;
  description?: string;
  questions: any[];
  createdAt: Date;
  updatedAt: Date;
}

export class IntakeFormService {
  static async create(data: CreateIntakeFormDto, headers: Record<string, string>): Promise<IntakeForm> {
    return HttpClient.post<IntakeForm>('/api/intake-forms', data, { headers });
  }

  static async findAll(headers: Record<string, string>): Promise<IntakeForm[]> {
    return HttpClient.get<IntakeForm[]>('/api/intake-forms', { headers });
  }

  static async findOne(id: string, headers: Record<string, string>): Promise<IntakeForm> {
    return HttpClient.get<IntakeForm>(`/api/intake-forms/${id}`, { headers });
  }

  static async update(id: string, data: CreateIntakeFormDto, headers: Record<string, string>): Promise<IntakeForm> {
    return HttpClient.put<IntakeForm>(`/api/intake-forms/${id}`, data, { headers });
  }

  static async delete(id: string, headers: Record<string, string>): Promise<void> {
    return HttpClient.delete<void>(`/api/intake-forms/${id}`, { headers });
  }
}
