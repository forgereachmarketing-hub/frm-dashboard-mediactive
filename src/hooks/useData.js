import { useState, useEffect, useCallback } from 'react'
import { fetchTab } from '../proxy'

export function useData(config) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!!config)
  const [error, setError] = useState(null)
  const [loadedAt, setLoadedAt] = useState(null)

  const load = useCallback(async () => {
    if (!config) return
    setLoading(true)
    setError(null)
    try {
      const monthResults = await Promise.all(
        config.outreachTabs.map(tab => fetchTab(config.proxyUrl, config.outreachSheetId, tab))
      )
      const sales = await fetchTab(config.proxyUrl, config.salesSheetId, config.salesTab)
      const months = {}
      config.outreachTabs.forEach((tab, i) => { months[tab] = monthResults[i] })
      setData({ months, sales })
      setLoadedAt(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [config])

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: load, loadedAt }
}
