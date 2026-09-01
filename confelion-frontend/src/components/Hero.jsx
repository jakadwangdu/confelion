import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import LightImage from "./LightImage"

export default function Hero({image, headline, subtext, buttonText, buttonLink}) {
  const [currentImage, setCurrentImage] = useState(image)
  const [prevImage, setPrevImage] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isFirstRender = useRef(true)

  // Listen to live settings / hero updates
  useEffect(() => {
    const handleHeroUpdate = (e) => {
      if (e.detail?.hero_image && e.detail.hero_image !== currentImage) {
        changeHeroImage(e.detail.hero_image)
      }
    }
    window.addEventListener("settings-updated", handleHeroUpdate)
    window.addEventListener("hero-updated", handleHeroUpdate)
    return () => {
      window.removeEventListener("settings-updated", handleHeroUpdate)
      window.removeEventListener("hero-updated", handleHeroUpdate)
    }
  }, [currentImage])

  const changeHeroImage = (newSrc) => {
    if (!newSrc || newSrc === currentImage) return
    
    // Preload new image in memory for instant buttery transition
    const preload = new Image()
    preload.src = newSrc
    preload.onload = () => {
      setPrevImage(currentImage)
      setCurrentImage(newSrc)
      setIsTransitioning(true)
      setTimeout(() => {
        setIsTransitioning(false)
        setPrevImage(null)
      }, 750)
    }
    preload.onerror = () => {
      setCurrentImage(newSrc)
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setCurrentImage(image)
      return
    }
    if (image && image !== currentImage) {
      changeHeroImage(image)
    }
  }, [image])

  return (
    <section
      className="hero-section relative min-h-[65vh] sm:min-h-[75vh] md:min-h-[85vh] lg:min-h-[90vh] flex items-center md:items-end justify-center overflow-hidden gpu-accelerated select-none"
      aria-labelledby="hero-heading"
      style={{backgroundColor: "#09090b"}}
    >
      {/* Background Crossfade Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Previous Image during crossfade */}
        {prevImage && (
          <div className="absolute inset-0 z-0">
            <LightImage
              handle="hero-prev"
              title={headline}
              src={prevImage}
              w={1920}
              h={1080}
              className="w-full h-full object-cover object-center"
            />
          </div>
        )}

        {/* Current Active Image with smooth fade-in */}
        {currentImage && (
          <div
            className={`absolute inset-0 z-0 transition-opacity duration-700 ease-out ${
              isTransitioning ? "opacity-0 animate-fade-in" : "opacity-100"
            }`}
          >
            <LightImage
              handle="hero"
              title={headline}
              src={currentImage}
              w={1920}
              h={1080}
              className="w-full h-full object-cover object-center scale-[1.01] hover:scale-[1.03] transition-transform duration-1000"
              priority
            />
          </div>
        )}

        {/* Streetwear Gradient & Ambient Lighting */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 z-10 pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:pb-24 text-center animate-fade-in animate-slide-up-sm">
        <h1
          id="hero-heading"
          className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight uppercase"
          style={{textShadow: "0 2px 24px rgba(0,0,0,0.6)"}}
        >
          {headline || "Less is more."}
        </h1>
        {subtext && (
          <p
            className="mt-3 sm:mt-4 md:mt-6 text-zinc-200 max-w-2xl mx-auto text-sm sm:text-base md:text-xl leading-relaxed font-normal"
            style={{textShadow: "0 1px 12px rgba(0,0,0,0.5)"}}
          >
            {subtext}
          </p>
        )}
        {buttonText && buttonLink && (
          <Link
            to={buttonLink}
            className="inline-block mt-6 sm:mt-8 md:mt-10 bg-white text-black px-6 sm:px-8 md:px-12 py-3 sm:py-3.5 md:py-4 text-xs sm:text-sm md:text-base tracking-widest font-bold rounded-full transition-all duration-300 hover:bg-zinc-100 active:scale-[0.98] hover:shadow-2xl shadow-xl"
            style={{boxShadow: "0 4px 24px rgba(255,255,255,0.25)"}}
          >
            {buttonText}
          </Link>
        )}
      </div>
    </section>
  )
}
