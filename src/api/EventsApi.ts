import type { APIResponse } from '@playwright/test';
import { BaseApi } from './BaseApi';
import type { EventItem } from './types';

export class EventsApi extends BaseApi {
  async list(params: Record<string, string | number> = {}): Promise<APIResponse> {
    return this.request.get('events', { params });
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`events/${id}`);
  }

  async getEvent(id: number): Promise<EventItem> {
    const response = await this.get(id);
    if (!response.ok()) throw new Error(`GET events/${id} failed: ${response.status()}`);
    return (await response.json()).data;
  }

  // Shared environment: pick an event with enough seats at runtime instead of pinning an id that may sell out.
  // No date filter on purpose: the sandbox lists past-dated events as "Upcoming" and they are bookable (see README)
  async findBookableEvent(minSeats: number): Promise<EventItem> {
    const response = await this.list({ limit: 100 });
    if (!response.ok()) throw new Error(`GET events failed: ${response.status()}`);
    const events: EventItem[] = (await response.json()).data;
    const event = events.find((e) => e.availableSeats >= minSeats);
    if (!event) throw new Error(`No event with at least ${minSeats} available seats`);
    return event;
  }
}
