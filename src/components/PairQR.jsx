import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { encodePairLink } from '../config'

export default function PairQR({ config, compact }) {
  const [qrUrl, setQrUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const link = encodePairLink(config)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(link, { width: 220, margin: 1, errorCorrectionLevel: 'L', color: { dark: '#000000', light: '#FFFFFF' } })
      .then(url => { if (!cancelled) setQrUrl(url) })
      .catch(() => { if (!cancelled) setQrUrl(null) })
    return () => { cancelled = true }
  }, [link])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {qrUrl ? (
        <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 14, lineHeight: 0 }}>
          <img src={qrUrl} alt="Pairing QR code" width={compact ? 170 : 220} height={compact ? 170 : 220} style={{ display: 'block' }} />
        </div>
      ) : (
        <div style={{ width: compact ? 190 : 240, height: compact ? 190 : 240, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 12 }}>
          Generating...
        </div>
      )}
      <button onClick={copyLink} style={{
        padding: '8px 16px', background: 'transparent', color: 'var(--text2)',
        border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer',
        fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
      }}>{copied ? 'Copied!' : 'Copy pairing link'}</button>
      <div style={{ fontSize: 11.5, color: 'var(--text3)', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
        Scan with your phone or open the link on another device. The setup transfers automatically. The link contains your connection details, share it only with people you trust.
      </div>
    </div>
  )
}
