<script setup>
// Modified: 2026-10-22
import { onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { examples } from './replExamples'

const root = ref(null)
const exampleById = Object.fromEntries(examples.map(example => [example.id, example]))
const sessionBufferKey = 'np-repl-session-buffer'
let editor
let disposed = false
let outputFrame
let loadExampleFromHash
let sidebarMenuLabel
let originalSidebarMenuLabel
let publicApiPromise

function resizeOutput(event) {
  if (event.source !== outputFrame?.contentWindow || event.data?.type !== 'np-repl-chart-height') return
  const height = Number(event.data.height)
  if (Number.isFinite(height) && height > 0) {
    outputFrame.style.height = `${Math.max(360, height)}px`
  }
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function loadPublicApi() {
  if (window.nP) return Promise.resolve(window.nP)
  if (!publicApiPromise) {
    publicApiPromise = loadScript(withBase('/nP.js')).then(() => {
      if (!window.nP) throw new Error('The nP browser bundle did not expose its public API.')
      return window.nP
    }).catch(error => {
      publicApiPromise = null
      throw error
    })
  }
  return publicApiPromise
}

async function loadCodeMirror() {
  if (window.CodeMirror) return true
  if (!document.querySelector('link[data-np-repl-codemirror]')) {
    const style = document.createElement('link')
    style.rel = 'stylesheet'
    style.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css'
    style.dataset.npReplCodemirror = ''
    document.head.appendChild(style)
  }
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js')
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js')
    return true
  } catch {
    return false
  }
}

function readSessionBuffer() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionBufferKey) || 'null')
    if (saved && typeof saved.code === 'string') {
      const activeId = exampleById[saved.activeId] ? saved.activeId : null
      const exampleCode = activeId ? exampleById[activeId].code : null
      const priorTrapezoidCode = activeId === 'trapezoid-fft-round-trip'
        ? exampleCode.replace("  shape: 'custom',\n", '')
        : null
      const unchangedExample = activeId && (
        saved.code === saved.exampleCode ||
        (typeof saved.exampleCode !== 'string' && saved.code === priorTrapezoidCode)
      )
      return { code: unchangedExample ? exampleCode : saved.code, activeId, exampleCode }
    }
  } catch {
    // Keep using the editor when browser storage is unavailable.
  }
  return null
}

function takeLegacyDraft() {
  const id = location.hash.match(/^#example-([a-z0-9-]+)$/)?.[1]
  try {
    const drafts = JSON.parse(localStorage.getItem('np-repl-example-drafts') || '{}')
    localStorage.removeItem('np-repl-example-drafts')
    if (id && exampleById[id] && typeof drafts?.[id] === 'string' && drafts[id].trim()) {
      return { code: drafts[id], activeId: id }
    }
  } catch {
    try { localStorage.removeItem('np-repl-example-drafts') } catch {}
  }
  return null
}

onMounted(async () => {
  sidebarMenuLabel = document.querySelector('.VPLocalNav .menu-text')
  if (sidebarMenuLabel) {
    originalSidebarMenuLabel = sidebarMenuLabel.textContent
    sidebarMenuLabel.textContent = 'Code examples'
  }

  const codeMirrorReady = await loadCodeMirror()
  if (disposed || !root.value) return

  const container = root.value
  const textarea = container.querySelector('#code')
  const output = container.querySelector('#output')
  outputFrame = output
  window.addEventListener('message', resizeOutput)
  const status = container.querySelector('#status')
  const resetButton = container.querySelector('#reset')
  const lintResults = container.querySelector('#lint-results')
  const savedBuffer = readSessionBuffer()
  const legacyDraft = takeLegacyDraft()
  const initialBuffer = savedBuffer || legacyDraft
  let activeId = initialBuffer?.activeId ?? null
  let exampleCode = initialBuffer?.exampleCode ?? (activeId ? exampleById[activeId].code : null)
  let loadingExample = false
  let runVersion = 0

  editor = codeMirrorReady
    ? window.CodeMirror.fromTextArea(textarea, { lineNumbers: true, mode: 'javascript', tabSize: 2, lineWrapping: true })
    : { getValue: () => textarea.value, setValue: value => { textarea.value = value }, clearHistory: () => {} }

  function clearLintResults() {
    lintResults.replaceChildren()
    lintResults.hidden = true
  }

  function focusCode(line, column) {
    container.querySelector('#code-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (editor.setCursor) {
      editor.setCursor(line - 1, column - 1)
      editor.focus()
    } else {
      const lines = textarea.value.split('\n')
      const offset = lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0) + column - 1
      textarea.focus()
      textarea.setSelectionRange(offset, offset)
    }
  }

  function showLintResults(messages) {
    clearLintResults()
    if (!messages.length) return
    lintResults.hidden = false
    for (const message of messages) {
      const row = document.createElement('p')
      const link = document.createElement('button')
      link.type = 'button'
      link.textContent = `Line ${message.line}`
      link.addEventListener('click', () => focusCode(message.line, message.column))
      row.append(link, document.createTextNode(`: ${message.message}`))
      lintResults.append(row)
    }
  }

  function saveBuffer() {
    if (loadingExample) return
    clearLintResults()
    try {
      const code = editor.getValue()
      if (!code && activeId === null) sessionStorage.removeItem(sessionBufferKey)
      else sessionStorage.setItem(sessionBufferKey, JSON.stringify({ code, activeId, exampleCode }))
    } catch {
      // Keep the current code in the editor when browser storage is unavailable.
    }
  }

  if (initialBuffer) {
    editor.setValue(initialBuffer.code)
    resetButton.disabled = activeId === null
    status.textContent = 'Editor restored'
    saveBuffer()
  }

  loadExampleFromHash = () => {
    const match = location.hash.match(/^#example-([a-z0-9-]+)$/)
    if (!match) return
    const id = match[1]
    const example = exampleById[id]
    if (!example || id === activeId) return
    activeId = id
    exampleCode = example.code
    loadingExample = true
    editor.setValue(example.code)
    loadingExample = false
    editor.clearHistory()
    resetButton.disabled = false
    status.textContent = 'Example loaded'
    saveBuffer()
  }

  window.addEventListener('hashchange', loadExampleFromHash)
  loadExampleFromHash()

  if (codeMirrorReady) editor.on('change', saveBuffer)
  else textarea.addEventListener('input', saveBuffer)

  resetButton.addEventListener('click', () => {
    exampleCode = exampleById[activeId].code
    loadingExample = true
    editor.setValue(exampleCode)
    loadingExample = false
    editor.clearHistory()
    status.textContent = 'Example reset'
    saveBuffer()
  })

  container.querySelector('#clear').addEventListener('click', () => {
    runVersion++
    loadingExample = true
    editor.setValue('')
    loadingExample = false
    activeId = null
    exampleCode = null
    resetButton.disabled = true
    history.replaceState(history.state, '', location.pathname + location.search)
    output.onload = null
    output.srcdoc = ''
    output.style.height = ''
    status.textContent = 'Editor and output cleared'
    saveBuffer()
  })

  container.querySelector('#view-output').addEventListener('click', () => {
    container.querySelector('#output-heading').scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  container.querySelector('#view-code').addEventListener('click', () => {
    container.querySelector('#code-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  container.querySelector('#run').addEventListener('click', async () => {
    const currentRun = ++runVersion
    const code = editor.getValue()
    clearLintResults()
    status.textContent = 'Checking code…'
    let warningCount = 0
    try {
      const [{ lintCode }, publicApi] = await Promise.all([import('./replLint'), loadPublicApi()])
      if (disposed || currentRun !== runVersion) return
      if (code !== editor.getValue()) {
        status.textContent = 'Code changed; press Run again'
        return
      }
      const messages = lintCode(code, publicApi)
      warningCount = messages.length
      showLintResults(messages)
    } catch (error) {
      if (disposed || currentRun !== runVersion) return
      if (code !== editor.getValue()) {
        status.textContent = 'Code changed; press Run again'
        return
      }
      console.error('REPL lint check failed:', error)
      lintResults.textContent = 'Lint check unavailable; running code.'
      lintResults.hidden = false
    }
    const sourceLiteral = JSON.stringify(`${code}\n//# sourceURL=np-debug.js`).replace(/</g, '\\u003c')
    status.textContent = 'Running…'
    output.style.height = ''
    output.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html{overflow-x:auto}body{min-width:720px;font:14px Arial,sans-serif;margin:1rem;color:#1f2937}pre{white-space:pre-wrap}.error{color:#b91c1c}svg{max-width:100%;height:auto}</style></head><body><div id="result"></div><script>const userSource=${sourceLiteral};function reportOutputHeight(){const body=document.body;const bottom=Array.from(body.children).reduce((height,child)=>Math.max(height,child.getBoundingClientRect().bottom),0);const margin=parseFloat(getComputedStyle(body).marginBottom)||0;parent.postMessage({type:'np-repl-chart-height',height:Math.ceil(bottom+margin+4)},'*');}function showError(error){document.getElementById('result').innerHTML='<pre class="error">'+String(error).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre>';requestAnimationFrame(reportOutputHeight);}window.onerror=function(message){showError(message);};function execute(){try{new Function(userSource)();}catch(error){console.error(error);showError(error.stack||error);}requestAnimationFrame(reportOutputHeight);new ResizeObserver(reportOutputHeight).observe(document.body);}<\/script><script src="${withBase('/nP.js')}" onload="execute()" onerror="showError('Unable to load the nP browser bundle.')"><\/script></body></html>`
    output.onload = () => { status.textContent = warningCount ? `Finished (${warningCount} lint warning${warningCount === 1 ? '' : 's'})` : 'Finished' }
  })
})

onUnmounted(() => {
  disposed = true
  if (sidebarMenuLabel?.textContent === 'Code examples') sidebarMenuLabel.textContent = originalSidebarMenuLabel
  window.removeEventListener('message', resizeOutput)
  if (loadExampleFromHash) window.removeEventListener('hashchange', loadExampleFromHash)
  if (editor?.toTextArea) editor.toTextArea()
})
</script>

<template>
  <main ref="root" class="np-repl">
    <h1>nP RF REPL</h1>
    <div class="intro">
      <p>Choose an example or write JavaScript, then press Run. Set <code>nP.global.fList</code> for frequency-dependent circuits; use <code>nP.log(...)</code> to show values.</p>
    </div>
    <div class="workspace">
      <section>
        <div id="code-toolbar" class="toolbar">
          <h2>JS Code</h2>
          <button id="run" type="button">Run</button>
          <button id="view-output" type="button">View output</button>
          <button id="clear" type="button">Clear</button>
          <button id="reset" type="button" disabled>Reset example</button>
          <span id="status" class="status" role="status">Ready</span>
        </div>
        <div id="lint-results" class="lint-results" role="status" aria-live="polite" hidden></div>
        <textarea id="code" aria-label="JavaScript editor"></textarea>
        <div class="output-heading-row">
          <h2 id="output-heading">Output</h2>
          <button id="view-code" type="button">View code</button>
        </div>
        <iframe id="output" title="REPL output" sandbox="allow-scripts" allow="clipboard-write"></iframe>
        <p class="note">The editor survives refreshes in this tab and is normally cleared when the tab closes. Code runs in an isolated output frame.</p>
      </section>
    </div>
  </main>
</template>

<style>
.np-repl { box-sizing: border-box; width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 2rem 2rem; font-family: Arial, sans-serif; color: var(--vp-c-text-1); }
.np-repl .workspace { min-width: 0; container: repl-workspace / inline-size; }
.np-repl h1 { margin: 0 0 .5rem; font-size: 2rem; }
.np-repl .intro { color: var(--vp-c-text-2); }
.np-repl .intro p { margin: .5rem 0; }
.np-repl .toolbar { display: flex; align-items: center; gap: 1rem; margin: 1.25rem 0 .5rem; }
.np-repl .toolbar button, .np-repl .output-heading-row button { height: 40px; border: 1px solid var(--vp-button-brand-border); border-radius: 20px; padding: 0 20px; color: var(--vp-button-brand-text); background: var(--vp-button-brand-bg); font-family: var(--vp-font-family-base); font-size: 14px; font-weight: 600; line-height: 38px; white-space: nowrap; cursor: pointer; }
.np-repl .toolbar button:hover, .np-repl .output-heading-row button:hover { border-color: var(--vp-button-brand-hover-border); color: var(--vp-button-brand-hover-text); background: var(--vp-button-brand-hover-bg); }
.np-repl .toolbar button:disabled { opacity: .5; cursor: not-allowed; }
.np-repl .status { color: var(--vp-c-text-2); font-size: .9rem; }
.np-repl .CodeMirror { height: 420px; border: 1px solid var(--vp-c-divider); border-radius: 8px; font-size: .95rem; color: var(--vp-c-text-1); background: var(--vp-c-bg); }
.np-repl textarea { display: block; width: 100%; min-height: 420px; }
.np-repl .lint-results:not([hidden]) { margin-bottom: .5rem; padding: .5rem .75rem; border: 1px solid #d97706; border-radius: 8px; color: var(--vp-c-text-1); background: var(--vp-c-bg-soft); }
.np-repl .lint-results p { margin: .25rem 0; }
.np-repl .lint-results button { padding: 0; color: var(--vp-c-brand-1); text-decoration: underline; cursor: pointer; }
.np-repl h2 { margin: 1.5rem 0 .5rem; font-size: 1.2rem; }
.np-repl .output-heading-row { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0 .5rem; }
.np-repl .toolbar h2, .np-repl .output-heading-row h2 { margin: 0; padding: 0; border: 0; }
.np-repl #code-toolbar,
.np-repl #output-heading { scroll-margin-top: calc(var(--vp-nav-height, 64px) + 1rem); }
.np-repl iframe { width: 100%; min-height: 360px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: white; }
.np-repl .note { margin-top: 1rem; color: var(--vp-c-text-2); font-size: .9rem; }
@media (max-width: 767px) {
  .np-repl { padding: 0 1rem 1rem; }
}
@container repl-workspace (max-width: 700px) {
  .np-repl .toolbar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; width: min(100%, 19rem); }
  .np-repl .toolbar h2, .np-repl .toolbar .status { grid-column: 1 / -1; }
}
@container repl-workspace (max-width: 303px) {
  .np-repl .toolbar { grid-template-columns: 9.25rem; }
}
</style>
