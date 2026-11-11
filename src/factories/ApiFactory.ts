import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from '../api/AuthApi';
import { EventsApi } from '../api/EventsApi';
import { BookingsApi } from '../api/BookingsApi';

export class ApiFactory {
  private readonly request: APIRequestContext;
  private authApi?: AuthApi;
  private eventsApi?: EventsApi;
  private bookingsApi?: BookingsApi;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  getAuthApi(): AuthApi {
    if (!this.authApi) this.authApi = new AuthApi(this.request);
    return this.authApi;
  }

  getEventsApi(): EventsApi {
    if (!this.eventsApi) this.eventsApi = new EventsApi(this.request);
    return this.eventsApi;
  }

  getBookingsApi(): BookingsApi {
    if (!this.bookingsApi) this.bookingsApi = new BookingsApi(this.request);
    return this.bookingsApi;
  }
}
