// routes/events.js
import express from "express";
import { authenticateToken, requireOrganizer } from "../middleware/auth.js";
import prisma from "../utils/database.js";

const router = express.Router();

function safeParseInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && !Number.isNaN(n) ? parseInt(n, 10) : null;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * GET /api/events
 * List active events (public)
 */
router.get("/", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        ticketTypes: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ success: true, data: { events } });
  } catch (error) {
    console.error("Get events error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * GET /api/events/:id
 * Get single event by ID (public)
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Event id is required" });

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        ticketTypes: true,
        _count: { select: { bookings: true } }
      }
    });

    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    return res.json({ success: true, data: { event } });
  } catch (error) {
    console.error("Get event error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/events
 * Create event - Organizer or Admin only
 */
router.post("/", authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      address,
      city,
      startTime,
      endTime,
      capacity,
      imageUrl,
      ticketTypes
    } = req.body || {};

    if (!title || !category || !venue || !startTime || capacity == null) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, category, venue, startTime, capacity"
      });
    }

    if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one ticket type is required"
      });
    }

    for (const t of ticketTypes) {
      if (!t || !t.name || t.price == null || t.quantity == null) {
        return res.status(400).json({
          success: false,
          message: "Each ticket type must include name, price and quantity"
        });
      }
      if (isNaN(Number(t.price)) || !Number.isInteger(Number(t.quantity)) || Number(t.quantity) < 0) {
        return res.status(400).json({
          success: false,
          message: "Ticket type price must be a number and quantity must be a non-negative integer"
        });
      }
    }

    const parsedCapacity = safeParseInt(capacity);
    if (parsedCapacity == null || parsedCapacity <= 0) {
      return res.status(400).json({ success: false, message: "capacity must be a positive integer" });
    }

    const parsedStart = toDate(startTime);
    if (!parsedStart) return res.status(400).json({ success: false, message: "Invalid startTime" });

    const parsedEnd = toDate(endTime);
    if (endTime && !parsedEnd) return res.status(400).json({ success: false, message: "Invalid endTime" });

    const data = {
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      category: String(category).trim(),
      venue: String(venue).trim(),
      address: address ? String(address).trim() : null,
      city: city ? String(city).trim() : null,
      startTime: parsedStart,
      endTime: parsedEnd,
      capacity: parsedCapacity,
      imageUrl: imageUrl ? String(imageUrl).trim() : null,
      isActive: true,
      organizerId: req.user.id,
      ticketTypes: {
        create: ticketTypes.map(t => ({
          name: String(t.name),
          price: Number(t.price),
          quantity: parseInt(t.quantity, 10)
        }))
      }
    };

    const event = await prisma.event.create({
      data,
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        ticketTypes: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: { event }
    });
  } catch (error) {
    console.error("Create event error:", error);
    if (error?.name === "PrismaClientValidationError") {
      return res.status(400).json({ success: false, message: "Invalid request shape", details: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * PUT /api/events/:id
 * Update an event - owner (organizer) or ADMIN
 * If ticketTypes array provided we replace existing ticket types for simplicity.
 */
router.put("/:id", authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Event id required" });

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Event not found" });

    const requester = req.user;
    const isOwner = requester.id === existing.organizerId;
    const isAdmin = requester.role === "ADMIN";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "Not authorized to edit this event" });

    const {
      title,
      description,
      category,
      venue,
      address,
      city,
      startTime,
      endTime,
      capacity,
      imageUrl,
      isActive,
      ticketTypes
    } = req.body || {};

    const updates = {};
    if (title !== undefined) updates.title = String(title);
    if (description !== undefined) updates.description = description ? String(description) : null;
    if (category !== undefined) updates.category = String(category);
    if (venue !== undefined) updates.venue = String(venue);
    if (address !== undefined) updates.address = address ? String(address) : null;
    if (city !== undefined) updates.city = city ? String(city) : null;

    if (capacity !== undefined) {
      const parsedCapacity = safeParseInt(capacity);
      if (parsedCapacity == null || parsedCapacity <= 0) return res.status(400).json({ success: false, message: "capacity must be a positive integer" });
      updates.capacity = parsedCapacity;
    }

    if (startTime !== undefined) {
      const parsedStart = toDate(startTime);
      if (!parsedStart) return res.status(400).json({ success: false, message: "Invalid startTime" });
      updates.startTime = parsedStart;
    }

    if (endTime !== undefined) {
      if (endTime === null || endTime === "") updates.endTime = null;
      else {
        const parsedEnd = toDate(endTime);
        if (!parsedEnd) return res.status(400).json({ success: false, message: "Invalid endTime" });
        updates.endTime = parsedEnd;
      }
    }

    if (imageUrl !== undefined) updates.imageUrl = imageUrl ? String(imageUrl) : null;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    let result;
    if (Array.isArray(ticketTypes)) {
      for (const t of ticketTypes) {
        if (!t || !t.name || t.price == null || t.quantity == null) {
          return res.status(400).json({ success: false, message: "Each ticket type must include name, price and quantity" });
        }
        if (isNaN(Number(t.price)) || !Number.isInteger(Number(t.quantity)) || Number(t.quantity) < 0) {
          return res.status(400).json({ success: false, message: "Ticket type price must be a number and quantity a non-negative integer" });
        }
      }

      result = await prisma.$transaction(async (tx) => {
        await tx.ticketType.deleteMany({ where: { eventId: id } });
        const updated = await tx.event.update({ where: { id }, data: updates });
        const createdTicketTypes = await Promise.all(ticketTypes.map(t =>
          tx.ticketType.create({
            data: {
              eventId: id,
              name: String(t.name),
              price: Number(t.price),
              quantity: parseInt(t.quantity, 10)
            }
          })
        ));
        return { updated, ticketTypes: createdTicketTypes };
      });
    } else {
      const updated = await prisma.event.update({ where: { id }, data: updates });
      result = { updated };
    }

    return res.json({ success: true, message: "Event updated", data: result });
  } catch (error) {
    console.error("Update event error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * DELETE /api/events/:id
 * Delete event permanently - only organizer owner or ADMIN
 */
router.delete("/:id", authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Event id required" });

    const event = await prisma.event.findUnique({ where: { id }, select: { id: true, organizerId: true } });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const requester = req.user;
    const isOwner = requester.id === event.organizerId;
    const isAdmin = requester.role === "ADMIN";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "Not authorized to delete this event" });

    // Transactionally delete dependent records then event
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { booking: { eventId: id } } }),
      prisma.booking.deleteMany({ where: { eventId: id } }),
      prisma.ticketType.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } })
    ]);

    return res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * GET /api/events/organizer/my-events
 * Organizer-only: list events created by the authenticated organizer
 */
router.get("/organizer/my-events", authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user.id },
      include: {
        ticketTypes: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ success: true, data: { events } });
  } catch (error) {
    console.error("Get organizer events error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
