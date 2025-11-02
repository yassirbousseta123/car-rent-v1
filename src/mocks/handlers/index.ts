import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';
import { VehicleZ, RenterZ, BookingZ, DocumentZ } from '../../types/domain';
import { isVehicleRangeAvailable } from '../../lib/availability';
import { v4 as uuidv4 } from 'uuid';

const API_DELAY = 300;

export const handlers = [
  // Vehicles
  http.get('/api/vehicles', async () => {
    await delay(API_DELAY);
    return HttpResponse.json(db.vehicles);
  }),

  http.get('/api/vehicles/:id', async ({ params }) => {
    await delay(API_DELAY);
    const vehicle = db.vehicles.find((v) => v.id === params.id);
    if (!vehicle) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(vehicle);
  }),

  http.post('/api/vehicles', async ({ request }) => {
    await delay(API_DELAY);
    const body = await request.json();
    const parsed = VehicleZ.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json({ error: 'Invalid vehicle data', details: parsed.error }, { status: 400 });
    }

    const vehicle = { ...parsed.data, id: parsed.data.id || uuidv4() };
    db.vehicles.push(vehicle);
    return HttpResponse.json(vehicle, { status: 201 });
  }),

  http.patch('/api/vehicles/:id', async ({ params, request }) => {
    await delay(API_DELAY);
    const body = (await request.json()) as Record<string, any>;
    const idx = db.vehicles.findIndex((v) => v.id === params.id);

    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    db.vehicles[idx] = { ...db.vehicles[idx], ...body };
    return HttpResponse.json(db.vehicles[idx]);
  }),

  http.delete('/api/vehicles/:id', async ({ params }) => {
    await delay(API_DELAY);
    const idx = db.vehicles.findIndex((v) => v.id === params.id);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    db.vehicles.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Renters
  http.get('/api/renters', async () => {
    await delay(API_DELAY);
    return HttpResponse.json(db.renters);
  }),

  http.get('/api/renters/:id', async ({ params }) => {
    await delay(API_DELAY);
    const renter = db.renters.find((r) => r.id === params.id);
    if (!renter) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(renter);
  }),

  http.post('/api/renters', async ({ request }) => {
    await delay(API_DELAY);
    const body = await request.json();
    const parsed = RenterZ.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json({ error: 'Invalid renter data', details: parsed.error }, { status: 400 });
    }

    const renter = { ...parsed.data, id: parsed.data.id || uuidv4() };
    db.renters.push(renter);
    return HttpResponse.json(renter, { status: 201 });
  }),

  http.patch('/api/renters/:id', async ({ params, request }) => {
    await delay(API_DELAY);
    const body = (await request.json()) as Record<string, any>;
    const idx = db.renters.findIndex((r) => r.id === params.id);

    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    db.renters[idx] = { ...db.renters[idx], ...body };
    return HttpResponse.json(db.renters[idx]);
  }),

  // Bookings
  http.get('/api/bookings', async () => {
    await delay(API_DELAY);
    return HttpResponse.json(db.bookings);
  }),

  http.get('/api/bookings/:id', async ({ params }) => {
    await delay(API_DELAY);
    const booking = db.bookings.find((b) => b.id === params.id);
    if (!booking) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(booking);
  }),

  http.post('/api/bookings', async ({ request }) => {
    await delay(API_DELAY);
    const body = await request.json();
    const parsed = BookingZ.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json({ error: 'Invalid booking data', details: parsed.error }, { status: 400 });
    }

    const { vehicleId, startAt, endAt } = parsed.data;

    const isAvailable = isVehicleRangeAvailable(
      db.bookings,
      startAt,
      endAt,
      vehicleId,
      db.settings.bufferHours
    );

    if (!isAvailable) {
      return HttpResponse.json(
        { error: 'Vehicle is not available for the selected dates', code: 'OVERLAP' },
        { status: 409 }
      );
    }

    const booking = { ...parsed.data, id: parsed.data.id || uuidv4() };
    db.bookings.push(booking);

    const vehicle = db.vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = 'reserved';
    }

    return HttpResponse.json(booking, { status: 201 });
  }),

  http.patch('/api/bookings/:id', async ({ params, request }) => {
    await delay(API_DELAY);
    const body = (await request.json()) as Record<string, any>;
    const idx = db.bookings.findIndex((b) => b.id === params.id);

    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    const oldBooking = db.bookings[idx];
    const updatedBooking = { ...oldBooking, ...body };

    if (body?.startAt || body?.endAt) {
      const isAvailable = isVehicleRangeAvailable(
        db.bookings,
        updatedBooking.startAt,
        updatedBooking.endAt,
        updatedBooking.vehicleId,
        db.settings.bufferHours,
        oldBooking.id
      );

      if (!isAvailable) {
        return HttpResponse.json(
          { error: 'Vehicle is not available for the selected dates', code: 'OVERLAP' },
          { status: 409 }
        );
      }
    }

    db.bookings[idx] = updatedBooking;

    if (body?.status) {
      const vehicle = db.vehicles.find((v) => v.id === updatedBooking.vehicleId);
      if (vehicle) {
        switch (body.status as string) {
          case 'reserved':
            vehicle.status = 'reserved';
            break;
          case 'checked_out':
            vehicle.status = 'rented';
            break;
          case 'returned':
          case 'canceled':
            vehicle.status = 'available';
            break;
        }
      }
    }

    return HttpResponse.json(updatedBooking);
  }),

  http.delete('/api/bookings/:id', async ({ params }) => {
    await delay(API_DELAY);
    const idx = db.bookings.findIndex((b) => b.id === params.id);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    const booking = db.bookings[idx];
    const vehicle = db.vehicles.find((v) => v.id === booking.vehicleId);
    if (vehicle) {
      vehicle.status = 'available';
    }

    db.bookings.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Documents
  http.get('/api/documents', async ({ request }) => {
    await delay(API_DELAY);
    const url = new URL(request.url);
    const bookingId = url.searchParams.get('bookingId');
    const vehicleId = url.searchParams.get('vehicleId');

    let docs = db.documents;

    if (bookingId) {
      docs = docs.filter((d) => d.bookingId === bookingId);
    }

    if (vehicleId) {
      docs = docs.filter((d) => d.vehicleId === vehicleId);
    }

    return HttpResponse.json(docs);
  }),

  http.post('/api/documents', async ({ request }) => {
    await delay(API_DELAY);
    const body = await request.json();
    const parsed = DocumentZ.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json({ error: 'Invalid document data', details: parsed.error }, { status: 400 });
    }

    const document = { ...parsed.data, id: parsed.data.id || uuidv4() };
    db.documents.push(document);
    return HttpResponse.json(document, { status: 201 });
  }),

  http.delete('/api/documents/:id', async ({ params }) => {
    await delay(API_DELAY);
    const idx = db.documents.findIndex((d) => d.id === params.id);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    db.documents.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // File upload (stub)
  http.post('/api/upload', async ({ request }) => {
    await delay(API_DELAY);
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return HttpResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const objectUrl = URL.createObjectURL(file);

    return HttpResponse.json({
      url: objectUrl,
      fileName: file.name,
      mime: file.type,
      size: file.size,
    });
  }),
];
