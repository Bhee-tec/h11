// pages/api/game/state.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { applyRateLimit } from '@/lib/rateLimit';

export default applyRateLimit(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegramId } = req.query;

  // Validate inputs
  if (!telegramId || isNaN(Number(telegramId))) {
    return res.status(400).json({ error: 'Invalid Telegram ID' });
  }

  try {
    // Find user by telegramId
    const user = await prisma.user.findUnique({
      where: { telegramId: Number(telegramId) },
      select: {
        points: true,
        flxPoints: true,
        currentMoves: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      score: user.points,
      flxPoints: user.flxPoints,
      currentMoves: user.currentMoves
    });
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});