import { useVehicles } from '../../hooks/useVehicles';
import { useBookings } from '../../hooks/useBookings';
import { Car, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';

export function DashboardPage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: bookings = [] } = useBookings();

  const activeBookings = bookings.filter((b) => b.status === 'checked_out');
  const upcomingReturns = bookings.filter(
    (b) => b.status === 'checked_out' && dayjs(b.endAt).isBefore(dayjs().add(3, 'day'))
  );
  const availableVehicles = vehicles.filter((v) => v.status === 'available');
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance');

  const utilization = vehicles.length > 0 ? ((activeBookings.length / vehicles.length) * 100).toFixed(1) : '0';

  const stats = [
    {
      name: 'Fleet Utilization',
      value: `${utilization}%`,
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      name: 'Vehicles Out',
      value: activeBookings.length,
      icon: Car,
      color: 'bg-green-500',
    },
    {
      name: 'Returns Due (3 days)',
      value: upcomingReturns.length,
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      name: 'Maintenance',
      value: maintenanceVehicles.length,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Vehicles</h2>
          <div className="space-y-2">
            {availableVehicles.length === 0 ? (
              <p className="text-gray-500">No vehicles available</p>
            ) : (
              availableVehicles.slice(0, 5).map((vehicle) => (
                <div key={vehicle.id} className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </span>
                  <span className="text-sm text-gray-500">{vehicle.plate}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Returns</h2>
          <div className="space-y-2">
            {upcomingReturns.length === 0 ? (
              <p className="text-gray-500">No upcoming returns</p>
            ) : (
              upcomingReturns.slice(0, 5).map((booking) => {
                const vehicle = vehicles.find((v) => v.id === booking.vehicleId);
                return (
                  <div key={booking.id} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">
                      {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown'}
                    </span>
                    <span className="text-sm text-gray-500">{dayjs(booking.endAt).format('MMM D, YYYY')}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
