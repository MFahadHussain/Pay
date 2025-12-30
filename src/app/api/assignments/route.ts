import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const projectId = searchParams.get('projectId')

    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (projectId) where.projectId = projectId

    const assignments = await db.employeeProjectAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: true,
        project: true
      }
    })
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

// POST create new assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, projectId, role, monthlySalary, startDate, endDate } = body

    if (!employeeId || !projectId || !role || !monthlySalary || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const assignment = await db.employeeProjectAssignment.create({
      data: {
        employeeId,
        projectId,
        role,
        monthlySalary: parseFloat(monthlySalary),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        employee: true,
        project: true
      }
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
