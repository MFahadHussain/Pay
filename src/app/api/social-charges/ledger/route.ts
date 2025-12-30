import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET social charges ledger
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const projectId = searchParams.get('projectId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: any = {}

    if (employeeId) where.employeeId = employeeId
    if (projectId) where.projectId = projectId
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)

    const ledger = await db.socialChargesLedger.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      include: {
        employee: true,
        project: true
      }
    })

    return NextResponse.json(ledger)
  } catch (error) {
    console.error('Error fetching social charges ledger:', error)
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
  }
}
