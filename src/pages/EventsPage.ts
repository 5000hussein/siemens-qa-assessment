import { type Page, type Locator } from '@playwright/test';
import { CommonPage } from './CommonPage';
import { ROUTES } from '../config/routes';
import { TIMEOUTS } from '../utils/timeouts';

export class EventsPage extends CommonPage {
  // ========== EVENT LIST ==========
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly eventCards: Locator;

  constructor(page: Page) {
    super(page);

    // ========== EVENT LIST ==========
    this.heading = page.getByRole('heading', { name: 'Upcoming Events', level: 1 });
    this.searchInput = page.getByRole('textbox', { name: 'Search events, venues…' });
    this.eventCards = page.getByRole('article');
  }

  // ========== EVENT LIST ACTIONS ==========
  async navigate(): Promise<void> {
    await this.navigateTo(ROUTES.events);
    await this.heading.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
  }

  eventCard(title: string): Locator {
    return this.eventCards.filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  async openEvent(title: string): Promise<void> {
    const bookNow = this.eventCard(title).getByRole('link', { name: 'Book Now' });
    await bookNow.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
    await bookNow.click();
    await this.page.getByRole('heading', { name: title, level: 1 }).waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
  }
}
