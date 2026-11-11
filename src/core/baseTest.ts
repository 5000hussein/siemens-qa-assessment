/* eslint-disable no-empty-pattern -- Playwright fixtures must destructure their first argument */
import { test as base, expect, request } from '@playwright/test';
import { PageFactory } from '../factories/PageFactory';
import { ApiFactory } from '../factories/ApiFactory';
import { CommonPage } from '../pages/CommonPage';
import { LoginPage } from '../pages/LoginPage';
import { EventsPage } from '../pages/EventsPage';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { MyBookingsPage } from '../pages/MyBookingsPage';
import { AuthApi } from '../api/AuthApi';
import { EventsApi } from '../api/EventsApi';
import { BookingsApi } from '../api/BookingsApi';
import { apiBaseUrl, getUserCredentials } from '../config/environment';

type Fixtures = {
  pages: PageFactory;
  commonPage: CommonPage;
  loginPage: LoginPage;
  eventsPage: EventsPage;
  eventDetailsPage: EventDetailsPage;
  myBookingsPage: MyBookingsPage;
  api: ApiFactory;
  anonymousApi: ApiFactory;
  authApi: AuthApi;
  eventsApi: EventsApi;
  bookingsApi: BookingsApi;
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
      const token = await new AuthApi(ctx).getToken(email, password);
      await ctx.dispose();
      await use(token);
    },
    { scope: 'worker' },
  ],

  // ========== API ==========
  api: async ({ apiToken }, use) => {
    const ctx = await request.newContext({ baseURL: apiBaseUrl, extraHTTPHeaders: { Authorization: `Bearer ${apiToken}` } });
    const api = new ApiFactory(ctx);
    await use(api);
    await api.getBookingsApi().cleanup();
    await ctx.dispose();
  },
  anonymousApi: async ({}, use) => {
    const ctx = await request.newContext({ baseURL: apiBaseUrl });
    const api = new ApiFactory(ctx);
    await use(api);
    await ctx.dispose();
  },
  authApi: async ({ api }, use) => {
    await use(api.getAuthApi());
  },
  eventsApi: async ({ api }, use) => {
    await use(api.getEventsApi());
  },
  bookingsApi: async ({ api }, use) => {
    await use(api.getBookingsApi());
  },

  // ========== PAGES ==========
  pages: async ({ page }, use) => {
    await use(new PageFactory(page));
  },
  commonPage: async ({ pages }, use) => {
    await use(pages.getCommonPage());
  },
  loginPage: async ({ pages }, use) => {
    await use(pages.getLoginPage());
  },
  eventsPage: async ({ pages }, use) => {
    await use(pages.getEventsPage());
  },
  eventDetailsPage: async ({ pages }, use) => {
    await use(pages.getEventDetailsPage());
  },
  myBookingsPage: async ({ pages }, use) => {
    await use(pages.getMyBookingsPage());
  },
});

export { expect };
