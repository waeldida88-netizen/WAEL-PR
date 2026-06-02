import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest, checkPermission } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const createSeatingLayoutSchema = z.object({
  eventId: z.string(),
  layoutType: z.enum(['THEATER', 'ROUND_TABLES', 'PLATFORM_ROWS', 'SEPARATE_TABLES']),
  totalChairs: z.number().int().min(1),
  templateId: z.string().optional(),
  layoutData: z.any().optional()
});

const assignGuestSchema = z.object({
  guestId: z.string(),
  chairNumber: z.number().int().min(1)
});

// ============================================
// CREATE SEATING LAYOUT
// ============================================

router.post('/', authenticate, checkPermission('canEditSeating'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createSeatingLayoutSchema.parse(req.body);

    // Check if layout already exists for event
    const existing = await prisma.seatingLayout.findUnique({
      where: { eventId: data.eventId }
    });

    if (existing) {
      throw new AppError(409, 'Seating layout already exists for this event');
    }

    const layout = await prisma.seatingLayout.create({
      data: {
        ...data,
        createdBy: req.user!.id,
        layoutData: data.layoutData || {}
      },
      include: { chairs: true }
    });

    // Create chairs based on total count
    const chairs = [];
    for (let i = 1; i <= data.totalChairs; i++) {
      chairs.push({
        layoutId: layout.id,
        chairNumber: i,
        positionX: Math.random() * 100,
        positionY: Math.random() * 100,
        status: 'AVAILABLE'
      });
    }

    await prisma.chair.createMany({
      data: chairs
    });

    req.app.locals.io.emit('seating-layout-created', { eventId: data.eventId, layout });

    res.status(201).json({
      success: true,
      data: layout
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET SEATING LAYOUT BY EVENT
// ============================================

router.get('/:eventId', authenticate, async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = req.params;

    const layout = await prisma.seatingLayout.findUnique({
      where: { eventId },
      include: { chairs: true }
    });

    if (!layout) {
      throw new AppError(404, 'Seating layout not found');
    }

    res.status(200).json({
      success: true,
      data: layout
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ASSIGN GUEST TO CHAIR
// ============================================

router.post('/:eventId/assign', authenticate, checkPermission('canEditSeating'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = req.params;
    const { guestId, chairNumber } = assignGuestSchema.parse(req.body);

    // Check if guest exists
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      throw new AppError(404, 'Guest not found');
    }

    // Check if layout exists
    const layout = await prisma.seatingLayout.findUnique({
      where: { eventId }
    });
    if (!layout) {
      throw new AppError(404, 'Seating layout not found');
    }

    // Check if chair is available
    const chair = await prisma.chair.findFirst({
      where: { layoutId: layout.id, chairNumber }
    });
    if (!chair) {
      throw new AppError(404, 'Chair not found');
    }

    if (chair.status !== 'AVAILABLE') {
      throw new AppError(409, 'Chair is already assigned or blocked');
    }

    // Update guest with chair assignment
    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: { chairNumber }
    });

    // Update chair status
    await prisma.chair.update({
      where: { id: chair.id },
      data: { status: 'ASSIGNED', assignedGuestId: guestId }
    });

    req.app.locals.io.emit('guest-assigned-to-chair', {
      eventId,
      guestId,
      chairNumber,
      guestName: updatedGuest.fullName
    });

    res.status(200).json({
      success: true,
      message: 'Guest assigned to chair successfully',
      data: updatedGuest
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// UPDATE CHAIR POSITION
// ============================================

router.put('/chair/:chairId', authenticate, checkPermission('canEditSeating'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chairId } = req.params;
    const { positionX, positionY, positionZ } = req.body;

    const chair = await prisma.chair.update({
      where: { id: chairId },
      data: { positionX, positionY, positionZ: positionZ || 0 }
    });

    req.app.locals.io.emit('chair-position-updated', chair);

    res.status(200).json({
      success: true,
      data: chair
    });
  } catch (error) {
    next(error);
  }
});

export default router;