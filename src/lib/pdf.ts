import jsPDF from 'jspdf';
import type { Booking, Vehicle, Renter } from '../types/domain';
import dayjs from 'dayjs';

export async function generateContractPDF(
  booking: Booking,
  vehicle: Vehicle,
  renter: Renter,
  signatureDataUrl?: string
): Promise<Blob> {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('RENTAL AGREEMENT', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Contract ID: ${booking.id}`, 20, 40);
  doc.text(`Date: ${dayjs().format('YYYY-MM-DD')}`, 20, 45);

  doc.setFontSize(12);
  doc.text('RENTER INFORMATION', 20, 60);
  doc.setFontSize(10);
  doc.text(`Name: ${renter.firstName} ${renter.lastName}`, 20, 68);
  doc.text(`ID Number: ${renter.idNumber}`, 20, 74);
  doc.text(`Phone: ${renter.phone || 'N/A'}`, 20, 80);
  doc.text(`Email: ${renter.email || 'N/A'}`, 20, 86);

  doc.setFontSize(12);
  doc.text('VEHICLE INFORMATION', 20, 100);
  doc.setFontSize(10);
  doc.text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, 20, 108);
  doc.text(`Plate: ${vehicle.plate}`, 20, 114);
  doc.text(`VIN: ${vehicle.vin || 'N/A'}`, 20, 120);

  doc.setFontSize(12);
  doc.text('RENTAL PERIOD', 20, 134);
  doc.setFontSize(10);
  doc.text(`Start: ${dayjs(booking.startAt).format('YYYY-MM-DD HH:mm')}`, 20, 142);
  doc.text(`End: ${dayjs(booking.endAt).format('YYYY-MM-DD HH:mm')}`, 20, 148);
  doc.text(`Daily Rate: $${booking.dailyRate.toFixed(2)}`, 20, 154);
  doc.text(`Deposit: $${(booking.deposit || 0).toFixed(2)}`, 20, 160);

  if (booking.fees.length > 0) {
    doc.text('Fees:', 20, 166);
    booking.fees.forEach((fee, idx) => {
      doc.text(`  - ${fee.name}: $${fee.amount.toFixed(2)}`, 20, 172 + idx * 6);
    });
  }

  doc.setFontSize(12);
  doc.text('TERMS & CONDITIONS', 20, 190);
  doc.setFontSize(8);
  const terms = [
    '1. The renter agrees to return the vehicle in the same condition as received.',
    '2. Any damage to the vehicle will be the responsibility of the renter.',
    '3. The renter must have a valid driver\'s license.',
    '4. The deposit will be refunded upon satisfactory vehicle return.',
  ];
  terms.forEach((term, idx) => {
    doc.text(term, 20, 198 + idx * 6);
  });

  if (signatureDataUrl) {
    doc.setFontSize(10);
    doc.text('Signature:', 20, 230);
    doc.addImage(signatureDataUrl, 'PNG', 20, 235, 50, 20);
  }

  return doc.output('blob');
}
