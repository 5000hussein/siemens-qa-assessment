/* eslint-disable no-empty-pattern -- Playwright fixtures must destructure their first argument */
import { test as base, expect, request, type APIRequestContext } from '@playwright/test';
import { CommonPage } from '../pages/CommonPage';
import { LoginPage } from '../pages/LoginPage';
import { EventsPage } from '../pages/EventsPage';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { MyBookingsPage } from '../pages/MyBookingsPage';
import { BookingDetailsPage } from '../pages/BookingDetailsPage';
import { AuthApi } from '../api/AuthApi';
import { EventsApi } from '../api/EventsApi';
import { BookingsApi } from '../api/BookingsApi';
import { apiBaseUrl, getUserCredentials } from '../config/environment';

type Fixtures = {
  commonPage: CommonPage;
  loginPage: LoginPage;
  eventsPage: EventsPage;
  eventDetailsPage: EventDetailsPage;
  myBookingsPage: MyBookingsPage;
  bookingDetailsPage: BookingDetailsPage;
  apiRequest: APIRequestContext;
  eventsApi: EventsApi;
  bookingsApi: BookingsApi;
  anonymousBookingsApi: BookingsApi;
};

type WorkerFixtures = {
  apiToken: string;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  // ========== AUTH (framework-owned: tests never log in themselves) ==========
  apiToken: [
    async ({}, use) => {
      const { email, password } = getUserCredentials();
      const ctx = await request.newContext({ baseURL: apiBaseUrl });
      const response = await new AuthApi(ctx).login(email, password);
      expect(response.status(), `Login failed for ${email}`).toBe(200);
      const token = (await response.json()).token;
      await ctx.dispose();
      await use(token);
    },
    { scope: 'worker' },
  ],

  // ========== API ==========
  apiRequest: async ({ apiToken }, use) => {
    const ctx = await request.newContext({ baseURL: apiBaseUrl, extraHTTPHeaders: { Authorization: `Bearer ${apiToken}` } });
    await use(ctx);
    await ctx.dispose();
  },
  eventsApi: async ({ apiRequest }, use) => {
    await use(new EventsApi(apiRequest));
  },
  bookingsApi: async ({ apiRequest }, use) => {
    await use(new BookingsApi(apiRequest));
  },
  // No token: only for "request without a token returns 401" tests
  anonymousBookingsApi: async ({}, use) => {
    const ctx = await request.newContext({ baseURL: apiBaseUrl });
    await use(new BookingsApi(ctx));
    await ctx.dispose();
  },

  // ========== PAGES ==========
  commonPage: async ({ page }, use) => {
    await use(new CommonPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  eventsPage: async ({ page }, use) => {
    await use(new EventsPage(page));
  },
  eventDetailsPage: async ({ page }, use) => {
    await use(new EventDetailsPage(page));
  },
  myBookingsPage: async ({ page }, use) => {
    await use(new MyBookingsPage(page));
  },
  bookingDetailsPage: async ({ page }, use) => {
    await use(new BookingDetailsPage(page));
  },
});

export { expect };
