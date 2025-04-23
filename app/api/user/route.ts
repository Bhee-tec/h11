import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

interface TelegramUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

export async function POST(req: NextRequest) {
  try {
    const userData: TelegramUser = await req.json()

    // Validate user data
    if (!userData?.id || typeof userData.id !== 'number') {
      return NextResponse.json({ error: 'Invalid Telegram user ID' }, { status: 400 })
    }

    // Upsert user (create or update if exists)
    const user = await prisma.user.upsert({
      where: { telegramId: userData.id },
      update: {},  // No updates needed if user already exists
      create: {
        telegramId: userData.id,
        username: userData.username?.trim() || null,
        firstName: userData.first_name?.trim() || null,
        lastName: userData.last_name?.trim() || null,
        points: 0,              // Initialize points to 0
        flxPoints: 0,           // Initialize flxPoints to 0
        currentMoves: 30,       // Set initial moves
        referralCode: uuidv4(), // Generate unique referral code
      },
    })

    return NextResponse.json(user, { status: 200 })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
