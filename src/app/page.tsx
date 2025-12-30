'use client'

import { useState, useEffect } from 'react'
import { Menu, Users, FolderKanban, UserCheck, Calendar, Wallet, BarChart3, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import EmployeesManagement from '@/components/EmployeesManagement'
import ProjectsManagement from '@/components/ProjectsManagement'
import AssignmentsManagement from '@/components/AssignmentsManagement'
import AttendanceManagement from '@/components/AttendanceManagement'
import PayrollManagement from '@/components/PayrollManagement'
import SocialChargesManagement from '@/components/SocialChargesManagement'
import Reports from '@/components/Reports'

type NavItem = {
  id: string
  label: string
  icon: any
  value: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, value: 'dashboard' },
  { id: 'employees', label: 'Employees', icon: Users, value: 'employees' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, value: 'projects' },
  { id: 'assignments', label: 'Assignments', icon: UserCheck, value: 'assignments' },
  { id: 'attendance', label: 'Attendance', icon: Calendar, value: 'attendance' },
  { id: 'payroll', label: 'Payroll', icon: Wallet, value: 'payroll' },
  { id: 'social-charges', label: 'Social Charges', icon: Wallet, value: 'social-charges' },
  { id: 'reports', label: 'Reports', icon: BarChart3, value: 'reports' },
]

export default function DashboardLayout() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState({
    employees: 0,
    projects: 0,
    attendance: 0,
    payroll: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [employeesRes, projectsRes, attendanceRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/projects'),
        fetch(`/api/attendance?date=${new Date().toISOString().split('T')[0]}`)
      ])

      const employeesData = employeesRes.ok ? await employeesRes.json() : []
      const projectsData = projectsRes.ok ? await projectsRes.json() : []
      const attendanceData = attendanceRes.ok ? await attendanceRes.json() : []

      setStats({
        employees: employeesData.length,
        projects: projectsData.length,
        attendance: attendanceData.filter((a: any) => a.status === 'P').length,
        payroll: 0 // Would need to check for pending payroll
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Employees" value={stats.employees.toString()} icon={Users} color="blue" />
              <StatCard title="Active Projects" value={stats.projects.toString()} icon={FolderKanban} color="green" />
              <StatCard title="Today's Attendance" value={stats.attendance.toString()} icon={Calendar} color="purple" />
              <StatCard title="System Status" value="Active" icon={Wallet} color="orange" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <QuickAction label="Record Attendance" section="attendance" onClick={() => setActiveSection('attendance')} />
                  <QuickAction label="Generate Payroll" section="payroll" onClick={() => setActiveSection('payroll')} />
                  <QuickAction label="Add Employee" section="employees" onClick={() => setActiveSection('employees')} />
                  <QuickAction label="Add Project" section="projects" onClick={() => setActiveSection('projects')} />
                </div>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">System Status</h2>
                <div className="space-y-3">
                  <StatusItem label="Database" status="Connected" />
                  <StatusItem label="Payroll Engine" status="Ready" />
                  <StatusItem label="Social Charges Calculation" status="Active" />
                  <StatusItem label="Reports Module" status="Available" />
                </div>
              </div>
            </div>
          </div>
        )
      case 'employees':
        return <EmployeesManagement />
      case 'projects':
        return <ProjectsManagement />
      case 'assignments':
        return <AssignmentsManagement />
      case 'attendance':
        return <AttendanceManagement />
      case 'payroll':
        return <PayrollManagement />
      case 'social-charges':
        return <SocialChargesManagement />
      case 'reports':
        return <Reports />
      default:
        return <div>Select a section</div>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <NavSidebar activeSection={activeSection} onSectionChange={(section) => {
                setActiveSection(section)
                setMobileMenuOpen(false)
              }} />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">Payroll System</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-card min-h-[calc(100vh-65px)]">
          <NavSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 pb-20 lg:pb-8">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  activeSection === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function NavSidebar({ activeSection, onSectionChange }: { activeSection: string, onSectionChange: (section: string) => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">Payroll System</h2>
        <p className="text-sm text-muted-foreground mt-1">Admin Dashboard</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-100px)]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.value
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ label, section, onClick }: { label: string, section: string, onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start h-auto py-4"
      onClick={onClick}
    >
      <div className="text-left">
        <p className="font-medium">{label}</p>
      </div>
    </Button>
  )
}

function StatusItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-green-500">{status}</span>
    </div>
  )
}
