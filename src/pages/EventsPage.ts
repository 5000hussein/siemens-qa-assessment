import { type Page, type Locator } from '@playwright/test';
import { CommonPage } from './CommonPage';
import { ROUTES } from '../config/routes';
import { TIMEOUTS } from '../utils/timeouts';

export class EventsPage extends CommonPage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Upcoming Events', level: 1 });
  }

  async navigate(): Promise<void> {
    await this.navigateTo(ROUTES.events);
    await this.heading.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
  }

  // Each event is an <article>; pick the one whose heading is exactly this title
  async openEvent(title: string): Promise<void> {
    const eventCard = this.page.getByRole('article').filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
    await this.click(eventCard.getByRole('link', { name: 'Book Now' }));
    await this.page.getByRole('heading', { name: title, level: 1 }).waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
  }
}
