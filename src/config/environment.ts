import 'dotenv/config';
import { readJsonValue } from '../utils/jsonHelper';

export const currentEnv = (process.env.ENV || 'PROD').toUpperCase();
// .env may carry CI=false; a plain truthiness check would treat that string as CI
export const isCI = process.env.CI === 'true';
export const environmentsJsonPath = './src/data/environments.json';
export const bookingsDataPath = './src/data/test_data/bookings.json';
export const authStatePath = './.auth/user.json';

export const baseUrl = readJsonValue(environmentsJsonPath, `${currentEnv}.baseUrl`);
export const apiBaseUrl = readJsonValue(environmentsJsonPath, `${currentEnv}.apiBaseUrl`);

export function getUserCredentials(): { email: string; password: string } {
  const email = process.env.EVENTHUB_USER_EMAIL;
  const password = process.env.EVENTHUB_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('EVENTHUB_USER_EMAIL and EVENTHUB_USER_PASSWORD must be set in .env (see .env.example)');
  }
  return { email, password };
}
