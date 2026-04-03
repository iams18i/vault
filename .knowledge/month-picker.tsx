'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

interface MonthPickerProps {
  value?: Date
  onChange?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  placeholder?: string
  className?: string
  disabled?: boolean
}

function MonthPicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Pick a month',
  className,
  disabled = false,
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewYear, setViewYear] = React.useState(
    value?.getFullYear() ?? new Date().getFullYear(),
  )

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewYear, monthIndex, 1)
    onChange?.(newDate)
    setOpen(false)
  }

  const handlePrevYear = () => {
    setViewYear((prev) => prev - 1)
  }

  const handleNextYear = () => {
    setViewYear((prev) => prev + 1)
  }

  const isMonthDisabled = (monthIndex: number) => {
    const date = new Date(viewYear, monthIndex, 1)
    if (
      minDate &&
      date < new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    ) {
      return true
    }
    if (
      maxDate &&
      date > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
    ) {
      return true
    }
    return false
  }

  const isMonthSelected = (monthIndex: number) => {
    if (!value) return false
    return value.getMonth() === monthIndex && value.getFullYear() === viewYear
  }

  const isCurrentMonth = (monthIndex: number) => {
    const now = new Date()
    return now.getMonth() === monthIndex && now.getFullYear() === viewYear
  }

  React.useEffect(() => {
    if (value) {
      setViewYear(value.getFullYear())
    }
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[240px] justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value ? (
            `${FULL_MONTHS[value.getMonth()]} ${value.getFullYear()}`
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handlePrevYear}
              disabled={minDate && viewYear <= minDate.getFullYear()}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Previous year</span>
            </Button>
            <div className="font-semibold text-sm">{viewYear}</div>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleNextYear}
              disabled={maxDate && viewYear >= maxDate.getFullYear()}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Next year</span>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, index) => (
              <Button
                key={month}
                variant={isMonthSelected(index) ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-9',
                  isCurrentMonth(index) &&
                    !isMonthSelected(index) &&
                    'border border-primary text-primary',
                )}
                disabled={isMonthDisabled(index)}
                onClick={() => handleMonthSelect(index)}
              >
                {month}
              </Button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                const now = new Date()
                setViewYear(now.getFullYear())
                handleMonthSelect(now.getMonth())
              }}
              disabled={(() => {
                const now = new Date()
                const currentMonthDate = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  1,
                )
                if (
                  minDate &&
                  currentMonthDate <
                    new Date(minDate.getFullYear(), minDate.getMonth(), 1)
                ) {
                  return true
                }
                if (
                  maxDate &&
                  currentMonthDate >
                    new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
                ) {
                  return true
                }
                return false
              })()}
            >
              Current Month
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { MonthPicker, MONTHS, FULL_MONTHS }
export type { MonthPickerProps }
