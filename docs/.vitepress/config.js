// Modified: 2026-10-16
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
            { text: 'Guide', link: '/introduction' },
            { text: 'REPL', link: '/repl.html', activeMatch: '^$' },
            { text: 'npm', link: 'https://www.npmjs.com/package/@jerrywiltz/np' },
            { text: 'Obsidian', link: 'https://community.obsidian.md/plugins/np-rf-analysis' },
            { text: 'GitHub', link: 'https://github.com/JerryWiltz/nP' }
        ],
        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Hello, nPort!', link: '/hello-nport' },
                    { text: 'Introduction', link: '/introduction' }
                ]
            },
            {
                text: 'More info',
                items: [
                    { text: 'Tutorial', link: '/tutorial' },
                    { text: 'Noise figure and intermodulation', link: '/noise-and-intermodulation' }
                ]
            },
            {
                text: 'API',
                items: [
                    { text: 'RF Constructors', link: '/rf-constructors' },
                    { text: 'Detailed API reference', link: '/guide' }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/JerryWiltz/nP' }
        ]
    }
}
