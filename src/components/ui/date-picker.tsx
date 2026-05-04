'use client'

import { useState, useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parseIso(iso: string): Date | null {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function toIso(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDisplay(iso: string): string {
  const d = parseIso(iso)
  if (!d) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstWeekdayOfMonth(year: number, month: number): number {
  // 0=Sun..6=Sat → convert to Mon-first (0=Mon..6=Sun)
  const raw = new Date(year, month, 1).getDay()
  return (raw + 6) % 7
}

interface DatePickerProps {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  className?: string
  minDate?: string
  maxDate?: string
}

export function DatePicker({ value, onChange, placeholder = 'DD.MM.YYYY', className, minDate, maxDate }: DatePickerProps) {
  const today = new Date()
  const selected = parseIso(value)

  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())
  const [open, setOpen] = useState(false)
  const [committedValue, setCommittedValue] = useState(value)
  const [inputValue, setInputValue] = useState(formatDisplay(value))
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync display when value changes externally (e.g. clear button, minDate/maxDate reset)
  if (value !== committedValue) {
    setCommittedValue(value)
    setInputValue(formatDisplay(value))
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const minParsed = parseIso(minDate ?? '')
  const maxParsed = parseIso(maxDate ?? '')

  function isDisabled(d: Date): boolean {
    if (minParsed && d < minParsed) return true
    if (maxParsed && d > maxParsed) return true
    return false
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    if (isDisabled(d)) return
    onChange(toIso(d))
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setInputValue(raw)
    // Accept DD.MM.YYYY
    const match = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
    if (match) {
      const [, dd, mm, yyyy] = match
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
      if (!isNaN(d.getTime()) && d.getDate() === Number(dd)) {
        onChange(toIso(d))
        setViewYear(Number(yyyy))
        setViewMonth(Number(mm) - 1)
      }
    } else if (raw === '') {
      onChange('')
    }
  }

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startOffset = firstWeekdayOfMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('relative flex items-center', className)}>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-8 w-44 min-w-0 rounded-lg border border-input bg-transparent pl-2.5 pr-8 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {value ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onChange('')}
            className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear date"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : (
          <PopoverTrigger
            tabIndex={-1}
            className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open calendar"
          >
            <CalendarIcon className="size-3.5" />
          </PopoverTrigger>
        )}
      </div>

      <PopoverContent align="start" className="w-auto p-3">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="icon-sm" onClick={prevMonth} type="button">
            <ChevronLeftIcon />
          </Button>
          <span className="text-sm font-medium">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={nextMonth} type="button">
            <ChevronRightIcon />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7 gap-px">
          {DAYS.map(d => (
            <div key={d} className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="h-8 w-8" />
            const thisDate = new Date(viewYear, viewMonth, day)
            const isSelected = selected ? isSameDay(thisDate, selected) : false
            const isToday = isSameDay(thisDate, today)
            const disabled = isDisabled(thisDate)
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(day)}
                disabled={disabled}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
                  disabled
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : isSelected
                    ? 'bg-primary text-primary-foreground font-medium'
                    : isToday
                    ? 'border border-border text-foreground hover:bg-muted'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
