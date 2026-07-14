<!-- Modified: 2026-07-14 -->
# Matrix Development

This analysis exercises real and complex matrix inversion, multiplication, and addition. Its text outputs are rendered safely below the JavaScript. It is converted from `dev/matrixDevelopment.html`.

```npjs
function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toPrecision(12);
}

function formatComplex(value) {
    var real = formatNumber(value.getR());
    var imaginary = formatNumber(Math.abs(value.getI()));
    var sign = value.getI() < 0 ? '-' : '+';

    return real + ' ' + sign + ' j' + imaginary;
}

function formatMatrix(matrix, formatter) {
    return matrix.m.map(function (row) {
        return '[ ' + row.map(formatter).join(', ') + ' ]';
    }).join('\n');
}

function render(id, label, input, result, formatter) {
    document.getElementById(id).textContent =
        label + '\n\n' +
        'Input:\n' + formatMatrix(input, formatter) + '\n\n' +
        'Result:\n' + formatMatrix(result, formatter);
}

var a = nP.matrix([
    [3, 5, 2],
    [0, 8, 2],
    [6, 2, 8]
]);

var b = nP.matrix([
    [8],
    [-7],
    [26]
]);

var realSolution = a.invert().mul(b);

render(
    'realMatrix',
    'nP.matrix(a).invert().mul(b)',
    a,
    realSolution,
    formatNumber
);

var c = nP.matrix([
    [nP.complex(3, 0), nP.complex(5, 0), nP.complex(2, 0)],
    [nP.complex(0, 0), nP.complex(8, 0), nP.complex(2, 0)],
    [nP.complex(6, 0), nP.complex(2, 0), nP.complex(8, 0)]
]);

var d = nP.matrix([
    [nP.complex(8, 0)],
    [nP.complex(-7, 0)],
    [nP.complex(26, 0)]
]);

var complexSolution = c.invertCplx().mulCplx(d);

render(
    'complexMatrix',
    'nP.matrix(c).invertCplx().mulCplx(d)',
    c,
    complexSolution,
    formatComplex
);

var e = nP.matrix([[1]]);
var matrixSum = e.add(e).add(e).add(e);

render(
    'matrixAddition',
    'e.add(e).add(e).add(e)',
    e,
    matrixSum,
    formatNumber
);
```
