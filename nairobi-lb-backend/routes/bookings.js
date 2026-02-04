import express from "express";
import prisma from "../utils/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * Create a booking (atomic)
 * POST /api/bookings
 * Body: { eventId, ticketTypeId, quantity }
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { eventId, ticketTypeId, quantity } = req.body || {};

    // Validate input
    if (!eventId || !ticketTypeId || !quantity) {
      return res.status(400).json({ success: false, message: "Event ID, ticket type ID, and quantity are required" });
    }

    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be a positive integer" });
    }

    // Load ticket type with its event to validate event and active status
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true }
    });

    if (!ticketType) {
      return res.status(404).json({ success: false, message: "Ticket type not found" });
    }

    // Ensure ticketType belongs to the requested event
    if (ticketType.eventId !== eventId) {
      return res.status(400).json({ success: false, message: "Ticket type does not belong to the specified event" });
    }

    // Ensure event exists and is active
    const event = ticketType.event;
    if (!event || !event.isActive) {
      return res.status(404).json({ success: false, message: "Event not found or inactive" });
    }

    // Check enough tickets available
    if (ticketType.quantity < qty) {
      return res.status(400).json({ success: false, message: "Not enough tickets available" });
    }

    const totalAmount = Number(ticketType.price) * qty;

    // Use a transaction: create booking and decrement ticket quantity atomically
    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          quantity: qty,
          totalAmount,
          userId: req.user.id,
          eventId,
          ticketTypeId
        },
        include: {
          event: { select: { title: true, startTime: true, venue: true } },
          ticketType: true
        }
      }),
      prisma.ticketType.update({
        where: { id: ticketTypeId },
        data: { quantity: { decrement: qty } }
      })
    ]);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { booking }
    });
  } catch (error) {
    console.error("Create booking error:", error);
    // Prisma known errors could be handled specially, but generic 500 is ok for now
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Get user's bookings
 * GET /api/bookings/my-bookings
 */
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        event: { select: { title: true, startTime: true, venue: true, imageUrl: true } },
        ticketType: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ success: true, data: { bookings } });
  } catch (error) {
    console.error("Get bookings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Get single booking
 * GET /api/bookings/:id
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: { include: { organizer: { select: { name: true, email: true } } } },
        ticketType: true,
        payments: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this booking" });
    }

    return res.json({ success: true, data: { booking } });
  } catch (error) {
    console.error("Get booking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Cancel booking
 * PUT /api/bookings/:id/cancel
 */
router.put("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { event: true, ticketType: true, payments: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const isOwner = booking.userId === req.user.id;
    const isAdmin = req.user?.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You are not authorized to cancel this booking" });
    }

    if (String(booking.status).toUpperCase() === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    // Update booking status and return tickets atomically
    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { ticketType: true }
      }),
      // Use increment to safely return tickets
      prisma.ticketType.update({
        where: { id: booking.ticketTypeId },
        data: { quantity: { increment: booking.quantity } }
      })
    ]);

    // TODO: If payment was made, initiate refund process

    return res.json({ success: true, message: "Booking cancelled successfully", data: { booking: updatedBooking } });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
