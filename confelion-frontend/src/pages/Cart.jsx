import {useEffect, useState} from "react"
import {Link} from "react-router-dom"
import LightImage from "../components/LightImage"
import {useAuth} from "../lib/AuthContext"

function loadRazorpay() {
  return new Promise(r => {
    if (window.Razorpay) return r(true)
    const s = document.createElement("script")
    s.src = "https://checkout.razorpay.com/v1/checkout.js"
    s.onload = () => r(true)
    s.onerror = () => r(false)
    document.body.appendChild(s)
  })
}

export default function Cart() {
  const {user} = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem("cart") || "[]"))
    setLoading(false)
  }, [])

  const save = v => {
    localStorage.setItem("cart", JSON.stringify(v))
    setItems(v)
    window.dispatchEvent(new Event("cart-updated"))
  }

  const total = items.reduce((s, i) => s + (+i.price || 0) * (i.qty || 1), 0)
  const rm = i => save(items.filter((_, k) => k !== i))
  const clear = () => save([])
  const updateQty = (i, delta) => {
    const newItems = [...items]
    newItems[i].qty = Math.max(1, (newItems[i].qty || 1) + delta)
    save(newItems)
  }

  const pay = async () => {
    if (!total) return alert("Cart empty")
    setPaying(true)
    const ok = await loadRazorpay()
    if (!ok) {
      setPaying(false)
      return alert("Razorpay SDK failed")
    }

    const currentUser = user || JSON.parse(localStorage.getItem("user") || "null")
    const userId = currentUser?.id || null

    try {
      const o = await fetch("/api/payment/order", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({amount: total})
      }).then(r => r.json())

      const opt = {
        key: o.key,
        amount: o.amount,
        currency: o.currency || "INR",
        name: "CONFELION",
        description: "Order payment",
        order_id: o.id,
        handler: async res => {
          const v = await fetch("/api/payment/verify", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              ...res,
              cart: items,
              user_id: userId
            })
          }).then(r => r.json())
          if (v.success || v.verified || v.mock) {
            alert("Payment success! Order ID: " + o.id)
            clear()
          } else {
            alert("Verification failed")
          }
          setPaying(false)
        },
        prefill: currentUser ? {name: currentUser.name, email: currentUser.email, contact: "9999999999"} : {name: "Test User", email: "test@confelion.com", contact: "9999999999"},
        theme: {color: "#000000"}
      }
      new window.Razorpay(opt).open()
    } catch (e) {
      setPaying(false)
      alert("Payment failed")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse-soft text-zinc-400">Loading cart...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white max-w-3xl mx-auto px-6 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8 md:mb-12 animate-fade-in animate-slide-up-sm">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Cart</h1>
        <Link to="/products" className="text-sm font-medium text-zinc-600 hover:text-black transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Continue shopping
        </Link>
      </div>

      {!items.length ? (
        <div className="text-center py-16 md:py-24 animate-fade-in animate-slide-up-sm">
          <div className="text-5xl mb-4">&#128722;</div>
          <h2 className="text-xl font-black mb-2">Your cart is empty</h2>
          <p className="text-zinc-500 mb-8">Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn-primary inline-block">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="animate-fade-in animate-slide-up-sm divide-y divide-zinc-100" style={{animationDelay: "100ms"}}>
            {items.map((it, i) => (
              <div key={i} className="py-5 md:py-6 flex gap-4 animate-fade-in animate-slide-up-sm" style={{animationDelay: `${200 + i * 100}ms`}}>
                <div className="w-20 h-24 md:w-24 md:h-28 bg-zinc-50 border rounded-xl shrink-0 overflow-hidden relative">
                  <LightImage
                    handle={it.handle}
                    title={it.title}
                    src={it.image}
                    w={80}
                    h={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-medium truncate">{it.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">Size: {it.size || "-"}</p>
                  <p className="text-sm font-medium mt-2">&#x20B9;{it.price}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => updateQty(i, -1)}
                      className="w-8 h-8 rounded-lg border border-zinc-200 hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{it.qty || 1}</span>
                    <button
                      onClick={() => updateQty(i, 1)}
                      className="w-8 h-8 rounded-lg border border-zinc-200 hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center"
                      aria-label="Increase quantity"
                    >
                      <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <p className="text-sm md:text-base font-bold text-right">&#x20B9;{(+it.price || 0) * (it.qty || 1)}</p>
                  <button
                    onClick={() => rm(i)}
                    className="text-xs text-zinc-500 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 animate-fade-in animate-slide-up-sm" style={{animationDelay: "300ms"}}>
            <div className="bg-zinc-50 rounded-2xl p-6 md:p-8 border border-zinc-100">
              <div className="flex justify-between text-sm mb-4">
                <span className="text-zinc-600">Subtotal</span>
                <span className="font-bold">&#x20B9;{total}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-zinc-600">Shipping</span>
                <span className="font-medium text-green-700">{total >= 999 ? "Free" : "&#x20B9;50"}</span>
              </div>
              {total > 0 && total < 999 && (
                <p className="text-xs text-zinc-500 mb-4 text-center">Add &#x20B9;{999 - total} more for free shipping</p>
              )}
              <div className="border-t border-zinc-200 pt-4 mb-6">
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>&#x20B9;{total + (total > 0 && total < 999 ? 50 : 0)}</span>
                </div>
              </div>
              <button
                onClick={pay}
                disabled={paying}
                className="w-full btn-primary py-4 text-base"
              >
                {paying ? "Processing..." : `PAY WITH RAZORPAY • \u20B9${total + (total > 0 && total < 999 ? 50 : 0)}`}
              </button>
              <p className="text-[11px] text-zinc-400 text-center mt-3">
                UPI &bull; Cards &bull; NetBanking &bull; Wallets &bull; Secured by Razorpay
              </p>
              <button onClick={clear} className="w-full mt-3 btn-secondary">
                Clear Cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
