import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest, checkPermission } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const createMinistryLeaderSchema = z.object({
  fullName: z.string().min(2),
  jobTitle: z.string(),
  organization: z.string(),
  phoneNumber: z.string().optional(),
  email: z.string().email(),
  profilePicture: z.string().optional(),
  notes: z.string().optional()
});

// ============================================
// CREATE MINISTRY LEADER
// ============================================

router.post('/', authenticate, checkPermission('canViewMinistryLeaders'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createMinistryLeaderSchema.parse(req.body);

    const leader = await prisma.ministryLeader.create({
      data
    });

    req.app.locals.io.emit('ministry-leader-created', leader);

    res.status(201).json({
      success: true,
      data: leader
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET ALL MINISTRY LEADERS
// ============================================

router.get('/', authenticate, checkPermission('canViewMinistryLeaders'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { skip = 0, take = 50, search } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { organization: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [leaders, total] = await Promise.all([
      prisma.ministryLeader.findMany({
        where,
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ministryLeader.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: leaders,
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
// GET SINGLE MINISTRY LEADER
// ============================================

router.get('/:id', authenticate, async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const leader = await prisma.ministryLeader.findUnique({
      where: { id },
      include: {
        invitations: true,
        guestRecords: true
      }
    });

    if (!leader) {
      throw new AppError(404, 'Ministry leader not found');
    }

    res.status(200).json({
      success: true,
      data: leader
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// UPDATE MINISTRY LEADER
// ============================================

router.put('/:id', authenticate, checkPermission('canViewMinistryLeaders'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = createMinistryLeaderSchema.partial().parse(req.body);

    const leader = await prisma.ministryLeader.update({
      where: { id },
      data
    });

    req.app.locals.io.emit('ministry-leader-updated', leader);

    res.status(200).json({
      success: true,
      data: leader
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE MINISTRY LEADER
// ============================================

router.delete('/:id', authenticate, checkPermission('canViewMinistryLeaders'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.ministryLeader.delete({
      where: { id }
    });

    req.app.locals.io.emit('ministry-leader-deleted', { id });

    res.status(200).json({
      success: true,
      message: 'Ministry leader deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;