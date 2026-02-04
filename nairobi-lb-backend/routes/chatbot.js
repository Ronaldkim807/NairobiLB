import express from 'express';
import { OpenAI } from 'openai';
import prisma from '../utils/database.js';

const router = express.Router();

// Initialize OpenAI (will use OPENAI_API_KEY from environment variables)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Chatbot endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log('🤖 Chatbot request:', message);

    // Get recent events for context
    const events = await prisma.event.findMany({
      where: { 
        isActive: true,
        startTime: {
          gte: new Date() // Only future events
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        venue: true,
        startTime: true,
        endTime: true,
        capacity: true,
        ticketTypes: {
          select: {
            name: true,
            price: true,
            quantity: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      take: 15, // Get more events for better context
      orderBy: { startTime: 'asc' }
    });

    // Format events for the AI context
    const eventContext = events.map(event => {
      const availableTickets = event.ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0);
      const bookedTickets = event._count.bookings;
      
      return `
Event: ${event.title}
Description: ${event.description || 'No description'}
Category: ${event.category}
Venue: ${event.venue}
Date & Time: ${event.startTime.toLocaleDateString()} ${event.startTime.toLocaleTimeString()}
Duration: ${Math.round((event.endTime - event.startTime) / (1000 * 60 * 60))} hours
Tickets: ${event.ticketTypes.map(t => 
  `${t.name} - KES ${t.price} (${t.quantity} available)`
).join(', ')}
Total Available: ${availableTickets} tickets
Already Booked: ${bookedTickets} tickets
Event ID: ${event.id}
---`;
    }).join('\n');

    // Build conversation history for context
    const historyMessages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const systemPrompt = `You are "Nairobi Assistant", a helpful AI chatbot for Nairobi Live & Book (Nairobi L&B), an event booking platform in Nairobi, Kenya.

IMPORTANT CONTEXT ABOUT CURRENT EVENTS:
${eventContext}

PLATFORM CAPABILITIES:
- Users can browse events by category (music, sports, conference, workshop, etc.)
- Users can book tickets for events
- Payments are processed via M-Pesa mobile money
- Users can view their booking history
- Organizers can create and manage events
- Event categories include: music concerts, sports matches, conferences, workshops, festivals, etc.

BOOKING PROCESS:
1. User selects event and ticket type
2. User provides phone number for M-Pesa payment
3. System sends STK Push to user's phone
4. User enters M-Pesa PIN to complete payment
5. Booking is confirmed instantly

RESPONSE GUIDELINES:
- Be friendly, helpful, and conversational
- Provide specific event recommendations when asked
- Include practical details like dates, venues, prices
- Suggest using event categories when users are exploring
- If you don't know something, admit it and suggest contacting support
- Keep responses concise but informative
- Use emojis occasionally to make it engaging
- Always mention if events are selling out or have limited tickets

CURRENT DATE: ${new Date().toLocaleDateString()}

Remember: You're helping real people in Nairobi find and book amazing events!`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const response = completion.choices[0].message.content;

    console.log('🤖 Chatbot response generated');

    res.json({
      success: true,
      data: { 
        response,
        usage: completion.usage
      }
    });

  } catch (error) {
    console.error('❌ Chatbot error:', error);
    
    // Fallback response if OpenAI fails
    const fallbackResponse = "I'm having trouble connecting right now. 😔 You can browse our events directly or try asking me again in a moment. In the meantime, check out our featured events!";
    
    res.json({
      success: true,
      data: { 
        response: fallbackResponse,
        isFallback: true
      }
    });
  }
});

// Search events via chatbot (enhanced search)
router.post('/search-events', async (req, res) => {
  try {
    const { query, category, date, priceRange } = req.body;

    if (!query && !category && !date) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter is required'
      });
    }

    const where = {
      isActive: true,
      startTime: {
        gte: new Date() // Only future events
      }
    };

    // Build search conditions
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { venue: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.startTime = {
        gte: searchDate,
        lt: nextDay
      };
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        venue: true,
        startTime: true,
        endTime: true,
        imageUrl: true,
        ticketTypes: {
          select: {
            name: true,
            price: true,
            quantity: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      take: 20,
      orderBy: { startTime: 'asc' }
    });

    // Filter by price range if specified
    let filteredEvents = events;
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      filteredEvents = events.filter(event => 
        event.ticketTypes.some(ticket => 
          ticket.price >= minPrice && 
          (!maxPrice || ticket.price <= maxPrice)
        )
      );
    }

    // Calculate available tickets and add to response
    const eventsWithAvailability = filteredEvents.map(event => {
      const availableTickets = event.ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0);
      const bookedTickets = event._count.bookings;
      const isPopular = bookedTickets > availableTickets * 0.7; // More than 70% booked
      
      return {
        ...event,
        availableTickets,
        bookedTickets,
        isPopular,
        minPrice: Math.min(...event.ticketTypes.map(t => t.price)),
        maxPrice: Math.max(...event.ticketTypes.map(t => t.price))
      };
    });

    res.json({
      success: true,
      data: { 
        events: eventsWithAvailability,
        total: eventsWithAvailability.length
      }
    });

  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get event categories for chatbot suggestions
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.event.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { 
        isActive: true,
        startTime: { gte: new Date() }
      }
    });

    const categoryCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await prisma.event.count({
          where: { 
            category: cat.category,
            isActive: true,
            startTime: { gte: new Date() }
          }
        });
        return {
          category: cat.category,
          count: count
        };
      })
    );

    res.json({
      success: true,
      data: { 
        categories: categoryCounts.sort((a, b) => b.count - a.count)
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Quick event suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const events = await prisma.event.findMany({
      where: { 
        isActive: true,
        startTime: { gte: new Date() }
      },
      select: {
        id: true,
        title: true,
        category: true,
        venue: true,
        startTime: true,
        ticketTypes: {
          select: {
            price: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      take: parseInt(limit),
      orderBy: { 
        startTime: 'asc' 
      }
    });

    const suggestions = events.map(event => ({
      id: event.id,
      title: event.title,
      category: event.category,
      venue: event.venue,
      date: event.startTime.toLocaleDateString(),
      time: event.startTime.toLocaleTimeString(),
      minPrice: Math.min(...event.ticketTypes.map(t => t.price)),
      popularity: event._count.bookings
    }));

    res.json({
      success: true,
      data: { suggestions }
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;