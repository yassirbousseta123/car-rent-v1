import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVehicle } from '../../hooks/useVehicles';
import { useBookings } from '../../hooks/useBookings';
import { useDocuments } from '../../hooks/useDocuments';
import { useRenters } from '../../hooks/useRenters';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import dayjs from 'dayjs';

type Tab = 'overview' | 'bookings' | 'documents';

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(id!);
  const { data: allBookings = [] } = useBookings();
  const { data: allDocuments = [] } = useDocuments({ vehicleId: id });
  const { data: renters = [] } = useRenters();

  const vehicleBookings = allBookings.filter((b) => b.vehicleId === id);

  if (vehicleLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!vehicle) {
    return <div className="text-center py-8">Vehicle not found</div>;
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Calendar },
    { id: 'bookings' as const, label: `Bookings (${vehicleBookings.length})`, icon: Calendar },
    { id: 'documents' as const, label: `Documents (${allDocuments.length})`, icon: FileText },
  ];

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/vehicles')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Vehicles
      </Button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-gray-500 mt-1">{vehicle.plate}</p>
          </div>
          <Badge variant={getStatusBadgeVariant(vehicle.status)}>{vehicle.status}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-sm text-gray-500">VIN</p>
            <p className="font-medium text-sm">{vehicle.vin || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Odometer</p>
            <p className="font-medium">{vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="font-medium">{vehicleBookings.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Documents</p>
            <p className="font-medium">{allDocuments.length}</p>
          </div>
        </div>

        {vehicle.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-700">{vehicle.notes}</p>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Availability Overview</h2>
            <p className="text-gray-500">Availability timeline coming soon...</p>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Booking History</h2>
            {vehicleBookings.length === 0 ? (
              <p className="text-gray-500">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                {vehicleBookings
                  .sort((a, b) => dayjs(b.startAt).diff(dayjs(a.startAt)))
                  .map((booking) => {
                    const renter = renters.find((r) => r.id === booking.renterId);
                    return (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {renter ? `${renter.firstName} ${renter.lastName}` : 'Unknown Renter'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {dayjs(booking.startAt).format('MMM D, YYYY')} -{' '}
                              {dayjs(booking.endAt).format('MMM D, YYYY')}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <span className="font-medium">${booking.dailyRate}/day</span>
                          {booking.deposit && <span className="ml-4">Deposit: ${booking.deposit}</span>}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Documents Gallery</h2>
            {allDocuments.length === 0 ? (
              <p className="text-gray-500">No documents yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allDocuments.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-3">
                    {doc.mime.startsWith('image/') ? (
                      <img src={doc.url} alt={doc.fileName} className="w-full h-32 object-cover rounded mb-2" />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <p className="text-xs font-medium truncate">{doc.kind.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
