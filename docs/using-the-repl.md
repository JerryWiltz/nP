---
title: Using the REPL
outline: [2, 2]
---

<!-- Modified: 2026-10-18 -->

# Using the REPL

The [nP REPL](./repl.md) lets you run JavaScript with the site's nP browser bundle. The editor starts empty. Type your own code or choose a starter example from the left sidebar, then press **Run**. Results appear in **Output** below the editor. Each run uses a fresh, isolated output frame.

For circuits that depend on frequency, set `nP.global.fList` before creating components. Use `nP.log(...)` to show values in **Output**. Use `console.log(...)` when you want to inspect values in the browser's developer console.

## Buttons

- **Run** checks the current code for lint warnings, then executes it.
- **View output** scrolls to the Output area.
- **Clear** empties both the editor and Output and clears the current editor buffer. You can select the same example again afterward.
- **Reset example** restores the selected starter example to its original code. It is available after you select an example.
- **View code** beside the Output heading scrolls back to the editor.

## Run a starter example

1. Open the [REPL](./repl.md) and choose an example in its left sidebar. Its JavaScript loads into the editor.
2. Read or edit the code, then press **Run**.
3. Inspect **Output**. A chart or table appears there when the example calls `nP.lineChart()`, `nP.smithChart()`, or `nP.lineTable()`.

You can also begin with an empty editor and type your own circuit. Selecting a different example replaces the editor contents. **Reset example** restores the currently selected example; **Clear** removes the selection and leaves the editor blank.

## Copy and paste PNG or CSV

Charts and tables provide their own copy buttons inside **Output**:

- On a line chart, Smith chart, or line table, click **Copy PNG** to put an image on the clipboard. Switch to an application that accepts pasted images and press **Ctrl+V** (or use that application's Paste command).
- On a line table, click **Copy CSV** to put comma-separated table text on the clipboard. Paste it into a spreadsheet or text editor.

These buttons copy to the clipboard; they do not save a `.png` or `.csv` file. Your browser may ask for clipboard permission. Clipboard copying works on the published HTTPS site and on a local `localhost` preview when the browser supports the relevant clipboard format.

## Automatic lint warnings

When you press **Run**, the REPL checks the editor before execution. Warnings appear immediately below the Run buttons and above the editor. Click a warning's line number to move the editor cursor there. Warnings do not prevent the code from running.

The current checks look for unexpected line continuations, accidental comma expressions, and direct calls to unknown nP API names. For example, `nP.r()` suggests `nP.R()`. The linter also reports JavaScript syntax errors. It checks direct calls such as `nP.R()`; it cannot reliably identify every name reached through variables or computed expressions.

## Debug with DevTools

1. Press **Run** and read the error in **Output**. A stack trace shows where the error was detected; the mistake may be on an earlier line.
2. Open your browser's developer tools and select **Console**. The REPL also logs the error there as an Error object. Your own `console.log(...)` messages appear there too.
3. In the Console error, find the stack entry containing **`np-debug.js:line:column`** and click it. DevTools opens the code from that run in **Sources** at the indicated location. If the first entries point to `nP.js`, look farther down the stack for `np-debug.js`; that is your editor code.
4. Check the indicated line and the code that builds its inputs. Fix the editor text and press **Run** again.

`np-debug.js` is a name the REPL gives to the code it runs so DevTools can find it. It is not a file you need to create or find in the repository. DevTools may show a small line offset because the browser wraps the editor code before running it.

## Editor storage and the browser tab

The REPL keeps **one editor buffer** in the browser tab used for the nP site. Edits survive a refresh and navigation between the landing page and REPL in that same tab. Loading another example replaces the buffer; **Clear** removes it. Separate tabs do not share ongoing edits.

Closing that tab normally removes its buffer. Some browsers can restore a closed tab's session, including its buffer. If you want to keep code independently of the tab, copy it into a file before closing it.
