import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useDocumentTitle } from './useDocumentTitle'

describe('useDocumentTitle', () => {
  let original: string
  beforeEach(() => {
    original = document.title
    document.title = 'Review agent runs | By Berit Alasmäki'
  })
  afterEach(() => {
    document.title = original
  })

  it('sets the tab title while given one, and restores it after', () => {
    const { rerender, unmount } = renderHook(
      ({ title }: { title: string | undefined }) => useDocumentTitle(title),
      { initialProps: { title: 'Fix the checkout bug | Berit Alasmäki' } },
    )
    expect(document.title).toBe('Fix the checkout bug | Berit Alasmäki')
    rerender({ title: undefined })
    expect(document.title).toBe('Review agent runs | By Berit Alasmäki')
    rerender({ title: 'Fix the checkout bug | Berit Alasmäki' })
    unmount()
    expect(document.title).toBe('Review agent runs | By Berit Alasmäki')
  })

  it('leaves the title alone when not given one', () => {
    renderHook(() => useDocumentTitle(undefined))
    expect(document.title).toBe('Review agent runs | By Berit Alasmäki')
  })
})
