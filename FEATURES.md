# 🚗 Complete Features Guide - Car Rental Management System

> **Purpose**: Detailed explanation of every feature - no code knowledge needed!

---

## 📖 What This Application Does

A web application that helps car rental businesses manage:
- **Fleet** - Track all vehicles and their availability
- **Reservations** - Create and manage bookings  
- **Customers** - Store renter information
- **Documents** - Handle IDs, contracts, photos
- **Analytics** - Monitor business performance

---

## 🏠 1. Dashboard

### What You See

**Four KPI Cards**:

1. **Fleet Utilization** (Blue)
   - Shows: % of fleet currently rented
   - Calculation: (Rented vehicles ÷ Total vehicles) × 100
   - Example: 3 out of 10 vehicles = 30%

2. **Vehicles Out** (Green)
   - Shows: Number with customers now
   - Updates: Real-time as bookings change

3. **Returns Due** (Yellow)
   - Shows: Vehicles returning in next 3 days
   - Helps: Plan cleaning/inspections

4. **Maintenance** (Red)
   - Shows: Vehicles in repair
   - Tracks: Unavailable inventory

**Two Lists**:
- **Available Vehicles** - Ready to rent (up to 5)
- **Upcoming Returns** - Returning soon (up to 5)

---

## 🚙 2. Vehicle Management

### Vehicle List Page

**Table Columns**:
- **Vehicle**: Year Make Model + Plate
- **Status**: Color-coded badge
  - 🟢 Available - Ready to rent
  - 🟡 Reserved - Booked, not picked up
  - 🔵 Rented - With customer
  - 🔴 Maintenance - Being repaired
  - ⚫ Inactive - Not in rotation
- **Odometer**: Current mileage
- **VIN**: Vehicle ID number

**Filters**: All, Available, Reserved, Rented, Maintenance, Inactive

**Actions**: Click any row to see details

### Vehicle Detail Page

**Three Tabs**:

1. **Overview** - Vehicle info and stats
2. **Bookings** - Complete rental history
   - Renter name and dates
   - Status and pricing
   - Sorted newest first
3. **Documents** - All uploaded files
   - ID photos (front/back)
   - Contracts (PDF)
   - Inspection photos
   - Grid layout with previews

---

## 📋 3. Reservation System

### Reservations List

**Shows**: All bookings past and present

**Columns**:
- Renter name + phone
- Vehicle details
- Rental period (start/end dates)
- Daily rate
- Status badge

**Filters**: All, Reserved, Checked Out, Returned, Canceled

### 6-Step Booking Wizard

**Step 1: Select Renter**
- Choose from existing customers
- OR click "Create New Renter" (coming soon)

**Step 2: Select Vehicle**  
- Only shows available vehicles
- Auto-suggests next available date

**Step 3: Choose Dates**
- Pick start and end date/time
- **Real-time conflict check**
- Shows error if vehicle unavailable
- Enforces 2-hour buffer between bookings

**Step 4: Set Pricing**
- Daily rate (default $50)
- Deposit amount (default $200)

**Step 5: Upload Documents**
- ID Front photo
- ID Back photo  
- Signature (coming soon)

**Step 6: Review & Confirm**
- Shows all entered info
- Click "Create Reservation"
- Success: Booking created, vehicle marked reserved

---

## 🔍 4. Smart Availability System

### The 2-Hour Buffer Rule

**Problem**: Cars need cleaning between rentals

**Solution**: 2-hour mandatory gap

**Example**:
```
Booking A: Jan 10-15, returns 10:00 AM
Buffer ends: Jan 15, 12:00 PM (2h after return)
Next booking can start: 12:00 PM or later
```

**If you try 11:00 AM start**:
- ❌ Error: "Vehicle not available"
- Must choose 12:00 PM or later

**If you try 1:00 PM start**:
- ✅ Success: Booking created

### Conflict Detection

**When Checked**:
- Every time you select dates
- Before confirming booking
- Shows error immediately if conflict

**What It Checks**:
- All existing bookings for that vehicle
- Adds 2h before each booking start
- Adds 2h after each booking end
- Rejects if new booking overlaps any buffer zone

---

## 🗂️ 5. Document Management

### Document Types

1. **id_front** - Renter ID card front
2. **id_back** - Renter ID card back  
3. **contract_pdf** - Signed rental agreement
4. **checkin_photo** - Vehicle at pickup (coming soon)
5. **checkout_photo** - Vehicle at return (coming soon)

### How Upload Works

**In Booking Wizard** (Step 5):
1. Click "Choose File"
2. Select image from computer
3. File held temporarily
4. When booking confirmed → Upload to system
5. Document linked to booking + vehicle + renter

### Contract PDF Generation

**Automatic when booking created**:
- Generates professional PDF
- Includes:
  - Renter info (name, ID, contact)
  - Vehicle info (make, model, plate, VIN)
  - Rental period and pricing
  - Terms & conditions
  - Signature (if captured)
- Stored as contract_pdf document
- Viewable in Documents tab

### Where to Find Documents

**Vehicle Detail Page → Documents Tab**:
- Shows ALL documents for that vehicle
- From all bookings ever made
- Grid layout with thumbnails
- Click to view full size

---

## 🌍 6. Language Support

**Available**: English (EN) and French (FR)

**How to Switch**:
- Look at sidebar bottom-left
- Click language toggle
- EN mode shows: "🇫🇷 Français"
- FR mode shows: "🇬🇧 English"
- All labels update instantly
- Preference saved to browser

**What Gets Translated**:
- Navigation menus
- Status labels
- Button text
- Form labels

---

## 📊 7. Data & Business Logic

### Booking Status Lifecycle

```
reserved → (customer picks up) → checked_out → (customer returns) → returned
```

Can also be canceled at any point.

### Vehicle Status Auto-Sync

```
Booking created → Vehicle = reserved
Booking checked out → Vehicle = rented  
Booking returned → Vehicle = available
Booking canceled → Vehicle = available
```

Updates happen automatically!

### Pricing Calculation

```
Subtotal = Daily Rate × Number of Days
Total = Subtotal + Fees + Deposit
```

**Example**:
- Daily Rate: $50
- Period: 5 days
- Deposit: $200
- Result: $50×5 + $200 = $450 total

---

## 🎯 8. Common Workflows

### Create a Booking

1. Click "Reservations" → "New Reservation"
2. Select customer from dropdown
3. Select vehicle (only available shown)
4. Choose dates (system checks conflicts)
5. Set pricing (rate + deposit)
6. Upload ID photos
7. Review and confirm
8. ✅ Booking created!

### Check Vehicle Availability

1. Click "Vehicles"
2. Find vehicle in list
3. Click to open detail page
4. Go to "Bookings" tab
5. See all future reservations
6. Calculate gaps between bookings

### View All Documents

1. Click "Vehicles"
2. Select vehicle
3. Click "Documents" tab
4. See grid of all files
5. Click any to view full size

---

## ✅ What IS Implemented

- ✅ Dashboard with KPIs
- ✅ Vehicle list + detail pages
- ✅ Booking list + creation wizard
- ✅ Conflict detection (2h buffer)
- ✅ Document uploads
- ✅ PDF contract generation
- ✅ Status auto-sync
- ✅ Language toggle (EN/FR)
- ✅ Mock API with test data

## ⚠️ Coming Soon

- ⏳ Full calendar view
- ⏳ Signature canvas
- ⏳ New renter form
- ⏳ Check-in/out workflow
- ⏳ Advanced date picker

## 🔮 Future (Requires Backend)

- 🔮 Real database
- 🔮 User authentication
- 🔮 Payment processing
- 🔮 Email notifications
- 🔮 Mobile app

---

**Questions?** Check the other docs:
- `README.md` - Setup guide
- `PROJECT_SUMMARY.md` - Quick overview
- `IMPLEMENTATION.md` - Technical details

*Last Updated: October 31, 2025*
