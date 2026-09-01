import {useState, useEffect, useRef} from "react"
import { Link } from "react-router-dom"
import {useNavigate, useLocation} from "react-router-dom"
import {Icons} from "./Icons"
import {useAuth} from "../lib/AuthContext"

function CartIcon({count = 0, size = 5}) {
  return (
    <Link
      to="/cart"
      className="relative p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors"
      aria-label={`Cart${count > 0 ? ` (${count} items)` : ""}`}
    >
      <Icons.Cart className={`${size === 6 ? 'w-6 h-6' : 'w-5 h-5'} text-zinc-700`} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pop">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  )
}

export default function Navigation() {
  const [isMobile, setIsMobile] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef(null)
  const {user, loading, signOut} = useAuth()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      setCartCount(cart.reduce((sum, item) => sum + (item.qty || 1), 0))
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

  const handleLogout = async () => {
    await signOut()
    navigate("/")
  }

  const navLinks = [
    {href: "/", label: "Home", icon: <Icons.Home className="w-5 h-5" />},
    {href: "/products", label: "Shop", icon: <Icons.Shop className="w-5 h-5" />},
  ]

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/"
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Top Navbar - Desktop */}
      <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-40 animate-slide-down">
        <Link to="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity" aria-label="CONFELION Home">
          <img
            src="/images/applogo.svg"
            alt="CONFELION"
            className="h-9 md:h-10 w-auto object-contain block"
          />
        </Link>
        <nav className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`relative flex items-center gap-1.5 text-sm font-medium transition-all duration-200 ${
                isActive(link.href)
                  ? "text-black"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <span aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
              {isActive(link.href) && (
                <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full animate-pulse" />
              )}
            </Link>
          ))}

          <CartIcon count={cartCount} size={5} />

          {user ? (
            <div className="relative ml-4" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors"
                aria-label="Account menu"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <Icons.User className="w-5 h-5 text-zinc-700" />
                <Icons.ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-100 rounded-xl shadow-lg py-2 animate-fade-in animate-slide-up-sm z-50">
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <p className="text-sm font-medium text-zinc-900 truncate">{user.user_metadata?.name || user.name || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/cart"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Icons.Cart className="w-5 h-5" />
                    <span>Cart</span>
                    {cartCount > 0 && <span className="ml-auto text-xs bg-black text-white px-2 py-0.5 rounded-full">{cartCount > 9 ? "9+" : cartCount}</span>}
                  </Link>
                  {(user.role === "admin" || user.user_metadata?.role === "admin") && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Icons.Admin className="w-5 h-5" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-zinc-50 transition-colors"
                  >
                    <Icons.Logout className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-4">
              <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-black transition-colors">
                Login
              </Link>
              <Link to="/signup" className="btn-primary text-sm px-4 py-2">
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-40 animate-slide-down">
        <Link to="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity" aria-label="CONFELION Home">
          <img
            src="/images/applogo.svg"
            alt="CONFELION"
            className="h-8 w-auto object-contain block"
          />
        </Link>
        <div className="flex items-center gap-2">
          <CartIcon count={cartCount} size={6} />
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors"
            aria-label={showMobileMenu ? "Close menu" : "Open menu"}
            aria-expanded={showMobileMenu}
          >
            {showMobileMenu ? <Icons.X className="w-6 h-6 text-zinc-700" /> : <Icons.Menu className="w-6 h-6 text-zinc-700" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl animate-slide-in-right">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <img src="/images/applogo.svg" alt="CONFELION" className="h-7 w-auto object-contain" />
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <Icons.X className="w-6 h-6 text-zinc-700" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-black/5 text-black"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              <Link
                to="/cart"
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive("/cart")
                    ? "bg-black/5 text-black"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Icons.Cart className="w-6 h-6" />
                <span className="font-medium">Cart</span>
                {cartCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pop">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
              {user ? (
                <>
                  {(user.role === "admin" || user.user_metadata?.role === "admin") && (
                    <Link
                      to="/admin"
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-zinc-600 hover:bg-zinc-50`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Icons.Admin className="w-6 h-6" />
                      <span className="font-medium">Admin Panel</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-zinc-50 transition-colors font-medium"
                  >
                    <Icons.Logout className="w-6 h-6" />
                    <span>Logout</span>
                  </button>
                  <div className="pt-2 border-t border-zinc-100">
                    <p className="px-4 py-2 text-xs text-zinc-500 capitalize">{user.user_metadata?.name || user.name || user.email?.split('@')[0]}</p>
                  </div>
                </>
              ) : (
                <div className="pt-4 border-t border-zinc-100 space-y-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-black text-white text-center font-medium transition-colors hover:bg-zinc-900"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Icons.User className="w-5 h-5" />
                    <span>Login / Sign Up</span>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Dock - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
        <div className="bg-white/95 backdrop-blur-md border-t border-zinc-100 px-2 py-2 safe-area-bottom">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-black/5 text-black"
                    : "text-zinc-500 active:bg-zinc-100"
                }`}
                onClick={() => navigate(link.href)}
              >
                <span className="text-lg" aria-hidden="true">{link.icon}</span>
                <span className="text-[11px] font-medium">{link.label}</span>
              </Link>
            ))}
            <CartIcon count={cartCount} size={6} />
            {(user?.role === "admin" || user?.user_metadata?.role === "admin") ? (
              <Link
                to="/admin"
                className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 text-zinc-500 active:bg-zinc-100`}
                onClick={() => navigate("/admin")}
              >
                <Icons.Admin className="w-6 h-6" />
                <span className="text-[11px] font-medium">Admin</span>
              </Link>
            ) : !user ? (
              <Link
                to="/login"
                className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 text-zinc-500 active:bg-zinc-100`}
                onClick={() => navigate("/login")}
              >
                <Icons.User className="w-6 h-6" />
                <span className="text-[11px] font-medium">Account</span>
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Mobile safe area spacer */}
      <div className="lg:hidden h-16" />

    </>
  )
}
