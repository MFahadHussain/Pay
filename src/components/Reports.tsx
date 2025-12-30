'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Employee {
  id: string
  fullName: string
}

interface Project {
  id: string
  name: string
}

interface PayrollRecord {
  id: string
  employee: { fullName: string }
  project: { name: string }
  month: number
  year: number
  totalWorkdays: number
  paidDays: number
  earnedSalary: number
  socialChargesAmount: number
  deferredSocialCharges: number
}

interface AttendanceSummary {
  date: string
  totalEmployees: number
  present: number
  absent: number
  onLeave: number
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

type ReportType = 'monthly-payroll' | 'yearly-salary' | 'project-cost' | 'attendance'

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('monthly-payroll')
  const [selectedMonth, setSelectedMonth] = useState('12')
  const [selectedYear, setSelectedYear] = useState('2023')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any[]>([])

  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchEmployeesAndProjects()
  }, [])

  useEffect(() => {
    if (reportType) {
      fetchReportData()
    }
  }, [reportType, selectedMonth, selectedYear, selectedEmployee, selectedProject])

  const fetchEmployeesAndProjects = async () => {
    try {
      const [employeesRes, projectsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/projects')
      ])

      if (employeesRes.ok && projectsRes.ok) {
        const employeesData = await employeesRes.json()
        const projectsData = await projectsRes.json()
        setEmployees(employeesData)
        setProjects(projectsData)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)

      let url = ''
      const params = new URLSearchParams()

      switch (reportType) {
        case 'monthly-payroll':
          url = '/api/payroll'
          params.append('month', selectedMonth)
          params.append('year', selectedYear)
          if (selectedEmployee !== 'all') params.append('employeeId', selectedEmployee)
          if (selectedProject !== 'all') params.append('projectId', selectedProject)
          break
        case 'yearly-salary':
          url = '/api/payroll'
          params.append('year', selectedYear)
          break
        case 'project-cost':
          url = '/api/payroll'
          if (selectedProject !== 'all') params.append('projectId', selectedProject)
          if (selectedYear) params.append('year', selectedYear)
          break
        case 'attendance':
          // This would need attendance API
          setReportData([])
          setLoading(false)
          return
      }

      const response = await fetch(`${url}?${params}`)
      if (!response.ok) throw new Error('Failed to fetch report data')

      const data = await response.json()
      setReportData(data)
    } catch (error) {
      toast.error('Failed to load report data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    toast.info('Export to Excel feature - would require additional libraries like xlsx')
  }

  const handleExportPDF = () => {
    toast.info('Export to PDF feature - would require additional libraries like jspdf')
  }

  const renderReportHeader = () => {
    const monthName = MONTHS.find(m => m.value === parseInt(selectedMonth))?.label || ''
    return (
      <div>
        <h2 className="text-2xl font-bold">
          {reportType === 'monthly-payroll' && 'Monthly Payroll Report'}
          {reportType === 'yearly-salary' && 'Yearly Salary Summary'}
          {reportType === 'project-cost' && 'Project-wise Cost Report'}
          {reportType === 'attendance' && 'Attendance Summary'}
        </h2>
        <p className="text-muted-foreground">
          {monthName && `${monthName} `}
          {selectedYear}
        </p>
      </div>
    )
  }

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p>Loading report data...</p>
        </div>
      )
    }

    if (reportData.length === 0) {
      return (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No data available for the selected criteria</p>
        </div>
      )
    }

    switch (reportType) {
      case 'monthly-payroll':
      case 'yearly-salary':
        return (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Workdays</TableHead>
                    <TableHead className="text-right">Paid Days</TableHead>
                    <TableHead className="text-right">Salary (PKR)</TableHead>
                    <TableHead className="text-right">Social Charges (PKR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((record: PayrollRecord) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employee.fullName}</TableCell>
                      <TableCell>{record.project.name}</TableCell>
                      <TableCell>
                        {MONTHS[record.month - 1].label} {record.year}
                      </TableCell>
                      <TableCell className="text-right">{record.totalWorkdays}</TableCell>
                      <TableCell className="text-right">{record.paidDays}</TableCell>
                      <TableCell className="text-right font-medium">
                        {record.earnedSalary.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {record.socialChargesAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t p-4 bg-muted">
              <div className="flex justify-end gap-8">
                <div>
                  <p className="text-sm text-muted-foreground">Total Salary</p>
                  <p className="text-lg font-bold">
                    {reportData.reduce((sum, r: PayrollRecord) => sum + r.earnedSalary, 0).toLocaleString()} PKR
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Social Charges</p>
                  <p className="text-lg font-bold">
                    {reportData.reduce((sum, r: PayrollRecord) => sum + r.socialChargesAmount, 0).toLocaleString()} PKR
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'project-cost':
        const projectTotals = reportData.reduce((acc: any, record: PayrollRecord) => {
          if (!acc[record.project.name]) {
            acc[record.project.name] = {
              salary: 0,
              socialCharges: 0,
              count: 0
            }
          }
          acc[record.project.name].salary += record.earnedSalary
          acc[record.project.name].socialCharges += record.socialChargesAmount
          acc[record.project.name].count++
          return acc
        }, {})

        return (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Payroll Records</TableHead>
                    <TableHead className="text-right">Total Salary (PKR)</TableHead>
                    <TableHead className="text-right">Total Social Charges (PKR)</TableHead>
                    <TableHead className="text-right">Total Cost (PKR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(projectTotals).map(([project, data]: [string, any]) => (
                    <TableRow key={project}>
                      <TableCell className="font-medium">{project}</TableCell>
                      <TableCell className="text-right">{data.count}</TableCell>
                      <TableCell className="text-right">{data.salary.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{data.socialCharges.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">
                        {(data.salary + data.socialCharges).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      default:
        return (
          <div className="bg-card rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">Select a report type to view data</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="reportType">Report Type</Label>
          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger id="reportType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly-payroll">Monthly Payroll</SelectItem>
              <SelectItem value="yearly-salary">Yearly Salary Summary</SelectItem>
              <SelectItem value="project-cost">Project-wise Cost</SelectItem>
              <SelectItem value="attendance">Attendance Summary</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger id="year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2022, 2023, 2024, 2025].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="employee">Filter by Employee</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
      </div>

      {/* Report Content */}
      {renderReportHeader()}
      {renderReportContent()}
    </div>
  )
}
