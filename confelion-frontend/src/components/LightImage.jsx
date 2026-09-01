import {useState, useEffect} from "react"

const DEFAULT_SVG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f4f4f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' font-size='18' font-weight='700' fill='%23a1a1aa'%3ECONFELION%3C/text%3E%3C/svg%3E"

export default function LightImage({src, alt, handle, title, tags, w = 400, h = 500, className = "", priority = false, style}) {
  const [imgSrc, setImgSrc] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const ai = handle
    ? `https://image.pollinations.ai/p/${encodeURIComponent(`minimalist studio fashion ${title || handle} ${tags || ""} white background lightweight`.slice(0, 90))}?width=${w}&height=${h}&nologo=true&model=turbo`
    : null

  let light = null
  if (src) {
    if (src.includes("cdn.shopify.com")) {
      light = src + (src.includes("?") ? "&" : "?") + `width=${w}&height=${h}&crop=center&format=webp`
    } else {
      light = src
    }
  } else {
    light = ai || DEFAULT_SVG_PLACEHOLDER
  }

  useEffect(() => {
    setImgSrc(null)
    setError(false)
    setLoading(true)
  }, [src, handle, title])

  const handleLoad = () => {
    setLoading(false)
    setError(false)
  }

  const handleError = () => {
    if (!error) {
      setError(true)
      setImgSrc(DEFAULT_SVG_PLACEHOLDER)
    }
    setLoading(false)
  }

  const srcToUse = imgSrc || light

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {loading && (
        <div className="absolute inset-0 skeleton animate-shimmer" aria-hidden="true" />
      )}
      <img
        src={srcToUse}
        alt={alt || title || "product"}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        width={w}
        height={h}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}
