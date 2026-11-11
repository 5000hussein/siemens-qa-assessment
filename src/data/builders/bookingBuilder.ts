import { readJsonObject } from '../../utils/jsonHelper';
import { bookingsDataPath, currentEnv } from '../../config/environment';
import type { CreateBookingInput, Customer } from '../../api/types';

// Single source for booking payloads: customer details come from test_data/bookings.json, never from specs
export function buildBookingInput(eventId: number, quantity: number, overrides: Record<string, unknown> = {}): CreateBookingInput {
  const customer = readJsonObject<{ name: string; email: string; phone: string }>(bookingsDataPath, `${currentEnv}.customer`);
  const details: Customer = { customerName: customer.name, customerEmail: customer.email, customerPhone: customer.phone };
  return { eventId, quantity, ...details, ...overrides } as CreateBookingInput;
}
