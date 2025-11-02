import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type { Vehicle, Renter, Booking, Document } from '../../types/domain';

export function generateSeedData(): {
  vehicles: Vehicle[];
  renters: Renter[];
  bookings: Booking[];
  documents: Document[];
} {
  const vehicles: Vehicle[] = [
    {
      id: uuidv4(),
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      plate: 'ABC-123',
      vin: '1HGBH41JXMN109186',
      status: 'available',
      odometer: 15000,
      images: ['https://via.placeholder.com/400x300?text=Toyota+Camry'],
      notes: 'Excellent condition',
    },
    {
      id: uuidv4(),
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      plate: 'XYZ-456',
      vin: '2HGFC2F59MH523456',
      status: 'available',
      odometer: 22000,
      images: ['https://via.placeholder.com/400x300?text=Honda+Accord'],
    },
    {
      id: uuidv4(),
      make: 'Ford',
      model: 'Explorer',
      year: 2023,
      plate: 'DEF-789',
      status: 'available',
      odometer: 8000,
    },
    {
      id: uuidv4(),
      make: 'Chevrolet',
      model: 'Malibu',
      year: 2020,
      plate: 'GHI-012',
      status: 'available',
      odometer: 35000,
    },
    {
      id: uuidv4(),
      make: 'Nissan',
      model: 'Altima',
      year: 2022,
      plate: 'JKL-345',
      status: 'maintenance',
      odometer: 18000,
      notes: 'Oil change scheduled',
    },
    {
      id: uuidv4(),
      make: 'Hyundai',
      model: 'Sonata',
      year: 2021,
      plate: 'MNO-678',
      status: 'available',
      odometer: 25000,
    },
    {
      id: uuidv4(),
      make: 'Kia',
      model: 'Optima',
      year: 2022,
      plate: 'PQR-901',
      status: 'available',
      odometer: 12000,
    },
    {
      id: uuidv4(),
      make: 'Mazda',
      model: 'CX-5',
      year: 2023,
      plate: 'STU-234',
      status: 'available',
      odometer: 5000,
    },
    {
      id: uuidv4(),
      make: 'Volkswagen',
      model: 'Jetta',
      year: 2021,
      plate: 'VWX-567',
      status: 'available',
      odometer: 28000,
    },
    {
      id: uuidv4(),
      make: 'Subaru',
      model: 'Outback',
      year: 2022,
      plate: 'YZA-890',
      status: 'available',
      odometer: 16000,
    },
  ];

  const firstNames = [
    'John',
    'Jane',
    'Michael',
    'Emily',
    'David',
    'Sarah',
    'Robert',
    'Jessica',
    'William',
    'Ashley',
    'James',
    'Amanda',
    'Christopher',
    'Jennifer',
    'Daniel',
    'Melissa',
    'Matthew',
    'Michelle',
    'Anthony',
    'Kimberly',
    'Mark',
    'Lisa',
    'Donald',
    'Nancy',
    'Paul',
  ];

  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Thompson',
    'White',
    'Harris',
    'Clark',
  ];

  const renters: Renter[] = firstNames.map((firstName, idx) => ({
    id: uuidv4(),
    firstName,
    lastName: lastNames[idx],
    email: `${firstName.toLowerCase()}.${lastNames[idx].toLowerCase()}@example.com`,
    phone: `555-${String(idx).padStart(4, '0')}`,
    dob: dayjs().subtract(25 + idx, 'year').toISOString(),
    idNumber: `DL${String(1000000 + idx).substring(1)}`,
    address: `${idx + 1} Main St, Anytown, USA`,
  }));

  const bookings: Booking[] = [];
  const documents: Document[] = [];

  for (let i = 0; i < 20; i++) {
    const vehicleId = vehicles[i % vehicles.length].id;
    const renterId = renters[i % renters.length].id;
    const bookingId = uuidv4();

    const startOffset = i * 3;
    const startAt = dayjs().add(startOffset, 'day').hour(10).minute(0).second(0).toISOString();
    const endAt = dayjs(startAt).add(2 + (i % 3), 'day').toISOString();

    const booking: Booking = {
      id: bookingId,
      vehicleId,
      renterId,
      startAt,
      endAt,
      dailyRate: 50 + i * 5,
      deposit: 200,
      fees: i % 3 === 0 ? [{ name: 'Insurance', amount: 15 }] : [],
      status: i < 5 ? 'reserved' : i < 10 ? 'checked_out' : i < 15 ? 'returned' : 'reserved',
      pickupLocation: 'Main Office',
      dropoffLocation: 'Main Office',
      notes: i % 5 === 0 ? 'Customer requested early pickup' : undefined,
    };

    bookings.push(booking);

    if (i % 4 === 0) {
      documents.push({
        id: uuidv4(),
        bookingId,
        vehicleId,
        renterId,
        kind: 'id_front',
        fileName: `id_front_${bookingId}.jpg`,
        mime: 'image/jpeg',
        url: 'https://via.placeholder.com/400x250?text=ID+Front',
        createdAt: dayjs(startAt).subtract(1, 'day').toISOString(),
      });

      documents.push({
        id: uuidv4(),
        bookingId,
        vehicleId,
        renterId,
        kind: 'id_back',
        fileName: `id_back_${bookingId}.jpg`,
        mime: 'image/jpeg',
        url: 'https://via.placeholder.com/400x250?text=ID+Back',
        createdAt: dayjs(startAt).subtract(1, 'day').toISOString(),
      });

      documents.push({
        id: uuidv4(),
        bookingId,
        vehicleId,
        renterId,
        kind: 'contract_pdf',
        fileName: `contract_${bookingId}.pdf`,
        mime: 'application/pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        createdAt: dayjs(startAt).subtract(1, 'day').toISOString(),
      });
    }
  }

  return { vehicles, renters, bookings, documents };
}
