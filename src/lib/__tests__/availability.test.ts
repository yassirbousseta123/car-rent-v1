import { describe, it, expect } from 'vitest';
import { overlaps, isVehicleRangeAvailable, getNextAvailableDate } from '../availability';
import type { Booking } from '../../types/domain';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

describe('availability logic', () => {
  describe('overlaps', () => {
    it('should detect overlapping ranges', () => {
      const start1 = '2024-01-10T10:00:00Z';
      const end1 = '2024-01-15T10:00:00Z';
      const start2 = '2024-01-13T10:00:00Z';
      const end2 = '2024-01-18T10:00:00Z';

      expect(overlaps(start1, end1, start2, end2, 0)).toBe(true);
    });

    it('should not detect non-overlapping ranges', () => {
      const start1 = '2024-01-10T10:00:00Z';
      const end1 = '2024-01-15T10:00:00Z';
      const start2 = '2024-01-16T10:00:00Z';
      const end2 = '2024-01-20T10:00:00Z';

      expect(overlaps(start1, end1, start2, end2, 0)).toBe(false);
    });

    it('should respect buffer hours', () => {
      const start1 = '2024-01-10T10:00:00Z';
      const end1 = '2024-01-15T10:00:00Z';
      const start2 = '2024-01-15T11:00:00Z';
      const end2 = '2024-01-20T10:00:00Z';

      expect(overlaps(start1, end1, start2, end2, 0)).toBe(false);
      expect(overlaps(start1, end1, start2, end2, 2)).toBe(true);
    });
  });

  describe('isVehicleRangeAvailable', () => {
    const vehicleId = 'vehicle-1';

    const bookings: Booking[] = [
      {
        id: 'booking-1',
        vehicleId,
        renterId: 'renter-1',
        startAt: '2024-01-10T10:00:00Z',
        endAt: '2024-01-15T10:00:00Z',
        dailyRate: 50,
        fees: [],
        status: 'reserved',
      },
      {
        id: 'booking-2',
        vehicleId,
        renterId: 'renter-2',
        startAt: '2024-01-20T10:00:00Z',
        endAt: '2024-01-25T10:00:00Z',
        dailyRate: 50,
        fees: [],
        status: 'reserved',
      },
    ];

    it('should return true for available range', () => {
      expect(
        isVehicleRangeAvailable(
          bookings,
          '2024-01-16T10:00:00Z',
          '2024-01-18T10:00:00Z',
          vehicleId,
          0
        )
      ).toBe(true);
    });

    it('should return false for overlapping range', () => {
      expect(
        isVehicleRangeAvailable(
          bookings,
          '2024-01-12T10:00:00Z',
          '2024-01-17T10:00:00Z',
          vehicleId,
          0
        )
      ).toBe(false);
    });

    it('should ignore canceled bookings', () => {
      const bookingsWithCanceled: Booking[] = [
        ...bookings,
        {
          id: 'booking-3',
          vehicleId,
          renterId: 'renter-3',
          startAt: '2024-01-16T10:00:00Z',
          endAt: '2024-01-18T10:00:00Z',
          dailyRate: 50,
          fees: [],
          status: 'canceled',
        },
      ];

      expect(
        isVehicleRangeAvailable(
          bookingsWithCanceled,
          '2024-01-16T10:00:00Z',
          '2024-01-18T10:00:00Z',
          vehicleId,
          0
        )
      ).toBe(true);
    });
  });

  describe('getNextAvailableDate', () => {
    const vehicleId = 'vehicle-1';

    it('should return from date if no bookings', () => {
      const from = '2024-01-10T10:00:00Z';
      expect(getNextAvailableDate([], vehicleId, from, 0)).toBe(from);
    });

    it('should return date after booking when from is during booking', () => {
      const bookings: Booking[] = [
        {
          id: 'booking-1',
          vehicleId,
          renterId: 'renter-1',
          startAt: '2024-01-10T10:00:00Z',
          endAt: '2024-01-15T10:00:00Z',
          dailyRate: 50,
          fees: [],
          status: 'reserved',
        },
      ];

      const result = getNextAvailableDate(bookings, vehicleId, '2024-01-12T10:00:00Z', 2);
      expect(result).toBeDefined();
      const resultDate = dayjs(result);
      const bookingEndWithBuffer = dayjs('2024-01-15T10:00:00Z').add(2, 'hour');
      
      expect(resultDate.toISOString()).toBe(bookingEndWithBuffer.toISOString());
    });
  });
});
