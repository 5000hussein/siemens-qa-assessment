import type { APIResponse } from '@playwright/test';
import { BaseApi } from './BaseApi';
import type { Booking, CreateBookingInput } from './types';

export class BookingsApi extends BaseApi {
  private readonly createdIds = new Set<number>();

  async create(input: Partial<CreateBookingInput> | Record<string, unknown>): Promise<APIResponse> {
    const response = await this.request.post('bookings', { data: input });
    if (response.status() === 201) this.createdIds.add((await response.json()).data.id);
    return response;
  }

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const response = await this.create(input);
    if (response.status() !== 201) throw new Error(`POST bookings failed: ${response.status()} ${await response.text()}`);
    return (await response.json()).data;
  }

  async list(params: Record<string, string | number> = {}): Promise<APIResponse> {
    return this.request.get('bookings', { params });
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`bookings/${id}`);
  }

  async getByRef(ref: string): Promise<APIResponse> {
    return this.request.get(`bookings/ref/${ref}`);
  }

  async cancel(id: number): Promise<APIResponse> {
    const response = await this.request.delete(`bookings/${id}`);
    if (response.ok()) this.createdIds.delete(id);
    return response;
  }

  // Bookings created through the UI are registered here so fixture teardown removes them too
  async trackByRef(ref: string): Promise<Booking> {
    const response = await this.getByRef(ref);
    if (!response.ok()) throw new Error(`GET bookings/ref/${ref} failed: ${response.status()}`);
    const booking: Booking = (await response.json()).data;
    this.createdIds.add(booking.id);
    return booking;
  }

  // Shared public environment: every booking a test creates is cancelled in fixture teardown
  async cleanup(): Promise<void> {
    for (const id of [...this.createdIds]) await this.cancel(id);
  }
}
