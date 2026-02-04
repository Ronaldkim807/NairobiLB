 // ./routes/payments.js
import express from 'express';
import prisma from '../utils/database.js';
import mpesaService from '../services/mpesaService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/payments/initiate
 * Body: { bookingId, phoneNumber }
 */
router.post('/initiate', authenticateToken, async (req, res) => {
  try {
    const { bookingId, phoneNumber } = req.body || {};

    if (!bookingId || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Booking ID and phone number are required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true, ticketType: true, user: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to pay for this booking' });
    }

    if (booking.status === 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    // Normalize phone
    let formattedPhone = String(phoneNumber).trim();
    if (formattedPhone.startsWith('0')) formattedPhone = `254${formattedPhone.substring(1)}`;
    else if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);

    // Initiate STK push
    const stkResult = await mpesaService.initiateSTKPush(
      formattedPhone,
      booking.totalAmount,
      `Event-${booking.event.id}`,
      `Payment for ${booking.event.title}`
    );

    if (!stkResult || !stkResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to initiate payment',
        error: stkResult?.error ?? stkResult
      });
    }

    // Persist payment record (store CheckoutRequestID where possible)
    const providerRef = stkResult.checkoutRequestID ?? stkResult.data?.CheckoutRequestID ?? null;

    const payment = await prisma.payment.create({
      data: {
        amount: booking.totalAmount,
        provider: 'mpesa',
        providerRef,
        phoneNumber: formattedPhone,
        status: 'PENDING',
        bookingId: booking.id
      }
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PENDING' }
    });

    return res.json({
      success: true,
      message: 'Payment initiated successfully. Please check your phone to complete the payment.',
      data: { payment, stkResponse: stkResult.data ?? stkResult }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/payments/mpesa-callback
 * Safaricom will POST the result here
 */
router.post('/mpesa-callback', async (req, res) => {
  try {
    const callbackData = req.body || {};
    console.log('M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2));

    const stkCallback = callbackData?.Body?.stkCallback ?? callbackData?.stkCallback ?? null;

    if (!stkCallback) {
      console.warn('M-Pesa callback missing stkCallback:', callbackData);
      // Acknowledge so Safaricom doesn't retry
      return res.json({ ResultCode: 0, ResultDesc: 'Received' });
    }

    const resultCode = Number(stkCallback.ResultCode ?? stkCallback.resultCode ?? -1);
    const checkoutRequestID = stkCallback.CheckoutRequestID ?? stkCallback.checkoutRequestID ?? null;

    if (resultCode === 0) {
      // Success: extract callback metadata items robustly
      const items = stkCallback?.CallbackMetadata?.Item ?? stkCallback?.CallbackMetadata ?? [];
      const findItem = (name) => {
        try {
          const it = items.find(i => i?.Name === name || i?.name === name);
          return it?.Value ?? it?.value ?? null;
        } catch {
          return null;
        }
      };

      const amount = findItem('Amount');
      const mpesaReceiptNumber = findItem('MpesaReceiptNumber') ?? findItem('MpesaReceiptNo') ?? null;
      const phoneNumber = findItem('PhoneNumber');

      // find payment record by CheckoutRequestID (providerRef)
      const payment = await prisma.payment.findFirst({
        where: { providerRef: checkoutRequestID },
        include: { booking: true }
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            providerRef: mpesaReceiptNumber ?? payment.providerRef,
            amount: amount ?? payment.amount,
            phoneNumber: phoneNumber ?? payment.phoneNumber
          }
        });

        if (payment.booking?.id) {
          await prisma.booking.update({
            where: { id: payment.booking.id },
            data: { status: 'CONFIRMED' }
          });
        }

        console.log(`Payment successful for booking ${payment.booking?.id ?? 'unknown'}`);
      } else {
        console.warn('Payment record not found for CheckoutRequestID:', checkoutRequestID);
      }
    } else {
      // Failed or cancelled
      const resultDesc = stkCallback.ResultDesc ?? stkCallback.resultDesc ?? 'Failed';

      const payment = await prisma.payment.findFirst({
        where: { providerRef: checkoutRequestID }
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        });

        if (payment.bookingId) {
          try {
            await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: 'CANCELLED' }
            });
          } catch (e) {
            console.warn('Failed to update booking status for failed payment:', e);
          }
        }
      }

      console.error('M-Pesa payment failed:', resultDesc);
    }

    // Acknowledge receipt
    return res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

/**
 * GET /api/payments/:paymentId/status
 */
router.get('/:paymentId/status', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (!payment.booking || payment.booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this payment' });
    }

    return res.json({ success: true, data: { payment } });
  } catch (error) {
    console.error('Check payment status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
