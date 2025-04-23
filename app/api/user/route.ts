import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface TelegramUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

interface UserResponse {
  id: string
  telegramId: number
  username: string | null
  firstName: string | null
  lastName: string | null
  points: number
  flxPoints: number
}

export async function POST(req: NextRequest) {
  try {
    const userData: TelegramUser = await req.json()

    // Validate input
    if (!userData?.id || typeof userData.id !== 'number') {
      return NextResponse.json(
        { error: 'Invalid Telegram user ID' },
        { status: 400 }
      )
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { telegramId: userData.id },
      update: {}, // No updates needed for existing user
      create: {
        telegramId: userData.id,
        username: userData.username?.trim() || null,
        firstName: userData.first_name?.trim() || null,
        lastName: userData.last_name?.trim() || null,
        points: 0,
        flxPoints: 0
      },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
        flxPoints: true
      }
    })

    return NextResponse.json<UserResponse>(user, { status: 200 })
    
  } catch (error) {
    console.error('User API Error:', error)

    // Handle Prisma errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Database operation failed', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}