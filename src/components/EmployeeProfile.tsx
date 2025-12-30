'use client'

import { useState, useEffect } from 'react'
import { User, Wallet, Calendar, DollarSign, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Employee {
  id: string
  fullName: string
  designation: string
  department: string
  baseSalary: number
  joiningDate: string
  employmentStatus: string
}

interface Project {
  id: string
  name: string
  description: string
}

interface Assignment {
  id: string
  role: string
  monthlySalary: number
  startDate: string
  endDate: string | null
  project: Project
}

interface PayrollSummary {
  totalSalary: number
  totalSocialCharges: number
  totalPaid: number
  totalDeferred: number
  months: number
}

interface EmployeeProfileProps {
  employee: Employee
}

export default function EmployeeProfile({ employee }: EmployeeProfileProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null)

  useEffect(() => {
    fetchEmployeeData()
  }, [employee.id, selectedMonth])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)

      // Fetch assignments
      const assignmentsRes = await fetch(`/api/assignments?employeeId=${employee.id}`)
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        // Filter assignments for the selected month
        const assignmentsDataWithProjects = await Promise.all(
          assignmentsData.map(async (assign: any) => {
            const projectRes = await fetch(`/api/projects`)
            const projectsData = await projectRes.json()
            const project = projectsData.find((p: Project) => p.id === assign.projectId)
            return { ...assign, project }
          })
        )
        setAssignments(assignmentsDataWithProjects)
      }

      // Fetch payroll summary for the year
      const [year, month] = selectedMonth.split('-')
      const payrollRes = await fetch(`/api/payroll?year=${year}&employeeId=${employee.id}`)
      if (payrollRes.ok) {
        const payrollData = await payrollRes.json()

        const totalSalary = payrollData.reduce((sum: number, p: any) => sum + p.earnedSalary, 0)
        const totalSocialCharges = payrollData.reduce((sum: number, p: any) => sum + p.socialChargesAmount, 0)
        const totalDeferred = payrollData.reduce((sum: number, p: any) => sum + p.deferredSocialCharges, 0)

        setPayrollSummary({
          totalSalary,
          totalSocialCharges,
          totalPaid: totalSocialCharges,
          totalDeferred,
          months: payrollData.length
        })
      }
    } catch (error) {
      console.error('Error fetching employee data:', error)
      toast.error('Failed to load employee data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading employee profile...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Employee Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employee Profile</CardTitle>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              employee.employmentStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {employee.employmentStatus}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Personal Information</span>
              </div>
              <div className="pl-6 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{employee.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Designation</p>
                  <p className="font-semibold">{employee.designation}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">{employee.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="font-semibold">{format(new Date(employee.joiningDate), 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm font-medium">Salary Information</span>
              </div>
              <div className="pl-6 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Base Salary</p>
                  <p className="font-semibold">{employee.baseSalary.toLocaleString()} PKR</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Project Assignments</CardTitle>
          <CardDescription>Active project assignments with monthly salaries</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No project assignments found
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{assignment.project.name}</span>
                        <span className="text-xs text-muted-foreground">({assignment.project.description})</span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-medium">{assignment.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Salary</p>
                        <p className="font-semibold">{assignment.monthlySalary.toLocaleString()} PKR</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Assignment Period</p>
                        <p className="font-medium">
                          {format(new Date(assignment.startDate), 'dd MMM yyyy')}
                          {' - '}
                          {assignment.endDate ? format(new Date(assignment.endDate), 'dd MMM yyyy') : 'Ongoing'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Yearly Payroll Summary ({selectedMonth.split('-')[0]})</CardTitle>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {[format(new Date(), 'yyyy-MM'), format(new Date(new Date().getFullYear() - 1, 1, 1), 'yyyy-MM')].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {payrollSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Salary */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm font-medium">Total Salary</span>
                </div>
                <p className="text-3xl font-bold">{payrollSummary.totalSalary.toLocaleString()}</p>
                <p className="text-sm opacity-90">{payrollSummary.months} months</p>
              </div>

              {/* Social Charges Paid */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5" />
                  <span className="text-sm font-medium">SC Paid</span>
                </div>
                <p className="text-3xl font-bold">{payrollSummary.totalSocialCharges.toLocaleString()}</p>
                <p className="text-sm opacity-90">PKR</p>
              </div>

              {/* Overall Compensation */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5" />
                  <span className="text-sm font-medium">Overall Paid</span>
                </div>
                <p className="text-3xl font-bold">{(payrollSummary.totalSalary + payrollSummary.totalSocialCharges).toLocaleString()}</p>
                <p className="text-sm opacity-90">PKR</p>
              </div>

              {/* Deferred SC Balance */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm font-medium">SC Balance</span>
                </div>
                <p className="text-3xl font-bold">{payrollSummary.totalDeferred.toLocaleString()}</p>
                <p className="text-sm opacity-90">PKR (Pending)</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No payroll data available for selected year
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
