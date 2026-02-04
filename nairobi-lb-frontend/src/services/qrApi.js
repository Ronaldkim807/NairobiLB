// src/services/qrApi.js
import QRCode from 'qrcode';

/**
 * Build a normalized ticket payload to embed inside the QR code.
 * Keep it compact but uniquely identifiable.
 */
export const buildTicketPayload = (booking, user) => ({
  bookingId: booking.id,
  reference: booking.bookingReference || booking.id,
  eventId: booking.event?.id,
  event: booking.event?.title,
  ticketType: booking.ticketType?.name,
  quantity: booking.quantity,
  attendee: user?.name || user?.email || 'Guest',
  issuedAt: new Date().toISOString(),
});

/**
 * Generate a QR code data URL using the qrcode library.
 * @param {object} payload
 * @param {number} size
 */
export const generateQrDataUrl = async (payload, size = 360) => {
  const text = JSON.stringify(payload);
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#111827', light: '#FFFFFF' },
  });
};
