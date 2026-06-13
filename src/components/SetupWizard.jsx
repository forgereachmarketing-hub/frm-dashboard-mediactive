import { useState } from 'react'
import { EMPTY_CONFIG, parseSheetId, importConfigFile } from '../config'
import { PROXY_SCRIPT, testProxy, fetchTabs } from '../proxy'
import { LOGO_SVG } from '../utils/data'
import PairQR from './PairQR'
import {
  OUTREACH_TEMPLATE_SHEET_ID, SALES_TEMPLATE_SHEET_ID,
  OUTREACH_TEMPLATE_XLSX, SALES_TEMPLATE_XLSX, SKILL_FILE, copyLink,
} from '../templates'

const GRADIENT = 'linear-gradient(90deg, #B16CEA, #FF5E69, #FFA84B)'

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
        background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 9,
        color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
      }}
    />
  )
}

function Btn({ children, onClick, primary, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '8px 14px' : '11px 22px',
      background: disabled ? 'var(--border2)' : primary ? 'var(--text)' : 'transparent',
      color: disabled ? 'var(--text3)' : primary ? 'var(--bg)' : 'var(--text2)',
      border: primary ? 'none' : '1px solid var(--border2)',
      borderRadius: 9, cursor: disabled ? 'default' : 'pointer',
      fontWeight: 700, fontSize: small ? 12 : 13, fontFamily: 'inherit', flexShrink: 0,
    }}>{children}</button>
  )
}

function LinkBtn({ href, children, download }) {
  return (
    <a href={href} target={download ? undefined : '_blank'} rel="noreferrer" download={download} style={{
      display: 'inline-block', padding: '8px 14px', background: 'transparent', color: 'var(--text2)',
      border: '1px solid var(--border2)', borderRadius: 9, fontWeight: 700, fontSize: 12,
      textDecoration: 'none', fontFamily: 'inherit',
    }}>{children}</a>
  )
}

function StatusMsg({ status }) {
  if (!status) return null
  const ok = status.type === 'ok'
  return (
    <div style={{ fontSize: 12.5, fontWeight: 600, color: ok ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
      {ok
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
      {status.msg}
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</div>
}

function H2({ children, optional }) {
  return (
    <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>
      {children}
      {optional && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', verticalAlign: 'middle', marginLeft: 8 }}>OPTIONAL</span>}
    </h2>
  )
}

function P({ children }) {
  return <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text2)', margin: '0 0 18px' }}>{children}</p>
}

function Steps({ items }) {
  return (
    <ol style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--text2)', margin: '0 0 16px', paddingLeft: 18 }}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ol>
  )
}

function ChoiceTabs({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
      {options.map(o => {
        const on = value === o.key
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            flex: 1, padding: '10px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
            cursor: 'pointer', border: '1px solid', borderColor: on ? 'var(--text)' : 'var(--border2)',
            background: on ? 'var(--text)' : 'transparent', color: on ? 'var(--bg)' : 'var(--text2)',
            transition: 'all 0.15s',
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

function TemplateBox({ sheetTemplateId, xlsxUrl, name }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Get the {name} template</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {sheetTemplateId && (
          <a href={copyLink(sheetTemplateId)} target="_blank" rel="noreferrer" style={{
            display: 'inline-block', padding: '8px 14px', background: 'var(--text)', color: 'var(--bg)',
            borderRadius: 9, fontWeight: 700, fontSize: 12, textDecoration: 'none', fontFamily: 'inherit',
          }}>Make a copy in Google Sheets</a>
        )}
        <LinkBtn href={xlsxUrl} download>Download .xlsx</LinkBtn>
      </div>
      <div style={{ fontSize: 11.5, lineHeight: 1.55, color: 'var(--text3)' }}>
        {sheetTemplateId
          ? 'Make a copy puts the template straight into your Google Drive. If you download the .xlsx instead, upload it to Google Drive and open it as a Google Sheet first.'
          : 'Download the file, then in Google Drive choose New → File upload, open it, and use File → Save as Google Sheets. Then paste the link of your new sheet below.'}
      </div>
    </div>
  )
}

const STEPS = ['Welcome', 'Google', 'Outreach', 'Sales', 'Fathom', 'Calendly', 'Done']

export default function SetupWizard({ onComplete, isMobile }) {
  const [step, setStep] = useState(0)
  const [cfg, setCfg] = useState({ ...EMPTY_CONFIG })
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [outreachInput, setOutreachInput] = useState('')
  const [salesInput, setSalesInput] = useState('')
  const [outreachTabsAvail, setOutreachTabsAvail] = useState(null)
  const [salesTabsAvail, setSalesTabsAvail] = useState(null)
  const [outreachMode, setOutreachMode] = useState('have')
  const [salesMode, setSalesMode] = useState('have')

  const set = patch => setCfg(c => ({ ...c, ...patch }))
  const next = () => { setStatus(null); setStep(s => s + 1) }
  const back = () => { setStatus(null); setStep(s => s - 1) }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(PROXY_SCRIPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked */ }
  }

  async function doTestProxy() {
    setBusy(true); setStatus(null)
    try {
      await testProxy(cfg.proxyUrl.trim())
      set({ proxyUrl: cfg.proxyUrl.trim() })
      setStatus({ type: 'ok', msg: 'Connected! Your proxy is working.' })
    } catch (e) {
      setStatus({ type: 'err', msg: e.message })
    } finally { setBusy(false) }
  }

  async function loadTabs(which) {
    const input = which === 'outreach' ? outreachInput : salesInput
    const id = parseSheetId(input)
    if (!id) { setStatus({ type: 'err', msg: 'Paste a valid Google Sheets URL or ID' }); return }
    setBusy(true); setStatus(null)
    try {
      const tabs = await fetchTabs(cfg.proxyUrl, id)
      if (which === 'outreach') {
        set({ igSheetId: id, igTabs: tabs })
        setOutreachTabsAvail(tabs)
        setStatus({ type: 'ok', msg: `Found ${tabs.length} tabs. Untick any that are not outreach data.` })
      } else {
        set({ salesSheetId: id, salesTab: tabs[0] || '' })
        setSalesTabsAvail(tabs)
        setStatus({ type: 'ok', msg: 'Sheet connected. Pick the tab with your call log.' })
      }
    } catch (e) {
      setStatus({ type: 'err', msg: e.message })
    } finally { setBusy(false) }
  }

  function toggleTab(tab) {
    const cur = cfg.igTabs || []
    set({ igTabs: cur.includes(tab) ? cur.filter(t => t !== tab) : [...cur, tab] })
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importConfigFile(file)
      onComplete(imported)
    } catch (err) {
      setStatus({ type: 'err', msg: err.message })
    }
  }

  const canNext = {
    0: true,
    1: status?.type === 'ok',
    2: !!cfg.igSheetId && (cfg.igTabs || []).length > 0,
    3: !!cfg.salesSheetId && !!cfg.salesTab,
    4: true,
    5: true,
    6: true,
  }[step]

  const sheetUrlInput = (which, input, setInput) => (
    <>
      <Label>Your spreadsheet URL or ID</Label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Input value={input} onChange={setInput} placeholder="https://docs.google.com/spreadsheets/d/..." />
        <Btn small onClick={() => loadTabs(which)} disabled={busy || !input.trim()}>{busy ? 'Loading...' : 'Load tabs'}</Btn>
      </div>
    </>
  )

  const tabPills = (tabs, isSelected, onPick) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {tabs.map(tab => {
        const on = isSelected(tab)
        return (
          <button key={tab} onClick={() => onPick(tab)} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
            cursor: 'pointer', border: '1px solid', borderColor: on ? 'var(--text)' : 'var(--border2)',
            background: on ? 'var(--text)' : 'transparent', color: on ? 'var(--bg)' : 'var(--text2)',
          }}>{tab}</button>
        )
      })}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: isMobile ? 16 : 32 }}>
      <div style={{ width: '100%', maxWidth: 580, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: 'var(--card-shadow)', overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 3, background: GRADIENT, width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width 0.3s ease', flexShrink: 0 }} />

        <div style={{ padding: isMobile ? '26px 22px' : '34px 40px', overflowY: 'auto' }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 26 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 4, background: i <= step ? 'var(--text)' : 'var(--border2)', transition: 'all 0.25s' }} />
            ))}
          </div>

          {step === 0 && (
            <>
              <div style={{ marginBottom: 18 }} dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 10px' }}>Welcome to your sales dashboard</h1>
              <P>
                This onboarding sets up everything from scratch: your tracking sheets, call logging, and the dashboard itself. It assumes you have nothing yet. If you already have some pieces, you can plug them in along the way.
              </P>
              <P>
                Your data never touches our servers, everything runs between your browser and your own Google account.
              </P>
              <Label>What is your first name?</Label>
              <Input value={cfg.userName} onChange={v => set({ userName: v })} placeholder="e.g. Alex" />
              <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text3)' }}>
                Already set up on another device?{' '}
                <label style={{ color: 'var(--text)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                  Import config file
                  <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                </label>
                {' '}or scan the pairing QR from your other device.
              </div>
              <StatusMsg status={status} />
            </>
          )}

          {step === 1 && (
            <>
              <H2>Connect your Google account</H2>
              <P>
                The dashboard reads your sheets through a tiny script running in your own Google account. Your sheets stay private, nothing is shared with anyone.
              </P>
              <Steps items={[
                <>Open <a href="https://script.google.com/home/projects/create" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 700 }}>script.google.com</a> and create a new project</>,
                <>Delete the sample code and paste the script below</>,
                <>Click <b style={{ color: 'var(--text)' }}>Deploy → New deployment → Web app</b></>,
                <>Set <b style={{ color: 'var(--text)' }}>Execute as: Me</b> and <b style={{ color: 'var(--text)' }}>Who has access: Anyone</b></>,
                <>Authorize, then copy the Web app URL and paste it here</>,
              ]} />
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <pre style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, fontSize: 10.5, lineHeight: 1.5, color: 'var(--text2)', maxHeight: 120, overflow: 'auto', margin: 0 }}>{PROXY_SCRIPT}</pre>
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <Btn small onClick={copyScript}>{copied ? 'Copied!' : 'Copy script'}</Btn>
                </div>
              </div>
              <Label>Web app URL</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={cfg.proxyUrl} onChange={v => set({ proxyUrl: v })} placeholder="https://script.google.com/macros/s/.../exec" />
                <Btn small onClick={doTestProxy} disabled={busy || !cfg.proxyUrl.trim()}>{busy ? 'Testing...' : 'Test'}</Btn>
              </div>
              <StatusMsg status={status} />
            </>
          )}

          {step === 2 && (
            <>
              <H2>Instagram outreach sheet</H2>
              <P>This is where you track your Instagram outreach: connections, replies, and bookings, one tab per month. You can add the LinkedIn sheet later in Settings.</P>
              <ChoiceTabs value={outreachMode} onChange={setOutreachMode} options={[
                { key: 'have', label: 'I already have one' },
                { key: 'need', label: 'I need the template' },
              ]} />
              {outreachMode === 'need' && (
                <TemplateBox sheetTemplateId={OUTREACH_TEMPLATE_SHEET_ID} xlsxUrl={OUTREACH_TEMPLATE_XLSX} name="outreach" />
              )}
              {sheetUrlInput('outreach', outreachInput, setOutreachInput)}
              {outreachTabsAvail && tabPills(outreachTabsAvail, t => (cfg.igTabs || []).includes(t), toggleTab)}
              <StatusMsg status={status} />
            </>
          )}

          {step === 3 && (
            <>
              <H2>Sales calls sheet</H2>
              <P>This is where every sales call gets logged: prospect, objections, outcome, lead quality.</P>
              <ChoiceTabs value={salesMode} onChange={setSalesMode} options={[
                { key: 'have', label: 'I already have one' },
                { key: 'need', label: 'I need the template' },
              ]} />
              {salesMode === 'need' && (
                <TemplateBox sheetTemplateId={SALES_TEMPLATE_SHEET_ID} xlsxUrl={SALES_TEMPLATE_XLSX} name="sales calls" />
              )}
              {sheetUrlInput('sales', salesInput, setSalesInput)}
              {salesTabsAvail && tabPills(salesTabsAvail, t => cfg.salesTab === t, t => set({ salesTab: t }))}
              <StatusMsg status={status} />

              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginTop: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Automatic call logging with Claude (recommended)</div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text2)', marginBottom: 10 }}>
                  Instead of filling the sheet by hand, Claude can pull each call from Fathom, extract the prospect, objections and outcome, and log the row for you. Setup:
                </div>
                <Steps items={[
                  <>Download the skill file below and open it in any text editor</>,
                  <>Replace <b style={{ color: 'var(--text)' }}>YOUR_SHEET_ID</b> with the ID from your sheet URL and <b style={{ color: 'var(--text)' }}>YOUR_SHEET_NAME</b> with its name in Drive</>,
                  <>In <a href="https://claude.ai" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 700 }}>claude.ai</a> go to Settings → Capabilities → Skills and upload the file</>,
                  <>Connect the <b style={{ color: 'var(--text)' }}>Zapier</b> connector in Settings → Connectors and sign in with your Zapier account (free plan works)</>,
                  <>At <a href="https://mcp.zapier.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 700 }}>mcp.zapier.com</a> add the action <b style={{ color: 'var(--text)' }}>Google Sheets: Add row</b> and connect your Google account there</>,
                  <>Then just tell Claude "log my last call" and it does the rest</>,
                ]} />
                <LinkBtn href={SKILL_FILE} download>Download skill file</LinkBtn>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <H2>Fathom</H2>
              <P>
                Fathom records and summarizes your sales calls. The call logging skill from the previous step reads these summaries, so you want Fathom running on every pitch call.
              </P>
              <Steps items={[
                <>Create a free account at <a href="https://fathom.video" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 700 }}>fathom.video</a> and connect your calendar so it auto joins your meetings</>,
                <>Install the Fathom desktop app or let the notetaker bot join your calls</>,
                <>In <a href="https://claude.ai" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 700 }}>claude.ai</a> go to Settings → Connectors, find <b style={{ color: 'var(--text)' }}>Fathom</b> and connect it</>,
                <>That is it. After your next call, tell Claude "log my last call" and the whole pipeline runs</>,
              ]} />
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                Already using Fathom? Just make sure the Claude connector is on and continue.
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <H2 optional>Calendly</H2>
              <P>
                Connect Calendly to see your upcoming booked calls right on the dashboard. Create a personal access token at{' '}
                <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 700 }}>calendly.com/integrations</a>{' '}
                and paste it below. You can also skip this and add it later in Settings.
              </P>
              <Label>Personal access token</Label>
              <Input type="password" value={cfg.calendlyToken} onChange={v => set({ calendlyToken: v })} placeholder="eyJraWQiOi..." />
              <p style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 10 }}>
                The token is stored only in this browser and sent only to your own Google script, never to any third party.
              </p>
            </>
          )}

          {step === 6 && (
            <>
              <H2>You are all set</H2>
              <P>
                Want the dashboard on your phone or another computer too? Scan this code and the whole setup transfers over. You can always find it later in Settings.
              </P>
              <PairQR config={cfg} />
            </>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
            <div>{step > 0 && <Btn onClick={back}>Back</Btn>}</div>
            {step === 5
              ? <Btn primary onClick={() => { set({ calendlyToken: cfg.calendlyToken.trim() }); next() }}>Finish setup</Btn>
              : step === 6
              ? <Btn primary onClick={() => onComplete(cfg)}>Open dashboard</Btn>
              : <Btn primary onClick={next} disabled={!canNext}>Continue</Btn>}
          </div>
        </div>
      </div>
    </div>
  )
}
