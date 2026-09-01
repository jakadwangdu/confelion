import {useState, useEffect, useRef} from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Icons } from "./Icons"
import { useAuth } from "../lib/AuthContext"

function BagButton({count = 0, size = 5}) {
  return (
    <Link
      to="/cart"
      className="relative p-2 rounded-full hover:bg-zinc-100 active:scale-95 transition-all duration-200"
      aria-label={`Shopping Bag${count > 0 ? ` (${count} items)` : ""}`}
    >
      <Icons.Bag className={`${size === 6 ? 'w-6 h-6' : 'w-5 h-5'} text-zinc-900`} />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pop shadow-sm">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  )
}

export default function Navigation() {
  const [cartCount, setCartCount] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef(null)
  const searchInputRef = useRef(null)
  const {user, signOut} = useAuth()

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]")
        setCartCount(cart.reduce((sum, item) => sum + (item.qty || 1), 0))
      } catch {
        setCartCount(0)
      }
    }
    updateCart()
    window.addEventListener("storage", updateCart)
    window.addEventListener("cart-updated", updateCart)
    return () => {
      window.removeEventListener("storage", updateCart)
      window.removeEventListener("cart-updated", updateCart)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (showSearchModal && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [showSearchModal])

  const handleLogout = async () => {
    await signOut()
    setShowUserMenu(false)
    navigate("/")
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearchModal(false)
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const navLinks = [
    {href: "/", label: "HOME", icon: <Icons.Home className="w-5 h-5" />},
    {href: "/products", label: "SHOP", icon: <Icons.Shop className="w-5 h-5" />},
  ]

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/"
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Left: Hamburger Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDrawer(true)}
              className="p-2 -ml-2 rounded-lg text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all"
              aria-label="Open menu"
            >
              <Icons.Menu className="w-6 h-6" />
            </button>
            
            {/* Desktop Quick Nav Links */}
            <nav className="hidden md:flex items-center gap-6 ml-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-xs font-bold tracking-wider transition-colors ${
                    isActive(link.href)
                      ? "text-black border-b-2 border-black pb-0.5"
                      : "text-zinc-500 hover:text-black"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Brand Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <Link to="/" className="hover:opacity-85 transition-opacity py-2" aria-label="CONFELION Home">
              <img
                src="/images/applogo.svg"
                alt="CONFELION"
                className="h-7 sm:h-8 md:h-9 w-auto object-contain block"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = "/applogo.png"
                }}
              />
            </Link>
          </div>

          {/* Right: Search, Account, Bag */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2 rounded-full text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all"
              aria-label="Search"
            >
              <Icons.Search className="w-5 h-5" />
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 rounded-full text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all"
                  aria-label="Account"
                >
                  <Icons.User className="w-5 h-5" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-zinc-100 rounded-2xl shadow-xl py-2 animate-scale-in z-50">
                    <div className="px-4 py-2.5 border-b border-zinc-100">
                      <p className="text-xs font-bold text-zinc-900 truncate uppercase tracking-wide">
                        {user.user_metadata?.name || user.name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/cart"
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Icons.Bag className="w-4 h-4" />
                      <span>Shopping Bag</span>
                      {cartCount > 0 && <span className="ml-auto text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">{cartCount}</span>}
                    </Link>
                    {(user.role === "admin" || user.user_metadata?.role === "admin") && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Icons.Admin className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-zinc-50 transition-colors"
                    >
                      <Icons.Logout className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 rounded-full text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all"
                aria-label="Login"
              >
                <Icons.User className="w-5 h-5" />
              </Link>
            )}

            <BagButton count={cartCount} size={5} />
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fade-in" onClick={() => setShowSearchModal(false)}>
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search jeans, shirts, tees, jackets..."
                className="w-full pl-12 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </form>
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
              <span>Popular: Wide Jeans, Linen Shirts, Boxy Tees</span>
              <button
                type="button"
                onClick={() => { setShowSearchModal(false); navigate("/products"); }}
                className="font-semibold text-black hover:underline"
              >
                View all items &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Menu Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 animate-fade-in" onClick={() => setShowDrawer(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
          <div className="absolute left-0 top-0 h-full w-full max-w-xs bg-white shadow-2xl animate-slide-in-left flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <img src="/images/applogo.svg" alt="CONFELION" className="h-7 w-auto object-contain" />
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                aria-label="Close menu"
              >
                <Icons.X className="w-6 h-6 text-zinc-700" />
              </button>
            </div>

            <nav className="p-5 space-y-2 flex-1 overflow-y-auto">
              <Link
                to="/"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider transition-all ${
                  isActive("/") ? "bg-black text-white" : "text-zinc-700 hover:bg-zinc-50"
                }`}
                onClick={() => setShowDrawer(false)}
              >
                <Icons.Home className="w-5 h-5" />
                <span>HOME</span>
              </Link>
              <Link
                to="/products"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider transition-all ${
                  isActive("/products") ? "bg-black text-white" : "text-zinc-700 hover:bg-zinc-50"
                }`}
                onClick={() => setShowDrawer(false)}
              >
                <Icons.Shop className="w-5 h-5" />
                <span>ALL PRODUCTS</span>
              </Link>
              <Link
                to="/cart"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider transition-all ${
                  isActive("/cart") ? "bg-black text-white" : "text-zinc-700 hover:bg-zinc-50"
                }`}
                onClick={() => setShowDrawer(false)}
              >
                <Icons.Bag className="w-5 h-5" />
                <span>SHOPPING BAG</span>
                {cartCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <>
                  {(user.role === "admin" || user.user_metadata?.role === "admin") && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setShowDrawer(false)}
                    >
                      <Icons.Admin className="w-5 h-5" />
                      <span>ADMIN PANEL</span>
                    </Link>
                  )}
                  <button
                    onClick={() => { handleLogout(); setShowDrawer(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-xs tracking-wider text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Icons.Logout className="w-5 h-5" />
                    <span>LOGOUT</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider bg-black text-white text-center mt-4"
                  onClick={() => setShowDrawer(false)}
                >
                  <Icons.User className="w-5 h-5" />
                  <span>LOGIN / SIGN UP</span>
                </Link>
              )}
            </nav>
            <div className="p-5 border-t border-zinc-100 text-center text-[11px] text-zinc-400">
              CONFELION • STREETWEAR &amp; APPAREL
            </div>
          </div>
        </div>
      )}

      {/* Bottom Dock - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-white/95 backdrop-blur-md border-t border-zinc-100 px-3 py-1.5 safe-area-bottom shadow-lg">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                  isActive(link.href)
                    ? "text-black"
                    : "text-zinc-400 active:bg-zinc-100"
                }`}
              >
                <span aria-hidden="true">{link.icon}</span>
                <span className="text-[10px] font-bold tracking-wider">{link.label}</span>
              </Link>
            ))}
            
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-zinc-400 active:bg-zinc-100 transition-all"
            >
              <Icons.Search className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wider">SEARCH</span>
            </button>

            <Link
              to="/cart"
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                isActive("/cart") ? "text-black" : "text-zinc-400 active:bg-zinc-100"
              }`}
            >
              <div className="relative">
                <Icons.Bag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[0.9rem] h-[0.9rem] px-0.5 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pop">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-wider">BAG</span>
            </Link>

            {(user?.role === "admin" || user?.user_metadata?.role === "admin") ? (
              <Link
                to="/admin"
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${isActive("/admin") ? "text-black" : "text-zinc-400"}`}
              >
                <Icons.Admin className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wider">ADMIN</span>
              </Link>
            ) : !user ? (
              <Link
                to="/login"
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${isActive("/login") ? "text-black" : "text-zinc-400"}`}
              >
                <Icons.User className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wider">ACCOUNT</span>
              </Link>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  )
}
