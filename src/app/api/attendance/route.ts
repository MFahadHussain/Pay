import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const projectId = searchParams.get('projectId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (employeeId) where.employeeId = employeeId
    if (projectId) where.projectId = projectId

    if (date) {
      const searchDate = new Date(date)
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999))
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const attendance = await db.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        employee: true,
        project: true
      }
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

// POST create or update attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, projectId, date, status } = body

    if (!employeeId || !projectId || !date || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const attendanceDate = new Date(date)

    // Check if attendance already exists
    const existing = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: attendanceDate
        }
      }
    })

    let attendance

    if (existing) {
      // Update existing attendance
      attendance = await db.attendance.update({
        where: { id: existing.id },
        data: {
          projectId,
          status
        },
        include: {
          employee: true,
          project: true
        }
      })
    } else {
      // Create new attendance
      attendance = await db.attendance.create({
        data: {
          employeeId,
          projectId,
          date: attendanceDate,
          status
        },
        include: {
          employee: true,
          project: true
        }
      })
    }

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating attendance:', error)
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
  }
}
