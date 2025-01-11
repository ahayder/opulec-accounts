import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  className?: string
  mode?: "single" | "range"
  selected?: Date | { from: Date; to: Date }
  onSelect?: ((date: Date) => void) | ((range: { from: Date; to: Date }) => void)
  defaultMonth?: Date
  numberOfMonths?: number
  fromDate?: Date
  toDate?: Date
}

function Calendar({
  className,
  mode = "single",
  selected,
  onSelect,
  defaultMonth = new Date(),
  numberOfMonths = 1,
  fromDate,
  toDate,
}: CalendarProps) {
  const maxDate = new Date() // Current date as maximum
  const [months, setMonths] = React.useState<Date[]>(() => {
    const initialMonths: Date[] = []
    for (let i = 0; i < numberOfMonths; i++) {
      const date = new Date(defaultMonth)
      date.setMonth(defaultMonth.getMonth() + i)
      initialMonths.push(date)
    }
    return initialMonths
  })

  const [selectedDates, setSelectedDates] = React.useState<{ from?: Date; to?: Date }>(
    selected && 'from' in selected ? selected : { from: selected as Date }
  )

  // Get month details
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  // Generate calendar data
  const generateCalendarDays = (monthDate: Date) => {
    const daysInMonth = getDaysInMonth(monthDate)
    const firstDay = getFirstDayOfMonth(monthDate)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), i))
    }

    return days
  }

  const handleDateClick = (date: Date) => {
    if (date > maxDate) return // Prevent selecting future dates
    
    if (mode === "single") {
      setSelectedDates({ from: date })
      ;(onSelect as ((date: Date) => void))?.(date)
    } else if (mode === "range") {
      if (!selectedDates.from || (selectedDates.from && selectedDates.to)) {
        setSelectedDates({ from: date })
      } else {
        const newDates = {
          from: selectedDates.from,
          to: date
        }
        if (newDates.from > date) {
          newDates.from = date
          newDates.to = selectedDates.from
        }
        setSelectedDates(newDates)
        ;(onSelect as ((range: { from: Date; to: Date }) => void))?.(newDates)
      }
    }
  }

  const isSelected = (date: Date) => {
    if (!date) return false
    if (mode === "single" && selectedDates.from) {
      return date.toDateString() === selectedDates.from.toDateString()
    }
    if (mode === "range" && selectedDates.from && selectedDates.to) {
      return (
        date >= selectedDates.from &&
        date <= selectedDates.to
      )
    }
    return false
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handleMonthChange = (monthIndex: number, increment: number) => {
    setMonths(prevMonths => {
      const newMonths = [...prevMonths]
      const newDate = new Date(newMonths[monthIndex])
      newDate.setMonth(newDate.getMonth() + increment)
      
      // Only update the specific month that was clicked
      newMonths[monthIndex] = newDate

      // If it's the first month, make sure second month is at least one month ahead
      if (monthIndex === 0 && newMonths.length > 1) {
        const secondMonth = new Date(newMonths[1])
        if (secondMonth <= newDate) {
          const nextMonth = new Date(newDate)
          nextMonth.setMonth(newDate.getMonth() + 1)
          newMonths[1] = nextMonth
        }
      }
      
      // If it's the second month, make sure first month is at least one month behind
      if (monthIndex === 1 && newMonths.length > 1) {
        const firstMonth = new Date(newMonths[0])
        if (firstMonth >= newDate) {
          const prevMonth = new Date(newDate)
          prevMonth.setMonth(newDate.getMonth() - 1)
          newMonths[0] = prevMonth
        }
      }

      return newMonths
    })
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex space-x-4">
        {months.map((monthDate, monthIndex) => {
          const days = generateCalendarDays(monthDate)

          return (
            <div key={monthIndex} className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMonthChange(monthIndex, -1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMonthChange(monthIndex, 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {mode === "range" && (
                  <div className="text-sm text-muted-foreground">
                    {monthIndex === 0 ? "Start date" : "End date"}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="h-9 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {days.map((date, index) => (
                  <div key={index} className="p-0">
                    {date ? (
                      <Button
                        variant={isSelected(date) ? "default" : "ghost"}
                        className={cn(
                          "h-9 w-9",
                          isSelected(date) && "bg-primary text-primary-foreground",
                          selectedDates.from && date.toDateString() === selectedDates.from.toDateString() && "rounded-l-md",
                          selectedDates.to && date.toDateString() === selectedDates.to.toDateString() && "rounded-r-md",
                          selectedDates.from && selectedDates.to && date > selectedDates.from && date < selectedDates.to && "bg-accent"
                        )}
                        onClick={() => handleDateClick(date)}
                        disabled={
                          (fromDate && date < fromDate) ||
                          (toDate && date > toDate) ||
                          date > maxDate // Disable future dates
                        }
                      >
                        {date.getDate()}
                      </Button>
                    ) : (
                      <div className="h-9 w-9" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar } 