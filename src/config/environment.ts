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

// From .env (gitignored), never from JSON: the repo is public
export const userEmail = process.env.EVENTHUB_USER_EMAIL ?? '';
export const userPassword = process.env.EVENTHUB_USER_PASSWORD ?? '';
