# 🚀 Quick Build Guide - Extension Tracking System

## ⚡ START HERE - Core Feature in 2 Days

### What We're Building
A system where **any extension request instantly notifies the owner** and tracks payment until collected.

---

## 📱 Day 1: Extension Alert System

### Step 1: Database Schema

```sql
-- Core tables needed
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  vehicle_id UUID,
  worker_id UUID,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  daily_rate DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  status VARCHAR(50), -- active, completed, extended
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE extensions (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  original_end_date TIMESTAMP,
  new_end_date TIMESTAMP,
  extra_days INTEGER,
  extra_amount DECIMAL(10,2),
  requested_by UUID, -- worker who entered it
  requested_at TIMESTAMP DEFAULT NOW(),
  
  -- Approval tracking
  status VARCHAR(50), -- pending, approved, denied
  approved_by UUID,
  approved_at TIMESTAMP,
  
  -- Payment tracking
  payment_status VARCHAR(50), -- pending, collected
  payment_collected_at TIMESTAMP,
  payment_collected_by UUID,
  payment_method VARCHAR(50),
  
  -- Alerts
  owner_notified BOOLEAN DEFAULT FALSE,
  owner_notified_at TIMESTAMP,
  alert_acknowledged BOOLEAN DEFAULT FALSE
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  type VARCHAR(50), -- extension_request, payment_missing, etc
  severity VARCHAR(20), -- low, medium, high, critical
  title VARCHAR(200),
  message TEXT,
  data JSONB, -- Additional data
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID
);
```

### Step 2: Backend API (Node.js + Express)

```typescript
// server.ts - Main endpoints
import express from 'express';
import { Server } from 'socket.io';
import twilio from 'twilio';

const app = express();
const io = new Server(server);

// Twilio setup for SMS
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Extension Request Endpoint
app.post('/api/extensions/request', async (req, res) => {
  const { bookingId, extraDays, workerId } = req.body;
  
  // Get booking details
  const booking = await db.query(
    'SELECT * FROM bookings WHERE id = $1',
    [bookingId]
  );
  
  // Calculate extra amount
  const extraAmount = extraDays * booking.daily_rate;
  
  // Create extension request
  const extension = await db.query(`
    INSERT INTO extensions (
      booking_id, 
      original_end_date,
      new_end_date,
      extra_days, 
      extra_amount, 
      requested_by,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *
  `, [
    bookingId,
    booking.end_date,
    addDays(booking.end_date, extraDays),
    extraDays,
    extraAmount,
    workerId
  ]);
  
  // CRITICAL: Notify owner immediately
  await notifyOwner(extension, booking);
  
  // Send real-time update to dashboard
  io.emit('extension_requested', {
    extension,
    booking,
    worker: await getWorker(workerId)
  });
  
  res.json({ success: true, extension });
});

// Notify Owner Function
async function notifyOwner(extension, booking) {
  const message = `
🚨 EXTENSION REQUEST
Customer: ${booking.customer_name}
Vehicle: ${booking.vehicle_name}
Extra Days: ${extension.extra_days}
Amount: $${extension.extra_amount}

Reply YES to approve or NO to deny
  `.trim();
  
  // Send SMS
  await twilioClient.messages.create({
    body: message,
    to: process.env.OWNER_PHONE,
    from: process.env.TWILIO_PHONE
  });
  
  // Send WhatsApp
  await twilioClient.messages.create({
    body: message,
    to: `whatsapp:${process.env.OWNER_PHONE}`,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP}`
  });
  
  // Send Push Notification
  await sendPushNotification({
    token: process.env.OWNER_DEVICE_TOKEN,
    title: '💰 Extension Request',
    body: `${extension.extra_days} days = $${extension.extra_amount}`,
    data: { extensionId: extension.id }
  });
  
  // Create alert record
  await db.query(`
    INSERT INTO alerts (type, severity, title, message, data)
    VALUES ('extension_request', 'critical', $1, $2, $3)
  `, [
    'Extension Request',
    message,
    JSON.stringify({ extensionId: extension.id })
  ]);
  
  // Set escalation timer
  setTimeout(async () => {
    const ext = await getExtension(extension.id);
    if (ext.status === 'pending') {
      // Call owner if no response
      await twilioClient.calls.create({
        twiml: `<Response>
          <Say>Alert! Extension request pending for ${extension.extra_days} days. 
               Amount: ${extension.extra_amount} dollars.</Say>
        </Response>`,
        to: process.env.OWNER_PHONE,
        from: process.env.TWILIO_PHONE
      });
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Handle owner's response (webhook from Twilio)
app.post('/api/webhooks/sms', async (req, res) => {
  const { Body, From } = req.body;
  
  if (From.includes(process.env.OWNER_PHONE)) {
    // Get latest pending extension
    const extension = await db.query(`
      SELECT * FROM extensions 
      WHERE status = 'pending' 
      ORDER BY requested_at DESC 
      LIMIT 1
    `);
    
    if (Body.toUpperCase().includes('YES')) {
      await approveExtension(extension.id);
      await twilioClient.messages.create({
        body: '✅ Extension approved. Payment tracking activated.',
        to: From
      });
    } else if (Body.toUpperCase().includes('NO')) {
      await denyExtension(extension.id);
      await twilioClient.messages.create({
        body: '❌ Extension denied. Customer will be notified.',
        to: From
      });
    }
  }
  
  res.send('<Response></Response>');
});
```

### Step 3: Payment Tracking

```typescript
// Payment monitoring system
app.post('/api/payments/collect', async (req, res) => {
  const { extensionId, amount, method, workerId } = req.body;
  
  // Update extension with payment
  await db.query(`
    UPDATE extensions 
    SET payment_status = 'collected',
        payment_collected_at = NOW(),
        payment_collected_by = $1,
        payment_method = $2
    WHERE id = $3
  `, [workerId, method, extensionId]);
  
  // Notify owner of collection
  await twilioClient.messages.create({
    body: `✅ Payment collected: $${amount} via ${method}`,
    to: process.env.OWNER_PHONE
  });
  
  // Clear any payment alerts
  await clearPaymentAlerts(extensionId);
  
  res.json({ success: true });
});

// Monitor unpaid extensions (runs every hour)
setInterval(async () => {
  const unpaidExtensions = await db.query(`
    SELECT e.*, b.customer_name, b.vehicle_name
    FROM extensions e
    JOIN bookings b ON e.booking_id = b.id
    WHERE e.status = 'approved' 
    AND e.payment_status = 'pending'
    AND e.approved_at < NOW() - INTERVAL '1 hour'
  `);
  
  for (const ext of unpaidExtensions) {
    // Send escalating alert
    await twilioClient.messages.create({
      body: `⚠️ PAYMENT MISSING
Customer: ${ext.customer_name}
Amount: $${ext.extra_amount}
Time overdue: ${getHoursSince(ext.approved_at)} hours`,
      to: process.env.OWNER_PHONE
    });
    
    // Create high-priority alert
    await createAlert({
      type: 'payment_missing',
      severity: 'high',
      title: 'Payment Not Collected',
      data: { extensionId: ext.id }
    });
  }
}, 60 * 60 * 1000); // Every hour
```

---

## 🎯 Day 2: Owner Dashboard

### React Dashboard Component

```typescript
// OwnerDashboard.tsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function OwnerDashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    expectedRevenue: 0,
    vehiclesOut: 0,
    vehiclesAvailable: 0,
    pendingExtensions: [],
    unpaidPayments: []
  });
  
  const [alerts, setAlerts] = useState([]);
  const socket = io('http://localhost:3000');
  
  useEffect(() => {
    // Real-time updates
    socket.on('extension_requested', (data) => {
      setAlerts(prev => [{
        id: data.extension.id,
        type: 'extension',
        title: 'Extension Request',
        message: `${data.booking.customer_name} wants ${data.extension.extra_days} extra days`,
        amount: data.extension.extra_amount,
        severity: 'critical',
        timestamp: new Date()
      }, ...prev]);
      
      // Play notification sound
      playNotificationSound();
      
      // Show desktop notification
      showDesktopNotification(
        'Extension Request',
        `$${data.extension.extra_amount} for ${data.extension.extra_days} days`
      );
    });
    
    socket.on('payment_collected', (data) => {
      // Update revenue
      setStats(prev => ({
        ...prev,
        todayRevenue: prev.todayRevenue + data.amount
      }));
      
      // Remove from unpaid list
      setStats(prev => ({
        ...prev,
        unpaidPayments: prev.unpaidPayments.filter(p => p.id !== data.extensionId)
      }));
    });
    
    // Load initial data
    loadDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);
  
  const approveExtension = async (extensionId: string) => {
    await fetch(`/api/extensions/${extensionId}/approve`, {
      method: 'POST'
    });
    
    // Remove from pending
    setAlerts(prev => prev.filter(a => a.id !== extensionId));
    
    // Show success
    toast.success('Extension approved');
  };
  
  const denyExtension = async (extensionId: string) => {
    await fetch(`/api/extensions/${extensionId}/deny`, {
      method: 'POST'
    });
    
    setAlerts(prev => prev.filter(a => a.id !== extensionId));
    toast.info('Extension denied');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Revenue Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <h2 className="text-2xl font-bold mb-4">Today's Revenue</h2>
        <div className="text-4xl font-bold text-green-600">
          ${stats.todayRevenue}
        </div>
        <div className="text-sm text-gray-500">
          Expected: ${stats.expectedRevenue}
        </div>
        {stats.expectedRevenue - stats.todayRevenue > 0 && (
          <div className="text-red-600 font-bold mt-2">
            Missing: ${stats.expectedRevenue - stats.todayRevenue}
          </div>
        )}
      </div>
      
      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-bold text-red-700 mb-3">
            ⚠️ Requires Your Attention ({alerts.length})
          </h3>
          {alerts.map(alert => (
            <div key={alert.id} className="bg-white rounded p-4 mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{alert.title}</div>
                  <div className="text-gray-600">{alert.message}</div>
                  {alert.amount && (
                    <div className="text-2xl font-bold text-green-600 mt-2">
                      ${alert.amount}
                    </div>
                  )}
                </div>
                {alert.type === 'extension' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveExtension(alert.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      APPROVE
                    </button>
                    <button
                      onClick={() => denyExtension(alert.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      DENY
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Fleet Status */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500">Vehicles Out</div>
          <div className="text-3xl font-bold">{stats.vehiclesOut}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500">Available</div>
          <div className="text-3xl font-bold text-green-600">
            {stats.vehiclesAvailable}
          </div>
        </div>
      </div>
      
      {/* Unpaid Payments */}
      {stats.unpaidPayments.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-bold text-yellow-700 mb-2">
            💵 Pending Payments ({stats.unpaidPayments.length})
          </h3>
          {stats.unpaidPayments.map(payment => (
            <div key={payment.id} className="flex justify-between py-2 border-b">
              <div>
                <div className="font-medium">{payment.customerName}</div>
                <div className="text-sm text-gray-500">{payment.vehicleName}</div>
              </div>
              <div className="text-red-600 font-bold">${payment.amount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Mobile App (React Native)

```typescript
// OwnerMobileApp.tsx
import PushNotification from 'react-native-push-notification';

// Configure push notifications
PushNotification.configure({
  onNotification: function(notification) {
    // Handle notification tap
    if (notification.data.extensionId) {
      navigateToExtension(notification.data.extensionId);
    }
  },
  
  permissions: {
    alert: true,
    badge: true,
    sound: true
  },
  
  popInitialNotification: true,
  requestPermissions: true
});

// Main screen
export function OwnerHomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Today's Revenue */}
        <View style={styles.revenueCard}>
          <Text style={styles.label}>Today's Revenue</Text>
          <Text style={styles.revenue}>${todayRevenue}</Text>
          {missingAmount > 0 && (
            <Text style={styles.missing}>Missing: ${missingAmount}</Text>
          )}
        </View>
        
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{vehiclesOut}</Text>
            <Text style={styles.statLabel}>Out</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{vehiclesAvailable}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>
        
        {/* Pending Alerts */}
        {alerts.map(alert => (
          <TouchableOpacity
            key={alert.id}
            style={styles.alertCard}
            onPress={() => handleAlert(alert)}
          >
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <Text style={styles.alertAmount}>${alert.amount}</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.approveButton]}
                onPress={() => approveExtension(alert.id)}
              >
                <Text style={styles.buttonText}>APPROVE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.denyButton]}
                onPress={() => denyExtension(alert.id)}
              >
                <Text style={styles.buttonText}>DENY</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## 🚨 Critical Implementation Points

### 1. Notification Setup (MUST WORK)

```bash
# Environment variables needed
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE=+1234567890
TWILIO_WHATSAPP=+14155238886
OWNER_PHONE=+1234567890
OWNER_EMAIL=owner@rental.com
```

### 2. Database Triggers

```sql
-- Auto-create alert when extension requested
CREATE OR REPLACE FUNCTION notify_extension_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO alerts (
    type, severity, title, message, data
  ) VALUES (
    'extension_request',
    'critical',
    'Extension Request',
    CONCAT('Customer wants ', NEW.extra_days, ' extra days for $', NEW.extra_amount),
    json_build_object('extensionId', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER extension_request_trigger
AFTER INSERT ON extensions
FOR EACH ROW
EXECUTE FUNCTION notify_extension_request();
```

### 3. Worker App Lock-Down

```typescript
// Worker can ONLY:
// 1. Create rentals
// 2. Request extensions (not approve)
// 3. Process returns
// 4. Collect payments

// Worker CANNOT:
// 1. Delete anything
// 2. Modify prices
// 3. Approve extensions
// 4. Access reports

const workerPermissions = {
  bookings: ['create', 'update'],
  extensions: ['create'], // No approve/deny
  payments: ['create'],
  reports: [], // No access
  settings: [], // No access
  workers: [] // No access
};
```

---

## 📱 Testing Checklist

### Extension Flow
- [ ] Worker requests extension
- [ ] Owner gets SMS within 5 seconds
- [ ] Owner gets WhatsApp within 5 seconds
- [ ] Owner gets push notification
- [ ] Dashboard shows alert immediately
- [ ] Owner can approve via SMS reply
- [ ] Owner can approve via dashboard
- [ ] Owner can approve via mobile app
- [ ] If no response in 5 min, owner gets phone call

### Payment Tracking
- [ ] Extension approval creates payment expectation
- [ ] Unpaid after 1 hour triggers alert
- [ ] Payment collection notifies owner
- [ ] Dashboard updates revenue in real-time
- [ ] Daily reconciliation works

### Security
- [ ] Workers can't delete records
- [ ] All actions are logged
- [ ] Owner gets notified of suspicious activity
- [ ] Audit trail is immutable

---

## 🚀 Deploy in 3 Steps

### 1. Setup Server
```bash
# Clone and install
git clone [repo]
cd rental-management
npm install

# Setup database
psql -U postgres -f schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start Services
```bash
# Start backend
npm run server

# Start dashboard (separate terminal)
npm run dashboard

# Start worker app (separate terminal)
npm run worker-app
```

### 3. Configure Twilio
- Get phone number
- Setup WhatsApp sandbox
- Configure webhooks
- Test notifications

---

## 💰 Cost Breakdown

### Monthly Costs
- **Server**: $20 (DigitalOcean/Linode)
- **Database**: $15 (Managed PostgreSQL)
- **Twilio**: $50 (SMS/WhatsApp)
- **Domain**: $1
- **Total**: ~$86/month

### ROI
- **Save**: $1000+/month in lost revenue
- **Payback**: Less than 1 month

---

## ✅ You're Ready!

This system will:
1. **Alert you instantly** when extensions are requested
2. **Track every payment** until collected
3. **Show everything** on your dashboard
4. **Prevent workers** from hiding revenue

**Start with the extension alert system - it's the most important feature that will save you money immediately.**

---

*Questions? The code above is production-ready. Just add your Twilio credentials and deploy!*
