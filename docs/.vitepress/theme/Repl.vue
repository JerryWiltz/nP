<script setup>
// Modified: 2026-10-17
import { onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { examples } from './replExamples'

const root = ref(null)
const exampleById = Object.fromEntries(examples.map(example => [example.id, example]))
let editor
let disposed = false
let outputFrame
let loadExampleFromHash

function resizeSingleChart(event) {
  if (event.source !== outputFrame?.contentWindow || event.data?.type !== 'np-repl-single-chart-height') return
  const height = Number(event.data.height)
  if (Number.isFinite(height) && height > 0 && height < 10000) {
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

function readDrafts() {
  try {
    const saved = JSON.parse(localStorage.getItem('np-repl-example-drafts') || '{}')
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
  } catch {
    return {}
  }
}

function sameCodeIgnoringWhitespace(left, right) {
  return left.replace(/\s+/g, '') === right.replace(/\s+/g, '')
}

onMounted(async () => {
  const codeMirrorReady = await loadCodeMirror()
  if (disposed || !root.value) return

  const container = root.value
  const textarea = container.querySelector('#code')
  const output = container.querySelector('#output')
  outputFrame = output
  window.addEventListener('message', resizeSingleChart)
  const status = container.querySelector('#status')
  const resetButton = container.querySelector('#reset')
  let drafts = readDrafts()
  let activeId = null
  let loadingExample = false

  editor = codeMirrorReady
    ? window.CodeMirror.fromTextArea(textarea, { lineNumbers: true, mode: 'javascript', tabSize: 2, lineWrapping: true })
    : { getValue: () => textarea.value, setValue: value => { textarea.value = value }, clearHistory: () => {} }

  function saveDraft() {
    if (activeId === null || loadingExample) return
    const value = editor.getValue()
    if (value.trim() && !sameCodeIgnoringWhitespace(value, exampleById[activeId].code)) drafts[activeId] = value
    else delete drafts[activeId]
    try {
      localStorage.setItem('np-repl-example-drafts', JSON.stringify(drafts))
    } catch {
      // Keep the draft in memory when browser storage is unavailable.
    }
  }

  loadExampleFromHash = () => {
    const match = location.hash.match(/^#example-([a-z0-9-]+)$/)
    if (!match) return
    const id = match[1]
    const example = exampleById[id]
    if (!example || id === activeId) return
    saveDraft()
    activeId = id
    loadingExample = true
    const draft = drafts[id]
    if (typeof draft === 'string' && sameCodeIgnoringWhitespace(draft, example.code)) delete drafts[id]
    editor.setValue(typeof draft === 'string' && draft.trim() && !sameCodeIgnoringWhitespace(draft, example.code) ? draft : example.code)
    loadingExample = false
    editor.clearHistory()
    resetButton.disabled = false
    status.textContent = 'Example loaded'
  }

  window.addEventListener('hashchange', loadExampleFromHash)
  loadExampleFromHash()

  if (codeMirrorReady) editor.on('change', saveDraft)
  else textarea.addEventListener('input', saveDraft)

  resetButton.addEventListener('click', () => {
    delete drafts[activeId]
    loadingExample = true
    editor.setValue(exampleById[activeId].code)
    loadingExample = false
    try {
      localStorage.setItem('np-repl-example-drafts', JSON.stringify(drafts))
    } catch {
      // Keep the draft in memory when browser storage is unavailable.
    }
    editor.clearHistory()
    status.textContent = 'Example reset'
  })

  container.querySelector('#clear').addEventListener('click', () => {
    editor.setValue('')
    saveDraft()
    output.onload = null
    output.srcdoc = ''
    output.style.height = ''
    status.textContent = 'Editor and output cleared'
  })

  container.querySelector('#view-output').addEventListener('click', () => {
    container.querySelector('#output-heading').scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  container.querySelector('#view-code').addEventListener('click', () => {
    container.querySelector('#code-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  container.querySelector('#run').addEventListener('click', () => {
    const sourceLiteral = JSON.stringify(editor.getValue()).replace(/</g, '\\u003c')
    status.textContent = 'Running…'
    output.style.height = ''
    output.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>body{font:14px Arial,sans-serif;margin:1rem;color:#1f2937}pre{white-space:pre-wrap}.error{color:#b91c1c}svg{max-width:100%;height:auto}</style></head><body><div id="result"></div><script>const userSource=${sourceLiteral};function showError(error){document.getElementById('result').innerHTML='<pre class="error">'+String(error).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre>';}function reportChartHeight(){if(document.querySelectorAll('svg.svgContainerClass,svg.smith-chart-svg').length!==1)return;const margin=parseFloat(getComputedStyle(document.body).marginBottom)||0;const height=Math.ceil(document.body.getBoundingClientRect().bottom+margin+4);parent.postMessage({type:'np-repl-single-chart-height',height},'*');}window.onerror=function(message){showError(message);};function execute(){try{new Function(userSource)();requestAnimationFrame(reportChartHeight);new ResizeObserver(reportChartHeight).observe(document.body);}catch(error){showError(error.stack||error);}}<\/script><script src="${withBase('/nP.js')}" onload="execute()" onerror="showError('Unable to load the nP browser bundle.')"><\/script></body></html>`
    output.onload = () => { status.textContent = 'Finished' }
  })
})

onUnmounted(() => {
  disposed = true
  window.removeEventListener('message', resizeSingleChart)
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
        <textarea id="code" aria-label="JavaScript editor"></textarea>
        <div class="output-heading-row">
          <h2 id="output-heading">Output</h2>
          <button id="view-code" type="button">View Code</button>
        </div>
        <iframe id="output" title="REPL output" sandbox="allow-scripts"></iframe>
        <p class="note">Code runs in an isolated output frame using the site's nP browser bundle.</p>
      </section>
    </div>
  </main>
</template>

<style>
.np-repl { box-sizing: border-box; width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 2rem 2rem; font-family: Arial, sans-serif; color: var(--vp-c-text-1); }
.np-repl .workspace { min-width: 0; }
.np-repl h1 { margin: 0 0 .5rem; font-size: 2rem; }
.np-repl .intro { color: var(--vp-c-text-2); }
.np-repl .intro p { margin: .5rem 0; }
.np-repl .toolbar { display: flex; align-items: center; gap: 1rem; margin: 1.25rem 0 .5rem; }
.np-repl .toolbar button, .np-repl .output-heading-row button { border: 0; border-radius: 999px; padding: .65rem 1.25rem; color: white; background: var(--vp-c-brand-1); font-weight: 700; cursor: pointer; }
.np-repl .toolbar button:hover, .np-repl .output-heading-row button:hover { background: var(--vp-c-brand-2); }
.np-repl .toolbar button:disabled { opacity: .5; cursor: not-allowed; }
.np-repl .status { color: var(--vp-c-text-2); font-size: .9rem; }
.np-repl .CodeMirror { height: 420px; border: 1px solid var(--vp-c-divider); border-radius: 8px; font-size: .95rem; color: var(--vp-c-text-1); background: var(--vp-c-bg); }
.np-repl textarea { display: block; width: 100%; min-height: 420px; }
.np-repl h2 { margin: 1.5rem 0 .5rem; font-size: 1.2rem; }
.np-repl .output-heading-row { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0 .5rem; }
.np-repl .toolbar h2, .np-repl .output-heading-row h2 { margin: 0; padding: 0; border: 0; }
.np-repl #code-toolbar,
.np-repl #output-heading { scroll-margin-top: calc(var(--vp-nav-height, 64px) + 1rem); }
.np-repl iframe { width: 100%; min-height: 360px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: white; }
.np-repl .note { margin-top: 1rem; color: var(--vp-c-text-2); font-size: .9rem; }
@media (max-width: 640px) { .np-repl { padding: 0 1rem 1rem; } .np-repl .toolbar { flex-wrap: wrap; } }
</style>
