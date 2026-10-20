// Modified: 2026-10-19
import { examples } from './theme/replExamples.js'

function replSidebarItems(category) {
    return examples.flatMap(example =>
        (example.category || 'examples') === category
            ? [{ text: example.title, link: `/repl.html#example-${example.id}` }]
            : []
    )
}

export default {
    title: 'nP Docs',
    description: 'Documentation for the nP project',
    base: '/nP/',

    // Keep archived material and repository instructions out of the site.
    srcExclude: ['_*/**', '**/AGENTS.md'],

    themeConfig: {
        logo: { src: '/nPortLogo.svg', alt: 'nP home' },
        siteTitle: false,
        nav: [
            { text: 'Guide', link: '/hello-nport' },
            { text: 'REPL', link: '/repl.html', activeMatch: '^$' },
            { text: 'npm', link: 'https://www.npmjs.com/package/@jerrywiltz/np' },
            { text: 'Obsidian', link: 'https://community.obsidian.md/plugins/np-rf-analysis' },
            { text: 'GitHub', link: 'https://github.com/JerryWiltz/nP' }
        ],
        sidebar: {
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
                text: 'Getting Started',
                items: [
                    { text: 'Hello nPort', link: '/hello-nport' },
                    { text: 'Introduction', link: '/introduction' }
                ]
            },
            {
                text: 'REPL',
                items: [
                    { text: 'Using the REPL', link: '/using-the-repl' }
                ]
            },
            {
                text: 'More info',
                items: [
                    { text: 'Tutorial', link: '/tutorial' },
                    { text: 'Circuit examples', link: '/circuit-examples' }
                ]
            },
            {
                text: 'API',
                items: [
                    { text: 'Global settings', link: '/global-settings' },
                    { text: 'nPort object', link: '/nport-object' },
                    { text: 'RF Constructors', link: '/rf-constructors' },
                    { text: 'Connecting nPorts', link: '/connecting-nports' },
                    { text: 'Charts, tables, and logs', link: '/charts-tables-and-logs' },
                    { text: 'Noise', link: '/noise' },
                    { text: 'Intermodulation', link: '/intermodulation' },
                    { text: 'Digital signals', link: '/digital-signals' },
                    { text: 'Math', link: '/math' },
                    { text: 'Ideal components', link: '/ideal-components' },
                    { text: 'Lumped components', link: '/lumped-components' },
                    { text: 'Filters', link: '/filters' },
                    { text: 'Microstrip', link: '/microstrip' },
                    { text: 'Diodes and active components', link: '/diodes-and-active-components' }
                ]
            }
          ]
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/JerryWiltz/nP' }
        ]
    }
}
