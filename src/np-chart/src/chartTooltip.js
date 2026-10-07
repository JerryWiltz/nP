// Modified: 2026-10-06

export function formatTooltipNumber(value) {
    return value.toPrecision(3);
}

export function formatTooltipFrequency(value, metricPrefix) {
    const units = {
        tera: 'THz', giga: 'GHz', mega: 'MHz', kilo: 'kHz',
        none: 'Hz', one: 'Hz', deci: 'dHz', centi: 'cHz',
        milli: 'mHz', micro: 'µHz', nano: 'nHz', pico: 'pHz'
    };
    const unit = units[String(metricPrefix).toLowerCase()] || 'GHz';
    return `${formatTooltipNumber(value)} ${unit}`;
}

export function appendTooltipRows(tooltip, rows) {
    rows.forEach(([label, value]) => {
        tooltip.append('div').text(`${label}: ${value}`);
    });
}
