import {useEffect, useState} from "react"
import { Link, useNavigate } from "react-router-dom"
import {Icons} from "../components/Icons"
import {useAuth} from "../lib/AuthContext"
import {fetchAPI} from "../lib/api"

export default function Admin() {
  const navigate = useNavigate()
  const {signOut} = useAuth()
  const [tab, setTab] = useState("products")
  const [users, setUsers] = useState([])
  const [prods, setProds] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [revenuePeriod, setRevenuePeriod] = useState('month')
  const [settings, setSettings] = useState({})
  const [f, setF] = useState({handle: "", title: "", price: "", qty: "10", size: "S,M,L,XL", image_url: ""})
  const [edit, setEdit] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState("")

  const getAuthToken = () => {
    const token = localStorage.getItem('token')
    if (token) return token
    try {
      const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      if (key) {
        const session = JSON.parse(localStorage.getItem(key))
        return session?.access_token || ""
      }
    } catch {}
    return ""
  }

  const hdr = () => ({Authorization: `Bearer ${getAuthToken()}`})

  useEffect(() => {
    const check = async () => {
      const token = getAuthToken()
      if (!token) {
        navigate("/login")
        return
      }

      const h = {Authorization: `Bearer ${token}`}
      
      try {
        const [usersData, prodsData, ordersData, settingsData, previewData] = await Promise.all([
          fetchAPI('/api/admin/users', {headers: h}).catch(() => []),
          fetchAPI('/api/admin/products', {headers: h}).catch(() => []),
          fetchAPI('/api/admin/orders', {headers: h}).catch(() => []),
          fetchAPI('/api/admin/settings', {headers: h}).catch(() => ({})),
          fetchAPI('/api/preview/tokens', {headers: h}).catch(() => []),
        ])
        setUsers(Array.isArray(usersData) ? usersData : [])
        setProds(Array.isArray(prodsData) ? prodsData : [])
        setOrders(Array.isArray(ordersData) ? ordersData : [])
        setSettings(settingsData || {})
        setPreviewTokens(Array.isArray(previewData) ? previewData : [])
      } catch (e) {
        console.error('Admin fetch failed:', e)
      }
    }
    check()
  }, [navigate])

  const fetchRevenue = async (period = 'month') => {
    try {
      const data = await fetchAPI(`/api/admin/revenue?period=${period}`, {headers: hdr()})
      if (!data.error) setRevenue(data)
    } catch (e) {
      console.error('Failed to fetch revenue:', e)
    }
  }

  useEffect(() => {
    fetchRevenue(revenuePeriod)
  }, [revenuePeriod])

  const handleFile = async (e, targetSetter) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return alert("Only images allowed")
    if (file.size > 5 * 1024 * 1024) return alert("Max 5MB")
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("image", file)
      const res = await fetch("/api/admin/upload", {method: "POST", headers: hdr(), body: fd})
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.url) {
        targetSetter(prev => ({...prev, image_url: data.url}))
        setPreview(data.url)
        if (targetSetter === setF) setF(p => ({...p, image_url: data.url}))
        if (targetSetter === setEdit) setEdit(p => ({...p, image_url: data.url}))
      }
    } catch (err) {
      alert("Upload failed: " + err.message)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const add = async e => {
    e.preventDefault()
    const r = await fetch("/api/admin/products", {
      method: "POST",
      headers: {...hdr(), "Content-Type": "application/json"},
      body: JSON.stringify(f)
    }).then(r => r.json())
    if (r.error) return alert(r.error)
    alert("Product added")
    setF({handle: "", title: "", price: "", qty: "10", size: "S,M,L,XL", image_url: ""})
    refreshProducts()
  }

  const del = async h => {
    if (!confirm("Delete " + h + " ?")) return
    const r = await fetch("/api/admin/products/" + h, {method: "DELETE", headers: hdr()}).then(r => r.json())
    if (r.error) return alert("Delete failed: " + r.error)
    refreshProducts()
  }

  const updStock = async (id, qty) => {
    await fetch("/api/admin/variants/" + id + "/stock", {
      method: "PUT",
      headers: {...hdr(), "Content-Type": "application/json"},
      body: JSON.stringify({qty})
    })
    alert("Stock updated")
  }

  const updImg = async handle => {
    const url = prompt("New image URL (Shopify CDN or /uploads path):")
    if (!url) return
    const r = await fetch("/api/admin/products/" + handle, {
      method: "PUT",
      headers: {...hdr(), "Content-Type": "application/json"},
      body: JSON.stringify({image_url: url})
    }).then(r => r.json())
    if (r.error) return alert(r.error)
    alert("Image updated")
    refreshProducts()
  }

  const updProd = async e => {
    e.preventDefault()
    const r = await fetch("/api/admin/products/" + edit.handle, {
      method: "PUT",
      headers: {...hdr(), "Content-Type": "application/json"},
      body: JSON.stringify(edit)
    }).then(r => r.json())
    if (r.error) return alert(r.error)
    alert("Updated")
    setEdit(null)
    refreshProducts()
  }

  const [saving, setSaving] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userError, setUserError] = useState("")
  const [previewTokens, setPreviewTokens] = useState([])
  const [previewTitle, setPreviewTitle] = useState("")
  const [creatingPreview, setCreatingPreview] = useState(false)

  const refreshUsers = async () => {
    setLoadingUsers(true)
    setUserError("")
    try {
      const d = await fetchAPI('/api/admin/users', {headers: hdr()})
      if (Array.isArray(d)) {
        setUsers(d)
      } else if (d?.error) {
        setUserError(d.error)
      }
    } catch (e) {
      console.error('Failed to load users:', e)
      setUserError(e.message || 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const refreshProducts = () => {
    fetchAPI('/api/admin/products', {headers: hdr()}).then(d => Array.isArray(d) && setProds(d)).catch(() => {})
  }

  const refreshOrders = () => {
    fetchAPI('/api/admin/orders', {headers: hdr()}).then(d => Array.isArray(d) && setOrders(d)).catch(() => {})
  }

  useEffect(() => {
    if (tab === "users") {
      refreshUsers()
    } else if (tab === "orders") {
      refreshOrders()
    } else if (tab === "products") {
      refreshProducts()
    }
  }, [tab])

  const refreshPreviewTokens = () => {
    fetchAPI('/api/preview/tokens', {headers: hdr()}).then(d => Array.isArray(d) && setPreviewTokens(d)).catch(() => {})
  }

  const createPreviewToken = async () => {
    setCreatingPreview(true)
    try {
      const data = await fetchAPI('/api/preview/tokens', {
        method: 'POST',
        headers: {...hdr(), 'Content-Type': 'application/json'},
        body: JSON.stringify({title: previewTitle || 'Website Preview', expiresInDays: 7})
      })
      setPreviewTitle("")
      refreshPreviewTokens()
      const url = `${window.location.origin}/preview/${data.token}`
      if (confirm(`Preview link created!\n\n${url}\n\nCopy to clipboard?`)) {
        navigator.clipboard.writeText(url).then(() => alert("Copied to clipboard!"))
      }
    } catch (e) {
      alert("Failed to create preview link: " + e.message)
    } finally {
      setCreatingPreview(false)
    }
  }

  const deletePreviewToken = async (token) => {
    if (!confirm("Revoke this preview link?")) return
    try {
      await fetch(`/api/preview/tokens/${token}`, {method: 'DELETE', headers: hdr()})
      refreshPreviewTokens()
    } catch (e) {
      alert("Failed to revoke link")
    }
  }

  const copyPreviewLink = (token) => {
    const url = `${window.location.origin}/preview/${token}`
    navigator.clipboard.writeText(url).then(() => alert("Copied to clipboard!"))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {...hdr(), "Content-Type": "application/json"},
        body: JSON.stringify({settings})
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      alert("Settings saved successfully!")
    } catch (e) {
      alert("Failed to save settings: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async () => {
    if (!confirm("Reset all settings to defaults?")) return
    setSaving(true)
    try {
      const defaults = {
        announcement_text: "Free shipping on orders over ₹999  •  Easy 30-day returns  •  COD available",
        announcement_bg: "#18181b",
        announcement_text_color: "#ffffff",
        announcement_accent_color: "#10b981",
        announcement_image: "",
        announcement_link: "",
        site_name: "CONFELION",
        site_tagline: "Minimalist apparel, impeccable craftsmanship",
        hero_headline: "Less is more.",
        hero_subtext: "Minimalist apparel, impeccable craftsmanship. The clothing is the hero.",
        hero_button_text: "SHOP COLLECTION",
        hero_button_link: "/products",
        hero_image: "/images/hero-banner.svg",
        footer_about: "Minimalist apparel, impeccable craftsmanship. The clothing is the hero.",
        footer_instagram: "",
        footer_twitter: "",
        featured_products: "",
        new_arrivals_count: "8",
      }
      setSettings(defaults)
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {...hdr(), "Content-Type": "application/json"},
        body: JSON.stringify({settings: defaults})
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      alert("Settings reset to defaults!")
    } catch (e) {
      alert("Failed to reset settings: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-black text-white px-6 py-4 animate-slide-down">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-black text-xl">CONFELION ADMIN</Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors">
              View Site
            </Link>
            <button
              onClick={() => setTab("preview")}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icons.Eye className="inline w-4 h-4 mr-1" /> Preview Site
            </button>
            <button
              onClick={async () => { await signOut(); navigate("/login") }}
              className="text-sm px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 animate-fade-in animate-slide-up-sm">
        <div className="flex flex-wrap gap-2 mb-8 animate-fade-in animate-slide-up-sm" style={{animationDelay: "100ms"}}>
          <button onClick={() => setTab("products")} className={`px-5 py-2.5 text-sm font-medium border rounded-xl transition-all duration-200 ${tab === "products" ? "bg-black text-white border-black shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"}`}>
            <Icons.Package className="inline w-4 h-4 mr-1" /> Products ({prods.length})
          </button>
          <button onClick={() => setTab("orders")} className={`px-5 py-2.5 text-sm font-medium border rounded-xl transition-all duration-200 ${tab === "orders" ? "bg-black text-white border-black shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"}`}>
            <Icons.Receipt className="inline w-4 h-4 mr-1" /> Orders ({orders.length})
          </button>
          <button onClick={() => setTab("revenue")} className={`px-5 py-2.5 text-sm font-medium border rounded-xl transition-all duration-200 ${tab === "revenue" ? "bg-black text-white border-black shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"}`}>
            <Icons.ChartBar className="inline w-4 h-4 mr-1" /> Revenue
          </button>
          <button onClick={() => setTab("users")} className={`px-5 py-2.5 text-sm font-medium border rounded-xl transition-all duration-200 ${tab === "users" ? "bg-black text-white border-black shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"}`}>
            <Icons.Users className="inline w-4 h-4 mr-1" /> Users ({users.length})
          </button>
          <button onClick={() => setTab("settings")} className={`px-5 py-2.5 text-sm font-medium border rounded-xl transition-all duration-200 ${tab === "settings" ? "bg-black text-white border-black shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"}`}>
            <Icons.Settings className="inline w-4 h-4 mr-1" /> Settings
          </button>
          <button onClick={() => setTab("add")} className={`px-5 py-2.5 text-sm font-medium border rounded-xl transition-all duration-200 ${tab === "add" ? "bg-black text-white border-black shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"}`}>
            <Icons.Plus className="inline w-4 h-4 mr-1" /> Add Product
          </button>
          <button onClick={() => setTab("preview")} className={`px-5 py-2.5 text-sm font-medium border rounded-xl transition-all duration-200 ${tab === "preview" ? "bg-black text-white border-black shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"}`}>
            <Icons.Eye className="inline w-4 h-4 mr-1" /> Preview ({previewTokens.length})
          </button>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
                <div>
                  <h3 className="font-black text-lg">Order #{selectedOrder.id}</h3>
                  <p className="text-xs text-zinc-500">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-lg hover:bg-zinc-100">
                  <Icons.X className="w-5 h-5 text-zinc-600" />
                </button>
              </div>

              <div className="mb-4 space-y-2 text-sm bg-zinc-50 p-4 rounded-xl">
                <div className="flex justify-between"><span className="text-zinc-500">Customer:</span><span className="font-medium">{selectedOrder.user_name || 'Guest'}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Email:</span><span>{selectedOrder.user_email || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Status:</span><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${selectedOrder.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{selectedOrder.status}</span></div>
                {selectedOrder.payment_id && <div className="flex justify-between"><span className="text-zinc-500">Payment ID:</span><span className="font-mono text-xs">{selectedOrder.payment_id}</span></div>}
              </div>

              <div className="mb-4">
                <h4 className="font-bold text-sm mb-3">Order Items</h4>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                        {it.image_url && <img src={it.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{it.product_title || `Product #${it.product_id}`}</p>
                          <p className="text-xs text-zinc-500">Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ''}</p>
                        </div>
                        <p className="font-bold text-sm">₹{((+it.price || 0) * (it.quantity || 1)).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No items recorded</p>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                <span className="font-bold text-base">Total Amount:</span>
                <span className="font-black text-xl">₹{selectedOrder.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden animate-fade-in animate-slide-up-sm" style={{animationDelay: "200ms"}}>
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-zinc-900">Registered Users</h3>
                <p className="text-xs text-zinc-500">{users.length} total user{users.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={refreshUsers}
                disabled={loadingUsers}
                className="text-xs font-medium px-3 py-1.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors flex items-center gap-1.5 text-zinc-700 disabled:opacity-50"
              >
                <Icons.RotateCcw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                {loadingUsers ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {userError && (
              <div className="p-4 bg-red-50 text-red-600 text-xs border-b border-red-100 flex items-center justify-between">
                <span>{userError}</span>
                <button onClick={refreshUsers} className="font-bold underline ml-2">Try again</button>
              </div>
            )}

            {loadingUsers && users.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="p-4 text-left font-medium text-zinc-600">ID</th>
                      <th className="p-4 text-left font-medium text-zinc-600">Name</th>
                      <th className="p-4 text-left font-medium text-zinc-600">Email</th>
                      <th className="p-4 text-center font-medium text-zinc-600">Role</th>
                      <th className="p-4 text-center font-medium text-zinc-600">Orders</th>
                      <th className="p-4 text-right font-medium text-zinc-600">Total Spent</th>
                      <th className="p-4 font-medium text-zinc-600">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-t border-zinc-100 hover:bg-zinc-50 transition-colors">
                        <td className="p-4 text-zinc-400 font-mono text-xs">#{u.id}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-700 uppercase shrink-0">
                              {(u.name || u.email || 'U')[0]}
                            </div>
                            <span className="font-medium text-zinc-900">{u.name || 'Anonymous'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-600 font-mono text-xs">{u.email}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${u.role === "admin" ? "bg-black text-white" : "bg-zinc-100 text-zinc-700"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-center font-medium text-zinc-700">{u.order_count || 0}</td>
                        <td className="p-4 text-right font-medium text-zinc-900">₹{(u.total_spent || 0).toLocaleString()}</td>
                        <td className="p-4 text-xs text-zinc-500 text-center">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="p-12 text-center text-zinc-500">
                    <Icons.Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-sm font-medium">No users found</p>
                    <p className="text-xs text-zinc-400 mt-1">Users will appear here once they register or make an account.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden animate-fade-in animate-slide-up-sm" style={{animationDelay: "200ms"}}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="p-4 text-left font-medium text-zinc-600">Order ID</th>
                    <th className="p-4 text-left font-medium text-zinc-600">Customer</th>
                    <th className="p-4 text-center font-medium text-zinc-600">Items</th>
                    <th className="p-4 text-right font-medium text-zinc-600">Total</th>
                    <th className="p-4 text-center font-medium text-zinc-600">Status</th>
                    <th className="p-4 font-medium text-zinc-600">Date</th>
                    <th className="p-4 font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="p-4 font-mono text-xs text-zinc-700">#{o.id}</td>
                      <td className="p-4">
                        <div className="font-medium">{o.user_name || 'Guest'}</div>
                        <div className="text-xs text-zinc-500">{o.user_email}</div>
                      </td>
                      <td className="p-4 text-center text-zinc-700">{o.item_count || 0}</td>
                      <td className="p-4 text-right font-medium text-zinc-700">₹{o.total?.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${o.status === 'paid' ? 'bg-green-50 text-green-700' : o.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-zinc-500">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="p-4">
                        <button onClick={() => setSelectedOrder(o)} className="text-xs font-medium text-zinc-600 hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && <div className="p-12 text-center text-zinc-500">No orders yet</div>}
          </div>
        )}

        {tab === "revenue" && revenue && (
          <div className="space-y-6 animate-fade-in animate-slide-up-sm" style={{animationDelay: "200ms"}}>
            <div className="bg-white border border-zinc-100 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-zinc-700">Period:</span>
                <div className="flex gap-2">
                  {['today', 'week', 'month', 'year'].map(p => (
                    <button key={p} onClick={() => {setRevenuePeriod(p); fetchRevenue(p)}} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${revenuePeriod === p ? "bg-black text-white shadow-sm" : "bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700"}`}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-100 rounded-2xl p-6 card hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><Icons.DollarSign className="w-6 h-6 text-green-700" /></div>
                  <div><p className="text-xs text-zinc-500">Total Revenue</p><p className="text-2xl font-black text-zinc-900">₹{revenue.summary?.revenue?.toLocaleString() || 0}</p></div>
                </div>
              </div>
              <div className="bg-white border border-zinc-100 rounded-2xl p-6 card hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><Icons.Receipt className="w-6 h-6 text-blue-700" /></div>
                  <div><p className="text-xs text-zinc-500">Total Orders</p><p className="text-2xl font-black text-zinc-900">{revenue.summary?.order_count || 0}</p></div>
                </div>
              </div>
              <div className="bg-white border border-zinc-100 rounded-2xl p-6 card hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center"><Icons.Users className="w-6 h-6 text-purple-700" /></div>
                  <div><p className="text-xs text-zinc-500">Avg Order Value</p><p className="text-2xl font-black text-zinc-900">₹{revenue.summary?.order_count > 0 ? Math.round(revenue.summary.revenue / revenue.summary.order_count).toLocaleString() : 0}</p></div>
                </div>
              </div>
              <div className="bg-white border border-zinc-100 rounded-2xl p-6 card hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center"><Icons.TrendingUp className="w-6 h-6 text-orange-700" /></div>
                  <div><p className="text-xs text-zinc-500">Top Products</p><p className="text-2xl font-black text-zinc-900">{revenue.topProducts?.length || 0}</p></div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-zinc-100 rounded-2xl p-6">
              <h3 className="font-black text-sm tracking-wide mb-4">Revenue Trend</h3>
              {revenue.revenueByPeriod?.length > 0 ? (
                <div className="h-64 flex items-end gap-2">
                  {revenue.revenueByPeriod.map((d, i) => {
                    const maxRev = Math.max(...revenue.revenueByPeriod.map(x => x.revenue))
                    const height = maxRev > 0 ? (d.revenue / maxRev) * 100 : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-black rounded-t transition-all duration-300 hover:bg-zinc-700" style={{height: `${height}%`, minHeight: height > 0 ? '4px' : '0'}} title={`₹${d.revenue.toLocaleString()}`} />
                        <span className="text-[10px] text-zinc-500">{d.period}</span>
                        <span className="text-[10px] font-medium text-zinc-700">₹{d.revenue.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-zinc-500 py-12">No revenue data for this period</p>
              )}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white border border-zinc-100 rounded-2xl p-6">
                <h3 className="font-black text-sm tracking-wide mb-4">Top Selling Products</h3>
                {revenue.topProducts?.length > 0 ? (
                  <div className="space-y-3">
                    {revenue.topProducts.map((p, i) => (
                      <div key={p.handle} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">{i + 1}</span>
                          <div><p className="font-medium text-sm">{p.title}</p><p className="text-xs text-zinc-500">{p.total_sold} sold</p></div>
                        </div>
                        <p className="font-black text-sm">₹{p.revenue.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center text-zinc-500 py-8">No product data</p>}
              </div>
              <div className="bg-white border border-zinc-100 rounded-2xl p-6">
                <h3 className="font-black text-sm tracking-wide mb-4">Recent Orders</h3>
                {revenue.recentOrders?.length > 0 ? (
                  <div className="space-y-3">
                    {revenue.recentOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                        <div><p className="font-medium text-sm">#{o.id} - {o.customer_name || 'Guest'}</p><p className="text-xs text-zinc-500">{new Date(o.created_at).toLocaleString()}</p></div>
                        <p className="font-black text-sm">₹{o.total.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center text-zinc-500 py-8">No recent orders</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden animate-fade-in animate-slide-up-sm" style={{animationDelay: "200ms"}}>
            <div className="p-6 md:p-8 max-w-4xl">
              <h2 className="text-2xl font-black tracking-tight mb-8">Site Settings</h2>

              {/* Hero Section Settings */}
              <SettingsSection
                icon={<Icons.Image className="w-5 h-5 text-blue-700" />}
                iconBg="bg-blue-50"
                title="Hero Section"
                subtitle="Customize the homepage hero banner"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Headline</label>
                    <input value={settings.hero_headline || ""} onChange={e => setSettings({...settings, hero_headline: e.target.value})} placeholder="Less is more." className="input" />
                  </div>
                  <div>
                    <label className="label">Button Text</label>
                    <input value={settings.hero_button_text || ""} onChange={e => setSettings({...settings, hero_button_text: e.target.value})} placeholder="SHOP COLLECTION" className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Subtext</label>
                  <textarea value={settings.hero_subtext || ""} onChange={e => setSettings({...settings, hero_subtext: e.target.value})} placeholder="Minimalist apparel, impeccable craftsmanship." className="input min-h-[80px] resize-y" rows={2} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Button Link</label>
                    <input value={settings.hero_button_link || ""} onChange={e => setSettings({...settings, hero_button_link: e.target.value})} placeholder="/products" className="input" />
                  </div>
                  <div>
                    <label className="label">Hero Image URL</label>
                    <input value={settings.hero_image || ""} onChange={e => setSettings({...settings, hero_image: e.target.value})} placeholder="/images/hero-banner.jpg" className="input" />
                  </div>
                </div>
                {settings.hero_image && <img src={settings.hero_image} alt="Hero preview" className="mt-2 w-full h-32 object-cover rounded-lg border" />}
              </SettingsSection>

              {/* Announcement Bar Settings */}
              <SettingsSection
                icon={<Icons.Megaphone className="w-5 h-5 text-emerald-700" />}
                iconBg="bg-emerald-50"
                title="Announcement Bar"
                subtitle="Customize the top announcement banner"
              >
                <div>
                  <label className="label">Announcement Text</label>
                  <textarea value={settings.announcement_text || ""} onChange={e => setSettings({...settings, announcement_text: e.target.value})} placeholder="Free shipping on orders over ₹999 • Easy returns • COD available" className="input min-h-[100px] resize-y" rows={3} />
                  <p className="text-xs text-zinc-500 mt-1">Supports multiple messages separated by bullet points</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Background Image URL (optional)</label>
                    <input value={settings.announcement_image || ""} onChange={e => setSettings({...settings, announcement_image: e.target.value})} placeholder="Leave empty for solid color" className="input" />
                  </div>
                  <div>
                    <label className="label">Link URL (optional)</label>
                    <input value={settings.announcement_link || ""} onChange={e => setSettings({...settings, announcement_link: e.target.value})} placeholder="/products?sale=true" className="input" />
                  </div>
                </div>
                {settings.announcement_image && <img src={settings.announcement_image} alt="Announcement preview" className="mt-2 w-full h-16 object-cover rounded-lg border" />}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ColorPicker label="Background Color" value={settings.announcement_bg || "#18181b"} onChange={v => setSettings({...settings, announcement_bg: v})} />
                  <ColorPicker label="Text Color" value={settings.announcement_text_color || "#ffffff"} onChange={v => setSettings({...settings, announcement_text_color: v})} />
                  <ColorPicker label="Accent Color" value={settings.announcement_accent_color || "#10b981"} onChange={v => setSettings({...settings, announcement_accent_color: v})} />
                </div>
              </SettingsSection>

              {/* Site Identity Settings */}
              <SettingsSection
                icon={<Icons.Globe className="w-5 h-5 text-violet-700" />}
                iconBg="bg-violet-50"
                title="Site Identity"
                subtitle="Basic site information"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Site Name</label>
                    <input value={settings.site_name || "CONFELION"} onChange={e => setSettings({...settings, site_name: e.target.value})} placeholder="CONFELION" className="input" />
                  </div>
                  <div>
                    <label className="label">Tagline</label>
                    <input value={settings.site_tagline || ""} onChange={e => setSettings({...settings, site_tagline: e.target.value})} placeholder="Minimalist apparel, impeccable craftsmanship" className="input" />
                  </div>
                </div>
              </SettingsSection>

              {/* Featured Products Settings */}
              <SettingsSection
                icon={<Icons.Star className="w-5 h-5 text-amber-700" />}
                iconBg="bg-amber-50"
                title="Featured Products"
                subtitle="Control which products appear on the homepage"
              >
                <div>
                  <label className="label">Featured Product Handles (comma-separated)</label>
                  <input value={settings.featured_products || ""} onChange={e => setSettings({...settings, featured_products: e.target.value})} placeholder="Leave empty for auto (first 4 products)" className="input" />
                  <p className="text-xs text-zinc-500 mt-1">Enter product handles separated by commas. Leave empty to auto-select the first 4 products.</p>
                </div>
                <div>
                  <label className="label">New Arrivals Count</label>
                  <input type="number" min="1" max="24" value={settings.new_arrivals_count || "8"} onChange={e => setSettings({...settings, new_arrivals_count: e.target.value})} className="input w-32" />
                  <p className="text-xs text-zinc-500 mt-1">Number of products to show in the New Arrivals section.</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                  <p className="text-xs text-zinc-500 mb-2">Available product handles:</p>
                  <div className="flex flex-wrap gap-1">
                    {prods.slice(0, 20).map(p => (
                      <button key={p.handle} onClick={() => {
                        const current = settings.featured_products || ""
                        const handles = current.split(",").map(h => h.trim()).filter(Boolean)
                        if (!handles.includes(p.handle)) {
                          handles.push(p.handle)
                          setSettings({...settings, featured_products: handles.join(", ")})
                        }
                      }} className="text-[10px] px-2 py-0.5 bg-white border border-zinc-200 rounded hover:bg-zinc-100 transition-colors">
                        {p.handle}
                      </button>
                    ))}
                  </div>
                </div>
              </SettingsSection>

              {/* Footer Settings */}
              <SettingsSection
                icon={<Icons.Settings className="w-5 h-5 text-zinc-700" />}
                iconBg="bg-zinc-100"
                title="Footer"
                subtitle="Customize the site footer"
              >
                <div>
                  <label className="label">About Text</label>
                  <textarea value={settings.footer_about || ""} onChange={e => setSettings({...settings, footer_about: e.target.value})} placeholder="Minimalist apparel, impeccable craftsmanship." className="input min-h-[80px] resize-y" rows={2} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Instagram URL</label>
                    <input value={settings.footer_instagram || ""} onChange={e => setSettings({...settings, footer_instagram: e.target.value})} placeholder="https://instagram.com/..." className="input" />
                  </div>
                  <div>
                    <label className="label">Twitter/X URL</label>
                    <input value={settings.footer_twitter || ""} onChange={e => setSettings({...settings, footer_twitter: e.target.value})} placeholder="https://twitter.com/..." className="input" />
                  </div>
                </div>
              </SettingsSection>

              {/* Save Button */}
              <div className="flex gap-3 pt-6 border-t border-zinc-100 mt-8">
                <button type="button" onClick={saveSettings} className="btn-primary px-8" disabled={saving}>
                  {saving ? "Saving..." : "Save All Settings"}
                </button>
                <button type="button" onClick={resetSettings} className="btn-secondary px-8">
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden animate-fade-in animate-slide-up-sm" style={{animationDelay: "200ms"}}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="p-4 text-left font-medium text-zinc-600">Handle</th>
                    <th className="p-4 text-left font-medium text-zinc-600">Title</th>
                    <th className="p-4 font-medium text-zinc-600">Price</th>
                    <th className="p-4 font-medium text-zinc-600">Stock</th>
                    <th className="p-4 font-medium text-zinc-600">Image</th>
                    <th className="p-4 font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prods.map(p => (
                    <tr key={p.id} className="border-t border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="p-4 font-mono text-xs text-zinc-700">{p.handle}</td>
                      <td className="p-4 font-medium">{p.title}</td>
                      <td className="p-4 text-zinc-700">₹{p.price || "-"}</td>
                      <td className="p-4"><StockCell p={p} onSave={updStock} /></td>
                      <td className="p-4">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded-lg border" /> : <span className="text-xs text-zinc-400 px-2 py-1 bg-zinc-50 rounded">AI</span>}
                      </td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => setEdit({...p, price: p.price || "", qty: p.qty || 10, size: "", image_url: p.image_url || ""})} className="text-xs font-medium text-zinc-600 hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100">Edit</button>
                        <button onClick={() => del(p.handle)} className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">Delete</button>
                        <button onClick={() => updImg(p.handle)} className="text-xs font-medium text-zinc-600 hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100">Image</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {edit && (
              <form onSubmit={updProd} className="border-t border-zinc-100 bg-zinc-50 p-6 animate-fade-in animate-slide-up-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><label className="label">Title</label><input value={edit.title || ""} onChange={e => setEdit({...edit, title: e.target.value})} placeholder="Title" className="input" /></div>
                  <div><label className="label">Price (₹)</label><input value={edit.price || ""} onChange={e => setEdit({...edit, price: e.target.value})} placeholder="Price" className="input" /></div>
                  <div><label className="label">Qty</label><input value={edit.qty || ""} onChange={e => setEdit({...edit, qty: e.target.value})} placeholder="Qty" className="input" /></div>
                  <div><label className="label">Sizes (S,M,L,XL)</label><input value={edit.size || ""} onChange={e => setEdit({...edit, size: e.target.value})} placeholder="Sizes S,M,L" className="input" /></div>
                </div>
                <div className="mb-4"><label className="label">Image URL</label><input value={edit.image_url || ""} onChange={e => setEdit({...edit, image_url: e.target.value})} placeholder="Image URL" className="input" /></div>
                <div className="mb-4">
                  <label className="label">Upload image</label>
                  <input type="file" accept="image/*" onChange={e => handleFile(e, setEdit)} className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-zinc-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white file:text-sm hover:file:bg-zinc-900 transition-colors cursor-pointer" disabled={uploading} />
                  {uploading && <p className="text-xs text-amber-600 mt-1 animate-pulse-soft">Compressing & uploading...</p>}
                  {edit.image_url && <img src={edit.image_url} alt="preview" className="mt-2 w-24 h-30 object-cover rounded-lg border" />}
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary px-6" disabled={uploading}>{uploading ? "Saving..." : "Update"}</button>
                  <button type="button" onClick={() => setEdit(null)} className="btn-secondary px-6">Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === "add" && (
          <form onSubmit={add} className="bg-white border border-zinc-100 rounded-2xl p-6 md:p-8 max-w-2xl animate-fade-in animate-slide-up-sm" style={{animationDelay: "200ms"}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><label className="label">Handle <span className="text-red-500">*</span></label><input placeholder="Handle (e.g. my-tee-black)" value={f.handle} onChange={e => setF({...f, handle: e.target.value})} className="input" required /></div>
              <div><label className="label">Title <span className="text-red-500">*</span></label><input placeholder="Title" value={f.title} onChange={e => setF({...f, title: e.target.value})} className="input" required /></div>
              <div><label className="label">Price (₹) <span className="text-red-500">*</span></label><input placeholder="Price (₹)" value={f.price} onChange={e => setF({...f, price: e.target.value})} className="input" required /></div>
              <div><label className="label">Stock Qty</label><input placeholder="Stock Qty" value={f.qty} onChange={e => setF({...f, qty: e.target.value})} className="input" /></div>
            </div>
            <div className="mb-6"><label className="label">Sizes (S,M,L,XL)</label><input placeholder="Sizes (S,M,L,XL)" value={f.size} onChange={e => setF({...f, size: e.target.value})} className="input" /></div>
            <div className="mb-6">
              <label className="label">Product Image</label>
              <input type="file" accept="image/*" onChange={e => handleFile(e, setF)} className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-zinc-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white file:text-sm hover:file:bg-zinc-900 transition-colors cursor-pointer" disabled={uploading} />
              {uploading && <p className="text-xs text-amber-600 mt-1 animate-pulse-soft">Uploading & compressing...</p>}
              <input placeholder="Or paste Image URL" value={f.image_url} onChange={e => setF({...f, image_url: e.target.value})} className="input mt-2" />
              {f.image_url && <img src={f.image_url} alt="preview" className="mt-2 w-32 h-40 object-cover rounded-lg border" />}
            </div>
            <button type="submit" className="w-full btn-primary py-3 text-sm tracking-wide" disabled={uploading}>{uploading ? "Uploading..." : "ADD PRODUCT"}</button>
          </form>
        )}

        {tab === "preview" && (
          <div className="space-y-6 animate-fade-in animate-slide-up-sm" style={{animationDelay: "200ms"}}>
            {/* Create New Preview */}
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icons.Eye className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Generate Preview Link</h3>
                  <p className="text-sm text-zinc-500">Create a shareable link for clients to preview your website</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={previewTitle}
                  onChange={e => setPreviewTitle(e.target.value)}
                  placeholder="Preview title (e.g. 'Client Review - July')"
                  className="input flex-1"
                />
                <button
                  onClick={createPreviewToken}
                  disabled={creatingPreview}
                  className="btn-primary px-6 py-2.5 whitespace-nowrap"
                >
                  {creatingPreview ? "Creating..." : "Generate Link"}
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-2">Links expire after 7 days. Clients can view the site without logging in.</p>
            </div>

            {/* Existing Preview Links */}
            <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
              <div className="p-6 pb-4">
                <h3 className="font-black text-sm tracking-wide">Active Preview Links ({previewTokens.length})</h3>
              </div>
              {previewTokens.length === 0 ? (
                <div className="p-12 text-center">
                  <Icons.Eye className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">No preview links yet</p>
                  <p className="text-zinc-400 text-xs mt-1">Create one above to share with clients</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {previewTokens.map(pt => {
                    const isExpired = pt.expires_at && new Date(pt.expires_at) < new Date()
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/preview/${pt.token}`
                    return (
                      <div key={pt.token} className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isExpired ? 'bg-red-400' : 'bg-green-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{pt.title || 'Untitled Preview'}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Created {new Date(pt.created_at).toLocaleDateString()}
                            {pt.expires_at && ` • Expires ${new Date(pt.expires_at).toLocaleDateString()}`}
                            {isExpired && <span className="text-red-500 ml-1 font-medium">Expired</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => copyPreviewLink(pt.token)}
                            className="text-xs font-medium text-zinc-600 hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
                          >
                            Copy Link
                          </button>
                          <a
                            href={`/preview/${pt.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
                          >
                            Open
                          </a>
                          <button
                            onClick={() => deletePreviewToken(pt.token)}
                            className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function SettingsSection({icon, iconBg, title, subtitle, children}) {
  return (
    <div className="mb-10 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>{icon}</div>
        <div>
          <h3 className="font-black text-lg">{title}</h3>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function ColorPicker({label, value, onChange}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-12 h-12 rounded-lg border border-zinc-200 cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="input flex-1 font-mono text-sm" placeholder="#000000" />
      </div>
    </div>
  )
}

function StockCell({p, onSave}) {
  const [qty, setQty] = useState(p.qty || 0)
  return (
    <span className="flex gap-2 items-center">
      <input value={qty} onChange={e => setQty(e.target.value)} className="w-16 input text-center text-xs" />
      <button onClick={() => onSave(p.variant_id, qty)} className="btn-primary px-3 py-1.5 text-xs">Save</button>
    </span>
  )
}
