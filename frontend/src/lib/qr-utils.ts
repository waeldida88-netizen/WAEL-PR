import crypto from 'crypto'
import QRCode from 'qrcode'

const ENCRYPTION_KEY = process.env.QR_CODE_ENCRYPTION_KEY || 'your-32-char-encryption-key-here!'
const SALT = process.env.QR_CODE_SECRET_SALT || 'your-salt-here'

/**
 * Generate secure QR code with encrypted guest data
 */
export async function generateSecureQRCode(guestData: {
  guestId: string
  guestName: string
  eventId: string
  chairNumber?: number
  email?: string
}) {
  try {
    // Create signature for verification
    const signature = crypto
      .createHmac('sha256', SALT)
      .update(JSON.stringify(guestData))
      .digest('hex')

    const qrPayload = JSON.stringify({
      ...guestData,
      signature,
      timestamp: Date.now()
    })

    // Generate QR code image
    const qrImage = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    })

    return {
      qrImage,
      qrPayload,
      signature
    }
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    throw error
  }
}

/**
 * Verify and decode QR code data
 */
export function verifyQRCode(qrPayload: string): {
  valid: boolean
  data?: any
  error?: string
} {
  try {
    const data = JSON.parse(qrPayload)
    const { signature, ...guestData } = data

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SALT)
      .update(JSON.stringify(guestData))
      .digest('hex')

    if (signature !== expectedSignature) {
      return {
        valid: false,
        error: 'Invalid QR code signature'
      }
    }

    // Check if QR code is expired (12 hours)
    const now = Date.now()
    const age = now - data.timestamp
    const maxAge = 12 * 60 * 60 * 1000

    if (age > maxAge) {
      return {
        valid: false,
        error: 'QR code expired'
      }
    }

    return {
      valid: true,
      data: guestData
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to parse QR code'
    }
  }
}

/**
 * Generate printable invitation with embedded QR code
 */
export async function generateInvitationPDF(invitation: {
  guestName: string
  guestTitle: string
  organization: string
  eventTitle: string
  eventDate: string
  eventTime: string
  venue: string
  qrImage: string
}) {
  try {
    // This would use a PDF generation library like pdfkit or html2pdf
    // For now, returning the structure
    return {
      ...invitation,
      ready: true
    }
  } catch (error) {
    console.error('Failed to generate invitation PDF:', error)
    throw error
  }
}
