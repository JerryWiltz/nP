// Modified: 2026-11-26
import { examples } from './theme/replExamples.js'

function replSidebarItems(category) {
    return examples.flatMap(example =>
        (example.category || 'examples') === category
            ? [{ text: example.title, link: `/repl.html#example-${example.id}` }]
            : []
    )
}

const config = {
    title: 'nP Docs',
    description: 'Documentation for the nP project',
    base: '/nP/',
    markdown: {
        math: true
    },

    // Keep archived material and repository instructions out of the site.
    srcExclude: ['_*/**', '**/AGENTS.md'],

    themeConfig: {
        logo: { src: '/nPortLogo.svg', alt: 'nP home' },
        siteTitle: false,
        nav: [
            { text: "What's new", link: '/whats-new-0-49-0' },
            { text: 'Guide', link: '/agentic-nport' },
            { text: 'REPL', link: '/repl.html', activeMatch: '^$' },
            { text: 'Tech Notes', link: '/tech-notes-s-parameters-for-the-novice', activeMatch: '^/tech-notes' },
            { text: 'npm', link: 'https://www.npmjs.com/package/@jerrywiltz/np' },
            { text: 'Obsidian', link: 'https://community.obsidian.md/plugins/np-rf-analysis' },
            { text: 'GitHub', link: 'https://github.com/JerryWiltz/nP' }
        ],
        sidebar: {
          '/tech-notes': [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Overview', link: '/tech-notes' }
                ]
            },
            {
                text: 'RF notes',
                items: [
                    { text: 'S-parameters for the novice', link: '/tech-notes-s-parameters-for-the-novice' },
                    { text: 'nPort overview', link: '/tech-notes-nport-overview' },
                    { text: 'NPN constructor', link: '/tech-notes-npn-constructor' },
                    { text: 'VNA time-domain reflection', link: '/tech-notes-vna-time-domain-reflection' },
                    { text: 'VNA frequency-domain measurement', link: '/tech-notes-vna-frequency-domain-measurement' }
                ]
            },
            {
                text: 'Digital notes',
                items: [
                    { text: 'Sampling and quantization', link: '/tech-notes-sampling-and-quantization' },
                    { text: 'Waveform in nPort', link: '/tech-notes-waveform-in-nport' },
                    { text: 'FFT in nPort', link: '/tech-notes-fft-in-nport' },
                    { text: 'mod() in nPort', link: '/tech-notes-mod-in-nport' }
                ]
            }
          ],
          '/repl': [
            { text: 'Getting Started', items: replSidebarItems('getting-started') },
            { text: 'RF Circuits', items: replSidebarItems('rf-circuits') },
            { text: 'Charts & Tables', items: replSidebarItems('charts-tables') },
            { text: 'Math Examples', items: replSidebarItems('math') },
            { text: 'Filters', items: replSidebarItems('filters') },
            { text: 'Microstrip', items: replSidebarItems('microstrip') },
            { text: 'Noise', items: replSidebarItems('noise') },
            { text: 'Intermodulation', items: replSidebarItems('intermodulation') },
            { text: 'Nonlinear', items: replSidebarItems('nonlinear') },
            { text: 'Analog Modulation', items: replSidebarItems('analog-modulation') },
            { text: 'Digital Signals', items: replSidebarItems('digital-signals') }
          ],
          '/': [
            {
                text: 'Getting started',
                items: [
                    { text: 'Agentic nPort', link: '/agentic-nport' },
                    { text: 'Hello nPort', link: '/hello-nport' },
                    { text: 'Introduction', link: '/introduction' },
                    { text: 'Symbol library', link: '/canonical-symbols' },
                    { text: 'Using the REPL', link: '/using-the-repl' },
                    { text: 'Tutorial', link: '/tutorial' }
                ]
            },
            {
                text: 'Core workflow',
                items: [
                    { text: 'Global settings', link: '/global-settings' },
                    { text: 'nPort object', link: '/nport-object' },
                    { text: 'RF constructors', link: '/rf-constructors' },
                    { text: 'Connecting nPorts', link: '/connecting-nports' },
                    { text: 'Charts, tables, and logs', link: '/charts-tables-and-logs' },
                    { text: 'Output units', link: '/output-units' },
                    { text: 'Schematics', link: '/schematics' }
                ]
            },
            {
                text: 'Component library',
                items: [
                    { text: 'Lumped components', link: '/lumped-components' },
                    { text: 'Ideal components', link: '/ideal-components' },
                    { text: 'Transistors and Diodes', link: '/diodes-and-active-components' },
                    { text: 'Filters', link: '/filters' },
                    { text: 'Microstrip', link: '/microstrip' }
                ]
            },
            {
                text: 'Analysis',
                items: [
                    { text: 'DC bias analysis', link: '/dc-bias-analysis' },
                    { text: 'Noise', link: '/noise' },
                    { text: 'Intermodulation', link: '/intermodulation' },
                    { text: 'Time-domain signals', link: '/digital-signals' }
                ]
            },
            {
                text: 'Examples',
                items: [
                    { text: 'Circuit examples', link: '/circuit-examples' }
                ]
            },
            {
                text: 'Reference and updates',
                items: [
                    { text: 'Math', link: '/math' },
                    { text: "What's new in 0.49.0", link: '/whats-new-0-49-0' }
                ]
            }
          ]
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/JerryWiltz/nP' }
        ]
    }
}

// Match the Guide's actual pages without duplicating its sidebar route list.
const whatsNewLink = config.themeConfig.nav.find(item => item.text === "What's new").link
const guideLinks = config.themeConfig.sidebar['/'].flatMap(group => group.items)
    .map(item => item.link)
    .filter(link => link !== whatsNewLink)
    .map(link => link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
config.themeConfig.nav.find(item => item.text === 'Guide').activeMatch =
    `^(?:${guideLinks.join('|')})(?:\\.html)?/?$`

export default config
