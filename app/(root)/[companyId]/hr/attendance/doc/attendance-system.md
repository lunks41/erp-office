# Attendance System Documentation

## Overview

The Attendance System is a comprehensive solution for managing employee attendance records with support for both biometric and physical attendance tracking. The system provides a visual calendar view, detailed reporting, and flexible filtering options.

## Features

### 1. Multi-Tab Interface

- **All**: Shows all attendance records regardless of type
- **Biometric**: Filters to show only biometric attendance records
- **Physical**: Filters to show only physical attendance records

### 2. Visual Calendar Grid

- Monthly view showing attendance status for each employee
- Color-coded status indicators
- Interactive tooltips with detailed information
- Employee avatars and department information

### 3. Attendance Statuses

- **P (Present)**: Employee is present and working
- **A (Absent)**: Employee is absent
- **L (Leave)**: Employee is on leave
- **HL (Half Leave)**: Employee is on half-day leave
- **CL (Casual Leave)**: Employee is on casual leave
- **PL (Paid Leave)**: Employee is on paid leave
- **WK (Weekend)**: Weekend or holiday
- **REJECTED**: Attendance record is rejected/unapproved

### 4. Advanced Filtering

- Department filter
- Location filter
- Employee filter
- Date range filter
- Status filter
- Attendance type filter (All/Biometric/Physical)

### 5. Summary Dashboard

- Total employee count
- Attendance rate percentage
- Biometric usage rate
- Total working hours
- Status breakdown
- Top performers list

## File Structure

```
app/(root)/[companyId]/hr/attendance/
├── components/
│   ├── attendance-dashboard.tsx      # Main dashboard component
│   ├── attendance-grid.tsx           # Calendar grid view
│   ├── attendance-summary.tsx        # Summary statistics
│   ├── attendance-filters.tsx        # Advanced filtering
│   └── attendance-form.tsx           # Add/edit attendance form
├── doc/
│   └── attendance-system.md          # This documentation
└── page.tsx                          # Main page component
```

## Interfaces

### Attendance Interface

```typescript
interface Attendance {
  id: string
  employeeId: string
  employeeName: string
  employeePhoto?: string
  date: string
  status: AttendanceStatus
  clockIn?: string
  clockOut?: string
  totalWorkingHours?: string
  earlyOutHours?: string
  lateInHours?: string
  leaveType?: LeaveType
  department?: string
  location?: string
  isBiometric: boolean
  isPhysical: boolean
  notes?: string
  createdDate: string
  editDate: string
}
```

### Attendance Status Types

```typescript
type AttendanceStatus =
  | "P" // Present
  | "A" // Absent
  | "L" // Leave
  | "HL" // Half Leave
  | "CL" // Casual Leave
  | "PL" // Paid Leave
  | "WK" // Weekend
  | "REJECTED" // Rejected/Unapproved
```

## Usage

### Basic Usage

```tsx
import { AttendanceDashboard } from "./components/attendance-dashboard"

export default function AttendancePage({
  params,
}: {
  params: { companyId: string }
}) {
  return (
    <div className="@container mx-auto space-y-6 py-6">
      <AttendanceDashboard companyId={params.companyId} />
    </div>
  )
}
```

### Using the Hook

```tsx
import { useAttendance } from "@/hooks/use-attendance"

function MyComponent({ companyId }: { companyId: string }) {
  const {
    attendance,
    loading,
    error,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    applyFilters,
  } = useAttendance(companyId)

  // Use the hook methods
}
```

## API Endpoints

The system expects the following API endpoints:

- `GET /companies/{companyId}/attendance` - Fetch attendance records
- `POST /companies/{companyId}/attendance` - Create attendance record
- `PUT /companies/{companyId}/attendance/{id}` - Update attendance record
- `DELETE /companies/{companyId}/attendance/{id}` - Delete attendance record
- `POST /companies/{companyId}/attendance/bulk-update` - Bulk update attendance
- `GET /companies/{companyId}/attendance/summary` - Get attendance summary
- `GET /companies/{companyId}/attendance/export` - Export attendance data

## Styling

The system uses Tailwind CSS classes and follows the design system established in the project. Key styling features:

- Responsive grid layout
- Color-coded status indicators
- Hover effects and tooltips
- Consistent spacing and typography
- Mobile-friendly design

## Customization

### Adding New Status Types

1. Update the `AttendanceStatus` type in `interfaces/attendance.ts`
2. Add the new status to the schema in `schemas/attendance.ts`
3. Update the status color mapping in `attendance-grid.tsx`
4. Add the status to form options in `attendance-form.tsx`

### Adding New Filters

1. Update the `AttendanceFilter` interface
2. Add filter UI components to `attendance-filters.tsx`
3. Update the filtering logic in `attendance-dashboard.tsx`
4. Update the API hook to handle the new filter

### Customizing the Grid

The calendar grid can be customized by modifying the `AttendanceGrid` component:

- Change the number of days displayed
- Modify the status color scheme
- Adjust the tooltip content
- Change the employee information display

## Dependencies

- React Hook Form for form management
- Zod for schema validation
- Lucide React for icons
- Tailwind CSS for styling
- Custom UI components from the project's component library

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live attendance updates
2. **Mobile App**: Native mobile app for attendance tracking
3. **Geolocation**: Location-based attendance verification
4. **Facial Recognition**: AI-powered attendance verification
5. **Integration**: Integration with payroll and HR systems
6. **Analytics**: Advanced analytics and reporting features
7. **Notifications**: Automated attendance notifications
8. **Approval Workflow**: Multi-level approval system for attendance records
