// Modified: 2026-09-07
export default {
    title: 'nP Docs',
    description: 'Documentation for the nP project',
    base: '/nP/',

    // Keep archived material and repository instructions out of the site.
    srcExclude: ['_*/**', '**/AGENTS.md'],

    themeConfig: {
        nav: [
            { text: 'Guide', link: '/' },
            { text: 'API reference', link: '/legacy-api-reference' },
            { text: 'REPL', link: '/repl.html', target: '_blank', rel: 'noreferrer' },
            { text: 'npm', link: 'https://www.npmjs.com/package/@jerrywiltz/np' },
            { text: 'GitHub', link: 'https://github.com/JerryWiltz/nP' }
        ],
        sidebar: [
            {
                text: 'Getting started',
                items: [
                    { text: 'Overview', link: '/' },
                    { text: 'API reference', link: '/legacy-api-reference' }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/JerryWiltz/nP' }
        ]
    }
}
