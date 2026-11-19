<!-- Modified: 2026-11-18 -->
<script setup>
import catalog from '../../../schematics/symbol-catalog.json'

const artwork = import.meta.glob('../../../schematics/symbols/*.svg', {
    eager: true,
    import: 'default',
    query: '?url&no-inline'
})

const names = new Map()

function addName(filename, name) {
    const existing = names.get(filename) || []
    names.set(filename, [...existing, name])
}

for (const [name, filename] of Object.entries(catalog.constructors)) {
    addName(filename, `${name}()`)
}
for (const [name, variants] of Object.entries(catalog.symbolVariants)) {
    for (const [variant, filename] of Object.entries(variants)) {
        names.set(filename, (names.get(filename) || []).filter(label => label !== `${name}()`))
        addName(filename, `${name}() (${variant})`)
    }
}
for (const mapping of [catalog.sourceSymbols, catalog.deviceSymbols]) {
    for (const [name, filename] of Object.entries(mapping)) addName(filename, name)
}

const symbols = Object.entries(artwork).map(([source, url]) => {
    const filename = source.split('/').pop()
    return {filename, url, label: (names.get(filename) || [filename]).join(', ')}
}).sort((first, second) => first.label.localeCompare(second.label, 'en'))

const signals = new Set(catalog.signalSymbols)
const sources = new Set(Object.values(catalog.sourceSymbols))
const devices = new Set(Object.values(catalog.deviceSymbols))
const groups = [
    {id: 'rf-symbols', title: 'RF components and networks',
        symbols: symbols.filter(symbol => !signals.has(symbol.filename)
            && !sources.has(symbol.filename) && !devices.has(symbol.filename))},
    {id: 'signal-symbols', title: 'Signal and analysis blocks',
        symbols: symbols.filter(symbol => signals.has(symbol.filename))},
    {id: 'source-symbols', title: 'Source artwork',
        symbols: symbols.filter(symbol => sources.has(symbol.filename))},
    {id: 'device-symbols', title: 'Device artwork',
        symbols: symbols.filter(symbol => devices.has(symbol.filename))}
].filter(group => group.symbols.length)
</script>

<template>
    <p>{{ symbols.length }} canonical symbols. The gallery uses the original artwork and catalog directly.</p>
    <section v-for="group in groups" :key="group.id" class="canonical-symbol-group">
        <h2 :id="group.id">{{ group.title }}</h2>
        <div class="canonical-symbol-grid">
            <figure v-for="symbol in group.symbols" :key="symbol.filename" class="canonical-symbol">
                <figcaption>
                    <strong>{{ symbol.label }}</strong>
                    <span>{{ symbol.filename }}</span>
                </figcaption>
                <a :href="symbol.url" :aria-label="`Open ${symbol.filename} at full size`">
                    <img :src="symbol.url" :alt="`${symbol.label}: canonical symbol with numbered connectors`" loading="lazy">
                </a>
            </figure>
        </div>
    </section>
</template>

<style scoped>
.canonical-symbol-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.canonical-symbol {
    margin: 0;
    padding: 16px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    background: var(--vp-c-bg-soft);
}

.canonical-symbol figcaption {
    margin-bottom: 12px;
    overflow-wrap: anywhere;
}

.canonical-symbol figcaption span {
    display: block;
    color: var(--vp-c-text-2);
    font-size: 12px;
}

.canonical-symbol a {
    display: flex;
    min-height: 180px;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border-radius: 4px;
}

.canonical-symbol img {
    display: block;
    max-width: 100%;
    height: auto;
}

.canonical-symbol a:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 3px;
}

@media (max-width: 639px) {
    .canonical-symbol-grid {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
