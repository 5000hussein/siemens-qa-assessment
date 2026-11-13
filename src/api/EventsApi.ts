import type { APIResponse } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class EventsApi extends BaseApi {
  async getEvents(params: Record<string, string | number> = {}): Promise<APIResponse> {
    return this.request.get('events', { params });
  }

  async getEvent(eventId: number): Promise<APIResponse> {
    return this.request.get(`events/${eventId}`);
  }
}
