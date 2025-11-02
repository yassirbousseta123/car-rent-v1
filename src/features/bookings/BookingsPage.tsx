import { useState } from 'react';
import { useBookings } from '../../hooks/useBookings';
import { useVehicles } from '../../hooks/useVehicles';
import { useRenters } from '../../hooks/useRenters';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Plus } from 'lucide-react';
import { BookingWizard } from './BookingWizard';
import dayjs from 'dayjs';
import type { Booking } from '../../types/domain';

export function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showWizard, setShowWizard] = useState(false);

  const { data: bookings = [], isLoading } = useBookings();
  const { data: vehicles = [] } = useVehicles();
  const { data: renters = [] } = useRenters();

  const filteredBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === statusFilter);

  const columns = [
    {
      key: 'renter',
      header: 'Renter',
      render: (b: Booking) => {
        const renter = renters.find((r) => r.id === b.renterId);
        return (
          <div>
            <div className="font-medium">
              {renter ? `${renter.firstName} ${renter.lastName}` : 'Unknown'}
            </div>
            {renter?.phone && <div className="text-xs text-gray-500">{renter.phone}</div>}
          </div>
        );
      },
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (b: Booking) => {
        const vehicle = vehicles.find((v) => v.id === b.vehicleId);
        return vehicle ? (
          <div>
            <div className="font-medium">{`${vehicle.year} ${vehicle.make} ${vehicle.model}`}</div>
            <div className="text-xs text-gray-500">{vehicle.plate}</div>
          </div>
        ) : (
          'Unknown'
        );
      },
    },
    {
      key: 'dates',
      header: 'Rental Period',
      render: (b: Booking) => (
        <div className="text-sm">
          <div>{dayjs(b.startAt).format('MMM D, YYYY')}</div>
          <div className="text-gray-500">{dayjs(b.endAt).format('MMM D, YYYY')}</div>
        </div>
      ),
    },
    {
      key: 'rate',
      header: 'Daily Rate',
      render: (b: Booking) => <span className="font-medium">${b.dailyRate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (b: Booking) => <Badge variant={getStatusBadgeVariant(b.status)}>{b.status}</Badge>,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reservations</h1>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-5 w-5 mr-2" />
          New Reservation
        </Button>
      </div>

      <div className="mb-4 flex gap-4">
        <Select
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'reserved', label: 'Reserved' },
            { value: 'checked_out', label: 'Checked Out' },
            { value: 'returned', label: 'Returned' },
            { value: 'canceled', label: 'Canceled' },
          ]}
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table data={filteredBookings.sort((a, b) => dayjs(b.startAt).diff(dayjs(a.startAt)))} columns={columns} />
      </div>

      {showWizard && <BookingWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
