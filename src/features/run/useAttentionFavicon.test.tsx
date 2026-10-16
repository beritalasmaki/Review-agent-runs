import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ATTENTION_FAVICON, useAttentionFavicon } from './useAttentionFavicon'

describe('useAttentionFavicon', () => {
  let link: HTMLLinkElement
  beforeEach(() => {
    link = document.createElement('link')
    link.rel = 'icon'
    link.setAttribute('href', '/favicon.png')
    document.head.append(link)
  })
  afterEach(() => link.remove())

  it('shows the amber-dot icon while active, and puts the original back after', () => {
    const { rerender, unmount } = renderHook(({ active }) => useAttentionFavicon(active), {
      initialProps: { active: true },
    })
    expect(link.getAttribute('href')).toBe(ATTENTION_FAVICON)
    rerender({ active: false })
    expect(link.getAttribute('href')).toBe('/favicon.png')
    rerender({ active: true })
    unmount()
    expect(link.getAttribute('href')).toBe('/favicon.png')
  })

  it('leaves the icon alone when not active', () => {
    renderHook(() => useAttentionFavicon(false))
    expect(link.getAttribute('href')).toBe('/favicon.png')
  })
})
