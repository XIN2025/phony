import { HttpClient } from '@/lib/http-client';

export interface IntakeForm {
  id: string;
  title: string;
  description?: string;
  questions: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IntakeFormSubmission {
  id: string;
  formId: string;
  answers: Record<string, unknown>;
  submittedAt: Date;
}

export interface ClientIntakeData {
  form: IntakeForm;
  submission?: IntakeFormSubmission;
  clientStatus: string;
}

export class ClientService {
  static async getIntakeForm(headers: Record<string, string>): Promise<ClientIntakeData> {
    return HttpClient.get<ClientIntakeData>('/api/client/intake-form', { headers });
  }

  static async submitIntakeForm(
    formId: string,
    answers: Record<string, unknown>,
    headers: Record<string, string>,
  ): Promise<{ message: string; submissionId: string }> {
    return HttpClient.post<{ message: string; submissionId: string }>(
      '/api/client/intake-form/submit',
      { formId, answers },
      { headers },
    );
  }

  static async fixClientStatuses(headers: Record<string, string>): Promise<{ message: string }> {
    return HttpClient.post<{ message: string }>('/api/client/fix-statuses', {}, { headers });
  }
}
