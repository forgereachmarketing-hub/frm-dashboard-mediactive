import { useState } from 'react'
import { parseSheetId, exportConfig, importConfigFile, clearConfig } from '../config'
import { testProxy, fetchTabs } from '../proxy'
import PairQR from './PairQR'

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--card-shadow)', padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
  )
}

function Btn({ children, onClick, primary, danger, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '7px 13px' : '10px 20px',
      background: disabled ? 'var(--border2)' : danger ? '#EF4444' : primary ? 'var(--text)' : 'transparent',
      color: disabled ? 'var(--text3)' : danger ? '#fff' : primary ? 'var(--bg)' : 'var(--text2)',
      border: primary || danger ? 'none' : '1px solid var(--border2)',
      borderRadius: 8, cursor: disabled ? 'default' : 'pointer', fontWeight: 700, fontSize: small ? 12 : 13, fontFamily: 'inherit',
    }}>{children}</button>
  )
}

function Msg({ m }) {
  if (!m) return null
  return <div style={{ fontSize: 12.5, fontWeight: 600, color: m.type === 'ok' ? '#10B981' : '#EF4444', marginTop: 8 }}>{m.msg}</div>
}

export default function Settings({ config, onSave, isMobile }) {
  const [cfg, setCfg] = useState({ ...config })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [igInput, setIgInput] = useState(config.igSheetId || config.outreachSheetId || '')
  const [liInput, setLiInput] = useState(config.liSheetId || '')
  const [salesInput, setSalesInput] = useState(config.salesSheetId)
  const [igTabsAvail, setIgTabsAvail] = useState(null)
  const [liTabsAvail, setLiTabsAvail] = useState(null)
  const [salesTabsAvail, setSalesTabsAvail] = useState(null)

  const set = patch => setCfg(c => ({ ...c, ...patch }))

  async function reloadTabs(which) {
    const input = which === 'ig' ? igInput : which === 'li' ? liInput : salesInput
    const id = parseSheetId(input)
    if (!id) { setMsg({ type: 'err', msg: 'Invalid spreadsheet URL or ID' }); return }
    setBusy(true); setMsg(null)
    try {
      const tabs = await fetchTabs(cfg.proxyUrl, id)
      if (which === 'ig') {
        const kept = tabs.filter(t => (cfg.igTabs || []).includes(t))
        set({ igSheetId: id, igTabs: kept.length ? kept : tabs })
        setIgTabsAvail(tabs)
      } else if (which === 'li') {
        const kept = tabs.filter(t => (cfg.liTabs || []).includes(t))
        set({ liSheetId: id, liTabs: kept.length ? kept : tabs })
        setLiTabsAvail(tabs)
      } else {
        set({ salesSheetId: id, salesTab: tabs.includes(cfg.salesTab) ? cfg.salesTab : (tabs[0] || '') })
        setSalesTabsAvail(tabs)
      }
      setMsg({ type: 'ok', msg: `Found ${tabs.length} tabs` })
    } catch (e) {
      setMsg({ type: 'err', msg: e.message })
    } finally { setBusy(false) }
  }

  async function doTest() {
    setBusy(true); setMsg(null)
    try {
      await testProxy(cfg.proxyUrl.trim())
      setMsg({ type: 'ok', msg: 'Proxy connection works' })
    } catch (e) {
      setMsg({ type: 'err', msg: e.message })
    } finally { setBusy(false) }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importConfigFile(file)
      onSave(imported)
    } catch (err) {
      setMsg({ type: 'err', msg: err.message })
    }
  }

  function handleReset() {
    if (!window.confirm('This removes all connections from this browser. Your sheets are not affected. Continue?')) return
    clearConfig()
    window.location.reload()
  }

  const canSave = cfg.proxyUrl && cfg.igSheetId && (cfg.igTabs || []).length > 0 && cfg.salesSheetId && cfg.salesTab

  return (
    <div style={{ maxWidth: 720 }}>
      <Section title="Profile">
        <Field label="First name (used in the greeting)">
          <Input value={cfg.userName} onChange={v => set({ userName: v })} placeholder="Your name" />
        </Field>
      </Section>

      <Section title="Google connection">
        <Field label="Apps Script web app URL">
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <Input value={cfg.proxyUrl} onChange={v => set({ proxyUrl: v })} placeholder="https://script.google.com/macros/s/.../exec" />
            <Btn small onClick={doTest} disabled={busy}>Test</Btn>
          </div>
        </Field>
      </Section>

      <Section title="Outreach — Instagram sheet">
        <Field label="Spreadsheet URL or ID">
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <Input value={igInput} onChange={setIgInput} />
            <Btn small onClick={() => reloadTabs('ig')} disabled={busy}>Load tabs</Btn>
          </div>
        </Field>
        {(igTabsAvail || (cfg.igTabs || []).length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {(igTabsAvail || cfg.igTabs || []).map(tab => {
              const on = (cfg.igTabs || []).includes(tab)
              return (
                <button key={tab} onClick={() => set({ igTabs: on ? (cfg.igTabs || []).filter(t => t !== tab) : [...(cfg.igTabs || []), tab] })} style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  border: '1px solid', borderColor: on ? 'var(--text)' : 'var(--border2)',
                  background: on ? 'var(--text)' : 'transparent', color: on ? 'var(--bg)' : 'var(--text2)',
                }}>{tab}</button>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Outreach — LinkedIn sheet">
        <Field label="Spreadsheet URL or ID (optional — add later if not set up yet)">
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <Input value={liInput} onChange={setLiInput} placeholder="Leave blank if not set up yet" />
            <Btn small onClick={() => reloadTabs('li')} disabled={busy || !liInput}>Load tabs</Btn>
          </div>
        </Field>
        {(liTabsAvail || (cfg.liTabs || []).length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {(liTabsAvail || cfg.liTabs || []).map(tab => {
              const on = (cfg.liTabs || []).includes(tab)
              return (
                <button key={tab} onClick={() => set({ liTabs: on ? (cfg.liTabs || []).filter(t => t !== tab) : [...(cfg.liTabs || []), tab] })} style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  border: '1px solid', borderColor: on ? 'var(--text)' : 'var(--border2)',
                  background: on ? 'var(--text)' : 'transparent', color: on ? 'var(--bg)' : 'var(--text2)',
                }}>{tab}</button>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Sales calls sheet">
        <Field label="Spreadsheet URL or ID">
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <Input value={salesInput} onChange={setSalesInput} />
            <Btn small onClick={() => reloadTabs('sales')} disabled={busy}>Load tabs</Btn>
          </div>
        </Field>
        {(salesTabsAvail || (cfg.salesTab ? [cfg.salesTab] : [])).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {(salesTabsAvail || [cfg.salesTab]).map(tab => {
              const on = cfg.salesTab === tab
              return (
                <button key={tab} onClick={() => set({ salesTab: tab })} style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  border: '1px solid', borderColor: on ? 'var(--text)' : 'var(--border2)',
                  background: on ? 'var(--text)' : 'transparent', color: on ? 'var(--bg)' : 'var(--text2)',
                }}>{tab}</button>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Calendly">
        <Field label="Personal access token (optional, shows upcoming calls on the dashboard)">
          <Input type="password" value={cfg.calendlyToken} onChange={v => set({ calendlyToken: v })} placeholder="Paste token or leave empty" />
        </Field>
        <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
          Get one at calendly.com → Integrations → API and webhooks. Stored only in this browser.
        </div>
      </Section>

      <Section title="Pair another device">
        <PairQR config={cfg} compact />
      </Section>

      <Section title="Backup and reset">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn small onClick={() => exportConfig(cfg)}>Export config</Btn>
          <label>
            <span style={{ display: 'inline-block', padding: '7px 13px', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text2)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Import config</span>
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <Btn small danger onClick={handleReset}>Reset everything</Btn>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 10 }}>
          Settings live in this browser only. Export the config to move it to another device or share it with a teammate.
        </div>
      </Section>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Btn primary disabled={!canSave} onClick={() => onSave(cfg)}>Save changes</Btn>
        <Msg m={msg} />
      </div>
    </div>
  )
}
