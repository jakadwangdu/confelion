import {useState, useEffect, useRef} from "react"
import {Link} from "react-router-dom"
import {Helmet} from "react-helmet-async"
import Navigation from "./Navigation"
import AnnouncementBar from "./AnnouncementBar"
import InstagramPopup from "./InstagramPopup"
import {fetchAPI} from "../lib/api"
import { Outlet } from "react-router-dom"

export default function Layout() {
  const [isLoading, setIsLoading] = useState(false)
  const [footer, setFooter] = useState({
    about: "Minimalist apparel, impeccable craftsmanship. The clothing is the hero.",
    instagram: "",
    twitter: "",
    siteName: "CONFELION",
    tagline: "Minimalist apparel, impeccable craftsmanship",
  })

  useEffect(() => {
    const controller = new AbortController()
    fetchAPI('/api/settings', {signal: controller.signal})
      .then(s => {
        setFooter({
          about: s.footer_about || "Minimalist apparel, impeccable craftsmanship. The clothing is the hero.",
          instagram: s.footer_instagram || "",
          twitter: s.footer_twitter || "",
          siteName: s.site_name || "CONFELION",
          tagline: s.site_tagline || "Minimalist apparel, impeccable craftsmanship",
        })
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <>
      <Helmet>
        <title>{footer.siteName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/images/applogo.svg" type="image/svg+xml" />
      </Helmet>

      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-zinc-400 to-black z-50 animate-loading" aria-hidden="true" />
      )}

      <AnnouncementBar />
      <Navigation />

      <main className="min-h-screen bg-white">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-100 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <img src="/images/applogo.svg" alt={footer.siteName} className="h-6 w-auto mb-3" />
              <p className="text-zinc-600 text-sm leading-relaxed max-w-sm">
                {footer.about}
              </p>
              <div className="flex items-center gap-3 mt-4">
                {footer.instagram && (
                  <a href={footer.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors" aria-label="Instagram">
                    <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="2"/><circle cx="12" cy="12" r="5" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
                  </a>
                )}
                {footer.twitter && (
                  <a href={footer.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors" aria-label="Twitter">
                    <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.43.36a9.09 9.09 0 01-2.88 1.1A4.52 4.52 0 0012 7.53v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                  </a>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-black text-sm tracking-wide mb-3">Shop</h4>
              <nav className="space-y-2">
                <Link to="/products" className="text-zinc-600 text-sm hover:text-black transition-colors block">All Products</Link>
                <Link to="/products?type=tee" className="text-zinc-600 text-sm hover:text-black transition-colors block">Tees</Link>
                <Link to="/products?type=shirt" className="text-zinc-600 text-sm hover:text-black transition-colors block">Shirts</Link>
                <Link to="/products?tags=jeans" className="text-zinc-600 text-sm hover:text-black transition-colors block">Jeans</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-black text-sm tracking-wide mb-3">Help</h4>
              <nav className="space-y-2">
                <Link to="/cart" className="text-zinc-600 text-sm hover:text-black transition-colors block">Cart</Link>
                <Link to="/login" className="text-zinc-600 text-sm hover:text-black transition-colors block">Account</Link>
                <span className="text-zinc-600 text-sm block">Shipping: Free over &#x20B9;999</span>
                <span className="text-zinc-600 text-sm block">Returns: Easy 7-day</span>
              </nav>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
            <span>&copy; {new Date().getFullYear()} {footer.siteName}. All rights reserved.</span>
            <a href="https://jakadwangdu.jo3.org" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-600 transition-colors underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-500">Made by jakadwangdu</a>
          </div>
        </div>
      </footer>

      <InstagramPopup />
    </>
  )
}
