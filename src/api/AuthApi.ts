import type { APIResponse } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class AuthApi extends BaseApi {
  async login(email: string, password: string): Promise<APIResponse> {
    return this.request.post('auth/login', { data: { email, password } });
  }
}
