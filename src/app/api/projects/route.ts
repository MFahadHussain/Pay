import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all projects
export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          include: {
            employee: true
          }
        }
      }
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch projects'
    if (error instanceof Error) {
      if (error.message.includes('PrismaClientInitializationError')) {
        errorMessage = 'Database connection error. Please check if the database is initialized.'
      } else if (error.message.includes('Unable to open the database file')) {
        errorMessage = 'Database file not found. Please run database migrations.'
      } else {
        errorMessage = `Failed to fetch projects: ${error.message}`
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, startDate, endDate, description } = body

    if (!name || !description || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description: description
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
