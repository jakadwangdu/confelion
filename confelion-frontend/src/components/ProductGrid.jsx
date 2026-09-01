import { Link } from "react-router-dom"
import LightImage from "./LightImage"

export default function ProductGrid({products, title, className = ""}) {
  if (!products || products.length === 0) return null

  return (
    <section className={`product-grid-section px-3 sm:px-4 md:px-6 max-w-7xl mx-auto ${className}`} aria-labelledby={title ? `${title.toLowerCase().replace(/\s+/g, '-')}-heading` : undefined}>
      {title && (
        <div className="product-grid-header mb-6 sm:mb-8 text-center sm:text-left">
          <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`} className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase">{title}</h2>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {products.map((product, index) => {
          const priceVal = typeof product.price === "number" ? product.price : parseFloat(product.price || 1399)
          const compareVal = product.compare_at_price ? (typeof product.compare_at_price === "number" ? product.compare_at_price : parseFloat(product.compare_at_price)) : (priceVal > 1000 ? priceVal + 201 : null)

          return (
            <Link
              key={product.handle}
              to={`/product/${product.handle}`}
              className="group flex flex-col animate-fade-in animate-slide-up-sm select-none"
              style={{animationDelay: `${60 + (index % 8) * 35}ms`}}
            >
              {/* Card Image Container with NEW Badge */}
              <div className="aspect-[4/5] bg-zinc-50 rounded-xl overflow-hidden relative border border-zinc-100/80 transition-all duration-300 group-hover:shadow-md">
                {/* NEW Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="badge-new-street uppercase">
                    NEW★
                  </span>
                </div>

                <LightImage
                  handle={product.handle}
                  title={product.title}
                  tags={product.tags}
                  src={product.light_image || product.image_url}
                  w={500}
                  h={625}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                
                {/* Subtle Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              {/* Multi-dot indicator below image */}
              <div className="flex items-center justify-center gap-1 mt-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-black transition-colors" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
              </div>

              {/* Title & Price Information */}
              <div className="pt-2 text-left">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-zinc-900 truncate group-hover:text-black transition-colors">
                  {product.title}
                </h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xs sm:text-sm font-bold price-rust">
                    Rs. {priceVal ? priceVal.toLocaleString("en-IN", {minimumFractionDigits: 2}) : "1,399.00"}
                  </span>
                  {compareVal && compareVal > priceVal && (
                    <span className="text-[10px] sm:text-xs font-normal text-zinc-400 line-through">
                      Rs. {compareVal.toLocaleString("en-IN", {minimumFractionDigits: 2})}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
