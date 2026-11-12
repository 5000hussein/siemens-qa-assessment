import type { APIResponse } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class AuthApi extends BaseApi {
  async login(email: string, password: string): Promise<APIResponse> {
    return this.request.post('auth/login', { data: { email, password } });
  }

  async getToken(email: string, password: string): Promise<string> {
    const response = await this.login(email, password);
    if (!response.ok()) throw new Error(`Login failed for ${email}: ${response.status()} ${await response.text()}`);
    return (await response.json()).token;
  }
}
