const KEY = 'mediactive_dashboard_config_v2'

export const EMPTY_CONFIG = {
  userName: '',
  proxyUrl: '',
  // Instagram outreach sheet
  igSheetId: '',
  igTabs: [],
  // LinkedIn outreach sheet
  liSheetId: '',
  liTabs: [],
  salesSheetId: '',
  salesTab: '',
  calendlyToken: '',
  // Legacy fields (kept for migration)
  outreachSheetId: '',
  outreachTabs: [],
}

export function loadConfig() {
  try {
    // Try v2 key first
    let raw = localStorage.getItem(KEY)
    if (!raw) {
      // Try migrating from v1
      const v1 = localStorage.getItem('mediactive_dashboard_config_v1')
      if (v1) {
        const old = JSON.parse(v1)
        const migrated = migrateConfig(old)
        if (isComplete(migrated)) {
          saveConfig(migrated)
          return migrated
        }
      }
      return null
    }
    const cfg = JSON.parse(raw)
    if (!isComplete(cfg)) return null
    return { ...EMPTY_CONFIG, ...cfg }
  } catch {
    return null
  }
}

export function saveConfig(cfg) {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

export function clearConfig() {
  localStorage.removeItem(KEY)
}

export function isComplete(cfg) {
  return !!(cfg && cfg.proxyUrl && cfg.igSheetId && cfg.igTabs && cfg.igTabs.length > 0 && cfg.salesSheetId && cfg.salesTab)
}

// Migrate a v1 config (outreachSheetId/outreachTabs) to v2 (igSheetId/igTabs)
export function migrateConfig(cfg) {
  if (!cfg) return cfg
  const migrated = { ...EMPTY_CONFIG, ...cfg }
  if (!migrated.igSheetId && migrated.outreachSheetId) {
    migrated.igSheetId = migrated.outreachSheetId
    migrated.igTabs = migrated.outreachTabs || []
  }
  return migrated
}

// Accepts a full Google Sheets URL or a raw spreadsheet ID
export function parseSheetId(input) {
  if (!input) return ''
  const s = input.trim()
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s
  return ''
}

export function exportConfig(cfg) {
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dashboard-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function importConfigFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const cfg = JSON.parse(reader.result)
        if (!isComplete(cfg)) return reject(new Error('Config file is missing required fields'))
        resolve({ ...EMPTY_CONFIG, ...cfg })
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}

// --- Device pairing via URL hash ---
// The config is base64url encoded into the hash fragment, which never
// leaves the browser (hash is not sent to any server).

export function encodePairLink(cfg) {
  const json = JSON.stringify(cfg)
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${window.location.origin}${window.location.pathname}#pair=${b64}`
}

export function consumePairFromUrl() {
  const m = window.location.hash.match(/#pair=([A-Za-z0-9_-]+)/)
  if (!m) return null
  try {
    let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const json = decodeURIComponent(escape(atob(b64)))
    const cfg = JSON.parse(json)
    // Strip the hash so the config does not linger in the address bar or history
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    if (!isComplete(cfg)) return null
    return { ...EMPTY_CONFIG, ...cfg }
  } catch {
    return null
  }
}
