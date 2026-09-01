import { useParams, Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import LightImage from "../components/LightImage"
import { Icons } from "../components/Icons"
import { fetchAPI } from "../lib/api"

export default function ProductDetail() {
  const { handle } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedThumb, setSelectedThumb] = useState(0)
  const [adding, setAdding] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("description")
  const [showSizeChart, setShowSizeChart] = useState(false)
  const [sizeChartImage, setSizeChartImage] = useState("")
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    if (!handle) return
    const controller = new AbortController()
    setLoading(true)

    Promise.all([
      fetchAPI(`/api/products/${handle}`, { signal: controller.signal }),
      fetchAPI('/api/settings', { signal: controller.signal }).catch(() => ({}))
    ])
      .then(([result, settings]) => {
        setData(result)
        if (settings?.size_chart_image) {
          setSizeChartImage(settings.size_chart_image)
        }
        // Auto-select first size if available
        if (result?.options) {
          const sizeOption = result.options.find(o => o.name.toLowerCase() === "size")
          if (sizeOption) {
            const parsedSizes = [...new Set(sizeOption.value.split(/[,;]/).map(s => s.trim()).filter(Boolean))]
            if (parsedSizes.length > 0) {
              setSelectedSize(parsedSizes[0])
            }
          }
        }
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
      <div className="min-h-[70vh] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Loading Item...</span>
        </div>
      </div>
    )
  }

  if (!data || !data.product) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center animate-fade-in">
        <div className="text-center px-6">
          <h2 className="text-2xl font-black mb-2 uppercase tracking-wide">Product Not Found</h2>
          <p className="text-zinc-500 mb-6 text-sm">The item you're looking for is unavailable or has been archived.</p>
          <Link to="/products" className="btn-primary inline-block px-8 py-3 text-xs tracking-widest font-bold">
            BACK TO SHOP
          </Link>
        </div>
      </div>
    )
  }

  const { product, variants, productImages, options } = data
  const defaultVariant = variants?.[0]
  const price = selectedVariant?.price || defaultVariant?.price || product.price || 1399
  const compareAtPrice = selectedVariant?.compare_at_price || defaultVariant?.compare_at_price || product.compare_at_price || (price > 1000 ? price + 201 : null)
  const stock = selectedVariant?.inventory_quantity ?? defaultVariant?.inventory_quantity ?? 10

  // Parse available sizes
  const sizes = (() => {
    if (!options) return ["28", "30", "32", "34"]
    const sizeOption = options.find(o => o.name.toLowerCase() === "size")
    if (!sizeOption || !sizeOption.value) return ["28", "30", "32", "34"]
    const parsed = [...new Set(sizeOption.value.split(/[,;]/).map(s => s.trim()).filter(Boolean))]
    return parsed.length > 0 ? parsed : ["28", "30", "32", "34"]
  })()

  const imagesList = productImages && productImages.length > 0
    ? productImages
    : [{ image_url: product.image_url || product.light_image }]

  const mainImage = imagesList[selectedThumb]?.light_url || imagesList[selectedThumb]?.image_url || product.image_url

  const handleAddToCart = (directCheckout = false) => {
    const sizeToAdd = selectedSize || sizes[0] || "M"
    const imageToAdd = mainImage

    setAdding(true)
    setTimeout(() => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      const existingIndex = cart.findIndex(
        item => item.handle === product.handle && item.size === sizeToAdd
      )

      if (existingIndex > -1) {
        cart[existingIndex].qty = (cart[existingIndex].qty || 1) + quantity
      } else {
        cart.push({
          handle: product.handle,
          title: product.title,
          price,
          size: sizeToAdd,
          qty: quantity,
          image: imageToAdd,
          variantId: selectedVariant?.id || defaultVariant?.id || null
        })
      }

      localStorage.setItem("cart", JSON.stringify(cart))
      window.dispatchEvent(new Event("cart-updated"))
      setAdding(false)

      if (directCheckout) {
        navigate("/cart")
      }
    }, 150)
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const shareTitle = product.title

  const handleSocialShare = (platform) => {
    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")
        break
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, "_blank")
        break
      case "pinterest":
        window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(mainImage)}&description=${encodeURIComponent(shareTitle)}`, "_blank")
        break
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`, "_blank")
        break
      case "mail":
        window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}`
        break
      case "copy":
        navigator.clipboard.writeText(shareUrl).then(() => {
          setCopiedLink(true)
          setTimeout(() => setCopiedLink(false), 2000)
        })
        break
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          
          {/* LEFT: Product Images with NEW badge & Dots */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative aspect-[4/5] bg-zinc-50 rounded-xl overflow-hidden group select-none">
              
              {/* NEW Badge in Top-Left Corner */}
              <div className="absolute top-4 left-4 z-20">
                <span className="badge-new-street uppercase">
                  NEW★
                </span>
              </div>

              {/* Main Product Image */}
              <LightImage
                handle={product.handle}
                title={product.title}
                tags={product.tags}
                src={mainImage}
                w={1000}
                h={1250}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                priority
              />

              {/* Prev / Next Image Chevrons on Hover */}
              {imagesList.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedThumb((selectedThumb - 1 + imagesList.length) % imagesList.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md backdrop-blur-sm flex items-center justify-center text-zinc-900 opacity-0 group-hover:opacity-100 active:scale-95 transition-all z-20"
                    aria-label="Previous image"
                  >
                    <Icons.ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedThumb((selectedThumb + 1) % imagesList.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md backdrop-blur-sm flex items-center justify-center text-zinc-900 opacity-0 group-hover:opacity-100 active:scale-95 transition-all z-20"
                    aria-label="Next image"
                  >
                    <Icons.ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Pagination Dots below image */}
            {imagesList.length > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-3 py-1">
                {imagesList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedThumb(i)}
                    className={`transition-all duration-300 rounded-full ${
                      i === selectedThumb
                        ? "w-2.5 h-2.5 bg-black"
                        : "w-2 h-2 bg-zinc-300 hover:bg-zinc-400"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Image Thumbnail Grid */}
            {imagesList.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3 mt-3">
                {imagesList.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedThumb(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedThumb
                        ? "border-black shadow-sm scale-[1.02]"
                        : "border-zinc-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <LightImage
                      handle={product.handle}
                      title={product.title}
                      src={img.light_url || img.image_url}
                      w={180}
                      h={180}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details, Sizes, Add to Cart & Description */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 uppercase mb-2">
              {product.title}
            </h1>

            {/* Price Row (Rust / Crimson Styling) */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-xl sm:text-2xl font-bold price-rust">
                RS. {typeof price === "number" ? price.toLocaleString("en-IN", {minimumFractionDigits: 2}) : price}
              </span>
              {compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price) && (
                <span className="text-sm font-normal text-zinc-400 line-through">
                  RS. {typeof compareAtPrice === "number" ? compareAtPrice.toLocaleString("en-IN", {minimumFractionDigits: 2}) : compareAtPrice}
                </span>
              )}
            </div>

            {/* Size Header with SIZE CHART Button */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-900 tracking-wider uppercase">
                SIZE: <span className="font-extrabold">{selectedSize || sizes[0]}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSizeChart(true)}
                className="text-xs font-bold text-zinc-600 hover:text-black tracking-wider uppercase underline underline-offset-4 transition-colors"
              >
                SIZE CHART
              </button>
            </div>

            {/* Size Selection Pill Buttons */}
            <div className="flex flex-wrap gap-2.5 mb-6" role="radiogroup" aria-label="Select Size">
              {sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`min-w-[3.25rem] h-10 px-3.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 border ${
                    selectedSize === sz
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-zinc-900 border-zinc-300 hover:border-black active:scale-95"
                  }`}
                  role="radio"
                  aria-checked={selectedSize === sz}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Quantity Selector + ADD TO CART Button */}
            <div className="flex items-center gap-3 mb-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-zinc-200 rounded-full px-3 py-2.5 bg-zinc-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-black active:scale-90 font-bold"
                  aria-label="Decrease quantity"
                >
                  &minus;
                </button>
                <span className="w-8 text-center text-xs font-bold text-zinc-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-black active:scale-90 font-bold"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Pill Button */}
              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={stock === 0 || adding}
                className="flex-1 py-3.5 px-6 rounded-full bg-black text-white text-xs font-extrabold tracking-widest uppercase hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-zinc-300"
              >
                {adding ? "ADDING..." : `ADD TO CART — RS. ${(price * quantity).toLocaleString("en-IN", {minimumFractionDigits: 2})}`}
              </button>
            </div>

            {/* BUY IT NOW Full Width Pill Button */}
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              disabled={stock === 0}
              className="w-full py-3.5 px-6 mb-6 rounded-full bg-white border border-black text-black text-xs font-extrabold tracking-widest uppercase hover:bg-zinc-900 hover:text-white active:scale-[0.98] transition-all shadow-xs disabled:opacity-50"
            >
              BUY IT NOW
            </button>

            {/* Tabbed Info Box: DESCRIPTION and SHIPPING & RETURN */}
            <div className="border border-zinc-200 rounded-2xl p-5 mb-6 bg-white shadow-xs">
              {/* Tab Navigation */}
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("description")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                    activeTab === "description"
                      ? "bg-black text-white shadow-xs"
                      : "text-zinc-400 hover:text-black"
                  }`}
                >
                  DESCRIPTION
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("shipping")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                    activeTab === "shipping"
                      ? "bg-black text-white shadow-xs"
                      : "text-zinc-400 hover:text-black"
                  }`}
                >
                  SHIPPING &amp; RETURN
                </button>
              </div>

              {/* Tab 1: Description */}
              {activeTab === "description" && (
                <div className="space-y-2 text-xs font-semibold text-zinc-700 tracking-wide uppercase leading-relaxed animate-fade-in">
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> HANDPICKED BY CONFELION
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> NOT MANUFACTURED BY CONFELION
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> SELECTED FROM TRUSTED PARTNERS
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> PREMIUM QUALITY STANDARDS
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> QUALITY CHECKED BEFORE DISPATCH
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> COMFORTABLE &amp; STYLISH
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> FREE SHIPPING ACROSS INDIA
                  </p>

                  {product.tags && (
                    <div className="pt-3 mt-3 border-t border-zinc-100 flex flex-wrap gap-1">
                      {product.tags.split(",").map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Shipping & Returns */}
              {activeTab === "shipping" && (
                <div className="space-y-2 text-xs font-semibold text-zinc-700 tracking-wide uppercase leading-relaxed animate-fade-in">
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> FREE EXPRESS SHIPPING ACROSS INDIA
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> DISPATCHED WITHIN 24-48 HOURS
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> ESTIMATED DELIVERY: 3-5 BUSINESS DAYS
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> EASY 7-DAY RETURN &amp; EXCHANGE POLICY
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> CASH ON DELIVERY (COD) AVAILABLE
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-900">•</span> 100% SECURE CHECKOUT WITH RAZORPAY
                  </p>
                </div>
              )}
            </div>

            {/* Social Share Section */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-extrabold text-zinc-900 tracking-wider uppercase">
                SHARE:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSocialShare("facebook")}
                  className="share-circle-btn"
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <Icons.Facebook className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialShare("twitter")}
                  className="share-circle-btn"
                  title="Share on X"
                  aria-label="Share on X"
                >
                  <Icons.TwitterX className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialShare("pinterest")}
                  className="share-circle-btn"
                  title="Share on Pinterest"
                  aria-label="Share on Pinterest"
                >
                  <Icons.Pinterest className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialShare("whatsapp")}
                  className="share-circle-btn"
                  title="Share on WhatsApp"
                  aria-label="Share on WhatsApp"
                >
                  <Icons.WhatsApp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialShare("mail")}
                  className="share-circle-btn"
                  title="Share via Email"
                  aria-label="Share via Email"
                >
                  <Icons.Mail className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialShare("copy")}
                  className="share-circle-btn relative"
                  title="Copy Product Link"
                  aria-label="Copy Product Link"
                >
                  <Icons.Link className="w-3.5 h-3.5" />
                  {copiedLink && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap animate-pop">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SIZE CHART MODAL */}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-zinc-900 uppercase tracking-wide flex items-center gap-2">
                  <Icons.Ruler className="w-5 h-5 text-black" />
                  SIZE &amp; FIT GUIDE
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Measurements in inches and standard fit guidelines</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-600 hover:text-black transition-colors"
                aria-label="Close size chart"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Admin Uploaded Size Chart Image if available */}
              {sizeChartImage ? (
                <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-50 p-2">
                  <img
                    src={sizeChartImage}
                    alt="Size Chart"
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>
              ) : null}

              {/* Standard Dimensions Table */}
              <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-900 text-white">
                    <tr>
                      <th className="p-3 text-left font-bold uppercase">Size</th>
                      <th className="p-3 text-center font-bold uppercase">Waist (in)</th>
                      <th className="p-3 text-center font-bold uppercase">Hip (in)</th>
                      <th className="p-3 text-center font-bold uppercase">Length (in)</th>
                      <th className="p-3 text-center font-bold uppercase">Inseam (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-800">
                    <tr className="hover:bg-zinc-50">
                      <td className="p-3 font-bold bg-zinc-50">28 (S)</td>
                      <td className="p-3 text-center">28 - 29</td>
                      <td className="p-3 text-center">38</td>
                      <td className="p-3 text-center">41.5</td>
                      <td className="p-3 text-center">31</td>
                    </tr>
                    <tr className="hover:bg-zinc-50">
                      <td className="p-3 font-bold bg-zinc-50">30 (M)</td>
                      <td className="p-3 text-center">30 - 31</td>
                      <td className="p-3 text-center">40</td>
                      <td className="p-3 text-center">42.0</td>
                      <td className="p-3 text-center">31.5</td>
                    </tr>
                    <tr className="hover:bg-zinc-50">
                      <td className="p-3 font-bold bg-zinc-50">32 (L)</td>
                      <td className="p-3 text-center">32 - 33</td>
                      <td className="p-3 text-center">42</td>
                      <td className="p-3 text-center">42.5</td>
                      <td className="p-3 text-center">32</td>
                    </tr>
                    <tr className="hover:bg-zinc-50">
                      <td className="p-3 font-bold bg-zinc-50">34 (XL)</td>
                      <td className="p-3 text-center">34 - 35</td>
                      <td className="p-3 text-center">44</td>
                      <td className="p-3 text-center">43.0</td>
                      <td className="p-3 text-center">32.5</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Fit Note */}
              <div className="bg-zinc-50 p-4 rounded-xl text-xs text-zinc-600 space-y-1.5">
                <p className="font-bold text-zinc-900 uppercase">Fit Recommendation:</p>
                <p>• Relaxed wide-leg silhouette. True to size for intentional baggy streetwear drape.</p>
                <p>• If you are in between sizes, we recommend sizing up for an oversized relaxed look.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="px-6 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition-colors"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
