import { useEffect, useState } from 'react'

export function useImage(src: string | undefined): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined)

  useEffect(() => {
    if (!src) {
      setImage(undefined)
      return
    }
    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (!cancelled) setImage(img)
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  return image
}
