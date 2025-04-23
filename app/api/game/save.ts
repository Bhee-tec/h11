// pages/api/game/save.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { applyRateLimit } from '@/lib/rateLimit';

interface SaveRequest {
  score: number;
  telegramId: number;
}

export default applyRateLimit(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { score, telegramId } = req.body as SaveRequest;

  // Validate inputs
  if (typeof score !== 'number' || score < 0 || score > 10000 || !telegramId) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // Find user by telegramId
    const user = await prisma.user.findUnique({
      where: { telegramId: Number(telegramId) },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's points and flxPoints
    const updatedUser = await prisma.user.update({
      where: { telegramId: Number(telegramId) },
      data: {
        points: score,
        flxPoints: { increment: Math.floor(score * 0.1) },
        currentMoves: user.currentMoves - 1 // track remaining moves
      },
      select: {
        points: true,
        flxPoints: true,
      },
    });

    res.status(200).json({
      newScore: updatedUser.points,
      newFlxPoints: updatedUser.flxPoints,
    });
  } catch (error) {
    console.error('Error saving game data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});