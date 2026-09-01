import {useEffect, useState, useCallback, useRef} from "react"
import {Link, useSearchParams} from "react-router-dom"
import LightImage from "../components/LightImage"
import {Icons} from "../components/Icons"
import {fetchAPI, buildUrl} from "../lib/api"

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [allTags, setAllTags] = useState([])
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "")
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "")
  const [selectedTags, setSelectedTags] = useState(searchParams.get("tags")?.split(",").filter(Boolean) || [])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest")
  const [viewMode, setViewMode] = useState("grid")
  const [totalCount, setTotalCount] = useState(0)
  const filtersFetchedRef = useRef(false)

  const fetchProducts = useCallback(async (signal) => {
    try {
      setLoading(true)
      const params = {}
      if (selectedCategory) params.category = selectedCategory
      if (selectedType) params.type = selectedType
      if (selectedTags.length > 0) params.tags = selectedTags.join(",")
      if (searchQuery) params.q = searchQuery
      if (sortBy !== "newest") params.sort = sortBy

      const data = await fetchAPI(buildUrl('/api/products', params), {signal})
      setProducts(data)
      setTotalCount(data.length)
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error("Failed to fetch products", e)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedType, selectedTags, searchQuery, sortBy])

  useEffect(() => {
    const controller = new AbortController()
    fetchProducts(controller.signal)
    return () => controller.abort()
  }, [fetchProducts])

  const fetchFilters = useCallback(async (signal) => {
    try {
      const data = await fetchAPI('/api/products', {signal})
      const cats = [...new Set(data.map(p => p.vendor).filter(Boolean))]
      const typs = [...new Set(data.map(p => p.type).filter(Boolean))]
      const tags = new Set()
      data.forEach(p => {
        if (p.tags) {
          p.tags.split(",").forEach(t => tags.add(t.trim()))
        }
      })
      setCategories(cats)
      setTypes(typs)
      setAllTags([...tags].filter(Boolean).sort())
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error("Failed to fetch filters", e)
      }
    }
  }, [])

  useEffect(() => {
    if (!filtersFetchedRef.current) {
      filtersFetchedRef.current = true
      const controller = new AbortController()
      fetchFilters(controller.signal)
      return () => controller.abort()
    }
  }, [fetchFilters])

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCategory) params.set("category", selectedCategory)
    if (selectedType) params.set("type", selectedType)
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","))
    if (searchQuery) params.set("q", searchQuery)
    if (sortBy !== "newest") params.set("sort", sortBy)
    setSearchParams(params, {replace: true})
  }, [selectedCategory, selectedType, selectedTags, searchQuery, sortBy])

  const hasActiveFilters = selectedCategory || selectedType || selectedTags.length > 0

  const clearAllFilters = () => {
    setSelectedCategory("")
    setSelectedType("")
    setSelectedTags([])
    setSearchQuery("")
  }

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const activeFilterLabel = (() => {
    if (selectedCategory) return selectedCategory
    if (selectedType) return selectedType
    if (selectedTags.length > 0) return selectedTags.join(", ")
    return "All Products"
  })()

  return (
    <div className="min-h-screen bg-surface">
      <div className="container-main py-8 md:py-12 lg:py-16">
        <div className="animate-fade-in animate-slide-up-sm mb-8 md:mb-10">
          <h1 className="heading-2 mb-2">{activeFilterLabel}</h1>
          <p className="body-sm text-text-muted">{totalCount} item{totalCount !== 1 ? "s" : ""}</p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-3 text-sm text-accent-emerald hover:text-accent-emerald/80 font-medium flex items-center gap-1 transition-colors"
            >
              <Icons.X className="w-4 h-4" /> Clear filters
            </button>
          )}
        </div>

        <div className="animate-fade-in animate-slide-up-sm" style={{animationDelay: "100ms"}}>
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
              <div className="sticky top-24 space-y-8">
                <SearchFilter
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />

                <FilterSection
                  title="Categories"
                  options={categories}
                  selected={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="All Categories"
                  type="radio"
                />

                <FilterSection
                  title="Types"
                  options={types}
                  selected={selectedType}
                  onChange={setSelectedType}
                  placeholder="All Types"
                  type="radio"
                />

                <FilterSection
                  title="Tags"
                  options={allTags}
                  selected={selectedTags}
                  onChange={toggleTag}
                  placeholder="All Tags"
                  type="checkbox"
                  multi
                />

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full btn-secondary text-sm py-2"
                  >
                    <Icons.X className="w-4 h-4 mr-1" /> Clear All Filters
                  </button>
                )}
              </div>
            </aside>

            <div className="flex-1">
              <MobileFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                types={types}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                tags={allTags}
                selectedTags={selectedTags}
                onTagToggle={toggleTag}
                hasActiveFilters={hasActiveFilters}
                onClearAll={clearAllFilters}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              <ProductResults
                products={products}
                loading={loading}
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SearchFilter({searchQuery, onSearchChange}) {
  return (
    <div className="relative">
      <label htmlFor="search" className="sr-only">Search products</label>
      <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
      <input
        id="search"
        type="text"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search products..."
        className="input pl-12 pr-4 w-full"
      />
    </div>
  )
}

function FilterSection({title, options, selected, onChange, placeholder, type, multi}) {
  if (options.length === 0) return null

  return (
    <div>
      <h3 className="caption mb-3">{title}</h3>
      {type === "radio" ? (
        <select
          value={selected}
          onChange={e => onChange(e.target.value)}
          className="input w-full mb-2"
          aria-label={`Filter by ${title.toLowerCase()}`}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`badge px-3 py-1.5 transition-all ${
                selected.includes(opt)
                  ? "bg-brand-900 text-text-inverse shadow-sm"
                  : "bg-brand-100 text-brand-700 hover:bg-brand-200"
              }`}
              aria-pressed={selected.includes(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MobileFilters({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  types,
  selectedType,
  onTypeChange,
  tags,
  selectedTags,
  onTagToggle,
  hasActiveFilters,
  onClearAll,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="lg:hidden space-y-4">
      <SearchFilter searchQuery={searchQuery} onSearchChange={onSearchChange} />

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary w-full justify-between ${hasActiveFilters ? "bg-brand-50 border-brand-300 text-brand-900" : ""}`}
        >
          <span>Filters</span>
          <Icons.ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          {hasActiveFilters && (
            <span className="badge-primary text-xs ml-2">
              {(selectedCategory ? 1 : 0) + (selectedType ? 1 : 0) + selectedTags.length}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="animate-fade-in animate-slide-up-sm space-y-6 pb-4 border-b border-brand-100">
          <FilterSection
            title="Categories"
            options={categories}
            selected={selectedCategory}
            onChange={(v) => {onCategoryChange(v); setShowFilters(false)}}
            placeholder="All Categories"
            type="radio"
          />
          <FilterSection
            title="Types"
            options={types}
            selected={selectedType}
            onChange={(v) => {onTypeChange(v); setShowFilters(false)}}
            placeholder="All Types"
            type="radio"
          />
          <FilterSection
            title="Tags"
            options={tags}
            selected={selectedTags}
            onChange={(tag) => {onTagToggle(tag); setShowFilters(false)}}
            placeholder="All Tags"
            type="checkbox"
            multi
          />
          <div className="flex gap-3">
            <button
              onClick={onClearAll}
              className="flex-1 btn-secondary text-sm"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 btn-primary text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-brand-100">
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
          className="input flex-1 text-sm py-2"
          aria-label="Sort products"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A-Z</option>
          <option value="name-desc">Name: Z-A</option>
        </select>

        <div className="flex items-center gap-1 bg-brand-100 rounded-lg p-1" role="group" aria-label="View mode">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-surface shadow-sm text-brand-900" : "text-brand-500 hover:text-brand-700"}`}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
          >
            <Icons.Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-surface shadow-sm text-brand-900" : "text-brand-500 hover:text-brand-700"}`}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
          >
            <Icons.List className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductResults({products, loading, viewMode}) {
  if (loading) {
    return (
      <div className="product-grid animate-fade-in" role="status" aria-label="Loading products">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card rounded-xl overflow-hidden">
            <div className="aspect-[3/4] skeleton" />
            <div className="p-2.5 sm:p-4 space-y-2">
              <div className="h-3.5 sm:h-4 w-3/4 skeleton rounded" />
              <div className="h-2.5 sm:h-3 w-1/2 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in animate-slide-up-sm">
        <div className="text-4xl sm:text-5xl mb-4">&#128269;</div>
        <h3 className="text-lg sm:text-xl font-bold mb-2">No products found</h3>
        <p className="text-sm text-zinc-500 mb-6">Try adjusting your filter or search</p>
        <Link
          to="/products"
          className="btn-primary inline-block text-sm"
        >
          View All Products
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-fade-in animate-slide-up-sm ${viewMode === "list" ? "!grid-cols-1" : ""}`}
      style={{animationDelay: "150ms"}}
      role="list"
      aria-label="Products"
    >
      {products.map((product, index) => {
        const priceVal = typeof product.price === "number" ? product.price : parseFloat(product.price || 1399)
        const compareVal = product.compare_at_price ? (typeof product.compare_at_price === "number" ? product.compare_at_price : parseFloat(product.compare_at_price)) : (priceVal > 1000 ? priceVal + 201 : null)

        return (
          <Link
            key={product.handle}
            to={`/product/${product.handle}`}
            className="group flex flex-col animate-fade-in animate-slide-up-sm select-none"
            style={{animationDelay: `${60 + (index % 8) * 35}ms`}}
            role="listitem"
          >
            <div className="aspect-square bg-zinc-50 overflow-hidden relative transition-all duration-300 group-hover:shadow-md">
              <div className="absolute top-1.5 left-1.5 z-10">
                <span className="badge-new-street uppercase">
                  SALE
                </span>
              </div>

              <LightImage
                handle={product.handle}
                title={product.title}
                tags={product.tags}
                src={product.light_image || product.image_url}
                w={500}
                h={500}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            <div className="flex items-center justify-center gap-1 mt-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-black transition-colors" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
            </div>

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
  )
}
