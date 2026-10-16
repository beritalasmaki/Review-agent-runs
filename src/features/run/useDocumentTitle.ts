import { useEffect } from 'react'

/**
 * While `title` is given, the browser tab's title is replaced with it. The title from
 * index.html comes back when `title` turns undefined or the page unmounts — the same
 * restore-on-unmount shape as `useAttentionFavicon`.
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title == null) return
    const original = document.title
    document.title = title
    return () => {
      document.title = original
    }
  }, [title])
}
