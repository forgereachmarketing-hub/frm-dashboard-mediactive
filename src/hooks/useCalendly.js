import { useState, useEffect } from 'react'
import { fetchCalendly } from '../proxy'

export function useCalendly(config) {
  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!config || !config.calendlyToken || !config.proxyUrl) {
      setEvents(null)
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const me = await fetchCalendly(config.proxyUrl, config.calendlyToken, 'https://api.calendly.com/users/me')
        const userUri = me?.resource?.uri
        if (!userUri) throw new Error('Could not read Calendly user')
        const now = new Date().toISOString()
        const url = `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&status=active&min_start_time=${encodeURIComponent(now)}&sort=start_time:asc&count=8`
        const res = await fetchCalendly(config.proxyUrl, config.calendlyToken, url)
        if (cancelled) return
        const items = (res?.collection || []).map(ev => ({
          name: ev.name,
          start: ev.start_time,
          end: ev.end_time,
          joinUrl: ev?.location?.join_url || null,
        }))
        setEvents(items)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [config])

  return { events, loading, error }
}
