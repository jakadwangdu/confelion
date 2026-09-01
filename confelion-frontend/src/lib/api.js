export const API_BASE = ''

export async function fetchAPI(path, options = {}) {
  const {signal, ...fetchOptions} = options
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    signal,
    ...fetchOptions,
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  
  return res.json()
}

export function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.origin)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value)
    }
  })
  return url.pathname + url.search
}
