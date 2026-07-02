# AGENTS.md
<!-- Modified: 2026-07-02 -->

Instructions for files in `dev/raw/`.

This directory is for raw technical source material, equation notes, and early derivations. It is not runtime source code and is not part of the Rollup build.

- Keep papers, copied notes, screenshots, and equation-capture files here while researching a model.
- Preserve source attribution: include paper title, author, publication/source, page, figure, and equation number when available.
- Prefer short summary notes over long verbatim copied text. Avoid storing full copyrighted papers in git unless the user explicitly decides the file should be tracked and has the right to store it.
- Use ASCII text when writing notes unless equations require a specific symbol.
- When transcribing equations for implementation, record the physical meaning and units of every variable.
- Keep spelling and capitalization of physical constants consistent with `src/np-nport/src/mlin/constants.js`. Do not invent alternate names such as `c0`, `speedOfLight`, or `eta0` in notes when the shared implementation name is `C0` or `VACUUM_IMPEDANCE`.
- When a paper uses different symbols for the same constant, write the paper symbol and the nP name together, for example `c = C0`, `epsilon_0 = EPSILON0`, `mu_0 = MU0`, or `eta_0 = VACUUM_IMPEDANCE`.
- Preserve standard author, paper, and model-family spellings in filenames, headings, notes, and citations. In particular, use `Hammerstad/Jensen`, not misspellings such as `Hammestad` or `Jensn`.
- When unsure about a paper author, equation family, or model name, verify the spelling before creating filenames or headings.
- For `mtee()` research, focus on equations that map physical dimensions, material constants, and frequency to equivalent circuit values or S-parameters.
- Do not edit `src/` from this directory. Move implementation work to `src/np-nport/src/mlin/` only after the equations and assumptions are clear.
