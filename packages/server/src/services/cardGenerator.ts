/**
 * Card generation service
 * Generates invitation card images on-demand
 */
import { prisma } from '../config/database';
import { createCanvas, loadImage } from 'canvas';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

// Define TemplateConfig locally to match shared types
interface TemplateElement {
  id: string;
  type: 'text' | 'qr';
  field?: string;
  content?: string;
  position: {
    x: number;
    y: number;
    anchor?: 'center' | 'left' | 'right' | 'top' | 'bottom';
  };
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | 'lighter';
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: number;
    size?: number;
  };
  dynamic: boolean;
}

interface TemplateConfig {
  version: string;
  baseImage: string;
  elements: TemplateElement[];
}

const CARDS_DIR = path.join(process.cwd(), 'public', 'cards');

// Ensure cards directory exists
if (!fs.existsSync(CARDS_DIR)) {
  fs.mkdirSync(CARDS_DIR, { recursive: true });
}

/**
 * Generate card image for a guest
 */
export async function generateGuestCard(guestId: string): Promise<string | null> {
  try {
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { event: true },
    });

    if (!guest || !guest.event) {
      throw new Error('Guest or event not found');
    }

    const event = guest.event;

    // Check if card design is configured
    if (!event.cardDesignImageUrl || !event.cardTemplateConfig) {
      throw new Error('Card design not configured for this event');
    }

    const templateConfig = event.cardTemplateConfig as TemplateConfig;
    const baseImageUrl = event.cardDesignImageUrl;

    // Get full path to base image
    let baseImagePath: string;
    
    if (baseImageUrl.startsWith('http')) {
      // External URL - download it
      const response = await fetch(baseImageUrl);
      const buffer = await response.arrayBuffer();
      const tempPath = path.join(CARDS_DIR, `temp-${Date.now()}.png`);
      fs.writeFileSync(tempPath, Buffer.from(buffer));
      baseImagePath = tempPath;
    } else {
      // Local file
      baseImagePath = path.join(process.cwd(), 'public', baseImageUrl.replace(/^\//, ''));
    }

    // Load base image
    const baseImage = await loadImage(baseImagePath);
    
    // Create canvas with same dimensions as base image
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext('2d');

    // Draw base image
    ctx.drawImage(baseImage, 0, 0);

    // Render each template element
    for (const element of templateConfig.elements) {
      if (element.type === 'text') {
        // Render text
        const text = element.dynamic && element.field === 'guest.name'
          ? guest.name
          : element.content || '';

        const fontSize = element.style.fontSize || 24;
        const fontFamily = element.style.fontFamily || 'Arial';
        const fontWeight = element.style.fontWeight || 'normal';
        const color = element.style.color || '#000000';
        const textAlign = element.style.textAlign || 'center';

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = textAlign as 'left' | 'center' | 'right' | 'start' | 'end';
        ctx.textBaseline = 'middle';

        // Calculate position
        const x = (element.position.x / 100) * baseImage.width;
        const y = (element.position.y / 100) * baseImage.height;

        // Adjust for anchor point
        let textX = x;
        if (textAlign === 'center') {
          textX = x;
        } else if (textAlign === 'right') {
          textX = x;
        } else {
          textX = x;
        }

        ctx.fillText(text, textX, y);
      } else if (element.type === 'qr') {
        // Generate QR code
        const verificationUrl = `${process.env.BASE_URL || 'http://46.62.209.58'}/c/${guest.code}`;
        const qrSize = element.style.size || 200;

        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: qrSize,
          margin: 1,
        });

        const qrImage = await loadImage(qrDataUrl);

        // Calculate position
        const x = (element.position.x / 100) * baseImage.width;
        const y = (element.position.y / 100) * baseImage.height;

        // Adjust for anchor point
        let qrX = x - qrSize / 2; // Center by default
        let qrY = y - qrSize / 2;

        if (element.position.anchor === 'left') {
          qrX = x;
        } else if (element.position.anchor === 'right') {
          qrX = x - qrSize;
        } else if (element.position.anchor === 'top') {
          qrY = y;
        } else if (element.position.anchor === 'bottom') {
          qrY = y - qrSize;
        }

        ctx.drawImage(qrImage, qrX, qrY);
      }
    }

    // Save generated card
    const cardFilename = `${guest.code}.png`;
    const cardPath = path.join(CARDS_DIR, cardFilename);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(cardPath, buffer);

    // Clean up temp file if we downloaded it
    if (baseImageUrl.startsWith('http') && baseImagePath.includes('temp-')) {
      fs.unlinkSync(baseImagePath);
    }

    return `/cards/${cardFilename}`;
  } catch (error) {
    console.error('Error generating guest card:', error);
    return null;
  }
}

/**
 * Delete card image for a guest
 */
export function deleteGuestCard(guestCode: string): void {
  try {
    const cardPath = path.join(CARDS_DIR, `${guestCode}.png`);
    if (fs.existsSync(cardPath)) {
      fs.unlinkSync(cardPath);
    }
  } catch (error) {
    console.error('Error deleting guest card:', error);
  }
}

/**
 * Check if card exists for a guest
 */
export function cardExists(guestCode: string): boolean {
  const cardPath = path.join(CARDS_DIR, `${guestCode}.png`);
  return fs.existsSync(cardPath);
}

