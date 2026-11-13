import type { APIResponse } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class BookingsApi extends BaseApi {
  async createBooking(data: object): Promise<APIResponse> {
    return this.request.post('bookings', { data });
  }

  async getBookings(params: Record<string, string | number> = {}): Promise<APIResponse> {
    return this.request.get('bookings', { params });
  }

  async getBooking(bookingId: number): Promise<APIResponse> {
    return this.request.get(`bookings/${bookingId}`);
  }

  async getBookingByRef(bookingRef: string): Promise<APIResponse> {
    return this.request.get(`bookings/ref/${bookingRef}`);
  }

  async cancelBooking(bookingId: number): Promise<APIResponse> {
    return this.request.delete(`bookings/${bookingId}`);
  }
}
