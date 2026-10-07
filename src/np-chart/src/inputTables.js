// Modified: 2026-10-06

// Accept either one table or an array of tables. A table is a header row
// followed by data rows; a collection has tables as its first-level entries.
export function normalizeInputTables(inputTable, chartName, dataKind) {
    if (!Array.isArray(inputTable) || inputTable.length === 0) {
        throw new TypeError(`${chartName}: inputTable must be a table or a nonempty array of tables.`);
    }

    const tables = Array.isArray(inputTable[0]) && !Array.isArray(inputTable[0][0])
        ? [inputTable]
        : inputTable;

    tables.forEach((table, tableIndex) => {
        const location = `${chartName}: inputTable table ${tableIndex + 1}`;
        if (!Array.isArray(table) || !Array.isArray(table[0]) || table[0].length < 2) {
            throw new TypeError(`${location} needs a header row with at least two columns.`);
        }

        const headers = table[0];
        if (headers.some(header => typeof header !== 'string' || header.trim() === '')) {
            throw new TypeError(`${location} headers must be nonempty strings.`);
        }

        if (dataKind !== 'table' && table.length < 2) {
            throw new TypeError(`${location} needs at least one data row.`);
        }

        table.slice(1).forEach((row, rowIndex) => {
            if (!Array.isArray(row) || row.length !== headers.length) {
                throw new TypeError(`${location} row ${rowIndex + 2} must have ${headers.length} columns.`);
            }
            if (dataKind === 'table') {
                if (row.some(value => typeof value !== 'string' && !Number.isFinite(value))) {
                    throw new TypeError(`${location} row ${rowIndex + 2} needs text or finite numbers.`);
                }
            } else if (row.some(value => !Number.isFinite(value))) {
                throw new TypeError(`${location} row ${rowIndex + 2} needs finite numbers.`);
            }
        });

        if (dataKind === 'line') {
            if (new Set(headers.slice(1)).size !== headers.length - 1) {
                throw new TypeError(`${location} trace headers must be unique.`);
            }
        } else if (dataKind === 'smith') {
            if ((headers.length - 1) % 2 !== 0) {
                throw new TypeError(`${location} needs a Re/Im column pair for each trace.`);
            }
            for (let column = 1; column < headers.length; column += 2) {
                const match = headers[column].match(/^(.+)Re$/);
                if (!match || headers[column + 1] !== `${match[1]}Im`) {
                    throw new TypeError(`${location} columns ${column + 1} and ${column + 2} must be matching Re/Im headers.`);
                }
            }
        }
    });

    return tables;
}
