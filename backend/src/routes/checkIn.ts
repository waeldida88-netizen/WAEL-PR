import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, checkPermission } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ============================================
// GET CHECK-INS BY EVENT
// ============================================

router.get('/event/:eventId', authenticate, checkPermission('canCheckInGuests'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = req.params;
    const { skip = 0, take = 50 } = req.query;

    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        where: { eventId },
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        include: {
          guest: true,
          event: true
        },
        orderBy: { checkedInAt: 'desc' }
      }),
      prisma.checkIn.count({ where: { eventId } })
    ]);

    res.status(200).json({
      success: true,
      data: checkIns,
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
// GET CHECK-IN STATISTICS
// ============================================

router.get('/stats/:eventId', authenticate, async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        guests: true,
        checkIns: true
      }
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    const stats = {
      totalInvited: event.guests.length,
      totalCheckedIn: event.checkIns.length,
      attendancePercentage:
        event.guests.length > 0
          ? ((event.checkIns.length / event.guests.length) * 100).toFixed(2)
          : 0,
      noShow: event.guests.filter(g => g.status === 'NO_SHOW').length,
      vipCheckedIn: event.checkIns.filter(ci =>
        event.guests.find(g => g.id === ci.guestId && g.isVip)
      ).length
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