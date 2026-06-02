import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcrypt';

const router = Router();

const permissionSchema = z.object({
  userId: z.string(),
  canViewDashboard: z.boolean().optional(),
  canManageEvents: z.boolean().optional(),
  canManageGuests: z.boolean().optional(),
  canEditSeating: z.boolean().optional(),
  canSendInvitations: z.boolean().optional(),
  canManageTeam: z.boolean().optional(),
  canViewMinistryLeaders: z.boolean().optional(),
  canCheckInGuests: z.boolean().optional(),
  canExportReports: z.boolean().optional()
});

// ============================================
// GET PENDING APPROVAL REQUESTS
// ============================================

router.get('/pending-requests', authenticate, authorize('SUPER_ADMIN'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING_APPROVAL' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: pendingUsers
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// APPROVE USER REGISTRATION
// ============================================

router.post('/approve-user/:userId', authenticate, authorize('SUPER_ADMIN'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.status !== 'PENDING_APPROVAL') {
      throw new AppError(400, 'User is not in pending approval status');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        isActive: true,
        approvedBy: req.user!.id,
        approvalDate: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// REJECT USER REGISTRATION
// ============================================

router.post('/reject-user/:userId', authenticate, authorize('SUPER_ADMIN'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(200).json({
      success: true,
      message: 'User registration rejected and deleted'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ASSIGN PERMISSIONS TO USER
// ============================================

router.post('/assign-permissions', authenticate, authorize('SUPER_ADMIN'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, ...permissions } = permissionSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { permissions: true }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const updatedPermissions = await prisma.permission.upsert({
      where: { userId },
      create: {
        userId,
        ...permissions
      },
      update: permissions
    });

    res.status(200).json({
      success: true,
      message: 'Permissions assigned successfully',
      data: updatedPermissions
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET ALL TEAM MEMBERS
// ============================================

router.get('/members', authenticate, authorize('SUPER_ADMIN'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { skip = 0, take = 20 } = req.query;

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: { status: { not: 'DELETED' } },
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        include: { permissions: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: { status: { not: 'DELETED' } } })
    ]);

    res.status(200).json({
      success: true,
      data: members,
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
// UPDATE USER ROLE
// ============================================

router.put('/user/:userId/role', authenticate, authorize('SUPER_ADMIN'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'VIEWER', 'SECURITY'];
    if (!validRoles.includes(role)) {
      throw new AppError(400, 'Invalid role');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { permissions: true }
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

export default router;