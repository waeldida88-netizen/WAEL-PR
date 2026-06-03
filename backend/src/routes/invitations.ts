import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest, checkPermission } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import QRCode from 'qrcode';
import crypto from 'crypto';

const router = Router();

const generateInvitationSchema = z.object({
  eventId: z.string(),
  guestIds: z.array(z.string()),
  invitationText: z.string().optional(),
  sendViaEmail: z.boolean().optional(),
  sendViaWhatsApp: z.boolean().optional()
});

// ============================================
// GENERATE INVITATIONS WITH QR CODES
// ============================================

router.post('/generate', authenticate, checkPermission('canSendInvitations'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId, guestIds, invitationText } = generateInvitationSchema.parse(req.body);

    // Check event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    const createdInvitations = [];

    for (const guestId of guestIds) {
      const guest = await prisma.guest.findUnique({
        where: { id: guestId }
      });

      if (!guest) continue;

      // Generate QR code DB record first (unique short code)
      const code = crypto.randomBytes(16).toString('hex'); // 32 hex chars

      const qrData = {
        guestId,
        eventId,
        guestName: guest.fullName,
        chairNumber: guest.chairNumber,
        timestamp: Date.now()
      };

      const encryptedData = Buffer.from(JSON.stringify(qrData)).toString('base64');

      const qrCodeRecord = await prisma.qRCode.create({
        data: {
          code,
          encryptedData,
          guestId,
          eventId
        }
      });

      // Generate a QR image that encodes only the unique code (the scanner will send the code to backend)
      const qrCodeImage = await QRCode.toDataURL(code);

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          eventId,
          guestId,
          createdBy: req.user!.id,
          invitationText,
          qrCodeId: qrCodeRecord.id,
          qrCodeData: qrCodeImage,
          status: 'READY_TO_SEND'
        }
      });

      createdInvitations.push(invitation);
    }

    req.app.locals.io.emit('invitations-generated', {
      eventId,
      count: createdInvitations.length
    });

    res.status(201).json({
      success: true,
      message: `${createdInvitations.length} invitations generated successfully`,
      data: createdInvitations
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET INVITATION
// ============================================

router.get('/:id', authenticate, async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        event: true,
        guest: true,
        qrCode: true
      }
    });

    if (!invitation) {
      throw new AppError(404, 'Invitation not found');
    }

    res.status(200).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SEND INVITATIONS
// ============================================

router.post('/send', authenticate, checkPermission('canSendInvitations'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invitationIds } = req.body;

    if (!Array.isArray(invitationIds)) {
      throw new AppError(400, 'invitationIds must be an array');
    }

    // TODO: Integrate with SendGrid / WhatsApp API
    const updated = await Promise.all(
      invitationIds.map(id =>
        prisma.invitation.update({
          where: { id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            emailSentAt: new Date()
          }
        })
      )
    );

    req.app.locals.io.emit('invitations-sent', {
      count: updated.length
    });

    res.status(200).json({
      success: true,
      message: `${updated.length} invitations sent successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SCAN QR CODE (Mobile Scanner will POST the unique code)
// ============================================

router.post('/scan-qr', authenticate, checkPermission('canCheckInGuests'), async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      throw new AppError(400, 'QR code is required');
    }

    const qrRecord = await prisma.qRCode.findUnique({
      where: { code: qrCode },
      include: { invitations: true }
    });

    if (!qrRecord) {
      throw new AppError(404, 'Invalid QR code');
    }

    const guest = await prisma.guest.findUnique({
      where: { id: qrRecord.guestId }
    });

    if (!guest) {
      throw new AppError(404, 'Guest not found');
    }

    // Prevent duplicate check-ins
    const existingCheckIn = await prisma.checkIn.findUnique({
      where: { guestId: guest.id }
    });

    if (existingCheckIn) {
      return res.status(200).json({
        success: true,
        message: 'Guest already checked in',
        data: { guest, checkedInAt: existingCheckIn.checkedInAt }
      });
    }

    // Create check-in record
    const checkIn = await prisma.checkIn.create({
      data: {
        eventId: qrRecord.eventId,
        guestId: qrRecord.guestId,
        checkedInBy: req.user!.id,
        scanMethod: 'QR_CODE'
      }
    });

    // Update guest status
    await prisma.guest.update({
      where: { id: qrRecord.guestId },
      data: { status: 'CHECKED_IN' }
    });

    // Update QR code scan count
    await prisma.qRCode.update({
      where: { id: qrRecord.id },
      data: {
        scannedCount: qrRecord.scannedCount + 1,
        lastScannedAt: new Date()
      }
    });

    // Emit real-time event to update dashboards and event rooms
    req.app.locals.io.to(`event-${qrRecord.eventId}`).emit('guest-checked-in-live', {
      guestId: guest.id,
      guestName: guest.fullName,
      chairNumber: guest.chairNumber,
      timestamp: checkIn.checkedInAt
    });

    res.status(200).json({
      success: true,
      message: 'Guest checked in successfully',
      data: {
        guest,
        checkIn
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
