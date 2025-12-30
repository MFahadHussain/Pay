import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await db.socialChargesPayment.findUnique({
      where: { id: params.id }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Reverse the payment in ledger
    if (payment.projectId) {
      const ledger = await db.socialChargesLedger.findFirst({
        where: {
          employeeId: payment.employeeId,
          projectId: payment.projectId
        }
      })

      if (ledger) {
        await db.socialChargesLedger.update({
          where: { id: ledger.id },
          data: {
            paidAmount: { decrement: payment.amount },
            balance: { increment: payment.amount }
          }
        })
      }
    }

    await db.socialChargesPayment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
