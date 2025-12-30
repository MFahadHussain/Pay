'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Save, Calendar as CalendarIcon, Filter } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format, addMonths, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns'

interface Employee {
  id: string
  fullName: string
  designation: string
}

interface Project {
  id: string
  name: string
  description: string
}

interface Attendance {
  id: string
  employeeId: string
  projectId: string
  date: string
  status: string
  employee: Employee
  project: Project
}

interface AttendanceRecord {
  employeeId: string
  projectId: string
  status: string
}

const ATTENDANCE_STATUS = [
  { code: 'P', label: 'Present', description: 'Present at work', earnsSC: true },
  { code: 'W', label: 'Weekend', description: 'Weekend day', earnsSC: true },
  { code: 'H', label: 'Holiday', description: 'National Holiday', earnsSC: true },
  { code: 'CL', label: 'Casual Leave', description: 'Casual Leave', earnsSC: false },
  { code: 'SL', label: 'Sick Leave', description: 'Sick Leave', earnsSC: false },
  { code: 'EL', label: 'Earned Leave', description: 'Earned Leave', earnsSC: false },
  { code: 'CO', label: 'Comp. Leave', description: 'Compensatory Leave', earnsSC: false },
  { code: 'T', label: 'Tour/Site', description: 'Tour / Site Visit', earnsSC: true },
  { code: 'WH', label: 'Work From Home', description: 'Work From Home', earnsSC: true },
  { code: 'CD', label: 'COVID Leave', description: 'COVID-19 Leave', earnsSC: false },
  { code: 'A', label: 'Absent', description: 'Absent', earnsSC: false },
]

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'P': 'bg-green-100 text-green-700',
    'W': 'bg-gray-100 text-gray-700',
    'H': 'bg-blue-100 text-blue-700',
    'CL': 'bg-yellow-100 text-yellow-700',
    'SL': 'bg-orange-100 text-orange-700',
    'EL': 'bg-purple-100 text-purple-700',
    'CO': 'bg-indigo-100 text-indigo-700',
    'T': 'bg-teal-100 text-teal-700',
    'WH': 'bg-cyan-100 text-cyan-700',
    'CD': 'bg-pink-100 text-pink-700',
    'A': 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export default function AttendanceManagement() {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [saving, setSaving] = useState(false)

  // Track unsaved changes
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({})

  useEffect(() => {
    fetchData()
  }, [selectedMonth])

  const fetchData = async () => {
    try {
      setLoading(true)
      const monthStart = startOfMonth(selectedMonth)
      const monthEnd = endOfMonth(selectedMonth)

      const [attendanceRes, employeesRes, projectsRes] = await Promise.all([
        fetch(`/api/attendance?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}`),
        fetch('/api/employees'),
        fetch('/api/projects')
      ])

      // Check each response individually for better error messages
      if (!attendanceRes.ok) {
        const errorData = await attendanceRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch attendance data (${attendanceRes.status})`)
      }
      if (!employeesRes.ok) {
        const errorData = await employeesRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch employees (${employeesRes.status})`)
      }
      if (!projectsRes.ok) {
        const errorData = await projectsRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch projects (${projectsRes.status})`)
      }

      // Parse JSON with error handling
      let attendanceData: Attendance[] = []
      let employeesData: Employee[] = []
      let projectsData: Project[] = []

      try {
        attendanceData = await attendanceRes.json()
      } catch (error) {
        console.error('Error parsing attendance data:', error)
        throw new Error('Invalid attendance data format')
      }

      try {
        employeesData = await employeesRes.json()
      } catch (error) {
        console.error('Error parsing employees data:', error)
        throw new Error('Invalid employees data format')
      }

      try {
        projectsData = await projectsRes.json()
      } catch (error) {
        console.error('Error parsing projects data:', error)
        throw new Error('Invalid projects data format')
      }

      // Validate data structure
      if (!Array.isArray(attendanceData)) {
        console.warn('Attendance data is not an array, using empty array')
        attendanceData = []
      }
      if (!Array.isArray(employeesData)) {
        console.warn('Employees data is not an array, using empty array')
        employeesData = []
      }
      if (!Array.isArray(projectsData)) {
        console.warn('Projects data is not an array, using empty array')
        projectsData = []
      }

      setAttendanceData(attendanceData)
      setEmployees(employeesData)
      setProjects(projectsData)

      // Initialize attendance records with error handling
      try {
        const records: Record<string, AttendanceRecord> = {}
        attendanceData.forEach((att: Attendance) => {
          try {
            if (att && att.employeeId && att.date) {
              const dateStr = format(new Date(att.date), 'yyyy-MM-dd')
              const key = `${att.employeeId}_${dateStr}`
              records[key] = {
                employeeId: att.employeeId,
                projectId: att.projectId || '',
                status: att.status || ''
              }
            }
          } catch (error) {
            console.error('Error processing attendance record:', error, att)
          }
        })
        setAttendanceRecords(records)
      } catch (error) {
        console.error('Error initializing attendance records:', error)
        setAttendanceRecords({})
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data'
      toast.error(errorMessage)
      console.error('Error in fetchData:', error)
      
      // Set empty arrays on error to prevent UI crashes
      setAttendanceData([])
      setEmployees([])
      setProjects([])
      setAttendanceRecords({})
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (employeeId: string, date: string, status: string) => {
    const key = `${employeeId}_${date}`
    setAttendanceRecords(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        employeeId,
        status
      }
    }))
  }

  const handleProjectChange = (employeeId: string, date: string, projectId: string) => {
    const key = `${employeeId}_${date}`
    setAttendanceRecords(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        employeeId,
        projectId
      }
    }))
  }

  const handleSaveAttendance = async () => {
    try {
      setSaving(true)

      // Save each record
      const promises: Promise<Response>[] = []

      Object.entries(attendanceRecords).forEach(([key, record]) => {
        const [employeeId, date] = key.split('_')
        if (record.status && record.projectId) {
          promises.push(
            fetch('/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employeeId,
                projectId: record.projectId,
                date,
                status: record.status
              })
            })
          )
        }
      })

      const results = await Promise.all(promises)

      if (results.every(res => res.ok)) {
        toast.success('Attendance saved successfully')
        fetchData()
      } else {
        throw new Error('Some records failed to save')
      }
    } catch (error) {
      toast.error('Failed to save attendance')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const navigateMonth = (months: number) => {
    const newDate = addMonths(selectedMonth, months)
    setSelectedMonth(newDate)
  }

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const monthDates = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  })

  // Calculate daily summary
  const dailySummary = monthDates.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const present = filteredEmployees.filter(emp => {
      const key = `${emp.id}_${dateStr}`
      return attendanceRecords[key]?.status === 'P' || attendanceData.find(a => 
        a.employeeId === emp.id && isSameDay(new Date(a.date), date)
      )?.status === 'P'
    }).length
    const absent = filteredEmployees.filter(emp => {
      const key = `${emp.id}_${dateStr}`
      return attendanceRecords[key]?.status === 'A' || attendanceData.find(a => 
        a.employeeId === emp.id && isSameDay(new Date(a.date), date)
      )?.status === 'A'
    }).length
    const onLeave = filteredEmployees.filter(emp => {
      const key = `${emp.id}_${dateStr}`
      return attendanceRecords[key]?.status || attendanceData.find(a => 
        a.employeeId === emp.id && isSameDay(new Date(a.date), date)
      )?.status
      return ['CL', 'SL', 'EL', 'CO', 'T', 'WH', 'CD'].includes(status || '')
    }).length
    const eligibleForSC = filteredEmployees.filter(emp => {
      const key = `${emp.id}_${dateStr}`
      return attendanceRecords[key]?.status || attendanceData.find(a => 
        a.employeeId === emp.id && isSameDay(new Date(a.date), date)
      )?.status
      return ['P', 'W', 'H', 'T', 'WH'].includes(status || '')
    }).length

    return { date, dateStr, present, absent, onLeave, eligibleForSC }
  })

  const totalPresent = dailySummary.reduce((sum, d) => sum + d.present, 0)
  const totalAbsent = dailySummary.reduce((sum, d) => sum + d.absent, 0)
  const totalOnLeave = dailySummary.reduce((sum, d) => sum + d.onLeave, 0)
  const totalEligibleForSC = dailySummary.reduce((sum, d) => sum + d.eligibleForSC, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <Button onClick={handleSaveAttendance} disabled={saving || loading}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Attendance'}
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <h2 className="text-xl font-bold">
              {format(selectedMonth, 'MMMM yyyy')}
            </h2>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-2 text-sm">
        {ATTENDANCE_STATUS.map(status => (
          <div key={status.code} className="flex items-center gap-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status.code)}`}>
              {status.code}
            </span>
            <span className="text-muted-foreground">{status.label}</span>
            {status.earnsSC && (
              <span className="text-xs text-green-600 font-medium">(Earns SC)</span>
            )}
          </div>
        ))}
      </div>

      {/* Monthly Summary */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Monthly Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalPresent}</p>
            <p className="text-sm text-muted-foreground">Present</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-teal-600">{totalEligibleForSC}</p>
            <p className="text-sm text-muted-foreground">Eligible for SC</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{totalOnLeave}</p>
            <p className="text-sm text-muted-foreground">Leaves</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{totalAbsent}</p>
            <p className="text-sm text-muted-foreground">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {employees.length}
            </p>
            <p className="text-sm text-muted-foreground">Total Employees</p>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Table - Vertical Layout */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-20 min-w-[180px]">
                  Employee
                </TableHead>
                {monthDates.map(date => (
                  <TableHead key={format(date, 'yyyy-MM-dd')} className="text-center min-w-[100px]">
                    <div className="text-xs font-medium">{format(date, 'EEE')}</div>
                    <div className="font-bold">{format(date, 'dd')}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={monthDates.length + 1} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={monthDates.length + 1} className="text-center py-4">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10 min-w-[180px]">
                      <div className="font-semibold">{employee.fullName}</div>
                      <div className="text-xs text-muted-foreground">{employee.designation}</div>
                    </TableCell>
                    {monthDates.map(date => {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      const record = attendanceRecords[`${employee.id}_${dateStr}`]
                      const existingAttendance = attendanceData.find(a => 
                        a.employeeId === employee.id && isSameDay(new Date(a.date), date)
                      )

                      return (
                        <TableCell key={dateStr} className="p-1 align-top min-w-[100px]">
                          <div className="flex flex-col gap-1">
                            <Select
                              value={record?.status || existingAttendance?.status || ''}
                              onValueChange={(value) => handleStatusChange(employee.id, dateStr, value)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="-" />
                              </SelectTrigger>
                              <SelectContent>
                                {ATTENDANCE_STATUS.map((status) => (
                                  <SelectItem key={status.code} value={status.code}>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status.code)}`}>
                                        {status.code}
                                      </span>
                                      <span className="text-xs">{status.label}</span>
                                      {status.earnsSC && (
                                        <span className="text-xs text-green-600">(Earns SC)</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={record?.projectId || existingAttendance?.projectId || ''}
                              onValueChange={(value) => handleProjectChange(employee.id, dateStr, value)}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue placeholder="Prj" />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    <div className="text-xs">{project.name.substring(0, 8)}</div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      )
                    })}
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
