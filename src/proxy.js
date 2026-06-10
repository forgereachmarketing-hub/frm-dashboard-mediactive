// The Google Apps Script code each user deploys to their own account.
// It runs under their Google identity, so their sheets stay private.
export const PROXY_SCRIPT = `function doGet(e) {
  var p = e.parameter || {};
  var out;
  try {
    if (!p.action && !p.id) {
      out = { ok: true, app: 'dashboard-proxy', version: 2 };
    } else if (p.action === 'tabs') {
      var ss = SpreadsheetApp.openById(p.id);
      out = { tabs: ss.getSheets().map(function(s) { return s.getName(); }) };
    } else if (p.action === 'tab') {
      var ss2 = SpreadsheetApp.openById(p.id);
      var sheet = ss2.getSheetByName(p.name);
      if (!sheet) throw new Error('Tab not found: ' + p.name);
      out = { values: sheet.getDataRange().getValues() };
    } else if (p.action === 'calendly') {
      var url = decodeURIComponent(p.url || '');
      if (url.indexOf('https://api.calendly.com/') !== 0) throw new Error('Only Calendly API URLs are allowed');
      var res = UrlFetchApp.fetch(url, {
        headers: { Authorization: 'Bearer ' + p.token },
        muteHttpExceptions: true
      });
      out = JSON.parse(res.getContentText());
    } else if (p.id && p.range) {
      var ss3 = SpreadsheetApp.openById(p.id);
      out = { values: ss3.getRange(p.range).getValues() };
    } else {
      throw new Error('Unknown request');
    }
  } catch (err) {
    out = { error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}`

async function call(proxyUrl, params) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${proxyUrl}?${qs}`)
  if (!res.ok) throw new Error(`Connection failed (HTTP ${res.status})`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

export async function testProxy(proxyUrl) {
  const json = await call(proxyUrl, {})
  if (!json.ok) throw new Error('This URL does not look like the dashboard proxy script')
  return true
}

export async function fetchTabs(proxyUrl, sheetId) {
  const json = await call(proxyUrl, { action: 'tabs', id: sheetId })
  return json.tabs || []
}

export async function fetchTab(proxyUrl, sheetId, tabName) {
  const json = await call(proxyUrl, { action: 'tab', id: sheetId, name: tabName })
  return json.values || []
}

export async function fetchCalendly(proxyUrl, token, apiUrl) {
  return call(proxyUrl, { action: 'calendly', token, url: encodeURIComponent(apiUrl) })
}
