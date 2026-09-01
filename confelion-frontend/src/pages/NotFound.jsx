import {Link} from "react-router-dom"
import {Icons} from "../components/Icons"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center animate-fade-in animate-slide-up-sm">
        <div className="text-8xl mb-6">&#128269;</div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Page Not Found</h1>
        <p className="text-zinc-500 text-lg md:text-xl mb-10 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary px-8 py-3">
            <Icons.Home className="inline w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <Link to="/products" className="btn-secondary px-8 py-3">
            <Icons.Shop className="inline w-4 h-4 mr-2" />
            Shop Collection
          </Link>
        </div>
      </div>
    </div>
  )
}
