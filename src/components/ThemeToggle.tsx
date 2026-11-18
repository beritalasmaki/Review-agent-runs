import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'
import { Switch } from './ui/switch'
import { currentTheme, setTheme, systemTheme } from './theme'
import type { Theme } from './theme'

/**
 * Light or dark, chosen by the viewer (docs/DECISIONS.md, 0063). Until they choose, the page
 * follows the system setting; the choice then sets `data-theme` on <html>, which the tokens
 * already honour, and is remembered in this browser. index.html applies a remembered choice
 * before the first paint, so the page never flashes the other theme.
 *
 * A switch, announced as "Dark theme, on/off". Knows nothing about the product.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>(currentTheme)

  // No choice made yet: follow the system if it changes while the page is open.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const follow = () => {
      if (!document.documentElement.dataset.theme) setThemeState(systemTheme())
    }
    query.addEventListener('change', follow)
    return () => query.removeEventListener('change', follow)
  }, [])

  const dark = theme === 'dark'
  return (
    <Switch
      checked={dark}
      onCheckedChange={(checked) => {
        const next: Theme = checked ? 'dark' : 'light'
        setTheme(next)
        setThemeState(next)
      }}
      aria-label="Dark theme"
      title={dark ? 'Switch to the light theme' : 'Switch to the dark theme'}
      // The track stays neutral in both states: the sun or the moon, in the brand colour, says
      // which theme is on.
      className={cn(
        'icon-motion h-8 w-16 justify-between px-[var(--space-2)] data-[state=checked]:bg-surface-raised',
        className,
      )}
      thumbClassName="absolute top-1/2 left-1 h-6 w-6 -translate-y-1/2 data-[state=checked]:translate-x-8"
    >
      <Sun
        aria-hidden
        className={cn('relative z-10 h-4 w-4', dark ? 'text-text-secondary' : 'text-primary')}
      />
      <Moon
        aria-hidden
        className={cn('relative z-10 h-4 w-4', dark ? 'text-primary' : 'text-text-secondary')}
      />
    </Switch>
  )
}
