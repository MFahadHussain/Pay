import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to round SC values to whole numbers
function roundSC(value: number): number {
  return Math.round(value)
}

// GET single ledger entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ledger = await db.socialChargesLedger.findUnique({
      where: { id: params.id },
      include: {
        employee: true,
        project: true
      }
    })

    if (!ledger) {
      return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 })
    }

    return NextResponse.json(ledger)
  } catch (error) {
    console.error('Error fetching ledger:', error)
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
  }
}

// PATCH mark ledger entry as paid/unpaid
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate params
    if (!params?.id) {
      return NextResponse.json({ error: 'Ledger entry ID is required' }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { isPaid } = body

    // Validate isPaid is a boolean
    if (typeof isPaid !== 'boolean') {
      return NextResponse.json({ error: 'isPaid must be a boolean value' }, { status: 400 })
    }

    const ledger = await db.socialChargesLedger.findUnique({
      where: { id: params.id }
    })

    if (!ledger) {
      return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 })
    }

    // Update isPaid status
    const updatedLedger = await db.socialChargesLedger.update({
      where: { id: params.id },
      data: { isPaid: isPaid === true }
    })

    // Recalculate all subsequent balances for this employee+project
    try {
      await recalculateSubsequentBalances(ledger.employeeId, ledger.projectId, ledger.month, ledger.year)
    } catch (recalcError) {
      console.error('Error recalculating balances:', recalcError)
      // Still return success for the update, but log the recalculation error
      // The balance will be corrected on next payroll generation
    }

    return NextResponse.json(updatedLedger)
  } catch (error) {
    console.error('Error updating ledger:', error)
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 })
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ error: 'Duplicate entry detected' }, { status: 409 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to update ledger',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Helper function to recalculate balances for all months after the updated month
async function recalculateSubsequentBalances(employeeId: string, projectId: string, month: number, year: number) {
  try {
    // Validate inputs
    if (!employeeId || !projectId) {
      throw new Error('Employee ID and Project ID are required')
    }

    // Get all ledger entries for this employee+project, ordered chronologically
    const allLedgers = await db.socialChargesLedger.findMany({
      where: {
        employeeId,
        projectId
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ]
    })

    if (allLedgers.length === 0) {
      return // No ledgers to recalculate
    }

    // Recalculate each month's balance sequentially
    for (let i = 0; i < allLedgers.length; i++) {
      const ledger = allLedgers[i]
      
    // Get previous balance - only from non-paid entries
    let previousBalance = 0
    for (let j = i - 1; j >= 0; j--) {
      if (!allLedgers[j].isPaid) {
        previousBalance = allLedgers[j].balance
        break
      }
    }
    
    // Calculate balance: 
    // SC Balance = ROUND(Previous Balance + SC Earned - SC Paid, 0)
    // - If paid: balance = 0 (status is Paid)
    // - If not paid: Previous Balance + SC Earned - SC Paid (NO Admin Paid)
    let newBalance: number
    if (ledger.isPaid) {
      newBalance = 0
    } else {
      newBalance = roundSC(previousBalance + ledger.totalEarned - ledger.totalWithheld)
    }

      // Update balance if it changed (using tolerance for floating point comparison)
      if (Math.abs(ledger.balance - newBalance) > 0.01) {
        try {
          await db.socialChargesLedger.update({
            where: { id: ledger.id },
            data: { balance: newBalance }
          })
          
          // Update the ledger in our array for next iteration
          allLedgers[i].balance = newBalance
        } catch (updateError) {
          console.error(`Error updating balance for ledger ${ledger.id}:`, updateError)
          // Continue with next ledger entry
        }
      }
    }
  } catch (error) {
    console.error('Error in recalculateSubsequentBalances:', error)
    throw error // Re-throw to be handled by caller
  }
}
