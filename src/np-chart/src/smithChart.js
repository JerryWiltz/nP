// Modified: 2026-06-27
import * as d3 from 'd3';

export function smithChart(options = {}) {
	// ======== Options & defaults ========
	const {
		inputTable = [[
			['Freq', 's11Re', 's11Im'],
			[100000000, -0.5, 0.2],
			[200000000, -0.35, 0.35],
			[300000000, -0.1, 0.45],
			[400000000, 0.15, 0.35],
			[500000000, 0.35, 0.1],
			[600000000, 0.45, -0.15]
		]],
		mount = 'body',
		containerId,
		svgId,
		title = '',
		chartTitle,
		metricPrefix = 'giga',
		showPoints = true,
		showLabels = true,
		showGrid = true,
		gridColor = '#b8b8b8',
		traceColor = true,
		traceWidth = 2,
		pointRadius = 3,
		labelFontSize = 11,
		labelColor,
		width = 600,
		height = 600,
		margin = { top: 40, right: 40, bottom: 40, left: 40 },
		unitCircleColor = 'black',
		unitCircleWidth = 1.5,
		fontFamily = 'sans-serif',
		fontSize = 14,
		containerFontSizePx,
		backgroundColor,
		pngBackground = 'transparent'
	} = options;

	const effectiveTitle = chartTitle ?? title;
	const effectiveFontSize = containerFontSizePx ?? fontSize;
	const effectiveBackgroundColor = backgroundColor ?? pngBackground;
	let txtLabels = d3.selectAll([]);

	const pickScale = {
		tera: 1e12, giga: 1e9, mega: 1e6, kilo: 1e3,
		none: 1, one: 1, deci: 1e-1, centi: 1e-2,
		milli: 1e-3, micro: 1e-6, nano: 1e-9, pico: 1e-12
	}[metricPrefix] || 1e9;

	function stripComplexSuffix(header) {
		return String(header).replace(/(?:Re|Im)$/i, '');
	}

	function formatData(tables) {
		return tables.flatMap(table => {
			const headers = table[0];
			const traces = [];

			for (let i = 1; i < headers.length; i += 2) {
				const reHeader = headers[i];
				const imHeader = headers[i + 1];
				if (!imHeader) continue;

				const traceName = stripComplexSuffix(reHeader);
				traces.push({
					traceName,
					values: table.slice(1).map(row => ({
						frequency: row[0] / pickScale,
						re: row[i],
						im: row[i + 1]
					})).filter(point =>
						Number.isFinite(point.re) && Number.isFinite(point.im)
					)
				});
			}

			return traces;
		});
	}

	const formattedData = formatData(inputTable);
	const n = Math.max(3, Math.min(9, formattedData.length));
	const color = traceColor
		? d3.scaleOrdinal(d3.schemeCategory10)
		: d3.scaleOrdinal(d3.schemeGreys[n]);

	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	const plotSize = Math.min(innerWidth, innerHeight);
	const plotLeft = margin.left + (innerWidth - plotSize) / 2;
	const plotTop = margin.top + (innerHeight - plotSize) / 2;
	const center = plotSize / 2;
	const radius = plotSize / 2;

	function gammaToPoint(gamma) {
		return [
			center + gamma.re * radius,
			center - gamma.im * radius
		];
	}

	const line = d3.line()
		.x(d => gammaToPoint(d)[0])
		.y(d => gammaToPoint(d)[1])
		.curve(d3.curveCatmullRom.alpha(0.5));

	const container = d3.select(mount)
		.append('div')
		.style('position', 'relative')
		.style('display', 'inline-block')
		.style('padding', '5px')
		.style('font-family', fontFamily)
		.style('font-size', `${effectiveFontSize}px`)
		.attr('id', containerId || null)
		.attr('class', 'smith-chart-container');

	const svg = container.append('svg')
		.attr('width', width)
		.attr('height', height)
		.attr('id', svgId || null)
		.attr('class', 'smith-chart-svg');

	const chartBackground = svg.insert('rect', ':first-child')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', width)
		.attr('height', height)
		.attr('fill', effectiveBackgroundColor === 'transparent' ? 'none' : effectiveBackgroundColor)
		.attr('class', 'smith-chart-background');

	container.style('position', 'relative');

	const button = container.append('button')
		.attr('aria-label', 'Copy')
		.style('position', 'absolute')
		.style('top', '5px')
		.style('right', '100px')
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
		.on('mouseup', function () { d3.select(this).style('background', '#ccf2ff'); });

	button.html(`
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667C1.83496 9.978 1.83432 9.42091 1.87109 8.9707C1.90851 8.5127 1.98772 8.10625 2.17969 7.72949L2.30176 7.51172C2.60586 7.0159 3.04236 6.6122 3.56348 6.34668L3.70606 6.28027C4.04237 6.136 4.40303 6.07083 4.80371 6.03809C5.14051 6.01057 5.53708 6.00551 6.00391 6.00391C6.00551 5.53708 6.01057 5.14051 6.03809 4.80371C6.0755 4.34588 6.15483 3.94012 6.34668 3.56348L6.46875 3.34473C6.77282 2.84912 7.20856 2.44514 7.72949 2.17969L7.87207 2.11328C8.20855 1.96886 8.56979 1.90385 8.9707 1.87109C9.42091 1.83432 9.978 1.83496 10.667 1.83496H13.5C14.1891 1.83496 14.746 1.83431 15.1963 1.87109C15.6541 1.90851 16.0599 1.98788 16.4365 2.17969L16.6553 2.30176C17.151 2.60585 17.5548 3.04244 17.8203 3.56348L17.8867 3.70606C18.031 4.04235 18.0962 4.40306 18.1289 4.80371C18.1657 5.25395 18.165 5.81091 18.165 6.5V9.33301Z">
        </path>
      </svg>Copy as png
    `);

	// New button function fire
	button.on('click', copyPNG);

	function copyPNG() {
		const containerDiv = container.node();
		const svgElement = containerDiv.querySelector('svg');

		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svgElement);

		const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(svgBlob);

		const img = new Image();
		img.onload = async () => {
			const canvas = document.createElement('canvas');
			// Use rendered size
			canvas.width = svgElement.clientWidth || +svgElement.getAttribute('width') || 800;
			canvas.height = svgElement.clientHeight || +svgElement.getAttribute('height') || 600;

			const ctx = canvas.getContext('2d');

			// ------ NEW: optional background fill (defaults to transparent) ------
			if (effectiveBackgroundColor && effectiveBackgroundColor !== 'transparent') {
				ctx.save();
				ctx.globalCompositeOperation = 'source-over';
				ctx.fillStyle = effectiveBackgroundColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.restore();
			}
			// --------------------------------------------------------------------

			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			URL.revokeObjectURL(url);

			canvas.toBlob(async (blob) => {
				try {
					await navigator.clipboard.write([
						new ClipboardItem({ 'image/png': blob })
					]);
					//console.log("Image copied to clipboard!");
				} catch (err) {
					//console.error("Failed to copy image:", err);
				}
			}, 'image/png');
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			console.error("Failed to load serialized SVG into Image", e);
		};
		img.src = url;
	}

	const txtChartTitle = svg.append('text')
		.attr('x', 10)
		.attr('y', 18)
		.style('visibility', effectiveTitle ? 'visible' : 'hidden')
		.text(effectiveTitle);

	const g = svg.append('g')
		.attr('transform', `translate(${plotLeft},${plotTop})`)
		.attr('class', 'smith-chart-plot-area');

	const clipId = `smith-clip-${Math.random().toString(36).slice(2)}`;
	svg.append('defs')
		.append('clipPath')
		.attr('id', clipId)
		.append('circle')
		.attr('cx', center)
		.attr('cy', center)
		.attr('r', radius);

	const smithGridGroup = g.append('g')
		.attr('class', 'smith-grid')
		.style('visibility', showGrid ? 'visible' : 'hidden')
		.attr('clip-path', `url(#${clipId})`);

	smithGridGroup.append('line')
		.attr('x1', 0)
		.attr('y1', center)
		.attr('x2', plotSize)
		.attr('y2', center)
		.attr('stroke', gridColor)
		.attr('stroke-width', 1);

	[0.2, 0.5, 1, 2, 5].forEach(r => {
		smithGridGroup.append('circle')
			.attr('cx', center + (r / (r + 1)) * radius)
			.attr('cy', center)
			.attr('r', (1 / (r + 1)) * radius)
			.attr('fill', 'none')
			.attr('stroke', gridColor)
			.attr('stroke-width', 1);
	});

	[0.2, 0.5, 1, 2, 5].forEach(x => {
		[x, -x].forEach(value => {
			smithGridGroup.append('circle')
				.attr('cx', center + radius)
				.attr('cy', center - (1 / value) * radius)
				.attr('r', Math.abs((1 / value) * radius))
				.attr('fill', 'none')
				.attr('stroke', gridColor)
				.attr('stroke-width', 1);
		});
	});

	const unitCircle = g.append('circle')
		.attr('cx', center)
		.attr('cy', center)
		.attr('r', radius)
		.attr('fill', 'none')
		.attr('stroke', unitCircleColor)
		.attr('stroke-width', unitCircleWidth)
		.attr('class', 'smith-unit-circle');

	const traceGroup = g.append('g')
		.attr('class', 'smith-traces')
		.attr('clip-path', `url(#${clipId})`);

	const labelGroup = g.append('g')
		.attr('class', 'smith-labels');

	const groups = traceGroup.selectAll('.smith-trace-group')
		.data(formattedData)
		.join('g')
		.attr('class', 'smith-trace-group');

	groups.append('path')
		.attr('d', d => line(d.values))
		.attr('fill', 'none')
		.attr('stroke', d => color(d.traceName))
		.attr('stroke-width', traceWidth);

	if (showPoints) {
		let tooltip;

		groups.selectAll('circle')
			.data(d => d.values.map(point => ({ ...point, traceName: d.traceName })))
			.join('circle')
			.attr('cx', d => gammaToPoint(d)[0])
			.attr('cy', d => gammaToPoint(d)[1])
			.attr('r', pointRadius)
			.attr('fill', d => color(d.traceName))
			.on('mouseenter', (event, d) => {
				container.select('.tooltip').remove();

				const [px, py] = d3.pointer(event, container.node());
				tooltip = container.append('div')
					.attr('class', 'tooltip')
					.style('position', 'absolute')
					.style('background', 'white')
					.style('border', '1px solid #aaa')
					.style('padding', '3px 6px')
					.style('white-space', 'nowrap')
					.style('pointer-events', 'none')
					.style('z-index', 10)
					.style('left', `${px + 10}px`)
					.style('top', `${py - 20}px`)
					.html(`${d.traceName}<br>Freq: ${d.frequency.toPrecision(3)}<br>Re: ${d.re.toPrecision(3)}<br>Im: ${d.im.toPrecision(3)}<br>Mag: ${Math.hypot(d.re, d.im).toPrecision(3)}<br>Ang: ${(Math.atan2(d.im, d.re) * 180 / Math.PI).toPrecision(3)} deg`);
			})
			.on('mousemove', (event) => {
				if (!tooltip) return;
				const [px, py] = d3.pointer(event, container.node());
				tooltip.style('left', `${px + 10}px`).style('top', `${py - 20}px`);
			})
			.on('mouseleave', () => {
				if (tooltip) { tooltip.remove(); tooltip = null; }
			});
	}

	if (showLabels) {
		txtLabels = labelGroup.selectAll('.txtLabel')
			.data(formattedData)
			.join('text')
			.attr('x', d => {
				const last = d.values[d.values.length - 1];
				return gammaToPoint(last)[0] + 6;
			})
			.attr('y', d => {
				const last = d.values[d.values.length - 1];
				return gammaToPoint(last)[1];
			})
			.attr('dy', '0.35em')
			.attr('class', 'txtLabel')
			.style('font-size', `${labelFontSize}px`)
			.style('fill', labelColor || null)
			.text(d => d.traceName);
	}

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

	function applyStyleToSelection(selection, style) {
		selection.each(function () {
			applyStyleToElement(this, style);
		});
	}

	function setTxtChartTitleStyle(style) {
		applyStyleToElement(txtChartTitle.node(), style);
	}

	function setChartBackgroundStyle(style) {
		applyStyleToElement(chartBackground.node(), style);
	}

	function setUnitCircleStyle(style) {
		applyStyleToElement(unitCircle.node(), style);
	}

	function setSmithGridStyle(style) {
		applyStyleToSelection(smithGridGroup.selectAll('circle,line'), style);
	}

	function setTxtChartLabelsStyle(style) {
		applyStyleToSelection(txtLabels, style);
	}

	return {
		// return elements
		container: container.node(),
		svg: svg.node(),
		chartBackground: chartBackground.node(),
		txtChartTitle: txtChartTitle.node(),
		unitCircle: unitCircle.node(),
		smithGridGroup: smithGridGroup.node(),
		traceGroup: traceGroup.node(),
		labelGroup: labelGroup.node(),
		txtChartLabels: txtLabels.nodes(),

		// return setters
		setTxtChartTitleStyle: setTxtChartTitleStyle,
		setChartBackgroundStyle: setChartBackgroundStyle,
		setUnitCircleStyle: setUnitCircleStyle,
		setSmithGridStyle: setSmithGridStyle,
		setTxtChartLabelsStyle: setTxtChartLabelsStyle
	};
}
