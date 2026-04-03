'use client'

import * as React from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DayPickerProps {
  value?: number
  onChange?: (day: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDay?: number
  maxDay?: number
}

export function DayPicker({
  value,
  onChange,
  placeholder = 'Select day',
  disabled = false,
  className,
  minDay = 1,
  maxDay = 31,
}: DayPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [page, setPage] = React.useState(0)

  const DAYS_PER_PAGE = 16
  const TOTAL_DAYS = 31
  const TOTAL_PAGES = Math.ceil(TOTAL_DAYS / DAYS_PER_PAGE)

  const getDaysForPage = (pageIndex: number) => {
    const start = pageIndex * DAYS_PER_PAGE + 1
    const end = Math.min(start + DAYS_PER_PAGE - 1, TOTAL_DAYS)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const handleDaySelect = (day: number) => {
    onChange?.(day)
    setOpen(false)
  }

  const isDayDisabled = (day: number) => {
    if (day < minDay || day > maxDay) return true
    return false
  }

  const isDaySelected = (day: number) => {
    return value === day
  }

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }

  const formatDay = (day: number) => {
    return `${day}${getOrdinalSuffix(day)}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-[180px] justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {value ? formatDay(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {page === 0 ? 'Days 1-16' : 'Days 17-31'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.min(TOTAL_PAGES - 1, p + 1))}
              disabled={page === TOTAL_PAGES - 1}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {getDaysForPage(page).map((day) => (
              <Button
                key={day}
                variant={isDaySelected(day) ? 'default' : 'ghost'}
                size="sm"
                className={cn('h-9 w-full')}
                disabled={isDayDisabled(day)}
                onClick={() => handleDaySelect(day)}
              >
                {day}
              </Button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                const today = new Date().getDate()
                if (today >= minDay && today <= maxDay) {
                  setPage(today <= 16 ? 0 : 1)
                  handleDaySelect(today)
                }
              }}
              disabled={(() => {
                const today = new Date().getDate()
                return today < minDay || today > maxDay
              })()}
            >
              Today&apos;s Day
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
