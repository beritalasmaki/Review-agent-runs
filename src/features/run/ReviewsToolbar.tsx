import { Button } from '../../components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible'
import { Input } from '../../components/ui/input'
import { NativeSelect, NativeSelectOption } from '../../components/ui/native-select'
import { Badge } from '../../components/ui/badge'
import { MorphIcon } from '../../components/MorphIcon'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { ChevronDown, ChevronUp } from 'lucide'
import type { TimeRange } from '../../lib/reviews'
import { cn } from '../../lib/utils'

/**
 * Search, the Filters button and panel, and the "Showing N of M" line above a My reviews
 * table (docs/DECISIONS.md, 0060). The main list and the archive use it with their own
 * time options and run-type choices.
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
  'flex items-center gap-[var(--space-2)] text-meta font-medium font-body whitespace-nowrap text-text-secondary'

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
    // `contents`: the collapsible adds no box of its own, so the layout is unchanged.
    <Collapsible open={open} onOpenChange={onToggleOpen} className="contents">
      <div className="flex flex-wrap items-center gap-[var(--space-3)] border-b border-border-subtle p-[var(--space-5)]">
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
        <CollapsibleTrigger asChild>
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
        </CollapsibleTrigger>
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

      <CollapsibleContent className="flex flex-wrap items-center gap-[var(--space-5)] border-b border-border-subtle bg-bg px-[var(--space-5)] py-[var(--space-4)]">
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
      </CollapsibleContent>
    </Collapsible>
  )
}
