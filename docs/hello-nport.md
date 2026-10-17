<!-- Modified: 2026-10-16 -->
# Hello, nPort!

This first example loads the nP browser bundle and writes a "Hello, nPort!" message into the page with `nP.log()`. This nP function is like the `console.log()`  in JavaScript. `nP.log()` renders in the html page, not in the dev tools console. So once you get this to run in nP, everything in nP should run.

## Get `nP.js`

The ready-to-use browser bundle is `dist/nP.js` in the nP repository. You need this one file for the example; you do not need to copy the individual files from `src/`.

If you have the repository open in VS Code, expand `dist/`, copy `nP.js`, and paste it into the folder where you will save `hello-nport.html`. The files should sit side by side:

```text
my-example/
├── hello-nport.html
└── nP.js
```

You can also [download `dist/nP.js` from GitHub](https://raw.githubusercontent.com/JerryWiltz/nP/master/dist/nP.js) and save it as `nP.js` in that folder. The GitHub file is the committed version; the local `dist/nP.js` may include changes that have not been pushed yet.

## Run it yourself

Copy the following into `hello-nport.html`, then open that file in your browser.

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hello, nPort!</title>
    <script src="./nP.js"></script>
</head>
<body>
    <script>
        nP.log('Hello, nPort!');
    </script>
</body>
</html>
```

The path `./nP.js` means "load `nP.js` from the same folder as this HTML file." Keep the capital `P` in the filename. The first script loads the bundle and creates the browser global `nP`; the second calls `nP.log()` to write the message into the page.

This VitePress page displays the HTML as a code example. The code block does not run here, and you do not need to copy `nP.js` just to read this page. Create and open the separate `hello-nport.html` file to run it.

Next, read the [Introduction](./introduction.md) to see how nP components and circuits fit together.
