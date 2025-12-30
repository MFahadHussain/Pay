import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to round SC values to whole numbers
function roundSC(value: number): number {
  return Math.round(value)
}

// GET social charges payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const projectId = searchParams.get('projectId')

    const where: any = {}

    if (employeeId) where.employeeId = employeeId
    if (projectId) where.projectId = projectId

    const payments = await db.socialChargesPayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST create new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, projectId, amount, paymentDate, notes } = body

    if (!employeeId || !amount || !paymentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Round payment amount
    const roundedAmount = roundSC(parseFloat(amount))

    const payment = await db.socialChargesPayment.create({
      data: {
        employeeId,
        projectId: projectId || null,
        amount: roundedAmount,
        paymentDate: new Date(paymentDate),
        notes: notes || ''
      }
    })

    // Update ledger paid amount and balance
    if (projectId) {
      // Update specific project ledger - find the most recent ledger entry
      const ledger = await db.socialChargesLedger.findFirst({
        where: {
          employeeId,
          projectId
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      })

      if (ledger) {
        await db.socialChargesLedger.update({
          where: { id: ledger.id },
          data: {
            paidAmount: roundSC(ledger.paidAmount + roundedAmount),
            balance: roundSC(ledger.balance - roundedAmount) // Can be negative
          }
        })
      }
    } else {
      // Update all ledgers for this employee - find most recent for each project
      const allLedgers = await db.socialChargesLedger.findMany({
        where: { employeeId },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      })

      // Group by project and get most recent for each
      const projectLedgers = new Map<string, any>()
      for (const ledger of allLedgers) {
        if (!projectLedgers.has(ledger.projectId)) {
          projectLedgers.set(ledger.projectId, ledger)
        }
      }

      // Distribute payment across most recent ledger of each project
      const ledgers = Array.from(projectLedgers.values())
      const totalBalance = ledgers.reduce((sum, l) => sum + l.balance, 0)
      let remainingPayment = roundedAmount

      // Sort by balance descending to pay off highest balances first
      ledgers.sort((a, b) => b.balance - a.balance)

      for (const ledger of ledgers) {
        if (remainingPayment <= 0) break

        const paymentAmount = roundSC(Math.min(Math.max(ledger.balance, 0), remainingPayment))
        if (paymentAmount > 0) {
          await db.socialChargesLedger.update({
            where: { id: ledger.id },
            data: {
              paidAmount: roundSC(ledger.paidAmount + paymentAmount),
              balance: roundSC(ledger.balance - paymentAmount) // Can be negative
            }
          })

          remainingPayment -= paymentAmount
        }
      }
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
