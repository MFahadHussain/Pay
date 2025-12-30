import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all employees
export async function GET() {
  try {
    const employees = await db.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          include: {
            project: true
          }
        }
      }
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch employees'
    if (error instanceof Error) {
      if (error.message.includes('PrismaClientInitializationError')) {
        errorMessage = 'Database connection error. Please check if the database is initialized.'
      } else if (error.message.includes('Unable to open the database file')) {
        errorMessage = 'Database file not found. Please run database migrations.'
      } else {
        errorMessage = `Failed to fetch employees: ${error.message}`
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST create new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, designation, department, baseSalary, joiningDate, employmentStatus } = body

    if (!fullName || !designation || !department || !baseSalary || !joiningDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const employee = await db.employee.create({
      data: {
        fullName,
        designation,
        department,
        baseSalary: parseFloat(baseSalary),
        joiningDate: new Date(joiningDate),
        employmentStatus: employmentStatus || 'Active'
      }
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
