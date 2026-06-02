import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest, checkPermission } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createGuestSchema = z.object({
  eventId: z.string(),
  fullName: z.string().min(2),
  jobTitle: z.string(),
  organization: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  isVip: z.boolean().optional(),
  guestType: z.enum(['REGULAR', 'SPEAKER', 'DIGNITARY', 'STAFF']).optional(),
  ministryLeaderId: z.string().optional(),
  rowNumber: z.number().int().optional(),
  chairNumber: z.number().int().optional()
});

// ============================================
// CREATE GUEST
// ============================================

router.post('/', authenticate, checkPermission('canManageGuests'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createGuestSchema.parse(req.body);

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: data.eventId }
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    // Check for duplicate chair assignment
    if (data.chairNumber) {
      const existingGuest = await prisma.guest.findFirst({
        where: {
          eventId: data.eventId,
          chairNumber: data.chairNumber
        }
      });

      if (existingGuest) {
        throw new AppError(409, 'Chair already assigned to another guest');
      }
    }

    const guest = await prisma.guest.create({
      data: {
        ...data,
        status: 'INVITED'
      }
    });

    // Emit real-time update
    req.app.locals.io.emit('guest-added', { eventId: data.eventId, guest });

    res.status(201).json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET GUESTS BY EVENT
// ============================================

router.get('/', authenticate, checkPermission('canManageGuests'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId, skip = 0, take = 50 } = req.query;

    if (!eventId) {
      throw new AppError(400, 'eventId is required');
    }

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where: { eventId: eventId as string },
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        include: {
          ministryLeader: true,
          invitation: {
            include: { qrCode: true }
          },
          checkIn: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.guest.count({ where: { eventId: eventId as string } })
    ]);

    res.status(200).json({
      success: true,
      data: guests,
      pagination: {
        total,
        skip: parseInt(skip as string),
        take: parseInt(take as string)
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET SINGLE GUEST
// ============================================

router.get('/:id', authenticate, async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        event: true,
        ministryLeader: true,
        invitation: {
          include: { qrCode: true }
        },
        checkIn: true
      }
    });

    if (!guest) {
      throw new AppError(404, 'Guest not found');
    }

    res.status(200).json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// UPDATE GUEST
// ============================================

router.put('/:id', authenticate, checkPermission('canManageGuests'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = createGuestSchema.partial().parse(req.body);

    const guest = await prisma.guest.update({
      where: { id },
      data,
      include: {
        event: true,
        ministryLeader: true
      }
    });

    // Emit real-time update
    req.app.locals.io.emit('guest-updated', guest);

    res.status(200).json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE GUEST
// ============================================

router.delete('/:id', authenticate, checkPermission('canManageGuests'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({ where: { id } });
    if (!guest) {
      throw new AppError(404, 'Guest not found');
    }

    await prisma.guest.delete({ where: { id } });

    // Emit real-time update
    req.app.locals.io.emit('guest-deleted', { id, eventId: guest.eventId });

    res.status(200).json({
      success: true,
      message: 'Guest deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// BULK IMPORT GUESTS
// ============================================

router.post('/bulk/import', authenticate, checkPermission('canManageGuests'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId, guests } = req.body;

    if (!eventId || !Array.isArray(guests)) {
      throw new AppError(400, 'eventId and guests array are required');
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    const createdGuests = await Promise.all(
      guests.map(guest =>
        prisma.guest.create({
          data: {
            ...guest,
            eventId,
            status: 'INVITED'
          }
        })
      )
    );

    // Emit real-time update
    req.app.locals.io.emit('guests-bulk-imported', { eventId, count: createdGuests.length });

    res.status(201).json({
      success: true,
      message: `${createdGuests.length} guests imported successfully`,
      data: createdGuests
    });
  } catch (error) {
    next(error);
  }
});

export default router;