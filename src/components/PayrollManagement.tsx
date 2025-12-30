'use client'

import { useState, useEffect } from 'react'
import { Calculator, Download, Eye, Trash2, Search, User, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EmployeeProfile from '@/components/EmployeeProfile'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Employee {
  id: string
  fullName: string
}

interface Project {
  id: string
  name: string
}

interface Payroll {
  id: string
  employeeId: string
  projectId: string
  month: number
  year: number
  totalWorkdays: number
  paidDays: number
  earnedSalary: number
  dailySalary: number
  eligibleDays: number
  attendanceRatio: number
  appliedSocialChargesPercent: number
  socialChargesAmount: number
  deferredSocialCharges: number
  sickLeaveDays: number
  casualLeaveDays: number
  earnedLeaveDays: number
  otherLeaveDays: number
  employee: Employee
  project: Project
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

interface EmployeeDetailProps {
  employee: Employee
  payrollRecords: Payroll[]
}

function EmployeeDetailView({ employee, payrollRecords }: EmployeeDetailProps) {
  const [selectedView, setSelectedView] = useState<'monthly' | 'yearly'>('monthly')

  // Helper function to round SC values
  const roundSC = (value: number) => Math.round(value)

  // Group payroll by month
  const monthlyPayroll = payrollRecords.reduce((acc, p) => {
    const key = `${p.year}-${p.month}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(p)
    return acc
  }, {} as Record<string, Payroll[]>)

  const sortedMonths = Object.keys(monthlyPayroll).sort().reverse()

  // Yearly totals - all rounded
  const yearlyStats = {
    totalSalary: payrollRecords.reduce((sum, p) => sum + p.earnedSalary, 0),
    totalEarnedSC: payrollRecords.reduce((sum, p) => sum + roundSC(p.socialChargesAmount), 0),
    totalDeferred: payrollRecords.reduce((sum, p) => sum + roundSC(p.deferredSocialCharges), 0),
    months: payrollRecords.length
  }
  const yearlySCBalance = roundSC(yearlyStats.totalEarnedSC - yearlyStats.totalDeferred)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{employee.fullName} - Detailed View</h2>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          ← Back
        </Button>
      </div>

      {/* Yearly Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Yearly Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm opacity-90">Total Salary</p>
            <p className="text-2xl font-bold">{yearlyStats.totalSalary.toLocaleString()} PKR</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Total Earned SC</p>
            <p className="text-2xl font-bold">{yearlyStats.totalEarnedSC.toLocaleString()} PKR</p>
          </div>
          <div>
            <p className="text-sm opacity-90">SC Balance</p>
            <p className={`text-2xl font-bold ${yearlySCBalance < 0 ? 'text-red-200' : ''}`}>
              {yearlySCBalance.toLocaleString()} PKR
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">SC Paid</p>
            <p className="text-2xl font-bold">{yearlyStats.totalDeferred.toLocaleString()} PKR</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/30">
          <p className="text-sm opacity-90">Total Compensation</p>
          <p className="text-3xl font-bold">{(yearlyStats.totalSalary + yearlyStats.totalEarnedSC - yearlyStats.totalDeferred).toLocaleString()} PKR</p>
        </div>
        {yearlySCBalance < 0 && (
          <div className="mt-2 text-xs opacity-75 italic">
            * Negative SC Balance indicates social charges advance adjusted against salary.
          </div>
        )}
      </div>

      {/* View Tabs */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList>
          <TabsTrigger value="monthly">Monthly Detail</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          {sortedMonths.map((key) => {
            const records = monthlyPayroll[key]
            const [year, month] = key.split('-').map(Number)
            const roundSC = (value: number) => Math.round(value)
            const totalSC = records.reduce((sum, r) => sum + roundSC(r.socialChargesAmount), 0)
            const totalDeferred = records.reduce((sum, r) => sum + roundSC(r.deferredSocialCharges), 0)
            const monthlySCBalance = roundSC(totalSC - totalDeferred)

            if (records.length === 0) return null

            return (
              <div key={key} className="bg-card rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">
                    {MONTHS[month - 1].label} {year}
                  </h3>
                </div>

                {/* Deduction Transparency */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-orange-800 mb-2">Social Charges Deduction Breakdown</h4>
                  {records.map((record, idx) => (
                    <div key={record.id} className="text-sm space-y-1">
                      <p><strong>Project:</strong> {record.project.name}</p>
                      <p><strong>Eligible Days:</strong> {record.eligibleDays} (Present: {record.eligibleDays} days)</p>
                      <p><strong>Total Workdays:</strong> {record.totalWorkdays}</p>
                      <p><strong>Working Ratio:</strong> {(record.attendanceRatio * 100).toFixed(4)}%</p>
                      <p><strong>Applied SC%:</strong> {record.appliedSocialChargesPercent.toFixed(2)}%</p>
                    <p><strong>Earned SC:</strong> {roundSC(record.socialChargesAmount).toLocaleString()} PKR</p>
                    <p><strong>Daily Salary:</strong> {Math.round(record.dailySalary).toLocaleString()} PKR</p>
                    <div className="border-t border-orange-300 pt-2 mt-2">
                        <p><strong>Leave Days:</strong> {(record.sickLeaveDays + record.casualLeaveDays + record.earnedLeaveDays + record.otherLeaveDays)}</p>
                        <p><strong>Breakdown:</strong> SL({record.sickLeaveDays}) + CL({record.casualLeaveDays}) + EL({record.earnedLeaveDays}) + Other({record.otherLeaveDays})</p>
                        <p><strong>SC Paid Calculation:</strong> {Math.round(record.dailySalary).toLocaleString()} PKR × {(record.sickLeaveDays + record.casualLeaveDays + record.earnedLeaveDays + record.otherLeaveDays)} days = {roundSC(record.deferredSocialCharges).toLocaleString()} PKR</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Monthly Totals */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 mb-2">Monthly Totals</h5>
                    <p><strong>Salary Paid:</strong> {records.reduce((sum, r) => sum + r.earnedSalary, 0).toLocaleString()} PKR</p>
                    <p><strong>Earned SC:</strong> {totalSC.toLocaleString()} PKR</p>
                    <p><strong>SC Paid This Month:</strong> {totalDeferred.toLocaleString()} PKR</p>
                  </div>
                  <div className={`border rounded-lg p-4 ${monthlySCBalance < 0 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                    <h5 className={`font-semibold mb-2 ${monthlySCBalance < 0 ? 'text-red-800' : 'text-orange-800'}`}>SC Balance</h5>
                    <p><strong>SC Balance:</strong> <span className={monthlySCBalance < 0 ? 'text-red-600 font-bold' : ''}>{monthlySCBalance.toLocaleString()} PKR</span></p>
                    <p className="text-xs text-muted-foreground mt-1">{monthlySCBalance < 0 ? 'Negative balance indicates SC advance' : 'Leave cost recovered from SC'}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-lg font-bold mb-4">Project-wise Breakdown</h3>
            {(() => {
              const projectStats = payrollRecords.reduce((acc, p) => {
                if (!acc[p.projectId]) {
                  acc[p.projectId] = {
                    project: p.project,
                    months: 0,
                    salary: 0,
                    sc: 0,
                    deferred: 0
                  }
                }
                acc[p.projectId].months++
                acc[p.projectId].salary += p.earnedSalary
                acc[p.projectId].sc += p.socialChargesAmount
                acc[p.projectId].deferred += p.deferredSocialCharges
                return acc
              }, {} as Record<string, any>)

              return Object.values(projectStats).map((stat) => (
                <div key={stat.projectId} className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
                  <h5 className="font-semibold text-purple-800 mb-2">{stat.project.name}</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Months:</strong> {stat.months}</p>
                    <p><strong>Total Salary:</strong> {stat.salary.toLocaleString()} PKR</p>
                    <p><strong>Total SC:</strong> {stat.sc.toLocaleString()} PKR</p>
                    <p><strong>Deferred:</strong> {stat.deferred.toLocaleString()} PKR</p>
                  </div>
                </div>
              ))
            })()}
          </div>

          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-lg font-bold mb-4">SC Balance Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span>Total Earned SC</span>
                <span className="font-bold">{yearlyStats.totalEarnedSC.toLocaleString()} PKR</span>
              </div>
              <div className="flex justify-between p-2 bg-orange-50 rounded">
                <span>SC Paid</span>
                <span className="font-bold">{yearlyStats.totalDeferred.toLocaleString()} PKR</span>
              </div>
              <div className={`flex justify-between p-2 rounded ${yearlySCBalance < 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
                <span>SC Balance</span>
                <span className={`font-bold ${yearlySCBalance < 0 ? 'text-red-600' : ''}`}>{yearlySCBalance.toLocaleString()} PKR</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function PayrollManagement() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MM'))
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'))
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    fetchPayrolls()
    fetchEmployeesAndProjects()
  }, [selectedMonth, selectedYear, filterEmployee, filterProject])

  const fetchEmployeesAndProjects = async () => {
    try {
      const [employeesRes, projectsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/projects')
      ])

      if (!employeesRes.ok || !projectsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const employeesData = await employeesRes.json()
      const projectsData = await projectsRes.json()

      setEmployees(employeesData)
      setProjects(projectsData)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchPayrolls = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear
      })

      if (filterEmployee !== 'all') params.append('employeeId', filterEmployee)
      if (filterProject !== 'all') params.append('projectId', filterProject)

      const response = await fetch(`/api/payroll?${params}`)
      if (!response.ok) throw new Error('Failed to fetch payrolls')

      const data = await response.json()
      setPayrolls(data)
    } catch (error) {
      toast.error('Failed to load payrolls')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePayroll = async () => {
    try {
      setGenerating(true)

      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear),
          ...(filterEmployee !== 'all' && { employeeId: filterEmployee }),
          ...(filterProject !== 'all' && { projectId: filterProject })
        })
      })

      if (!response.ok) throw new Error('Failed to generate payroll')

      const data = await response.json()
      toast.success(`Payroll generated for ${data.length} employee(s)`)
      fetchPayrolls()
    } catch (error) {
      toast.error('Failed to generate payroll')
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/payroll/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete payroll')

      toast.success('Payroll deleted successfully')
      fetchPayrolls()
    } catch (error) {
      toast.error('Failed to delete payroll')
      console.error(error)
    }
  }

  const filteredPayrolls = payrolls.filter(payroll =>
    payroll.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payroll.project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Helper function to round SC values (already rounded in API, but ensure display)
  const roundSC = (value: number) => Math.round(value)

  const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + p.earnedSalary, 0)
  const totalSocialCharges = filteredPayrolls.reduce((sum, p) => sum + roundSC(p.socialChargesAmount), 0) // SC Earned
  const totalDeferred = filteredPayrolls.reduce((sum, p) => sum + roundSC(p.deferredSocialCharges), 0) // SC Paid
  const totalSCBalance = totalSocialCharges - totalDeferred // SC Balance (can be negative)

  return selectedEmployee ? (
    <EmployeeDetailView employee={selectedEmployee} payrollRecords={payrolls.filter(p => p.employeeId === selectedEmployee.id)} />
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <Button onClick={handleGeneratePayroll} disabled={generating || loading}>
          <Calculator className="h-4 w-4 mr-2" />
          {generating ? 'Generating...' : 'Generate Payroll'}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor="month">Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger id="month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            min="2020"
            max="2030"
          />
        </div>
        <div>
          <Label htmlFor="employee">Employee</Label>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger id="employee">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="project">Project</Label>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger id="project">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  {proj.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-8 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <h3 className="text-sm font-medium opacity-90">Total Payroll</h3>
          <p className="text-2xl font-bold">{totalPayroll.toLocaleString()}</p>
          <p className="text-sm opacity-90">PKR</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <h3 className="text-sm font-medium opacity-90">SC Earned</h3>
          <p className="text-2xl font-bold">{totalSocialCharges.toLocaleString()}</p>
          <p className="text-sm opacity-90">PKR</p>
        </div>
        <div className={`rounded-lg p-6 ${totalSCBalance < 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'} text-white`}>
          <h3 className="text-sm font-medium opacity-90">SC Balance</h3>
          <p className="text-2xl font-bold">{roundSC(totalSCBalance).toLocaleString()}</p>
          <p className="text-sm opacity-90">PKR{totalSCBalance < 0 ? ' (Negative)' : ''}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <h3 className="text-sm font-medium opacity-90">SC Paid</h3>
          <p className="text-2xl font-bold">{roundSC(totalDeferred).toLocaleString()}</p>
          <p className="text-sm opacity-90">PKR</p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead className="text-right">SC Earned</TableHead>
                <TableHead className="text-right">SC Paid</TableHead>
                <TableHead className="text-right">SC Balance</TableHead>
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPayrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No payroll records found. Generate payroll to view records.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">{payroll.employee.fullName}</TableCell>
                    <TableCell>{payroll.project.name}</TableCell>
                    <TableCell className="text-right">
                      {payroll.earnedSalary.toLocaleString()} PKR
                    </TableCell>
                    <TableCell className="text-right">
                      {roundSC(payroll.socialChargesAmount).toLocaleString()} PKR
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {roundSC(payroll.deferredSocialCharges).toLocaleString()} PKR
                    </TableCell>
                    <TableCell className={`text-right font-medium ${roundSC(payroll.socialChargesAmount - payroll.deferredSocialCharges) < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {roundSC(payroll.socialChargesAmount - payroll.deferredSocialCharges).toLocaleString()} PKR
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedEmployee(payroll.employee)}
                        title="View Employee Details"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
