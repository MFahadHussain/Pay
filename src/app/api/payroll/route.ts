import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to round SC values to whole numbers (standard rounding)
function roundSC(value: number): number {
  return Math.round(value)
}

// Attendance status codes
const ATTENDANCE_STATUS = {
  PRESENT: 'P',
  WEEKEND: 'W',
  HOLIDAY: 'H',
  CASUAL_LEAVE: 'CL',
  SICK_LEAVE: 'SL',
  EARNED_LEAVE: 'EL',
  COMPENSATORY_LEAVE: 'CO',
  TOUR: 'T',
  WORK_FROM_HOME: 'WH',
  COVID_LEAVE: 'CD',
  ABSENT: 'A'
}

// Statuses that earn social charges (eligible days)
const SC_ELIGIBLE_STATUS = [
  ATTENDANCE_STATUS.PRESENT,
  ATTENDANCE_STATUS.WEEKEND,
  ATTENDANCE_STATUS.HOLIDAY,
  ATTENDANCE_STATUS.TOUR,
  ATTENDANCE_STATUS.WORK_FROM_HOME
]

// Statuses that are paid (salary)
const PAID_STATUS = [
  ATTENDANCE_STATUS.PRESENT,
  ATTENDANCE_STATUS.WEEKEND,
  ATTENDANCE_STATUS.HOLIDAY,
  ATTENDANCE_STATUS.CASUAL_LEAVE,
  ATTENDANCE_STATUS.SICK_LEAVE,
  ATTENDANCE_STATUS.EARNED_LEAVE,
  ATTENDANCE_STATUS.COMPENSATORY_LEAVE,
  ATTENDANCE_STATUS.TOUR,
  ATTENDANCE_STATUS.WORK_FROM_HOME,
  ATTENDANCE_STATUS.COVID_LEAVE
]

// GET payroll records
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

    const payrolls = await db.payroll.findMany({
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

    return NextResponse.json(payrolls)
  } catch (error) {
    console.error('Error fetching payrolls:', error)
    return NextResponse.json({ error: 'Failed to fetch payrolls' }, { status: 500 })
  }
}

// POST generate payroll for a month
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, employeeId, projectId } = body

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 })
    }

    const monthNum = parseInt(month)
    const yearNum = parseInt(year)

    // Get all active assignments or specific assignment
    const assignments = await db.employeeProjectAssignment.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(projectId && { projectId }),
        startDate: {
          lte: new Date(yearNum, monthNum, 0)
        },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date(yearNum, monthNum - 1, 1) } }
        ]
      },
      include: {
        employee: true,
        project: true
      }
    })

    if (assignments.length === 0) {
      return NextResponse.json({ error: 'No assignments found for given criteria' }, { status: 404 })
    }

    const results = []

    for (const assignment of assignments) {
      // Get all attendance for this employee in this month
      const attendance = await db.attendance.findMany({
        where: {
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          date: {
            gte: new Date(yearNum, monthNum - 1, 1),
            lte: new Date(yearNum, monthNum, 0)
          }
        }
      })

      // Calculate total workdays in the month
      const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate()
      const totalWorkdays = lastDayOfMonth

      // Calculate paid days and eligible days for social charges
      let paidDays = 0
      let eligibleDays = 0
      let sickLeaveDays = 0
      let casualLeaveDays = 0
      let earnedLeaveDays = 0
      let otherLeaveDays = 0

      attendance.forEach((att) => {
        const status = att.status

        // Count paid days (all except Absent)
        if (PAID_STATUS.includes(status)) {
          paidDays++
        }

        // Count eligible days for social charges (P, W, H, T, WH)
        if (SC_ELIGIBLE_STATUS.includes(status)) {
          eligibleDays++
        }

        // Count leave days by type (individual checks)
        if (status === ATTENDANCE_STATUS.SICK_LEAVE) {
          sickLeaveDays++
        }
        if (status === ATTENDANCE_STATUS.CASUAL_LEAVE) {
          casualLeaveDays++
        }
        if (status === ATTENDANCE_STATUS.EARNED_LEAVE) {
          earnedLeaveDays++
        }
        if (status === ATTENDANCE_STATUS.COMPENSATORY_LEAVE) {
          otherLeaveDays++
        }
        if (status === ATTENDANCE_STATUS.TOUR) {
          otherLeaveDays++
        }
        if (status === ATTENDANCE_STATUS.WORK_FROM_HOME) {
          otherLeaveDays++
        }
        if (status === ATTENDANCE_STATUS.COVID_LEAVE) {
          otherLeaveDays++
        }
      })

      // EXACT CALCULATION - Must Match Example Output
      //
      // Step 1: Attendance Ratio
      // Attendance Ratio = Present / Total Workdays
      // Example: 29 / 31 = 0.93548387096774194 (exact)
      const attendanceRatio = totalWorkdays > 0 ? eligibleDays / totalWorkdays : 0

      // Step 2: Apply Attendance Ratio to Social Charges
      // Applied SC % = 20% × Attendance Ratio
      // Example: 20% × 0.93548387096774194 = 18.709677419354874%
      const appliedSCPercent = 0.20 * attendanceRatio

      // Step 3: Earned Social Charges
      // Earned SC = Monthly Salary × Applied SC %
      // Using monthly salary (not earned salary) for SC calculation
      // Example: 300,000 × 18.709677419354874% = 56,129.03 PKR
      const earnedSocialChargesRaw = assignment.monthlySalary * appliedSCPercent
      // ROUND to whole number
      const earnedSocialCharges = roundSC(earnedSocialChargesRaw)

      // Step 4: Deferred Social Charges (Leave Impact) - This is SC Paid
      // Daily Salary = Monthly Salary / Workdays
      // SC Paid = Daily Salary × Leave Days
      // Example: (300,000 / 31) × 2 = 9,677.41935483871 × 2 = 19,354.84 PKR
      const dailySalary = assignment.monthlySalary / totalWorkdays
      const totalLeaveDays = sickLeaveDays + casualLeaveDays + earnedLeaveDays + otherLeaveDays
      const deferredSocialChargesRaw = totalLeaveDays > 0 ? (dailySalary * totalLeaveDays) : 0
      // ROUND to whole number - This is SC Paid
      const deferredSocialCharges = roundSC(deferredSocialChargesRaw)

      // SC Balance = SC Earned - SC Paid (can be negative)
      // This is calculated but not stored separately - it's derived from the two values above

      // For salary: Salary Paid = Daily Salary × Paid Days
      const salaryPaid = dailySalary * paidDays

      // For storage: keep dailySalary for backward compatibility
      const dailySalaryForStorage = dailySalary

      // Check if payroll already exists
      const existingPayroll = await db.payroll.findUnique({
        where: {
          employeeId_projectId_month_year: {
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
            month: monthNum,
            year: yearNum
          }
        }
      })

      let payroll

      if (existingPayroll) {
        // Update existing payroll
        payroll = await db.payroll.update({
          where: { id: existingPayroll.id },
          data: {
            totalWorkdays,
            paidDays,
            earnedSalary: salaryPaid,
            dailySalary: dailySalaryForStorage,
            eligibleDays,
            attendanceRatio,
            appliedSocialChargesPercent: appliedSCPercent * 100,
            socialChargesAmount: earnedSocialCharges, // SC Earned (rounded)
            deferredSocialCharges, // SC Paid (rounded)
            sickLeaveDays,
            casualLeaveDays,
            earnedLeaveDays,
            otherLeaveDays
          },
          include: {
            employee: true,
            project: true
          }
        })
      } else {
        // Create new payroll
        payroll = await db.payroll.create({
          data: {
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
            month: monthNum,
            year: yearNum,
            totalWorkdays,
            paidDays,
            earnedSalary: salaryPaid,
            dailySalary: dailySalaryForStorage,
            eligibleDays,
            attendanceRatio,
            appliedSocialChargesPercent: appliedSCPercent * 100,
            socialChargesAmount: earnedSocialCharges, // SC Earned (rounded)
            deferredSocialCharges, // SC Paid (rounded)
            sickLeaveDays,
            casualLeaveDays,
            earnedLeaveDays,
            otherLeaveDays
          },
          include: {
            employee: true,
            project: true
          }
        })
      }

      // Update social charges ledger
      await updateSocialChargesLedger(payroll, attendance)

      // Recalculate all subsequent months' balances to maintain running balance
      await recalculateSubsequentBalances(assignment.employeeId, assignment.projectId, monthNum, yearNum)

      results.push(payroll)
    }

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    console.error('Error generating payroll:', error)
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 })
  }
}

// DELETE payroll record
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

// Helper function to recalculate balances for all months after the updated month
async function recalculateSubsequentBalances(employeeId: string, projectId: string, month: number, year: number) {
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

    // Update balance if it changed
    if (Math.abs(ledger.balance - newBalance) > 0.01) {
      await db.socialChargesLedger.update({
        where: { id: ledger.id },
        data: { balance: newBalance }
      })
      
      // Update the ledger in our array for next iteration
      allLedgers[i].balance = newBalance
    }
  }
}

// Helper function to update social charges ledger
async function updateSocialChargesLedger(payroll: any, attendance: any[]) {
  const { employeeId, projectId, month, year, socialChargesAmount } = payroll

  // Social Charges Component Structure (20%)
  // SL: 1.67%, CL: 1.67%, EL: 8.33%, Other: 8.33%
  // All amounts must be rounded
  const SL_amount = roundSC(socialChargesAmount * (1.67 / 20))
  const CL_amount = roundSC(socialChargesAmount * (1.67 / 20))
  const EL_amount = roundSC(socialChargesAmount * (8.33 / 20))
  const Other_amount = roundSC(socialChargesAmount * (8.33 / 20))

  const totalEarned = socialChargesAmount // Already rounded
  const totalWithheld = payroll.deferredSocialCharges // Already rounded (SC Paid)

  // Check if ledger exists
  const existingLedger = await db.socialChargesLedger.findUnique({
    where: {
      employeeId_projectId_month_year: {
        employeeId,
        projectId,
        month,
        year
      }
    }
  })

  // Get previous balance - only from non-paid entries
  // We need to find the most recent non-paid ledger entry before this month
  const previousLedgers = await db.socialChargesLedger.findMany({
    where: {
      employeeId,
      projectId,
      isPaid: false, // Only consider non-paid entries for running balance
      OR: [
        { year: { lt: year } },
        { year, month: { lt: month } }
      ]
    },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' }
    ],
    take: 1
  })

  // Previous balance (excluding Admin Paid - only SC Earned - SC Paid)
  const previousBalance = previousLedgers.length > 0 ? previousLedgers[0].balance : 0

  // Calculate new balance: Previous Balance + SC Earned - SC Paid
  // SC Balance = ROUND(Previous Balance + SC Earned - SC Paid, 0)
  // Do NOT include Admin Paid in balance calculation
  const newBalance = roundSC(previousBalance + totalEarned - totalWithheld)

  if (existingLedger) {
    // Update existing ledger - preserve isPaid status
    // Balance formula: 
    // - If isPaid: balance = 0 (status is Paid)
    // - If not paid: Previous Balance + SC Earned - SC Paid (NO Admin Paid)
    const finalBalance = existingLedger.isPaid 
      ? 0 
      : roundSC(previousBalance + totalEarned - totalWithheld)
    
    await db.socialChargesLedger.update({
      where: { id: existingLedger.id },
      data: {
        earnedSickLeave: payroll.sickLeaveDays > 0 ? SL_amount : 0,
        earnedCasualLeave: payroll.casualLeaveDays > 0 ? CL_amount : 0,
        earnedEarnedLeave: payroll.earnedLeaveDays > 0 ? EL_amount : 0,
        earnedOtherPayable: Other_amount,
        totalEarned,
        // Withheld from leave days - all rounded
        withheldSickLeave: roundSC(payroll.sickLeaveDays > 0 ? (totalWithheld * (payroll.sickLeaveDays / (payroll.sickLeaveDays + payroll.casualLeaveDays + payroll.earnedLeaveDays + payroll.otherLeaveDays || 1))) : 0),
        withheldCasualLeave: roundSC(payroll.casualLeaveDays > 0 ? (totalWithheld * (payroll.casualLeaveDays / (payroll.sickLeaveDays + payroll.casualLeaveDays + payroll.earnedLeaveDays + payroll.otherLeaveDays || 1))) : 0),
        withheldEarnedLeave: roundSC(payroll.earnedLeaveDays > 0 ? (totalWithheld * (payroll.earnedLeaveDays / (payroll.sickLeaveDays + payroll.casualLeaveDays + payroll.earnedLeaveDays + payroll.otherLeaveDays || 1))) : 0),
        withheldOtherPayable: roundSC((payroll.otherLeaveDays || 0) > 0 ? (totalWithheld * ((payroll.otherLeaveDays || 0) / (payroll.sickLeaveDays + payroll.casualLeaveDays + payroll.earnedLeaveDays + payroll.otherLeaveDays || 1))) : 0),
        totalWithheld,
        // Balance = 0 if paid, otherwise Previous Balance + SC Earned - SC Paid - Admin Paid
        balance: finalBalance
        // Note: paidAmount and isPaid are preserved - they're only updated via their respective APIs
      }
    })
  } else {
    // Create new ledger - default isPaid is false
    await db.socialChargesLedger.create({
      data: {
        employeeId,
        projectId,
        month,
        year,
        earnedSickLeave: payroll.sickLeaveDays > 0 ? SL_amount : 0,
        earnedCasualLeave: payroll.casualLeaveDays > 0 ? CL_amount : 0,
        earnedEarnedLeave: payroll.earnedLeaveDays > 0 ? EL_amount : 0,
        earnedOtherPayable: Other_amount,
        totalEarned,
        // Withheld from leave days - all rounded
        withheldSickLeave: roundSC(payroll.sickLeaveDays > 0 ? (totalWithheld * (payroll.sickLeaveDays / (payroll.sickLeaveDays + payroll.casualLeaveDays + payroll.earnedLeaveDays + payroll.otherLeaveDays || 1))) : 0),
        withheldCasualLeave: roundSC(payroll.casualLeaveDays > 0 ? (totalWithheld * (payroll.casualLeaveDays / (payroll.sickLeaveDays + payroll.casualLeaveDays + payroll.earnedLeaveDays + payroll.otherLeaveDays || 1))) : 0),
        withheldEarnedLeave: roundSC(payroll.earnedLeaveDays > 0 ? (totalWithheld * (payroll.earnedLeaveDays / (payroll.sickLeaveDays + payroll.casualLeaveDays + payroll.earnedLeaveDays + payroll.otherLeaveDays || 1))) : 0),
        withheldOtherPayable: roundSC((payroll.otherLeaveDays || 0) > 0 ? (totalWithheld * ((payroll.otherLeaveDays || 0) / (payroll.sickLeaveDays + payroll.casualLeaveDays + payroll.earnedLeaveDays + payroll.otherLeaveDays || 1))) : 0),
        totalWithheld,
        // Balance = Previous Balance + SC Earned - SC Paid (can be negative)
        // isPaid defaults to false
        balance: newBalance
      }
    })
  }
}
