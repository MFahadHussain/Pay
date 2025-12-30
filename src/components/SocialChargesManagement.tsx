'use client'

import { useState, useEffect } from 'react'
import { Wallet, Eye, Search } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface LedgerEntry {
  id: string
  employeeId: string
  projectId: string
  month: number
  year: number
  earnedSickLeave: number
  earnedCasualLeave: number
  earnedEarnedLeave: number
  earnedOtherPayable: number
  totalEarned: number
  withheldSickLeave: number
  withheldCasualLeave: number
  withheldEarnedLeave: number
  withheldOtherPayable: number
  totalWithheld: number
  paidAmount: number
  isPaid: boolean
  balance: number
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

export default function SocialChargesManagement() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MM'))
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'))
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null)

  useEffect(() => {
    fetchData()
    fetchEmployeesAndProjects()
  }, [selectedMonth, selectedYear, filterEmployee, filterProject])

  const fetchEmployeesAndProjects = async () => {
    try {
      const [employeesRes, projectsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/projects')
      ])

      // Check each response individually for better error messages
      if (!employeesRes.ok) {
        const errorData = await employeesRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch employees (${employeesRes.status})`)
      }
      if (!projectsRes.ok) {
        const errorData = await projectsRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch projects (${projectsRes.status})`)
      }

      // Parse JSON with error handling
      let employeesData: Employee[] = []
      let projectsData: Project[] = []

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
      if (!Array.isArray(employeesData)) {
        console.warn('Employees data is not an array, using empty array')
        employeesData = []
      }
      if (!Array.isArray(projectsData)) {
        console.warn('Projects data is not an array, using empty array')
        projectsData = []
      }

      setEmployees(employeesData)
      setProjects(projectsData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data'
      toast.error(errorMessage)
      console.error('Error in fetchEmployeesAndProjects:', error)
      
      // Set empty arrays on error to prevent UI crashes
      setEmployees([])
      setProjects([])
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch ledger
      const ledgerParams = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear
      })
      if (filterEmployee !== 'all') ledgerParams.append('employeeId', filterEmployee)
      if (filterProject !== 'all') ledgerParams.append('projectId', filterProject)

      let ledgerResponse: Response
      try {
        ledgerResponse = await fetch(`/api/social-charges/ledger?${ledgerParams}`)
      } catch (networkError) {
        throw new Error(`Network error: Failed to connect to ledger API. ${networkError instanceof Error ? networkError.message : 'Unknown error'}`)
      }

      if (!ledgerResponse.ok) {
        const errorData = await ledgerResponse.json().catch(() => ({}))
        const statusText = ledgerResponse.statusText || `Status ${ledgerResponse.status}`
        throw new Error(errorData.error || `Failed to fetch ledger: ${statusText}`)
      }

      let ledgerData: LedgerEntry[] = []
      try {
        ledgerData = await ledgerResponse.json()
      } catch (parseError) {
        console.error('Error parsing ledger data:', parseError)
        throw new Error('Invalid ledger data format - server returned invalid JSON')
      }
      
      // Validate ledger data structure
      if (!Array.isArray(ledgerData)) {
        console.warn('Ledger data is not an array, using empty array')
        ledgerData = []
      }
      
      setLedger(ledgerData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data'
      toast.error(errorMessage)
      console.error('Error in fetchData:', error)
      
      // Set empty arrays on error to prevent UI crashes
      setLedger([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (entryId: string, isPaid: boolean) => {
    try {
      if (!entryId) {
        toast.error('Invalid entry ID')
        return
      }

      const response = await fetch(`/api/social-charges/ledger/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !isPaid })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to update payment status'
        throw new Error(errorMessage)
      }

      const updatedEntry = await response.json()
      toast.success(`Social charges ${!isPaid ? 'marked as paid' : 'marked as unpaid'}`)
      
      // Refresh data to show updated balances
      await fetchData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment status'
      toast.error(errorMessage)
      console.error('Error marking as paid:', error)
    }
  }

  // Helper function to round SC values with error handling
  const roundSC = (value: number) => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return 0
    }
    return Math.round(value)
  }

  // Filter ledger with error handling
  const filteredLedger = ledger.filter(entry => {
    try {
      if (!entry || !entry.employee || !entry.project) {
        return false
      }
      const employeeName = entry.employee.fullName?.toLowerCase() || ''
      const projectName = entry.project.name?.toLowerCase() || ''
      const searchLower = searchTerm.toLowerCase()
      return employeeName.includes(searchLower) || projectName.includes(searchLower)
    } catch (error) {
      console.error('Error filtering ledger entry:', error)
      return false
    }
  })

  // Calculate totals - SC Balance = sum of all balances (excluding Admin Paid)
  // SC Paid = sum of all SC Paid (withheld)
  let totalBalance = 0
  let totalEarned = 0
  let totalSCPaid = 0

  try {
    // SC Balance = sum of all SC Balances (can be negative)
    totalBalance = roundSC(ledger.reduce((sum, entry) => {
      // If status is Paid (isPaid = true), balance is 0, otherwise use actual balance
      const balance = entry?.isPaid ? 0 : (entry?.balance ?? 0)
      return sum + (typeof balance === 'number' && !isNaN(balance) ? balance : 0)
    }, 0))
    
    // SC Earned = sum of all SC Earned
    totalEarned = roundSC(ledger.reduce((sum, entry) => {
      const earned = entry?.totalEarned ?? 0
      return sum + (typeof earned === 'number' && !isNaN(earned) ? earned : 0)
    }, 0))
    
    // SC Paid = sum of all SC Paid (withheld, not Admin Paid)
    totalSCPaid = roundSC(ledger.reduce((sum, entry) => {
      const scPaid = entry?.totalWithheld ?? 0
      return sum + (typeof scPaid === 'number' && !isNaN(scPaid) ? scPaid : 0)
    }, 0))
  } catch (error) {
    console.error('Error calculating totals:', error)
    // Values already default to 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Social Charges Management</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <h3 className="text-sm font-medium opacity-90">SC Earned</h3>
          <p className="text-2xl font-bold mt-2">{totalEarned.toLocaleString()}</p>
          <p className="text-sm opacity-90">PKR</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
          <h3 className="text-sm font-medium opacity-90">SC Paid</h3>
          <p className="text-2xl font-bold mt-2">{totalSCPaid.toLocaleString()}</p>
          <p className="text-sm opacity-90">PKR</p>
        </div>
        <div className={`rounded-lg p-6 text-white ${totalBalance < 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'}`}>
          <h3 className="text-sm font-medium opacity-90">SC Balance</h3>
          <p className="text-2xl font-bold mt-2">
            {totalBalance.toLocaleString()}
            {totalBalance < 0 && <span className="text-xs ml-2 opacity-75">(Negative)</span>}
          </p>
          <p className="text-sm opacity-90">PKR</p>
          {totalBalance < 0 && (
            <p className="text-xs opacity-75 mt-1 italic">
              Negative balance indicates social charges advance adjusted against salary.
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-4">
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
        <div className="relative">
          <Label htmlFor="search">Search</Label>
          <Search className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Ledger View */}
      <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">SC Earned</TableHead>
                  <TableHead className="text-right">SC Paid</TableHead>
                  <TableHead className="text-right">SC Balance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredLedger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No ledger entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLedger.map((entry) => {
                    // Calculate SC Balance: Previous Balance + SC Earned - SC Paid (excluding Admin Paid)
                    const scBalance = roundSC(entry.balance)
                    // Status: Paid if SC Balance = 0 OR isPaid flag is true, Unpaid otherwise
                    const displayStatus = entry.isPaid || scBalance === 0
                    
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.employee.fullName}</TableCell>
                        <TableCell>{entry.project.name}</TableCell>
                        <TableCell>
                          {MONTHS[entry.month - 1].label} {entry.year}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {roundSC(entry.totalEarned).toLocaleString()} PKR
                        </TableCell>
                        <TableCell className="text-right text-orange-600 font-medium">
                          {roundSC(entry.totalWithheld).toLocaleString()} PKR
                        </TableCell>
                        <TableCell 
                          className={`text-right font-medium ${
                            displayStatus 
                              ? 'text-blue-600' 
                              : scBalance < 0 
                                ? 'text-red-600' 
                                : scBalance > 0 
                                  ? 'text-orange-600' 
                                  : 'text-green-600'
                          }`}
                          title={scBalance < 0 ? 'Negative balance indicates social charges advance adjusted against salary.' : ''}
                        >
                          {displayStatus ? (
                            <span className="text-blue-600 font-bold">
                              {roundSC(scBalance).toLocaleString()} PKR
                            </span>
                          ) : (
                            <>
                              {roundSC(scBalance).toLocaleString()} PKR
                              {scBalance < 0 && (
                                <span className="text-xs ml-1" title="Negative balance indicates social charges advance adjusted against salary">
                                  ⚠️
                                </span>
                              )}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {displayStatus ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Unpaid
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant={displayStatus ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleMarkAsPaid(entry.id, displayStatus)}
                            >
                              {displayStatus ? 'Mark Unpaid' : 'Mark Paid'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedEntry(entry)
                                setDetailDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>


      {/* Ledger Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ledger Details</DialogTitle>
            <DialogDescription>
              {selectedEntry && `${selectedEntry.employee.fullName} - ${selectedEntry.project.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="text-center py-2 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Month</p>
                <p className="text-lg font-bold">
                  {MONTHS[selectedEntry.month - 1].label} {selectedEntry.year}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Earned (Sick Leave)</Label>
                  <p className="font-medium text-green-600">{roundSC(selectedEntry.earnedSickLeave).toLocaleString()} PKR</p>
                </div>
                <div>
                  <Label>Earned (Casual Leave)</Label>
                  <p className="font-medium text-green-600">{roundSC(selectedEntry.earnedCasualLeave).toLocaleString()} PKR</p>
                </div>
                <div>
                  <Label>Earned (Earned Leave)</Label>
                  <p className="font-medium text-green-600">{roundSC(selectedEntry.earnedEarnedLeave).toLocaleString()} PKR</p>
                </div>
                <div>
                  <Label>Earned (Other Payable)</Label>
                  <p className="font-medium text-green-600">{roundSC(selectedEntry.earnedOtherPayable).toLocaleString()} PKR</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label>SC Earned</Label>
                  <p className="font-bold text-green-600">{roundSC(selectedEntry.totalEarned).toLocaleString()} PKR</p>
                </div>
                <div className="flex justify-between items-center">
                  <Label>SC Paid (Withheld)</Label>
                  <p className="font-bold text-orange-600">{roundSC(selectedEntry.totalWithheld).toLocaleString()} PKR</p>
                </div>
                <div className="flex justify-between items-center text-lg pt-2 border-t">
                  <Label className="text-base">SC Balance</Label>
                  <p className={`font-bold ${
                    selectedEntry.isPaid || roundSC(selectedEntry.balance) === 0
                      ? 'text-blue-600' 
                      : roundSC(selectedEntry.balance) < 0 
                        ? 'text-red-600' 
                        : roundSC(selectedEntry.balance) > 0 
                          ? 'text-orange-600' 
                          : 'text-green-600'
                  }`}>
                    {selectedEntry.isPaid || roundSC(selectedEntry.balance) === 0
                      ? `${roundSC(selectedEntry.balance).toLocaleString()} PKR (Paid)`
                      : `${roundSC(selectedEntry.balance).toLocaleString()} PKR`}
                    {!selectedEntry.isPaid && roundSC(selectedEntry.balance) < 0 && (
                      <span className="text-xs ml-2 text-muted-foreground">(Negative)</span>
                    )}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Label className="text-base">Status</Label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedEntry.isPaid || roundSC(selectedEntry.balance) === 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedEntry.isPaid || roundSC(selectedEntry.balance) === 0 ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                {!selectedEntry.isPaid && roundSC(selectedEntry.balance) < 0 && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Negative balance indicates social charges advance adjusted against salary.
                  </p>
                )}
                {(selectedEntry.isPaid || roundSC(selectedEntry.balance) === 0) && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    This entry is marked as paid. SC Balance is highlighted in blue.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
