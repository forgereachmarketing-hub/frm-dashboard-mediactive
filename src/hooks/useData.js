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
      const igTabs = config.igTabs || []
      const liTabs = config.liTabs || []

      const [igResults, liResults, sales] = await Promise.all([
        Promise.all(igTabs.map(tab => fetchTab(config.proxyUrl, config.igSheetId, tab))),
        liTabs.length > 0 && config.liSheetId
          ? Promise.all(liTabs.map(tab => fetchTab(config.proxyUrl, config.liSheetId, tab)))
          : Promise.resolve([]),
        fetchTab(config.proxyUrl, config.salesSheetId, config.salesTab),
      ])

      const igMonths = {}
      igTabs.forEach((tab, i) => { igMonths[tab] = igResults[i] })

      const liMonths = {}
      liTabs.forEach((tab, i) => { liMonths[tab] = liResults[i] })

      // Merged months for Dashboard/Sales/Tasks (all channels combined)
      const allMonths = { ...igMonths, ...liMonths }

      setData({ ig: { months: igMonths }, li: { months: liMonths }, months: allMonths, sales })
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
