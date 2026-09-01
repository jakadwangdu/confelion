import { Link } from "react-router-dom"
import LightImage from "./LightImage"

export default function ProductGrid({products, title, className = ""}) {
  if (!products || products.length === 0) return null

  return (
    <section className={`product-grid-section ${className}`} aria-labelledby={title ? `${title.toLowerCase().replace(/\s+/g, '-')}-heading` : undefined}>
      {title && (
        <div className="product-grid-header">
          <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`} className="text-xl md:text-2xl font-black tracking-tight">{title}</h2>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {products.map((product, index) => (
          <Link
            key={product.handle}
            to={`/product/${product.handle}`}
            className="group card-interactive animate-fade-in animate-slide-up-sm"
            style={{animationDelay: `${200 + index * 50}ms`}}
          >
            <div className="aspect-[3/4] bg-zinc-50 overflow-hidden relative">
              <LightImage
                handle={product.handle}
                title={product.title}
                tags={product.tags}
                src={product.light_image || product.image_url}
                w={400}
                h={500}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="p-3 md:p-4">
              <h3 className="text-sm font-medium truncate group-hover:text-black transition-colors">{product.title}</h3>
              <p className="text-xs text-zinc-500 mt-1 truncate">{product.vendor} &bull; {product.type}</p>
              {product.price && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900">&#x20B9;{product.price}</span>
                  {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                    <span className="text-xs line-through text-zinc-400">&#x20B9;{product.compare_at_price}</span>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
