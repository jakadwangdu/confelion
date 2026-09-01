import {useParams, Link} from "react-router-dom"
import {useEffect, useState, useCallback} from "react"
import LightImage from "../components/LightImage"
import {Icons} from "../components/Icons"
import {fetchAPI} from "../lib/api"

export default function ProductDetail() {
  const {handle} = useParams()
  const [data, setData] = useState(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedThumb, setSelectedThumb] = useState(0)
  const [adding, setAdding] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)

  useEffect(() => {
    if (!handle) return

    const controller = new AbortController()
    setLoading(true)

    fetchAPI(`/api/products/${handle}`, {signal: controller.signal})
      .then(result => {
        setData(result)
        setLoading(false)
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setData(null)
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [handle])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse-soft text-zinc-400">Loading...</div>
      </div>
    )
  }

  if (!data || !data.product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center animate-fade-in animate-slide-up-sm">
        <div className="text-center px-6">
          <div className="text-4xl mb-4">&#128269;</div>
          <h2 className="text-xl font-black mb-2">Product not found</h2>
          <p className="text-zinc-500 mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/products" className="btn-primary inline-block">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  const {product, variants, productImages, options} = data
  const defaultVariant = variants?.[0]
  const price = selectedVariant?.price || defaultVariant?.price || product.price || 999
  const compareAtPrice = selectedVariant?.compare_at_price || defaultVariant?.compare_at_price || product.compare_at_price
  const stock = selectedVariant?.inventory_quantity ?? defaultVariant?.inventory_quantity ?? 10

  const sizes = (() => {
    if (!options) return []
    const sizeOption = options.find(o => o.name.toLowerCase() === "size")
    if (!sizeOption) return []
    return [...new Set(sizeOption.value.split(/[,;]/).map(s => s.trim()).filter(Boolean))]
  })()

  const colors = (() => {
    if (!options) return []
    const colorOption = options.find(o => o.name.toLowerCase() === "color" || o.name.toLowerCase() === "colour")
    if (!colorOption) return []
    return [...new Set(colorOption.value.split(/[,;]/).map(s => s.trim()).filter(Boolean))]
  })()

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      alert("Please select a size")
      return
    }

    const variantToAdd = selectedVariant || defaultVariant
    const sizeToAdd = selectedSize || (sizes[0] || "")
    const colorToAdd = colors[0] || ""
    const imageToAdd = productImages?.[selectedThumb]?.light_url || productImages?.[selectedThumb]?.image_url || productImages?.[0]?.light_url || productImages?.[0]?.image_url || product.image_url

    setAdding(true)
    setTimeout(() => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      const existingIndex = cart.findIndex(
        item => item.handle === product.handle && item.size === sizeToAdd && item.color === colorToAdd
      )

      if (existingIndex > -1) {
        cart[existingIndex].qty = (cart[existingIndex].qty || 1) + 1
      } else {
        cart.push({
          handle: product.handle,
          title: product.title,
          price,
          size: sizeToAdd,
          color: colorToAdd,
          qty: 1,
          image: imageToAdd,
          variantId: variantToAdd?.id || null
        })
      }

      localStorage.setItem("cart", JSON.stringify(cart))
      window.dispatchEvent(new Event("cart-updated"))
      setAdding(false)
      alert("Added to cart!")
    }, 150)
  }

  const mainImage = productImages?.[selectedThumb]?.light_url || productImages?.[selectedThumb]?.image_url || product.image_url

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <nav className="animate-fade-in animate-slide-up-sm mb-6 md:mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
            <li><Link to="/" className="hover:text-black transition-colors">Home</Link></li>
            <li className="mx-1" aria-hidden="true">/</li>
            <li><Link to="/products" className="hover:text-black transition-colors">Shop</Link></li>
            <li className="mx-1" aria-hidden="true">/</li>
            <li className="text-zinc-900 font-medium truncate max-w-[200px]">{product.title}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 animate-fade-in animate-slide-up-sm" style={{animationDelay: "100ms"}}>
          <div>
            <div className="aspect-[4/5] bg-zinc-50 rounded-2xl overflow-hidden relative group">
              <LightImage
                handle={product.handle}
                title={product.title}
                tags={product.tags}
                src={mainImage}
                w={600}
                h={750}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              {productImages && productImages.length > 1 && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
                  {productImages.slice(0, 5).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedThumb(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${i === selectedThumb ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"}`}
                      aria-label={`View image ${i + 1}`}
                      aria-current={i === selectedThumb}
                    />
                  ))}
                </div>
              )}
            </div>

            {productImages && productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-3 animate-fade-in animate-slide-up-sm" style={{animationDelay: "200ms"}}>
                {productImages.slice(0, 5).map((image, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedThumb(i)}
                    className={`aspect-square object-cover border-2 rounded-xl overflow-hidden transition-all duration-200 ${i === selectedThumb ? "border-black" : "border-transparent hover:border-zinc-300"}`}
                    aria-label={`Select image ${i + 1}`}
                    aria-current={i === selectedThumb}
                  >
                    <LightImage
                      handle={product.handle}
                      title={product.title}
                      src={image.light_url || image.image_url}
                      w={150}
                      h={150}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="animate-fade-in animate-slide-up-sm" style={{animationDelay: "300ms"}}>
            <p className="text-xs font-medium tracking-widest text-zinc-500 mb-1">
              {product.vendor && (
                <Link to={`/products?category=${encodeURIComponent(product.vendor)}`} className="hover:text-black transition-colors">{product.vendor}</Link>
              )}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{product.title}</h1>
            {product.type && (
              <p className="text-sm text-zinc-500 mb-4">
                <Link to={`/products?type=${encodeURIComponent(product.type)}`} className="hover:text-black transition-colors">{product.type}</Link>
              </p>
            )}
            {product.tags && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {product.tags.split(",").map((tag, i) => {
                  const t = tag.trim()
                  if (!t) return null
                  return (
                    <Link key={i} to={`/products?tags=${encodeURIComponent(t)}`} className="text-[11px] px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full hover:bg-zinc-200 hover:text-black transition-colors">
                      {t}
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-6 animate-fade-in animate-slide-up-sm" style={{animationDelay: "400ms"}}>
              <span className="text-2xl md:text-3xl font-bold">&#x20B9;{price}</span>
              {compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price) && (
                <span className="text-sm line-through text-zinc-400">&#x20B9;{compareAtPrice}</span>
              )}
            </div>

            <div className="mb-6 animate-fade-in animate-slide-up-sm" style={{animationDelay: "500ms"}}>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {stock > 0 ? `${stock} in stock` : "Out of stock"}
              </span>
            </div>

            {colors.length > 0 && (
              <div className="mb-8 animate-fade-in animate-slide-up-sm" style={{animationDelay: "550ms"}}>
                <p className="text-xs tracking-wide font-medium mb-3 text-zinc-700">COLOR</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select color">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        const matchingVariant = variants?.find(v =>
                          v.option_values?.some(opt => opt.value.toLowerCase() === c.toLowerCase())
                        )
                        if (matchingVariant) setSelectedVariant(matchingVariant)
                      }}
                      role="radio"
                      aria-checked={selectedVariant?.option_values?.some(opt => opt.value.toLowerCase() === c.toLowerCase()) || (!selectedVariant && c === colors[0])}
                      className={`px-4 py-2 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedVariant?.option_values?.some(opt => opt.value.toLowerCase() === c.toLowerCase())
                          ? "bg-black text-white border-black"
                          : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 active:scale-95"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mb-8 animate-fade-in animate-slide-up-sm" style={{animationDelay: "600ms"}}>
                <p className="text-xs tracking-wide font-medium mb-3 text-zinc-700">SIZE</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select size">
                  {sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s.trim())}
                      role="radio"
                      aria-checked={selectedSize === s.trim()}
                      className={`px-5 py-2.5 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedSize === s.trim()
                          ? "bg-black text-white border-black"
                          : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 active:scale-95"
                      }`}
                    >
                      {s.trim()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={stock === 0 || adding || (sizes.length > 0 && !selectedSize)}
              className={`w-full py-4 md:py-5 text-sm md:text-base font-medium tracking-wide rounded-xl transition-all duration-200 ${
                stock === 0 || (sizes.length > 0 && !selectedSize)
                  ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                  : "bg-black text-white hover:bg-zinc-900 active:scale-[0.98]"
              }`}
              style={{animationDelay: "700ms"}}
            >
              {adding ? "Adding..." : stock === 0 ? "Out of Stock" : "ADD TO CART"}
            </button>

            <div className="mt-6 animate-fade-in animate-slide-up-sm" style={{animationDelay: "750ms"}}>
              <button
                className="w-full py-3 text-sm font-medium tracking-wide rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200"
                onClick={() => {
                  const url = window.location.href
                  navigator.share ? navigator.share({title: product.title, url}) : navigator.clipboard.writeText(url)
                }}
              >
                <Icons.ArrowRight className="w-4 h-4 inline mr-2" /> Share
              </button>
            </div>

            <details className="mt-8 border-t border-zinc-100 pt-6 animate-fade-in animate-slide-up-sm" style={{animationDelay: "800ms"}}>
              <summary className="text-sm font-medium cursor-pointer select-none flex items-center gap-2">
                Details
                <Icons.ChevronDown className="w-5 h-5 text-zinc-400" />
              </summary>
              <div className="mt-4 space-y-3 text-sm text-zinc-600 leading-relaxed">
                <p>{product.tags || "No additional details available."}</p>
                {product.product_category && <p className="text-xs text-zinc-400">{product.product_category}</p>}
              </div>
            </details>

            <details className="mt-4 border-t border-zinc-100 pt-6 animate-fade-in animate-slide-up-sm" style={{animationDelay: "850ms"}}>
              <summary className="text-sm font-medium cursor-pointer select-none flex items-center gap-2">
                Shipping &amp; Returns
                <Icons.ChevronDown className="w-5 h-5 text-zinc-400" />
              </summary>
              <div className="mt-4 space-y-3 text-sm text-zinc-600 leading-relaxed">
                <p>Free shipping on orders over &#x20B9;999</p>
                <p>Easy 7-day returns and exchanges</p>
                <p>COD available across India</p>
                <p>Orders ship within 1-2 business days</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
