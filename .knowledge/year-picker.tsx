'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface YearPickerProps {
  value?: number
  onChange?: (year: number) => void
  minYear?: number
  maxYear?: number
  placeholder?: string
  disabled?: boolean
  className?: string
}

const YEARS_PER_PAGE = 12

export function YearPicker({
  value,
  onChange,
  minYear = 1900,
  maxYear = 2100,
  placeholder = 'Pick a year',
  disabled = false,
  className,
}: YearPickerProps) {
  const [open, setOpen] = React.useState(false)
  const currentYear = new Date().getFullYear()

  // Calculate the starting decade page based on value or current year
  const getStartYear = (year: number) => {
    return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE
  }

  const [pageStartYear, setPageStartYear] = React.useState(() =>
    getStartYear(value ?? currentYear),
  )

  // Generate array of years for current page
  const years = React.useMemo(() => {
    return Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStartYear + i)
  }, [pageStartYear])

  const handleYearSelect = (year: number) => {
    onChange?.(year)
    setOpen(false)
  }

  const handlePreviousPage = () => {
    setPageStartYear((prev) => prev - YEARS_PER_PAGE)
  }

  const handleNextPage = () => {
    setPageStartYear((prev) => prev + YEARS_PER_PAGE)
  }

  const isYearDisabled = (year: number) => {
    return year < minYear || year > maxYear
  }

  const isYearSelected = (year: number) => {
    return value === year
  }

  const isCurrentYear = (year: number) => {
    return year === currentYear
  }

  const canGoPrevious = pageStartYear > minYear
  const canGoNext = pageStartYear + YEARS_PER_PAGE <= maxYear

  // Reset page when popover opens
  React.useEffect(() => {
    if (open) {
      setPageStartYear(getStartYear(value ?? currentYear))
    }
  }, [open, value, currentYear])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a year"
          disabled={disabled}
          className={cn(
            'w-[200px] justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {value ? value : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePreviousPage}
              disabled={!canGoPrevious}
              aria-label="Previous years"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {pageStartYear} - {pageStartYear + YEARS_PER_PAGE - 1}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextPage}
              disabled={!canGoNext}
              aria-label="Next years"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {years.map((year) => (
              <Button
                key={year}
                variant={isYearSelected(year) ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-9',
                  isCurrentYear(year) &&
                    !isYearSelected(year) &&
                    'border border-primary text-primary',
                )}
                disabled={isYearDisabled(year)}
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </Button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setPageStartYear(getStartYear(currentYear))
                handleYearSelect(currentYear)
              }}
              disabled={currentYear < minYear || currentYear > maxYear}
            >
              Current Year
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
