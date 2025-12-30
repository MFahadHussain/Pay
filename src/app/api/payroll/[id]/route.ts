import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET single payroll record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payroll = await db.payroll.findUnique({
      where: { id: params.id },
      include: {
        employee: true,
        project: true
      }
    })

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    return NextResponse.json(payroll)
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 })
  }
}

// DELETE payroll
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.payroll.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payroll:', error)
    return NextResponse.json({ error: 'Failed to delete payroll' }, { status: 500 })
  }
}
