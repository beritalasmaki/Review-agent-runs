import * as React from 'react'
import { cn } from '@/lib/utils'

/*
 * shadcn/ui's Table, restyled onto this project's tokens (docs/DECISIONS.md, 0070): a real
 * <table> in a container that scrolls sideways when the table is wider than the page. One
 * addition to shadcn's API: `containerClassName`, for that container — a card's border, or
 * `scrollbar-none` where the user asked for no visible scrollbar (0061).
 */
function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<'table'> & { containerClassName?: string }) {
  return (
    <div
      data-slot="table-container"
      className={cn('relative w-full overflow-x-auto', containerClassName)}
    >
      <table
        data-slot="table"
        className={cn('w-full border-collapse text-left', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('border-b border-border-subtle bg-text-primary/6', className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={className} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('border-t border-border-subtle bg-surface-raised font-semibold', className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn('border-b border-border-subtle', className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-left align-middle font-heading text-caption font-semibold tracking-[0.1em] text-text-secondary uppercase',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td data-slot="table-cell" className={cn('align-middle', className)} {...props} />
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-meta text-text-secondary', className)}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
