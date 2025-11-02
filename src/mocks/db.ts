import type { Vehicle, Renter, Booking, Document } from '../types/domain';

export interface DB {
  vehicles: Vehicle[];
  renters: Renter[];
  bookings: Booking[];
  documents: Document[];
  settings: {
    bufferHours: number;
  };
}

export const db: DB = {
  vehicles: [],
  renters: [],
  bookings: [],
  documents: [],
  settings: {
    bufferHours: 2,
  },
};

export function resetDB() {
  db.vehicles = [];
  db.renters = [];
  db.bookings = [];
  db.documents = [];
}
