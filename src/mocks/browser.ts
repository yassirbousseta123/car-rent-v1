import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { db } from './db';
import { generateSeedData } from './seed/data';

export const worker = setupWorker(...handlers);

export function initializeMockData() {
  const seed = generateSeedData();
  db.vehicles = seed.vehicles;
  db.renters = seed.renters;
  db.bookings = seed.bookings;
  db.documents = seed.documents;
}
