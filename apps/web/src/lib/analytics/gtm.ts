// Tiny Google Tag Manager wrapper. No dependencies and no framework imports,
// so this folder can be copied into other sites as-is.

type DataLayerEntry = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[]
  }
}

let initialized = false

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function push(entry: DataLayerEntry) {
  if (!isBrowser() || !initialized) return

  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(entry)
}

/** Loads the GTM container once. A missing container id keeps analytics off. */
export function initAnalytics({ containerId }: { containerId?: string }) {
  if (!isBrowser() || initialized || !containerId) return

  initialized = true
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`
  document.head.appendChild(script)
}

/** Sent on each SPA route change. Trigger a GA4 page_view tag on this event. */
export function pageview(path = window.location.pathname) {
  push({
    event: 'virtual_page_view',
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export function event(name: string, params: DataLayerEntry = {}) {
  push({ event: name, ...params })
}
