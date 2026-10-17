<script setup>
// Modified: 2026-10-16
import { onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { examples } from './replExamples'

const root = ref(null)
let editor
let disposed = false

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
    return JSON.parse(localStorage.getItem('np-repl-example-drafts') || '{}')
  } catch {
    return {}
  }
}

onMounted(async () => {
  const codeMirrorReady = await loadCodeMirror()
  if (disposed || !root.value) return

  const container = root.value
  const textarea = container.querySelector('#code')
  const output = container.querySelector('#output')
  const status = container.querySelector('#status')
  const exampleList = container.querySelector('#examples')
  let drafts = readDrafts()
  let activeIndex = 0

  editor = codeMirrorReady
    ? window.CodeMirror.fromTextArea(textarea, { lineNumbers: true, mode: 'javascript', tabSize: 2, lineWrapping: true })
    : { getValue: () => textarea.value, setValue: value => { textarea.value = value }, clearHistory: () => {} }

  function saveDraft() {
    drafts[activeIndex] = editor.getValue()
    try {
      localStorage.setItem('np-repl-example-drafts', JSON.stringify(drafts))
    } catch {
      // Keep the draft in memory when browser storage is unavailable.
    }
  }

  examples.forEach((example, index) => {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.className = 'example-button' + (index === 0 ? ' active' : '')
    button.type = 'button'
    button.textContent = example.title
    button.addEventListener('click', () => {
      saveDraft()
      activeIndex = index
      editor.setValue(drafts[index] ?? example.code)
      editor.clearHistory()
      exampleList.querySelectorAll('.example-button').forEach(entry => entry.classList.remove('active'))
      button.classList.add('active')
      status.textContent = 'Example loaded'
    })
    item.appendChild(button)
    exampleList.appendChild(item)
  })

  editor.setValue(drafts[0] ?? examples[0].code)
  if (codeMirrorReady) editor.on('change', saveDraft)
  else textarea.addEventListener('input', saveDraft)

  container.querySelector('#reset').addEventListener('click', () => {
    delete drafts[activeIndex]
    editor.setValue(examples[activeIndex].code)
    saveDraft()
    editor.clearHistory()
    status.textContent = 'Example reset'
  })

  container.querySelector('#run').addEventListener('click', () => {
    const sourceLiteral = JSON.stringify(editor.getValue()).replace(/</g, '\\u003c')
    status.textContent = 'Running…'
    output.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>body{font:14px Arial,sans-serif;margin:1rem;color:#1f2937}pre{white-space:pre-wrap}.error{color:#b91c1c}svg{max-width:100%;height:auto}</style></head><body><div id="result"></div><script>const userSource=${sourceLiteral};function showError(error){document.getElementById('result').innerHTML='<pre class="error">'+String(error).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre>';}window.onerror=function(message){showError(message);};function execute(){try{new Function(userSource)();}catch(error){showError(error.stack||error);}}<\/script><script src="${withBase('/nP.js')}" onload="execute()" onerror="showError('Unable to load the nP browser bundle.')"><\/script></body></html>`
    output.onload = () => { status.textContent = 'Finished' }
  })
})

onUnmounted(() => {
  disposed = true
  if (editor?.toTextArea) editor.toTextArea()
})
</script>

<template>
  <main ref="root" class="np-repl">
    <h1>nP RF REPL</h1>
    <p class="intro">Choose a starter example, edit the JavaScript, press Run, and inspect the result below.</p>
    <div class="workspace">
      <aside>
        <div class="instructions">
          <h2>Instructions</h2>
          <p>Each example runs in an isolated browser frame with the global <code>nP</code> object available.</p>
          <ol>
            <li>Choose an example.</li>
            <li>Modify the code.</li>
            <li>Press <strong>Run</strong>.</li>
            <li>Read the output or chart.</li>
          </ol>
          <p>Set <code>nP.global.fList</code> before creating frequency-dependent circuits. Use <code>nP.log(...)</code> to print values.</p>
        </div>
        <h2>Examples</h2>
        <ol id="examples" aria-label="REPL starter examples"></ol>
      </aside>
      <section>
        <div class="toolbar">
          <button id="run" type="button">Run</button>
          <button id="reset" type="button">Reset example</button>
          <span id="status" class="status" role="status">Ready</span>
        </div>
        <textarea id="code" aria-label="JavaScript editor"></textarea>
        <h2>Output</h2>
        <iframe id="output" title="REPL output" sandbox="allow-scripts"></iframe>
        <p class="note">Code runs in an isolated output frame using the site's nP browser bundle.</p>
      </section>
    </div>
  </main>
</template>

<style>
.np-repl { box-sizing: border-box; width: 100%; max-width: 1280px; margin: 0 auto; padding: 2rem; font-family: Arial, sans-serif; color: var(--vp-c-text-1); }
.np-repl .workspace { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 2rem; align-items: start; }
.np-repl .workspace > * { min-width: 0; }
.np-repl aside { position: sticky; top: 5rem; }
.np-repl aside h2 { margin-top: 0; }
.np-repl aside p, .np-repl aside li { color: var(--vp-c-text-2); font-size: .9rem; line-height: 1.45; }
.np-repl aside ol { margin: .5rem 0 0; padding-left: 1.25rem; }
.np-repl .example-button { display: block; width: 100%; margin: .35rem 0; padding: .45rem .55rem; border: 0; border-radius: 6px; color: var(--vp-c-brand-1); background: transparent; text-align: left; font-weight: 600; cursor: pointer; }
.np-repl .example-button:hover, .np-repl .example-button.active { background: var(--vp-c-bg-soft); }
.np-repl .instructions { padding-bottom: 1rem; border-bottom: 1px solid var(--vp-c-divider); }
.np-repl h1 { margin: 0 0 .5rem; font-size: 2rem; }
.np-repl .intro { margin-top: 0; color: var(--vp-c-text-2); }
.np-repl .toolbar { display: flex; align-items: center; gap: 1rem; margin: 1.25rem 0 .5rem; }
.np-repl .toolbar button { border: 0; border-radius: 999px; padding: .65rem 1.25rem; color: white; background: var(--vp-c-brand-1); font-weight: 700; cursor: pointer; }
.np-repl .toolbar button:hover { background: var(--vp-c-brand-2); }
.np-repl .status { color: var(--vp-c-text-2); font-size: .9rem; }
.np-repl .CodeMirror { height: 420px; border: 1px solid var(--vp-c-divider); border-radius: 8px; font-size: .95rem; color: var(--vp-c-text-1); background: var(--vp-c-bg); }
.np-repl textarea { display: block; width: 100%; min-height: 420px; }
.np-repl h2 { margin: 1.5rem 0 .5rem; font-size: 1.2rem; }
.np-repl iframe { width: 100%; min-height: 360px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: white; }
.np-repl .note { margin-top: 1rem; color: var(--vp-c-text-2); font-size: .9rem; }
@media (max-width: 800px) { .np-repl .workspace { grid-template-columns: 1fr; } .np-repl aside { position: static; } }
@media (max-width: 640px) { .np-repl { padding: 1rem; } .np-repl .toolbar { flex-wrap: wrap; } }
</style>
