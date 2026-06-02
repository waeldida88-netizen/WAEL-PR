import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest, checkPermission } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  venueName: z.string().min(2),
  venueAddress: z.string().optional(),
  eventDate: z.string().datetime(),
  eventTime: z.string(),
  endTime: z.string().optional(),
  totalCapacity: z.number().int().min(1),
  layoutType: z.enum(['THEATER', 'ROUND_TABLES', 'PLATFORM_ROWS', 'SEPARATE_TABLES']),
  backgroundImage: z.string().optional(),
  templateId: z.string().optional()
});

// ============================================
// CREATE EVENT
// ============================================

router.post('/', authenticate, checkPermission('canManageEvents'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createEventSchema.parse(req.body);

    const event = await prisma.event.create({
      data: {
        ...data,
        createdBy: req.user!.id,
        status: 'DRAFT'
      },
      include: {
        seatingLayout: true
      }
    });

    // Emit real-time update
    req.app.locals.io.emit('event-created', event);

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET ALL EVENTS
// ============================================

router.get('/', authenticate, checkPermission('canViewDashboard'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, skip = 0, take = 10 } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        include: {
          user: { select: { fullName: true, email: true } },
          guests: true,
          seatingLayout: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.event.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: events,
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
// GET SINGLE EVENT
// ============================================

router.get('/:id', authenticate, async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, email: true } },
        guests: true,
        seatingLayout: {
          include: { chairs: true }
        },
        invitations: true,
        checkIns: true
      }
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// UPDATE EVENT
// ============================================

router.put('/:id', authenticate, checkPermission('canManageEvents'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = createEventSchema.partial().parse(req.body);

    const event = await prisma.event.update({
      where: { id },
      data,
      include: {
        user: { select: { fullName: true } },
        guests: true
      }
    });

    // Emit real-time update
    req.app.locals.io.emit('event-updated', event);

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE EVENT
// ============================================

router.delete('/:id', authenticate, checkPermission('canManageEvents'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id }
    });

    // Emit real-time update
    req.app.locals.io.emit('event-deleted', { id });

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET EVENT STATISTICS
// ============================================

router.get('/:id/statistics', authenticate, async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        guests: true,
        checkIns: true,
        invitations: true
      }
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    const stats = {
      totalCapacity: event.totalCapacity,
      totalInvited: event.guests.length,
      checked_in: event.checkIns.length,
      no_show: event.guests.filter(g => g.status === 'NO_SHOW').length,
      vip_count: event.guests.filter(g => g.isVip).length,
      rsvp_yes: event.guests.filter(g => g.status === 'RSVP_YES').length,
      rsvp_no: event.guests.filter(g => g.status === 'RSVP_NO').length,
      attendance_rate: event.guests.length > 0 
        ? ((event.checkIns.length / event.guests.length) * 100).toFixed(2)
        : 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;