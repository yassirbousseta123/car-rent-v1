# Car Rental Management System

A modern, full-featured car rental management web application built with React, TypeScript, and Vite.

## Features

### Core Functionality
- **Vehicle Management**: Track fleet with status (available, reserved, rented, maintenance, inactive)
- **Reservation System**: Multi-step booking wizard with conflict detection
- **Renter Management**: Store customer information and documents
- **Document Management**: Upload ID photos, generate and sign contracts (PDF)
- **Availability Logic**: Smart conflict detection with configurable buffer hours (default 2h)
- **Dashboard**: Real-time KPIs (utilization %, vehicles out, returns due, maintenance)

### Technical Features
- **Mock API**: MSW (Mock Service Worker) with realistic seed data
- **Type Safety**: Full TypeScript coverage with Zod validation
- **State Management**: TanStack Query (server state) + Zustand (UI state)
- **Internationalization**: EN/FR language toggle
- **Responsive UI**: Tailwind CSS with mobile-first design
- **Testing**: Vitest unit tests + Playwright (ready for E2E)

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + Headless UI |
| Icons | Lucide React |
| Routing | React Router v7 |
| Server State | TanStack Query v5 |
| Local State | Zustand |
| Forms | React Hook Form + Zod |
| Dates | Day.js |
| API Mocking | MSW v2 |
| PDF Generation | jsPDF |
| Testing | Vitest + RTL + Playwright |

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone or download the project
cd car-rental-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Open Vitest UI
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## Project Structure

```
src/
├── app/                  # App shell, routing, providers
│   ├── App.tsx          # Main app with router & QueryClient
│   └── Layout.tsx       # Sidebar navigation layout
├── api/                 # API client
│   └── client.ts        # Typed fetch wrapper
├── components/          # Reusable UI components
│   └── ui/             # Button, Input, Modal, Table, Badge, Select
├── features/           # Feature-based modules
│   ├── dashboard/      # Dashboard with KPIs
│   ├── vehicles/       # Vehicle list & detail pages
│   ├── bookings/       # Reservation list & wizard
│   ├── renters/        # Renter management (stub)
│   ├── calendar/       # Calendar view (stub)
│   └── documents/      # Document gallery & upload
├── hooks/              # React Query hooks
│   ├── useVehicles.ts
│   ├── useBookings.ts
│   ├── useRenters.ts
│   └── useDocuments.ts
├── lib/                # Utilities
│   ├── availability.ts # Overlap detection & conflict logic
│   ├── currency.ts     # Intl currency formatting
│   ├── i18n.ts        # EN/FR translations
│   └── pdf.ts         # Contract PDF generation
├── mocks/              # MSW setup
│   ├── browser.ts      # Service worker initialization
│   ├── db.ts          # In-memory database
│   ├── handlers/       # Request handlers
│   └── seed/          # Seed data (10 vehicles, 25 renters, 20 bookings)
├── stores/             # Zustand stores
│   └── uiStore.ts     # Locale, currency, settings
└── types/              # TypeScript types & Zod schemas
    └── domain.ts      # Vehicle, Renter, Booking, Document
```

## Business Rules

### Availability Logic
- **Buffer Hours**: Configurable cleaning/prep time between bookings (default: 2h)
- **Conflict Detection**: Prevents overlapping reservations on the same vehicle
- **Status Sync**: Vehicle status updates automatically (reserved → rented → available)
- **Smart Suggestions**: "Next available" date calculation

### Booking Lifecycle
1. **Reserved**: Initial state after creation
2. **Checked Out**: Vehicle in renter's possession
3. **Returned**: Vehicle returned, available again
4. **Canceled**: Booking canceled, vehicle freed

### Document Requirements
Each booking should have:
- ID Front photo
- ID Back photo  
- Signed contract PDF (auto-generated with jsPDF)
- Optional: Check-in/Check-out photos

## Key Components

### Booking Wizard
Multi-step form for creating reservations:
1. **Renter**: Select existing or create new
2. **Vehicle**: Choose from available vehicles
3. **Dates**: Date range picker with conflict validation
4. **Pricing**: Daily rate, deposit, fees
5. **Documents**: Upload ID photos, capture signature
6. **Review**: Confirm and create

### Vehicle Detail Page
Tabbed interface showing:
- **Overview**: Vehicle info, status, statistics
- **Bookings**: Complete rental history
- **Documents**: Gallery of all uploaded files

### Availability Algorithm

```typescript
// Check if vehicle is available for date range
function isVehicleRangeAvailable(
  bookings: Booking[],
  start: string,
  end: string,
  vehicleId: string,
  bufferH = 2
): boolean
```

- Filters active bookings (excludes canceled)
- Checks for overlap with buffer consideration
- Returns true if no conflicts

## API Endpoints (MSW)

All endpoints are mocked with MSW:

```
GET    /api/vehicles          # List all vehicles
GET    /api/vehicles/:id      # Get vehicle by ID
POST   /api/vehicles          # Create vehicle
PATCH  /api/vehicles/:id      # Update vehicle
DELETE /api/vehicles/:id      # Delete vehicle

GET    /api/renters           # List all renters
GET    /api/renters/:id       # Get renter by ID
POST   /api/renters           # Create renter
PATCH  /api/renters/:id       # Update renter

GET    /api/bookings          # List all bookings
GET    /api/bookings/:id      # Get booking by ID
POST   /api/bookings          # Create booking (validates availability)
PATCH  /api/bookings/:id      # Update booking (syncs vehicle status)
DELETE /api/bookings/:id      # Delete booking

GET    /api/documents?bookingId=X&vehicleId=Y  # List documents
POST   /api/documents         # Create document record
DELETE /api/documents/:id     # Delete document

POST   /api/upload            # Upload file (returns object URL)
```

### Conflict Handling
POST/PATCH booking returns `409 Conflict` if vehicle is unavailable:

```json
{
  "error": "Vehicle is not available for the selected dates",
  "code": "OVERLAP"
}
```

## Testing

### Unit Tests
```bash
npm run test:run
```

Coverage includes:
- Availability logic (overlap detection, buffer hours)
- Date range validation
- Next available date calculation

### E2E Tests (Playwright Ready)
```bash
npm run test:e2e  # To be implemented
```

Suggested scenarios:
- Create reservation happy path
- Conflict detection and error handling
- Document upload flow
- Vehicle status transitions

## Future Backend Integration

### API Migration Plan
1. **Replace MSW**: Remove `src/mocks/` and update `src/api/client.ts` with real API URL
2. **File Storage**: Replace object URLs with S3/CloudFront URLs
3. **Authentication**: Add JWT tokens to API client headers
4. **Validation**: Keep Zod schemas, add server-side validation
5. **Real-time**: Consider WebSockets for live booking updates

### Backend Requirements (OpenAPI)
- RESTful API matching current endpoints
- Multipart file upload support
- Zod schema compatibility for request/response validation
- CORS configuration for local development

### Suggested Backend Stack
- **Framework**: Express/Fastify (Node.js) or FastAPI (Python)
- **Database**: PostgreSQL with Prisma/TypeORM
- **File Storage**: AWS S3 or Cloudflare R2
- **Authentication**: JWT with refresh tokens
- **Validation**: Use generated Zod schemas

### Data Model Extensions
Consider adding:
- **Payments**: Stripe/PayPal integration
- **Insurance**: Coverage tracking
- **Maintenance**: Service schedules, cost tracking
- **VIN Decoding**: Automatic vehicle info from VIN
- **OCR**: ID verification from uploaded photos
- **Geolocation**: Pickup/dropoff tracking
- **Notifications**: Email/SMS for bookings, returns

## Known Limitations & TODOs

### Current Session
- ✅ Core CRUD operations
- ✅ Availability logic with buffer
- ✅ Document upload & PDF generation
- ✅ Multi-step booking wizard
- ✅ Dashboard KPIs
- ✅ Internationalization (EN/FR)
- ⚠️ Calendar view (basic structure only)
- ⚠️ Check-in/Check-out flow (stub)
- ⚠️ Signature pad (placeholder)
- ⚠️ Renter creation form (stub)

### Future Enhancements
- [ ] PWA mode with offline support (IndexedDB cache)
- [ ] Advanced calendar with drag-and-drop rescheduling
- [ ] Availability heatmap visualization
- [ ] Smart vehicle assignment (suggest alternatives)
- [ ] Printable contract/invoice templates
- [ ] Role-based access control (Owner/Clerk)
- [ ] Real-time collaboration (multiple users)
- [ ] Analytics dashboard (revenue, popular vehicles)

## Performance

- **Lighthouse Score Target**: ≥ 90
- **Bundle Size**: < 500KB (gzipped)
- **Query Caching**: 5min stale time for vehicles/bookings
- **Optimistic Updates**: Instant UI feedback on mutations

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

When adding features:
1. Follow existing patterns (feature folders, typed hooks)
2. Add Zod schemas for new entities
3. Update MSW handlers for new endpoints
4. Write unit tests for business logic
5. Maintain type safety (no `any` types)

## License

MIT (or your preferred license)

---

**Built with ❤️ using React + TypeScript + Vite**
