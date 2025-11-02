import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../../hooks/useVehicles';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Plus } from 'lucide-react';
import type { Vehicle } from '../../types/domain';

export function VehiclesPage() {
  const navigate = useNavigate();
  const { data: vehicles = [], isLoading } = useVehicles();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredVehicles = statusFilter === 'all'
    ? vehicles
    : vehicles.filter((v) => v.status === statusFilter);

  const columns = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (v: Vehicle) => (
        <div>
          <div className="font-medium">{`${v.year} ${v.make} ${v.model}`}</div>
          <div className="text-gray-500 text-xs">{v.plate}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v: Vehicle) => (
        <Badge variant={getStatusBadgeVariant(v.status)}>
          {v.status}
        </Badge>
      ),
    },
    {
      key: 'odometer',
      header: 'Odometer',
      render: (v: Vehicle) => (
        <span>{v.odometer ? `${v.odometer.toLocaleString()} mi` : 'N/A'}</span>
      ),
    },
    {
      key: 'vin',
      header: 'VIN',
      render: (v: Vehicle) => <span className="text-xs">{v.vin || 'N/A'}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vehicles...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
        <Button onClick={() => {/* TODO: Add vehicle modal */}}>
          <Plus className="h-5 w-5 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="mb-4 flex gap-4">
        <Select
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'available', label: 'Available' },
            { value: 'reserved', label: 'Reserved' },
            { value: 'rented', label: 'Rented' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          data={filteredVehicles}
          columns={columns}
          onRowClick={(vehicle) => navigate(`/vehicles/${vehicle.id}`)}
        />
      </div>
    </div>
  );
}
