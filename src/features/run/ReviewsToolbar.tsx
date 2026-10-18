import { Button } from '../../components/ui/button'
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { Input } from '../../components/ui/input'
import { NativeSelect, NativeSelectOption } from '../../components/ui/native-select'
import { Badge } from '../../components/ui/badge'
import { MorphIcon } from '../../components/MorphIcon'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { ChevronDown, ChevronUp } from 'lucide'
import type { TimeRange } from '../../lib/reviews'
import { cn } from '../../lib/utils'

/**
 * Search, the Filters button and its popover, and the "Showing N of M" line above a My
 * reviews table (docs/DECISIONS.md, 0060). The main list and the archive use it with their
 * own time options and run-type choices.
 *
 * The filter fields live in a `Popover` (docs/DECISIONS.md, 0099), not an inline expanding
 * panel: anchored to the Filters button itself, with a notch (`PopoverArrow`) pointing back
 * at it, like a speech bubble — one of the stacked-bands layout's bands is now genuinely
 * floating above the others instead of pushing them down.
 */

export interface FilterState {
  query: string
  time: TimeRange
  from: string
  to: string
  requester: string
}

export interface ReviewsToolbarProps {
  searchLabel: string
  searchPlaceholder: string
  filters: FilterState
  onFilters: (next: Partial<FilterState>) => void
  open: boolean
  onToggleOpen: () => void
  timeLabel: string
  timeOptions: { value: TimeRange; label: string }[]
  type: {
    value: string
    options: { value: string; label: string }[]
    onChange: (v: string) => void
    counts: boolean
  }
  people: string[]
  resultLabel: string
  onClear?: () => void
}

const FIELD_LABEL =
  'flex flex-col gap-[var(--space-1)] text-meta font-medium font-body text-text-secondary'

export function ReviewsToolbar({
  searchLabel,
  searchPlaceholder,
  filters,
  onFilters,
  open,
  onToggleOpen,
  timeLabel,
  timeOptions,
  type,
  people,
  resultLabel,
  onClear,
}: ReviewsToolbarProps) {
  const filterCount =
    (filters.time !== 'all' ? 1 : 0) +
    (filters.requester !== 'all' ? 1 : 0) +
    (type.counts && type.value !== 'all' ? 1 : 0)

  return (
    <div className="flex flex-wrap items-center gap-[var(--space-3)] p-[var(--space-5)]">
      <label className="relative flex w-full items-center sm:w-[21.25rem]">
        <span className="sr-only">{searchLabel}</span>
        <Search
          aria-hidden
          className="absolute left-[var(--space-3)] h-4 w-4 text-text-secondary"
        />
        <Input
          type="search"
          value={filters.query}
          onChange={(event) => onFilters({ query: event.target.value })}
          placeholder={searchPlaceholder}
          className="py-[var(--space-3)] pl-[calc(var(--space-6)+var(--space-1))]"
        />
      </label>
      <Popover open={open} onOpenChange={(next) => next !== open && onToggleOpen()}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'btn-glass glass-sheen gap-[var(--space-2)]',
              open &&
                'border-primary bg-primary-tint text-primary hover:border-primary hover:bg-primary-tint',
            )}
          >
            <SlidersHorizontal aria-hidden className="h-4 w-4" />
            Filters
            {filterCount > 0 && (
              <Badge variant="primary" size="sm" className="gap-0">
                {filterCount}
                <span className="sr-only"> on</span>
              </Badge>
            )}
            <MorphIcon icon={open ? ChevronUp : ChevronDown} className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex w-72 flex-col gap-[var(--space-4)] border-glass-border bg-glass shadow-glass backdrop-blur-[var(--blur-glass)]"
        >
          <PopoverArrow className="fill-glass-chip" />
          <label className={FIELD_LABEL}>
            {timeLabel}
            <NativeSelect
              value={filters.time}
              onChange={(event) => onFilters({ time: event.target.value as TimeRange })}
              className="font-medium"
            >
              {timeOptions.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          {filters.time === 'custom' && (
            <div className="flex items-center gap-[var(--space-2)] text-meta text-text-secondary">
              <Input
                type="date"
                aria-label="From"
                value={filters.from}
                onChange={(event) => onFilters({ from: event.target.value })}
                className="w-auto text-meta font-medium"
              />
              <span>to</span>
              <Input
                type="date"
                aria-label="To"
                value={filters.to}
                onChange={(event) => onFilters({ to: event.target.value })}
                className="w-auto text-meta font-medium"
              />
            </div>
          )}
          <label className={FIELD_LABEL}>
            Run type
            <NativeSelect
              value={type.value}
              onChange={(event) => type.onChange(event.target.value)}
              className="font-medium"
            >
              {type.options.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className={FIELD_LABEL}>
            Requester
            <NativeSelect
              value={filters.requester}
              onChange={(event) => onFilters({ requester: event.target.value })}
              className="font-medium"
            >
              <NativeSelectOption value="all">Everyone</NativeSelectOption>
              {people.map((person) => (
                <NativeSelectOption key={person} value={person}>
                  {person}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </PopoverContent>
      </Popover>
      <div className="ml-auto flex items-center gap-[var(--space-4)]">
        <span className="text-meta whitespace-nowrap text-text-secondary">{resultLabel}</span>
        {onClear && (
          <Button variant="link" size="inline" onClick={onClear}>
            <X aria-hidden className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
