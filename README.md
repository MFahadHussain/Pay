

## ✨ Technology Stack

This scaffold provides a robust foundation built with:

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode in 2 lines of code

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Fetch** - Promise-based HTTP request

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development

## 🎯 Why This Scaffold?

- **🏎️ Fast Development** - Pre-configured tooling and best practices
- **🎨 Beautiful UI** - Complete shadcn/ui component library with advanced interactions
- **🔒 Type Safety** - Full TypeScript configuration with Zod validation
- **📱 Responsive** - Mobile-first design principles with smooth animations
- **🗄️ Database Ready** - Prisma ORM configured for rapid backend development
- **🔐 Auth Included** - NextAuth.js for secure authentication flows
- **📊 Data Visualization** - Charts, tables, and drag-and-drop functionality
- **🌍 i18n Ready** - Multi-language support with Next Intl
- **🚀 Production Ready** - Optimized build and deployment settings
- **🤖 AI-Friendly** - Structured codebase perfect for AI assistance

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.



- **💻 Code Generation** - Generate components, pages, and features instantly
- **🎨 UI Development** - Create beautiful interfaces with AI assistance  
- **🔧 Bug Fixing** - Identify and resolve issues with intelligent suggestions
- **📝 Documentation** - Auto-generate comprehensive documentation
- **🚀 Optimization** - Performance improvements and best practices



## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## 🎨 Available Features & Components

This scaffold includes a comprehensive set of modern web development tools:

### 🧩 UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Overlay**: Dialog, Sheet, Popover, Tooltip, Hover Card
- **Data Display**: Badge, Avatar, Calendar

### 📊 Advanced Data Features
- **Tables**: Powerful data tables with sorting, filtering, pagination (TanStack Table)
- **Charts**: Beautiful visualizations with Recharts
- **Forms**: Type-safe forms with React Hook Form + Zod validation

### 🎨 Interactive Features
- **Animations**: Smooth micro-interactions with Framer Motion
- **Drag & Drop**: Modern drag-and-drop functionality with DND Kit
- **Theme Switching**: Built-in dark/light mode support

### 🔐 Backend Integration
- **Authentication**: Ready-to-use auth flows with NextAuth.js
- **Database**: Type-safe database operations with Prisma
- **API Client**: HTTP requests with Fetch + TanStack Query
- **State Management**: Simple and scalable with Zustand

### 🌍 Production Features
- **Internationalization**: Multi-language support with Next Intl
- **Image Optimization**: Automatic image processing with Sharp
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Essential Hooks**: 100+ useful React hooks with ReactUse for common patterns

# Payroll & Social Charges Management System

A modern payroll application designed to handle **employee salaries, social charges, leave deductions, and negative balance handling** with clear financial transparency.

This system treats **Social Charges (SC)** as a running wallet that can be earned, consumed, paid by admin, and even go negative—while ensuring salaries remain correctly marked as **Paid**.

---

## 🚀 Features

* Employee payroll processing
* Social Charges (SC) earning & tracking
* Leave-based salary withholding
* Negative SC balance support
* Admin-controlled SC payments
* Project-wise payroll tracking
* Clean dashboard summaries
* Fully rounded values (no decimals)

---

## 🧠 Core Concept: Social Charges Wallet

Social Charges act as a **running balance wallet** for each employee/project.

* SC can be **earned monthly**
* SC can be **consumed** when salary is deducted due to leave
* SC can be **paid by admin** at any time
* SC balance **can go negative**, representing an advance or liability

Even when SC is insufficient, **salary remains Paid**.

---

## 📊 Key Definitions

| Term          | Description                                            |
| ------------- | ------------------------------------------------------ |
| Salary        | Final salary paid to employee (after leave adjustment) |
| SC Earned     | Social charges generated for the period                |
| SC Paid       | SC consumed to cover leave deductions                  |
| Admin Paid SC | SC manually settled by admin                           |
| SC Balance    | Remaining SC (can be negative)                         |

---

## 🧮 Calculation Rules

### Employee Payroll (Period-Level)

```
SC Balance = ROUND(SC Earned − SC Paid, 0)
```

* SC Paid may exceed SC Earned
* SC Balance may be negative
* No carry-forward at this level

---

### Social Charges Management (Running Balance)

```
SC Balance = ROUND(
  Previous Balance
  + SC Earned
  + Admin Paid SC
  − SC Paid,
0)
```

* Negative balance allowed
* Future earnings/payments offset negatives first

---

## 🏖 Leave & Salary Handling

* Employee marks leave
* Salary is reduced
* Reduced amount recorded as **SC Paid**
* SC Balance is reduced (may go negative)
* Salary status remains **Paid**

---

## 📋 Dashboard Metrics

* **SC Earned** → Total SC generated
* **SC Paid** → Total SC consumed via leave
* **SC Balance** → Current running balance

> ⚠️ Labels must not be confused: *SC Paid means consumed, not admin payment.*

---

## 🔢 Rounding Policy

* All monetary values are **whole numbers only**
* Standard rounding applied (≥ .5 rounds up)
* No decimals in UI, reports, or exports

---

## 🎨 UI / UX Guidelines

* Negative SC Balance shown in **red**
* Tooltip for negative balance:

> "Negative balance indicates social charges advance adjusted against salary."

---

## ✅ Validation Rules

* Do not block leave due to insufficient SC
* Do not mark salary as unpaid due to SC shortage
* Do not clamp SC Balance to zero

---

## 🧩 Example Output

```
Employee        Project   Salary   SC Earned   SC Paid   SC Balance
Assad Ali Khan  BTHPP     44032    5871        14677     -8806
Assad Ali Khan  AGES HO   9677     1935        0         1935
```

---

## 📌 One-Line System Rule

> Social charges act as a running wallet that may go negative while salaries remain fully paid.

---

## 🛠 Future Enhancements

* Multi-currency support
* Export to accounting systems
* Audit logs for SC adjustments
* Role-based access control
* Analytics & forecasting

---

## 📄 License

This project is proprietary and intended for internal or licensed use only.

---

## 🤝 Contribution

Please follow internal development standards and ensure all calculations comply with the rounding and balance rules defined above.

---

**Built for accuracy, clarity, and real-world payroll complexity.**



