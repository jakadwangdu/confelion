import { Link } from "react-router-dom"
import LightImage from "./LightImage"

export default function Hero({image, headline, subtext, buttonText, buttonLink}) {
  return (
    <section
      className="hero-section relative min-h-[70vh] md:min-h-[85vh] flex items-end justify-center overflow-hidden"
      aria-labelledby="hero-heading"
      style={{backgroundColor: "transparent"}}
    >
      {image && (
        <div className="absolute inset-0 z-0">
          <LightImage
            handle="hero"
            title={headline}
            src={image}
            w={1920}
            h={1080}
            className="w-full h-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-16 md:pb-24 text-center animate-fade-in animate-slide-up-sm">
        <h1
          id="hero-heading"
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white"
          style={{textShadow: "0 2px 20px rgba(0,0,0,0.3)"}}
        >
          {headline}
        </h1>
        {subtext && (
          <p className="mt-4 md:mt-6 text-zinc-200 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed" style={{textShadow: "0 1px 8px rgba(0,0,0,0.2)"}}>
            {subtext}
          </p>
        )}
        {buttonText && buttonLink && (
          <Link
            to={buttonLink}
            className="inline-block mt-8 md:mt-10 bg-white text-black px-8 md:px-12 py-3 md:py-4 text-sm md:text-base tracking-wide font-semibold rounded-full transition-all duration-300 hover:bg-zinc-100 active:scale-[0.98] hover:shadow-lg"
            style={{boxShadow: "0 4px 20px rgba(255,255,255,0.2)"}}
          >
            {buttonText}
          </Link>
        )}
      </div>
    </section>
  )
}
