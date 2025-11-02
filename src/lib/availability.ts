import dayjs from 'dayjs';
import type { Booking } from '../types/domain';

export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
  bufferH = 2
): boolean {
  const sA = dayjs(aStart).subtract(bufferH, 'hour');
  const eA = dayjs(aEnd).add(bufferH, 'hour');
  return sA.isBefore(dayjs(bEnd)) && dayjs(bStart).isBefore(eA);
}

export function isVehicleRangeAvailable(
  bookings: Booking[],
  start: string,
  end: string,
  vehicleId: string,
  bufferH = 2,
  excludeBookingId?: string
): boolean {
  return !bookings
    .filter(
      (b) =>
        b.vehicleId === vehicleId &&
        b.status !== 'canceled' &&
        b.id !== excludeBookingId
    )
    .some((b) => overlaps(start, end, b.startAt, b.endAt, bufferH));
}

export function getConflictingBookings(
  bookings: Booking[],
  start: string,
  end: string,
  vehicleId: string,
  bufferH = 2,
  excludeBookingId?: string
): Booking[] {
  return bookings.filter(
    (b) =>
      b.vehicleId === vehicleId &&
      b.status !== 'canceled' &&
      b.id !== excludeBookingId &&
      overlaps(start, end, b.startAt, b.endAt, bufferH)
  );
}

export function getNextAvailableDate(
  bookings: Booking[],
  vehicleId: string,
  from: string = dayjs().toISOString(),
  bufferH = 2
): string | null {
  const upcoming = bookings
    .filter((b) => b.vehicleId === vehicleId && b.status !== 'canceled')
    .sort((a, b) => dayjs(a.startAt).diff(dayjs(b.startAt)));

  if (upcoming.length === 0) return from;

  let candidate = dayjs(from);
  for (const booking of upcoming) {
    const bookingStart = dayjs(booking.startAt).subtract(bufferH, 'hour');
    if (candidate.isBefore(bookingStart)) {
      return candidate.toISOString();
    }
    candidate = dayjs(booking.endAt).add(bufferH, 'hour');
  }

  return candidate.toISOString();
}

export function getUnavailableDateRanges(
  bookings: Booking[],
  vehicleId: string,
  bufferH = 2
): Array<{ start: string; end: string }> {
  return bookings
    .filter((b) => b.vehicleId === vehicleId && b.status !== 'canceled')
    .map((b) => ({
      start: dayjs(b.startAt).subtract(bufferH, 'hour').toISOString(),
      end: dayjs(b.endAt).add(bufferH, 'hour').toISOString(),
    }));
}
