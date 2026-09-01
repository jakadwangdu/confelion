import {useState} from "react"
import {useNavigate, Link} from "react-router-dom"
import {Icons} from "../components/Icons"
import {useAuth} from "../lib/AuthContext"

export default function Login() {
  const navigate = useNavigate()
  const {signIn} = useAuth()
  const [f, setF] = useState({email: "", password: ""})
  const [e, setE] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async ev => {
    ev.preventDefault()
    setE("")
    setLoading(true)
    const { data, error } = await signIn(f.email, f.password)
    setLoading(false)
    if (error) return setE(error.message)
    const role = data?.user?.role || data?.user?.user_metadata?.role
    navigate(role === "admin" ? "/admin" : "/products")
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-in animate-slide-up-sm">
        <div className="text-center mb-8 md:mb-10">
          <Link to="/" className="inline-block mb-6">
            <img src="/images/applogo.svg" alt="CONFELION" className="h-8 w-auto" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Welcome back</h1>
          <p className="text-zinc-500 mt-2 text-sm">Sign in to continue shopping</p>
        </div>

        <form onSubmit={submit} className="bg-white border border-zinc-100 rounded-2xl p-6 md:p-8">
          {e && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs rounded-xl animate-fade-in animate-slide-up-sm" role="alert">
              {e}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={f.email}
                  onChange={e => setF({...f, email: e.target.value})}
                  className="input pl-12"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={f.password}
                  onChange={e => setF({...f, password: e.target.value})}
                  className="input pl-12"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 mt-2"
            >
              {loading ? "Signing in..." : "LOGIN"}
            </button>
          </div>

          <p className="text-xs text-center mt-6 text-zinc-500">
            No account? <Link to="/signup" className="font-medium text-black hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
