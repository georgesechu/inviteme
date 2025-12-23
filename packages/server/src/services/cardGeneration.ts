/**
 * Card generation service
 * Generates invitation cards from templates
 */
import { prisma } from '../config/database';
import fs from 'fs/promises';
import path from 'path';

const CARDS_DIR = process.env.CARDS_DIR || path.join(process.cwd(), 'cards');

/**
 * Generate invitation card for a guest
 * TODO: Implement actual image generation using template
 */
export async function generateCard(
  guestId: string,
  cardDesignId: string
): Promise<string | null> {
  try {
    // Get guest and card design
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    const cardDesign = await prisma.cardDesign.findUnique({
      where: { id: cardDesignId },
    });

    if (!guest || !cardDesign) {
      return null;
    }

    // Ensure cards directory exists
    await fs.mkdir(CARDS_DIR, { recursive: true });

    // Generate card filename
    const filename = `${guest.code}.png`;
    const filepath = path.join(CARDS_DIR, filename);

    // TODO: Implement actual card generation
    // For now, we'll just create a placeholder
    // In production, this would:
    // 1. Load the template image
    // 2. Add guest name
    // 3. Generate QR code with verification URL
    // 4. Save the final card

    // Placeholder: create an empty file (replace with actual generation)
    await fs.writeFile(filepath, '');

    // Return the URL path
    return `/cards/${filename}`;
  } catch (error) {
    console.error('Error generating card:', error);
    return null;
  }
}

/**
 * Generate cards for all guests in an invitation
 */
export async function generateCardsForInvitation(invitationId: string): Promise<string[]> {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      invitationGuests: {
        include: { guest: true },
      },
    },
  });

  if (!invitation) {
    return [];
  }

  const cardUrls: string[] = [];

  for (const ig of invitation.invitationGuests) {
    const guest = ig.guest;
    const cardUrl = await generateCard(guest.id, invitation.cardDesignId);
    if (cardUrl) {
      cardUrls.push(cardUrl);
    }
  }

  return cardUrls;
}

