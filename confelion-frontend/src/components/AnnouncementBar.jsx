import {useState, useEffect} from "react"
import {Icons} from "./Icons"
import {fetchAPI} from "../lib/api"

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const fetchSettings = async () => {
      try {
        const data = await fetchAPI('/api/settings', {signal: controller.signal})
        setSettings(data)
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error("Failed to fetch announcement settings", e)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!loading && !settings) {
      const stored = localStorage.getItem("announcementDismissed")
      if (stored) {
        const {timestamp} = JSON.parse(stored)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setDismissed(true)
        }
      }
    }
  }, [loading, settings])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("announcementDismissed", JSON.stringify({timestamp: Date.now()}))
  }

  if (dismissed || loading || !settings) return null

  const bgColor = settings.announcement_bg || "#18181b"
  const textColor = settings.announcement_text_color || "#ffffff"
  const accentColor = settings.announcement_accent_color || "#10b981"
  const text = settings.announcement_text || "Free shipping on orders over &#x20B9;999  &bull;  Easy 30-day returns  &bull;  COD available"
  const imageUrl = settings.announcement_image
  const linkUrl = settings.announcement_link

  const barContent = (
    <div
      className="announce-bar"
      role="region"
      aria-label="Announcement"
      style={{background: imageUrl ? "transparent" : bgColor, color: textColor}}
    >
      {imageUrl ? (
        <div className="w-full h-full relative overflow-hidden">
          <img
            src={imageUrl}
            alt="Announcement"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 flex items-center justify-center" style={{background: `${bgColor}cc`}}>
            <div className="announce-text" style={{color: textColor}}>
              <span>{text}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="announce-text" style={{color: textColor}}>
          <span style={{color: accentColor}}>&#9733;</span> <span>{text}</span> <span style={{color: accentColor}}>&#9733;</span>
        </div>
      )}
      <button
        className="announce-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        style={{color: textColor}}
      >
        <Icons.X className="w-4 h-4" />
      </button>
    </div>
  )

  if (linkUrl) {
    return (
      <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95 transition-opacity">
        {barContent}
      </a>
    )
  }

  return barContent
}
