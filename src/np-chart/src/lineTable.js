import * as d3 from 'd3';

export function lineTable(options = {}) {
		// ======== Options & defaults ========
		const {
			// data: array of tables; each table is a 2D array; row 0 is header strings
			inputTable = [[
				['Freq', 's21dB', 's23dB'],
				[0, -3.52182, -3.52182],
				[600000000, -3.51008, -4.19455],
				[1200000000, -3.47582, -5.72534],
				[1800000000, -3.42189, -7.46851],
				[2400000000, -3.35291, -9.21548],
				[3000000000, -3.27504, -11.01964],
				[3600000000, -3.19561, -13.04088],
				[4200000000, -3.12248, -15.53461],
				[4800000000, -3.06328, -18.99038],
				[5400000000, -3.02443, -24.83689],
				[6000000000, -3.01031, -53.90094],
				[6600000000, -3.02253, -25.46905],
				[7200000000, -3.05969, -19.30541],
				[7800000000, -3.11761, -15.74536],
				[8400000000, -3.18997, -13.20271],
				[9000000000, -3.26921, -11.15721],
				[9600000000, -3.34745, -9.34356],
				[10200000000, -3.41731, -7.596],
				[10800000000, -3.47251, -5.85015],
				[11400000000, -3.50832, -4.28704],
				[12000000000, -3.52176, -3.52571]
			]],
			// Where to append the container. Defaults to <body>.
			mount = 'body',
			// Optional explicit IDs
			containerId,
			svgId,
			// Visuals / behavior
			metricPrefix = 'giga',
			title = '',
			tableTitle,
			headColor = 'color', // 'color' (blue) | 'gray'
			headerColor,
			showWHAlert = false, // true => alert width/height
			// Sizing
			columnWidth = 100,
			rowHeight = 20,
			margin = { left: 20, top: 36, right: 20, bottom: 20 },
			fontFamily = 'sans-serif',
			fontSize = 14,
			containerFontSizePx,
			pngBackground = 'white'
		} = options;

		const effectiveTitle = tableTitle ?? title;
		const effectiveFontSize = containerFontSizePx ?? fontSize;
		const effectiveHeaderColor = headerColor ?? headColor;

		// ======== Helpers ========
		const pickScale = (p) => ({
			tera: 1e12, giga: 1e9, mega: 1e6, kilo: 1e3,
			none: 1, one: 1, deci: 1e-1, centi: 1e-2,
			milli: 1e-3, micro: 1e-6,
			nano: 1e-9, pico: 1e-12
		}[String(p).toLowerCase()] ?? 1e9);

		const metricPrefixLabel = (p) => ({
			tera: 'tera', giga: 'giga', mega: 'mega', kilo: 'kilo',
			deci: 'deci', centi: 'centi', milli: 'milli',
			micro: 'micro', nano: 'nano', pico: 'pico'
		}[String(p).toLowerCase()] ?? 'giga');

		// Copy tables and rows before scaling the frequency column.
		const data = inputTable.map(table =>
			table.map(row => row.slice())
		);
		const freqScale = pickScale(metricPrefix);
		const freqPrefixLabel = metricPrefixLabel(metricPrefix);
		data.forEach(tbl => {
			if (tbl[0] && typeof tbl[0][0] === 'string' && freqPrefixLabel) {
				tbl[0][0] = `${tbl[0][0]} ${freqPrefixLabel}`;
			}
			for (let r = 1; r < tbl.length; r++) {
				if (Number.isFinite(tbl[r][0])) tbl[r][0] = tbl[r][0] / freqScale;
			}
		});

		// Table shape calc
		const tablesCount = data.length;
		const rowsPerTable = data.map(t => t.length);
		const totalRows = rowsPerTable.reduce((a, b) => a + b, 0);
		const totalCols = data.reduce((max, t) => {
			const localMax = Math.max(...t.map(row => row.length));
			return Math.max(max, localMax);
		}, 0);

		const tableWidth = totalCols * (columnWidth + 3) + 1;
		const tableHeight = totalRows * (rowHeight + 1) + (tablesCount - 1) + 1;
		const titleWidth = effectiveTitle ? effectiveTitle.length * effectiveFontSize * 0.65 : 0;
		const controlsWidth = 280;
		const minOuterWidth = Math.ceil(titleWidth + controlsWidth);
		const outerWidth = Math.max(margin.left + tableWidth + margin.right, minOuterWidth);
		const outerHeight = margin.top + tableHeight + margin.bottom;

		if (showWHAlert) {
			// eslint-disable-next-line no-alert
			alert(`The table dimensions: Width is ${outerWidth}, Height is ${outerHeight}`);
		}

		const headerFill = effectiveHeaderColor === 'gray' ? '#d4d4d4' : '#add8e6';
		const titleVisible = effectiveTitle ? 'visible' : 'hidden';

		// Y offsets for each stacked table (inside the drawing area)
		const x0 = margin.left;
		const yOffsets = [];
		for (let i = 0; i < tablesCount; i++) {
			const prev = i === 0 ? 0 : yOffsets[i - 1] + rowsPerTable[i - 1] * (rowHeight + 1) + 1;
			yOffsets.push(prev);
		}
		const y0 = margin.top;

		// ======== Mount points & elements ========
		document.getElementsByTagName('svg').length;
		//const defaultContainerId = containerId || `line-table-container-${existingSvgs + 1}`;
		//const defaultSvgId = svgId || `line-table-${existingSvgs + 1}`;

			const container = d3.select(mount)
				.append('div')
				.attr('id', containerId || null)
				.attr('class', 'line-table-container')
				.style('display', 'inline-block')
				.style('position', 'relative')        // anchor for absolute button
				.style('font-family', fontFamily)
				.style('font-size', `${effectiveFontSize}px`)
				.style('padding-top', '0');

		// ======== PNG copy (keeps SVG in place) ========
		async function svgToPngBlob(svgNode, width, height) {
			const doctype = `<?xml version="1.0" standalone="no"?>` +
				`<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`;
			const source = (new XMLSerializer()).serializeToString(svgNode);
			const svgBlob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' });
			const url = URL.createObjectURL(svgBlob);

			try {
				const img = new Image();
				// Important for some browsers to render local SVG properly
				img.decoding = 'async';
				img.loading = 'eager';

				const loadPromise = new Promise((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = (e) => reject(e);
				});
				img.src = url;
				await loadPromise;

					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext('2d', { willReadFrequently: false });
					if (pngBackground && pngBackground !== 'transparent') {
						ctx.fillStyle = pngBackground;
						ctx.fillRect(0, 0, width, height);
					}
					ctx.drawImage(img, 0, 0);

				const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
				return blob;
			} finally {
				URL.revokeObjectURL(url);
			}
		}

		async function copyPNG() {
			const node = svg.node();
			try {
				const blob = await svgToPngBlob(node, outerWidth, outerHeight);
				if (!blob) throw new Error('Failed to create PNG blob');

				if (!navigator.clipboard || !window.ClipboardItem) {
					throw new Error('Clipboard API for images is not supported in this browser/context.');
				}

				await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

				//console.log("Image copied to clipboard!");

			} catch (err) {
				//console.error(err);
				//console.error("Failed to copy image:", err);
			}
		}

		function tsvEscape(val) {
			const s = (val ?? '').toString();
			return s.replace(/\t/g, ' ').replace(/[\n\r]/g, ' ');
		}

		async function copyTSV() {
			try {
				const tsvChunks = data.map(tbl => {
					const cols = Math.max(...tbl.map(r => r.length));
					const lines = [];
					for (let r = 0; r < tbl.length; r++) {
						const row = [];
						for (let c = 0; c < cols; c++) {
							const val = (tbl[r] || [])[c];
							const formatted = (typeof val === 'string')
								? val
								: Number.isFinite(val) ? val.toFixed(5) : '';
							row.push(tsvEscape(formatted));
						}
						lines.push(row.join('\t'));
					}
					return lines.join('\n');
				});

				const tsvText = tsvChunks.join('\n\n'); // blank line between tables

				if (!navigator.clipboard || !navigator.clipboard.writeText) {
					throw new Error('Clipboard text API not available.');
				}

				await navigator.clipboard.writeText(tsvText);

				//console.log("copied to clipboard");


			} catch (err) {
				//console.error("Failed to copy image:", err);
			}
		}

		// ======== Button (direct child of container) ========
		const button = container.append('button')
			//.attr('id', 'copyImage')
			.attr('aria-label', 'Copy')
			.style('position', 'absolute')
			.style('top', '0')
			.style('right', '10px')
			.style('background', 'none')
			.style('border', 'none')
			.style('padding', '4px 8px')
			.style('cursor', 'pointer')
			.style('display', 'inline-flex')
			.style('align-items', 'center')
			.style('gap', '4px')
			.style('border-radius', '6px')
			.on('mouseover', function () { d3.select(this).style('background', '#ccf2ff'); })  //#ccf2ff
			.on('mouseout', function () { d3.select(this).style('background', 'none'); })
			.on('mousedown', function () { d3.select(this).style('background', '#00ace6'); })  //#00ace6
			.on('mouseup', function () { d3.select(this).style('background', '#ccf2ff'); })
			.on('click', copyPNG);

		button.html(`
    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667C1.83496 9.978 1.83432 9.42091 1.87109 8.9707C1.90851 8.5127 1.98772 8.10625 2.17969 7.72949L2.30176 7.51172C2.60586 7.0159 3.04236 6.6122 3.56348 6.34668L3.70606 6.28027C4.04237 6.136 4.40303 6.07083 4.80371 6.03809C5.14051 6.01057 5.53708 6.00551 6.00391 6.00391C6.00551 5.53708 6.01057 5.14051 6.03809 4.80371C6.0755 4.34588 6.15483 3.94012 6.34668 3.56348L6.46875 3.34473C6.77282 2.84912 7.20856 2.44514 7.72949 2.17969L7.87207 2.11328C8.20855 1.96886 8.56979 1.90385 8.9707 1.87109C9.42091 1.83432 9.978 1.83496 10.667 1.83496H13.5C14.1891 1.83496 14.746 1.83431 15.1963 1.87109C15.6541 1.90851 16.0599 1.98788 16.4365 2.17969L16.6553 2.30176C17.151 2.60585 17.5548 3.04244 17.8203 3.56348L17.8867 3.70606C18.031 4.04235 18.0962 4.40306 18.1289 4.80371C18.1657 5.25395 18.165 5.81091 18.165 6.5V9.33301Z">
      </path>
    </svg>Copy as png
  `);

		const tsvBtn = container.append('button')
			//.attr('id', 'copyTsv')
			.attr('aria-label', 'Copy TSV')
			.style('position', 'absolute')
			.style('top', '0')
			.style('right', '150px')  // adjust so it doesn’t overlap your PNG button
			.style('background', 'none')
			.style('border', 'none')
			.style('padding', '4px 8px')
			.style('cursor', 'pointer')
			.style('display', 'inline-flex')
			.style('align-items', 'center')
			.style('gap', '4px')
			.style('border-radius', '6px')
			.on('mouseover', function () { d3.select(this).style('background', '#ccf2ff'); })
			.on('mouseout', function () { d3.select(this).style('background', 'none'); })
			.on('mousedown', function () { d3.select(this).style('background', '#00ace6'); })
			.on('mouseup', function () { d3.select(this).style('background', '#ccf2ff'); })
			.on('click', copyTSV);

		tsvBtn.html([
			'<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">',
			'  <path d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667C1.83496 9.978 1.83432 9.42091 1.87109 8.9707C1.90851 8.5127 1.98772 8.10625 2.17969 7.72949L2.30176 7.51172C2.60586 7.0159 3.04236 6.6122 3.56348 6.34668L3.70606 6.28027C4.04237 6.136 4.40303 6.07083 4.80371 6.03809C5.14051 6.01057 5.53708 6.00551 6.00391 6.00391C6.00551 5.53708 6.01057 5.14051 6.03809 4.80371C6.0755 4.34588 6.15483 3.94012 6.34668 3.56348L6.46875 3.34473C6.77282 2.84912 7.20856 2.44514 7.72949 2.17969L7.87207 2.11328C8.20855 1.96886 8.56979 1.90385 8.9707 1.87109C9.42091 1.83432 9.978 1.83496 10.667 1.83496H13.5C14.1891 1.83496 14.746 1.83431 15.1963 1.87109C15.6541 1.90851 16.0599 1.98788 16.4365 2.17969L16.6553 2.30176C17.151 2.60585 17.5548 3.04244 17.8203 3.56348L17.8867 3.70606C18.031 4.04235 18.0962 4.40306 18.1289 4.80371C18.1657 5.25395 18.165 5.81091 18.165 6.5V9.33301Z"></path>',
			'</svg>Copy as tsv'
		].join(''));


		// ======== The SVG itself ========
			const svg = container.append('svg')
				.attr('id', svgId || null)
				.style('user-select', 'text')
			.style('-webkit-user-select', 'text')
			.style('-ms-user-select', 'text')
				.attr('class', 'line-table-svg')
				.attr('width', outerWidth)
				.attr('height', outerHeight)
				.style('background-color', pngBackground === 'transparent' ? 'transparent' : pngBackground);

			const tableBackground = svg.insert('rect', ':first-child')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', outerWidth)
				.attr('height', outerHeight)
				.attr('fill', pngBackground === 'transparent' ? 'none' : pngBackground)
				.attr('class', 'line-table-background');

		// Border
		const tableBorder = svg.append('rect')
			.attr('width', outerWidth)
			.attr('height', outerHeight)
			.attr('class', 'line-table-border')
			.attr('fill', 'none')
			.attr('stroke', 'none')//black
			.attr('stroke-width', 1);

		// Title
		const txtTableTitle = svg.append('text')
				.attr('x', 2)
				.attr('y', 18)
				.style('visibility', titleVisible)
				.style('font', `${effectiveFontSize}px ${fontFamily}`)
				.style('user-select', 'none')
				.style('-webkit-user-select', 'none')
				.style('-ms-user-select', 'none')
				.style('pointer-events', 'none')
				.text(effectiveTitle);

		const txtHeaders = [];
		const txtData = [];

		function cssPropertyToJsName(propertyName) {
			return propertyName.replace(/-([a-z])/g, function (_, letter) {
				return letter.toUpperCase();
			});
		}

		function applyStyleToElement(element, style) {
			if (!element) return;

			if (typeof style === 'string') {
				const currentStyle = element.getAttribute('style') || '';
				element.setAttribute('style', currentStyle ? currentStyle + ';' + style : style);
			} else if (typeof style === 'object' && style !== null) {
				for (const [key, value] of Object.entries(style)) {
					element.style[cssPropertyToJsName(key)] = value;
				}
			}
		}

		function applyTextStyle(elements, style) {
			elements.forEach((el) => {
				applyStyleToElement(el, style);
			});
		}

		// ======== Pure-SVG table renderer ========
		function drawTable(myArray, originX, originY) {
			const cols = Math.max(...myArray.map(r => r.length));
			for (let row = 0; row < myArray.length; row++) {
				for (let col = 0; col < cols; col++) {
					const val = (myArray[row] || [])[col];
					const isHeader = row === 0; // your format uses row 0 as headers
					const fill = isHeader ? headerFill : 'white';
					const x = originX + (columnWidth + 3) * col;
					const y = originY + (rowHeight + 1) * row;

					// Cell rect
					svg.append('rect')
						.attr('x', x)
						.attr('y', y)
						.attr('width', (col === cols - 1 ? columnWidth + 3 - 1 : columnWidth + 3)) // last cell a tad narrower for outer stroke symmetry
						.attr('height', rowHeight + 1)
						.attr('fill', fill)
						.attr('stroke', 'black')//'black'
						.attr('stroke-width', 1)
						.attr('pointer-events', 'none');   // allow text selection

					// Cell text
					const txt = (typeof val === 'string')
						? val
						: Number.isFinite(val) ? val.toFixed(5) : '';

					const textX = isHeader
						? x + Math.max(3, Math.round(columnWidth / 2 - (String(txt).length * columnWidth) / 28)) // crude center
						: x + 3;

					const text = svg.append('text')
							.attr('x', textX)
							.attr('y', y + 16) // baseline adjustment
							.attr('class', 'line-table-text')
							.style('font', `${effectiveFontSize}px ${fontFamily}`)
						.text(txt)
						.style('user-select', 'text')
						.style('-webkit-user-select', 'text')
						.style('-ms-user-select', 'text')
						.style('cursor', 'text');

					if (isHeader) {
						txtHeaders.push(text.node());
					} else {
						txtData.push(text.node());
					}
				}
			}
		}

		// Draw all tables stacked
		data.forEach((tbl, i) => {
			drawTable(tbl, x0, y0 + yOffsets[i]);
		});

		function setTxtTableTitleStyle(style) {
			applyStyleToElement(txtTableTitle.node(), style);
		}

		function setTableBackgroundStyle(style) {
			applyStyleToElement(tableBackground.node(), style);
		}

		function setTableBorderStyle(style) {
			applyStyleToElement(tableBorder.node(), style);
		}

		function setTxtTableHeadersStyle(style) {
			applyTextStyle(txtHeaders, style);
		}

		function setTxtTableDataStyle(style) {
			applyTextStyle(txtData, style);
		}

		// Returning an API to the user
		// There are exposed elements for super users
		// There are exposed setter methods to change the style
		// ---> You can pass an object to a setter: { fill: "red", fontStyle: "italic" }
		// ---> Or you can pass a string to a setter: "fill:red; font-style:italic;"
		// Either will work

		return {
			// return elements
			container: container.node(),
			svg: svg.node(),
			tableBackground: tableBackground.node(),
			tableBorder: tableBorder.node(),
			txtTableTitle: txtTableTitle.node(),
			txtHeaders: txtHeaders,
			txtData: txtData,

			// return setters
			setTxtTableTitleStyle: setTxtTableTitleStyle,
			setTableBackgroundStyle: setTableBackgroundStyle,
			setTableBorderStyle: setTableBorderStyle,
			setTxtTableHeadersStyle: setTxtTableHeadersStyle,
			setTxtTableDataStyle: setTxtTableDataStyle
		};

	}
