import type { Page } from '@playwright/test';
import { CommonPage } from '../pages/CommonPage';
import { LoginPage } from '../pages/LoginPage';
import { EventsPage } from '../pages/EventsPage';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { MyBookingsPage } from '../pages/MyBookingsPage';

export class PageFactory {
  private readonly page: Page;
  private commonPage?: CommonPage;
  private loginPage?: LoginPage;
  private eventsPage?: EventsPage;
  private eventDetailsPage?: EventDetailsPage;
  private myBookingsPage?: MyBookingsPage;

  constructor(page: Page) {
    this.page = page;
  }

  getCommonPage(): CommonPage {
    if (!this.commonPage) this.commonPage = new CommonPage(this.page);
    return this.commonPage;
  }

  getLoginPage(): LoginPage {
    if (!this.loginPage) this.loginPage = new LoginPage(this.page);
    return this.loginPage;
  }

  getEventsPage(): EventsPage {
    if (!this.eventsPage) this.eventsPage = new EventsPage(this.page);
    return this.eventsPage;
  }

  getEventDetailsPage(): EventDetailsPage {
    if (!this.eventDetailsPage) this.eventDetailsPage = new EventDetailsPage(this.page);
    return this.eventDetailsPage;
  }

  getMyBookingsPage(): MyBookingsPage {
    if (!this.myBookingsPage) this.myBookingsPage = new MyBookingsPage(this.page);
    return this.myBookingsPage;
  }
}
