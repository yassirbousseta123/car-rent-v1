import { z } from 'zod';

export type VehicleStatus = 'available' | 'reserved' | 'rented' | 'maintenance' | 'inactive';

export const VehicleZ = z.object({
  id: z.string().uuid(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990),
  plate: z.string().min(1),
  vin: z.string().optional(),
  status: z.custom<VehicleStatus>(),
  odometer: z.number().int().nonnegative().optional(),
  images: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
});
export type Vehicle = z.infer<typeof VehicleZ>;

export const RenterZ = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  dob: z.string(), // ISO
  idNumber: z.string().min(1), // national ID / DL
  address: z.string().optional(),
});
export type Renter = z.infer<typeof RenterZ>;

export type DocKind = 'id_front' | 'id_back' | 'contract_pdf' | 'checkin_photo' | 'checkout_photo';

export const DocumentZ = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  renterId: z.string().uuid(),
  kind: z.custom<DocKind>(),
  fileName: z.string().min(1),
  mime: z.string().min(1),
  url: z.string(), // object URL in mock; placeholder for S3 later
  createdAt: z.string(), // ISO
});
export type Document = z.infer<typeof DocumentZ>;

export type BookingStatus = 'reserved' | 'checked_out' | 'returned' | 'canceled';

export const BookingZ = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  renterId: z.string().uuid(),
  startAt: z.string(), // ISO
  endAt: z.string(), // ISO
  dailyRate: z.number().nonnegative(),
  deposit: z.number().nonnegative().optional(),
  fees: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number().nonnegative(),
      })
    )
    .default([]),
  status: z.custom<BookingStatus>(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  notes: z.string().optional(),
});
export type Booking = z.infer<typeof BookingZ>;
