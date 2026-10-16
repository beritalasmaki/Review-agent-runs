import { useEffect } from 'react'

/** The favicon with an amber dot in its corner — public/favicon-attention.png. */
export const ATTENTION_FAVICON = '/favicon-attention.png'

/**
 * While `active`, the browser tab's icon carries an amber dot, so a reviewer sees from the tab
 * alone that a run has things to solve (docs/DECISIONS.md, 0054). The icon from index.html
 * comes back when `active` turns false or the page unmounts. Does nothing when the document
 * has no icon link.
 */
export function useAttentionFavicon(active: boolean) {
  useEffect(() => {
    if (!active) return
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return
    const original = link.getAttribute('href')
    link.setAttribute('href', ATTENTION_FAVICON)
    return () => {
      if (original != null) link.setAttribute('href', original)
    }
  }, [active])
}
