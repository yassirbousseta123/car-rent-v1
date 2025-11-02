import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useCreateBooking } from '../../hooks/useBookings';
import { useVehicles } from '../../hooks/useVehicles';
import { useRenters } from '../../hooks/useRenters';
import { useCreateDocument, useUploadFile } from '../../hooks/useDocuments';
import { isVehicleRangeAvailable, getNextAvailableDate } from '../../lib/availability';
import { useBookings } from '../../hooks/useBookings';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { generateContractPDF } from '../../lib/pdf';
import { AlertCircle } from 'lucide-react';

type Step = 'renter' | 'vehicle' | 'dates' | 'pricing' | 'documents' | 'review';

interface BookingWizardProps {
  onClose: () => void;
}

interface WizardState {
  renterId?: string;
  vehicleId?: string;
  startAt?: string;
  endAt?: string;
  dailyRate: number;
  deposit: number;
  fees: Array<{ name: string; amount: number }>;
  idFrontFile?: File;
  idBackFile?: File;
  signatureDataUrl?: string;
}

export function BookingWizard({ onClose }: BookingWizardProps) {
  const [step, setStep] = useState<Step>('renter');
  const [state, setState] = useState<WizardState>({
    dailyRate: 50,
    deposit: 200,
    fees: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [newRenterMode, setNewRenterMode] = useState(false);

  const { data: vehicles = [] } = useVehicles();
  const { data: renters = [] } = useRenters();
  const { data: bookings = [] } = useBookings();
  const createBooking = useCreateBooking();
  const createDocument = useCreateDocument();
  const uploadFile = useUploadFile();

  const steps: Step[] = ['renter', 'vehicle', 'dates', 'pricing', 'documents', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const handleNext = () => {
    setError(null);

    if (step === 'vehicle' && state.vehicleId) {
      const nextAvailable = getNextAvailableDate(bookings, state.vehicleId);
      if (nextAvailable && !state.startAt) {
        setState((s) => ({
          ...s,
          startAt: nextAvailable,
          endAt: dayjs(nextAvailable).add(3, 'day').toISOString(),
        }));
      }
    }

    if (step === 'dates' && state.vehicleId && state.startAt && state.endAt) {
      const isAvailable = isVehicleRangeAvailable(bookings, state.startAt, state.endAt, state.vehicleId);
      if (!isAvailable) {
        setError('Vehicle is not available for selected dates. Please choose different dates.');
        return;
      }
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    if (!state.renterId || !state.vehicleId || !state.startAt || !state.endAt) {
      setError('Missing required information');
      return;
    }

    try {
      const bookingId = uuidv4();
      const renter = renters.find((r) => r.id === state.renterId);
      const vehicle = vehicles.find((v) => v.id === state.vehicleId);

      await createBooking.mutateAsync({
        id: bookingId,
        renterId: state.renterId,
        vehicleId: state.vehicleId,
        startAt: state.startAt,
        endAt: state.endAt,
        dailyRate: state.dailyRate,
        deposit: state.deposit,
        fees: state.fees,
        status: 'reserved',
      });

      if (state.idFrontFile) {
        const uploaded = await uploadFile.mutateAsync(state.idFrontFile);
        await createDocument.mutateAsync({
          id: uuidv4(),
          bookingId,
          vehicleId: state.vehicleId,
          renterId: state.renterId,
          kind: 'id_front',
          fileName: state.idFrontFile.name,
          mime: state.idFrontFile.type,
          url: uploaded.url,
          createdAt: new Date().toISOString(),
        });
      }

      if (state.idBackFile) {
        const uploaded = await uploadFile.mutateAsync(state.idBackFile);
        await createDocument.mutateAsync({
          id: uuidv4(),
          bookingId,
          vehicleId: state.vehicleId,
          renterId: state.renterId,
          kind: 'id_back',
          fileName: state.idBackFile.name,
          mime: state.idBackFile.type,
          url: uploaded.url,
          createdAt: new Date().toISOString(),
        });
      }

      if (state.signatureDataUrl && renter && vehicle) {
        const pdfBlob = await generateContractPDF(
          {
            id: bookingId,
            vehicleId: state.vehicleId,
            renterId: state.renterId,
            startAt: state.startAt,
            endAt: state.endAt,
            dailyRate: state.dailyRate,
            deposit: state.deposit,
            fees: state.fees,
            status: 'reserved',
          },
          vehicle,
          renter,
          state.signatureDataUrl
        );

        const pdfFile = new File([pdfBlob], `contract_${bookingId}.pdf`, { type: 'application/pdf' });
        const uploaded = await uploadFile.mutateAsync(pdfFile);

        await createDocument.mutateAsync({
          id: uuidv4(),
          bookingId,
          vehicleId: state.vehicleId,
          renterId: state.renterId,
          kind: 'contract_pdf',
          fileName: pdfFile.name,
          mime: 'application/pdf',
          url: uploaded.url,
          createdAt: new Date().toISOString(),
        });
      }

      onClose();
    } catch (err: any) {
      setError(err?.data?.error || 'Failed to create booking');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'renter':
        return !!state.renterId;
      case 'vehicle':
        return !!state.vehicleId;
      case 'dates':
        return !!state.startAt && !!state.endAt;
      case 'pricing':
        return state.dailyRate > 0;
      case 'documents':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Reservation" size="xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  idx <= currentStepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-12 h-1 ${idx < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="min-h-[300px]">
        {step === 'renter' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Select or Create Renter</h3>
            {!newRenterMode ? (
              <>
                <Select
                  label="Existing Renter"
                  value={state.renterId || ''}
                  onChange={(e) => setState({ ...state, renterId: e.target.value })}
                  options={[
                    { value: '', label: 'Select a renter...' },
                    ...renters.map((r) => ({
                      value: r.id,
                      label: `${r.firstName} ${r.lastName} - ${r.idNumber}`,
                    })),
                  ]}
                />
                <Button variant="ghost" onClick={() => setNewRenterMode(true)} className="mt-2">
                  + Create New Renter
                </Button>
              </>
            ) : (
              <p className="text-gray-500">Create new renter form coming soon...</p>
            )}
          </div>
        )}

        {step === 'vehicle' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Select Vehicle</h3>
            <Select
              label="Vehicle"
              value={state.vehicleId || ''}
              onChange={(e) => setState({ ...state, vehicleId: e.target.value })}
              options={[
                { value: '', label: 'Select a vehicle...' },
                ...vehicles
                  .filter((v) => v.status === 'available')
                  .map((v) => ({
                    value: v.id,
                    label: `${v.year} ${v.make} ${v.model} (${v.plate})`,
                  })),
              ]}
            />
          </div>
        )}

        {step === 'dates' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Rental Period</h3>
            <div className="space-y-4">
              <Input
                type="datetime-local"
                label="Start Date & Time"
                value={state.startAt ? dayjs(state.startAt).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={(e) =>
                  setState({ ...state, startAt: dayjs(e.target.value).toISOString() })
                }
              />
              <Input
                type="datetime-local"
                label="End Date & Time"
                value={state.endAt ? dayjs(state.endAt).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={(e) =>
                  setState({ ...state, endAt: dayjs(e.target.value).toISOString() })
                }
              />
            </div>
          </div>
        )}

        {step === 'pricing' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Pricing Details</h3>
            <div className="space-y-4">
              <Input
                type="number"
                label="Daily Rate ($)"
                value={state.dailyRate}
                onChange={(e) => setState({ ...state, dailyRate: Number(e.target.value) })}
              />
              <Input
                type="number"
                label="Deposit ($)"
                value={state.deposit}
                onChange={(e) => setState({ ...state, deposit: Number(e.target.value) })}
              />
            </div>
          </div>
        )}

        {step === 'documents' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
            <div className="space-y-4">
              <Input
                type="file"
                label="ID Front"
                accept="image/*"
                onChange={(e) => setState({ ...state, idFrontFile: e.target.files?.[0] })}
              />
              <Input
                type="file"
                label="ID Back"
                accept="image/*"
                onChange={(e) => setState({ ...state, idBackFile: e.target.files?.[0] })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
                <p className="text-sm text-gray-500">Signature pad coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Review & Confirm</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Renter:</strong> {renters.find((r) => r.id === state.renterId)?.firstName} {renters.find((r) => r.id === state.renterId)?.lastName}</p>
              <p><strong>Vehicle:</strong> {vehicles.find((v) => v.id === state.vehicleId)?.make} {vehicles.find((v) => v.id === state.vehicleId)?.model}</p>
              <p><strong>Dates:</strong> {dayjs(state.startAt).format('MMM D, YYYY')} - {dayjs(state.endAt).format('MMM D, YYYY')}</p>
              <p><strong>Daily Rate:</strong> ${state.dailyRate}</p>
              <p><strong>Deposit:</strong> ${state.deposit}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={currentStepIndex > 0 ? handleBack : onClose}>
          {currentStepIndex > 0 ? 'Back' : 'Cancel'}
        </Button>
        {step === 'review' ? (
          <Button onClick={handleSubmit} isLoading={createBooking.isPending}>
            Create Reservation
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
          </Button>
        )}
      </div>
    </Modal>
  );
}
