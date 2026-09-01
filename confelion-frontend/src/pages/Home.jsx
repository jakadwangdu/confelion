import {useEffect, useState, useRef} from "react"
import Hero from "../components/Hero"
import CollectionStrip from "../components/CollectionStrip"
import ProductGrid from "../components/ProductGrid"
import Features from "../components/Features"
import ReviewsMarquee from "../components/ReviewsMarquee"
import ViewAllButton from "../components/ViewAllButton"
import {fetchAPI} from "../lib/api"

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [collectionProducts, setCollectionProducts] = useState([])
  const [hero, setHero] = useState({
    image: "/images/hero-banner.svg",
    headline: "Less is more.",
    subtext: "Minimalist apparel, impeccable craftsmanship. The clothing is the hero.",
    buttonText: "SHOP COLLECTION",
    buttonLink: "/products",
  })
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const loadProducts = async (featuredHandles, newArrivalsCount) => {
      try {
        const data = await fetchAPI('/api/products')
        if (featuredHandles) {
          const handles = featuredHandles.split(",").map(h => h.trim()).filter(Boolean)
          const featured = data.filter(p => handles.includes(p.handle))
          if (featured.length > 0) {
            setFeaturedProducts(featured)
            setCollectionProducts(data.filter(p => !handles.includes(p.handle)).slice(0, newArrivalsCount))
          } else {
            setFeaturedProducts(data.slice(0, 4))
            setCollectionProducts(data.slice(4, 4 + newArrivalsCount))
          }
        } else {
          setFeaturedProducts(data.slice(0, 4))
          setCollectionProducts(data.slice(4, 4 + newArrivalsCount))
        }
      } catch (e) {
        console.error('Failed to load products', e)
      }
    }

    ;(async () => {
      try {
        const settings = await fetchAPI('/api/settings')
        setHero({
          image: settings.hero_image || "/images/hero-banner.svg",
          headline: settings.hero_headline || "Less is more.",
          subtext: settings.hero_subtext || "Minimalist apparel, impeccable craftsmanship. The clothing is the hero.",
          buttonText: settings.hero_button_text || "SHOP COLLECTION",
          buttonLink: settings.hero_button_link || "/products",
        })
        loadProducts(settings.featured_products, parseInt(settings.new_arrivals_count) || 8)
      } catch (e) {
        loadProducts(null, 8)
      }
    })()
  }, [])

  return (
    <>
      <div className="min-h-screen bg-white text-zinc-900">
        <Hero
          image={hero.image}
          headline={hero.headline}
          subtext={hero.subtext}
          buttonText={hero.buttonText}
          buttonLink={hero.buttonLink}
        />

        <CollectionStrip />

        {featuredProducts.length > 0 && (
          <ProductGrid
            products={featuredProducts}
            title="Featured Collection"
            className="py-12 md:py-16"
          />
        )}

        <ViewAllButton />

        {collectionProducts.length > 0 && (
          <ProductGrid
            products={collectionProducts}
            title="New Arrivals"
            className="py-12 md:py-16"
          />
        )}

        <Features />
        <ReviewsMarquee />
      </div>
    </>
  )
}
