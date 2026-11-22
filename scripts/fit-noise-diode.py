#!/usr/bin/env python3
# Modified: 2026-11-22
"""Fit the paper's digitized 16.7 mA plots, never measured/calibrated raw data.
Optional research tool: Python 3 + numpy, scipy, matplotlib, Pillow; pdftocairo.
Run from the repo: python3 scripts/fit-noise-diode.py --pdf /path/to/paper.pdf
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, map_coordinates
from scipy.optimize import minimize_scalar

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'test/fixtures/noise-diode-plot-data.json'
REPORT = ROOT / 'developmentDocs/semiconductors/noiseDiodeFit.json'
CHART = ROOT / 'developmentDocs/semiconductors/figures/noise-diode-fit.svg'
GENERATED = ROOT / 'src/np-nport/src/diodes/noiseDiodeFit.js'


def fit_linear(x, y):
    coefficients = np.linalg.lstsq(x, y, rcond=None)[0]
    residual = x @ coefficients - y
    leverage = np.sum(x * (x @ np.linalg.pinv(x.T @ x)), axis=1)
    return {'coefficients': coefficients.tolist(),
            'rmseDb': float(np.sqrt(np.mean(residual ** 2))),
            'maxErrorDb': float(np.max(np.abs(residual))),
            'leaveOneOutRmseDb': float(np.sqrt(np.mean((residual / (1 - leverage)) ** 2)))}


def rf(f, tau):
    # Original Eq. 4 branches, combined algebraically before evaluating fa.
    w = 2 * np.pi * f
    ratio = f / 26.59e9
    theta = w * tau
    a = 4.85 * np.sinc(theta / (2 * np.pi)) ** 2
    b = ((1 - np.sinc(theta / np.pi)) - 1.5 * ratio ** 2) / (w * 169.44e-15)
    numerator = a - 1j * b
    denominator = numerator + (1 - ratio ** 2) * 102.58
    zi = 102.58 * numerator / denominator
    zs = 5.43 + zi
    package = 1 + 1j * w * 160e-15 * zs
    z = zs / package + 1j * w * 165.5e-12
    h = (-1j * b * 102.58 / denominator) / package
    return z, h, package


def extract_images(pdf, destination):
    svg = destination / 'page.svg'
    subprocess.run(['pdftocairo', '-svg', '-f', '3', '-l', '3', str(pdf), str(svg)], check=True)
    images = {}
    for element in ET.parse(svg).getroot().iter('{http://www.w3.org/2000/svg}image'):
        dimensions = (int(element.attrib['width']), int(element.attrib['height']))
        raw = base64.b64decode(element.attrib['{http://www.w3.org/1999/xlink}href'].split(',', 1)[1])
        name = destination / ('image-%sx%s.png' % dimensions)
        name.write_bytes(raw)
        images[dimensions] = name
    return images


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf', type=Path, required=True)
    args = parser.parse_args()
    data = json.loads(DATA.read_text())
    if hashlib.sha256(args.pdf.read_bytes()).hexdigest() != data['sha256']:
        raise ValueError('PDF checksum differs from the documented source; recalibrate axes before fitting.')
    p5 = np.array(data['figure5']['pixelPoints'], dtype=float)
    a5 = data['figure5']['axes']
    f5 = 40 * (p5[:, 0] - a5['x0']) / (a5['x40'] - a5['x0'])
    y5 = 10 * (1 + 3 * (a5['yLog10M2_1'] - p5[:, 1]) / (a5['yLog10M2_1'] - a5['yLog10M2_4']))
    p6 = np.array(data['figure6']['pixelPoints'], dtype=float)
    a6 = data['figure6']['axes']
    f6 = 40 * (p6[:, 0] - a6['x0']) / (a6['x40'] - a6['x0'])
    y6 = 20 + 14 * (a6['yEnr20'] - p6[:, 1]) / (a6['yEnr20'] - a6['yEnr34'])
    candidates5 = []
    x5 = np.log(f5 / 10)
    for degree in [1, 2, 3, 4]:
        candidate = fit_linear(np.vander(x5, degree + 1, increasing=True), y5)
        candidates5.append({'kind': 'log-polynomial', 'degree': degree, **candidate})
    for knee in [15, 20, 25, 28, 30]:
        h5 = np.maximum(np.log(f5 / knee), 0)
        candidate = fit_linear(np.column_stack([np.ones_like(x5), x5, h5 ** 2]), y5)
        candidates5.append({'kind': 'segmented-log', 'kneeGHz': knee, **candidate})
    selected5 = min(candidates5, key=lambda c: c['leaveOneOutRmseDb'])
    if selected5['kind'] != 'segmented-log':
        raise ValueError('Selected family changed; review the generated runtime representation.')
    candidates6 = []
    x6 = (f6 - 21) / 19
    for degree in range(1, 6):
        candidates6.append({'degree': degree, **fit_linear(np.vander(x6, degree + 1, increasing=True), y6)})
    selected6 = min(candidates6, key=lambda c: c['leaveOneOutRmseDb'])
    with tempfile.TemporaryDirectory(prefix='np-noise-fit-') as directory:
        images = extract_images(args.pdf, Path(directory))
        ink = np.asarray(Image.open(images[(996, 755)]).convert('L')) > 160
        distance = distance_transform_edt(~ink)
        f4 = np.linspace(2e9, 39.5e9, 450)
        xp = 134 + (846 - 134) * f4 / 40e9

        def distances(tau_ps):
            z, _, _ = rf(f4, tau_ps * 1e-12)
            yr = 625 - z.real * (625 - 24) / 70
            yi = 625 - (z.imag + 30) * (625 - 24) / 70
            return np.concatenate([map_coordinates(distance, [yr, xp], order=1, mode='constant', cval=30),
                                   map_coordinates(distance, [yi, xp], order=1, mode='constant', cval=30)])

        # Only the table's omitted transit time is fitted. Scoring nearest ink
        # cannot separate measured/initial/optimized traces and is labelled so.
        result = minimize_scalar(lambda t: np.mean(np.minimum(distances(t) ** 2, 400)),
                                 bounds=(7, 14), method='bounded', options={'xatol': 1e-6})
        tau = float(result.x * 1e-12)
        raster = {'transitTimeSeconds': tau, 'rmsDistancePixels': float(np.sqrt(np.mean(distances(result.x) ** 2))),
                  'method': 'Nearest-ink Figure 4 fit of omitted transit time; Table 1 parameters held fixed; measured and estimated traces overlap.'}
    report = {'source': data['source'], 'sha256': data['sha256'], 'biasCurrentA': data['biasCurrentA'],
              'validFrequencyHz': [2e9, 40e9], 'figure4': raster,
              'figure5': {'selected': selected5, 'candidates': candidates5,
                          'digitized': np.column_stack([f5 * 1e9, 10 ** (y5 / 10)]).tolist()},
              'figure6': {'selected': selected6, 'candidates': candidates6,
                          'digitized': np.column_stack([f6 * 1e9, y6]).tolist()},
              'limitations': 'Plot-derived research fit, not raw measurements or calibrated ENR. Figure 6 includes an unspecified transition and is not used as intrinsic diode noise. No DC curve, off-state model or bias/temperature interpolation.'}
    REPORT.write_text(json.dumps(report, indent=2) + '\n')
    generated = {'transitTime': tau, 'referenceFrequency': 1e10,
                 'kneeFrequency': selected5['kneeGHz'] * 1e9, 'coefficientsDb': selected5['coefficients'],
                 'minFrequency': 2e9, 'maxFrequency': 40e9}
    GENERATED.write_text('// Generated by scripts/fit-noise-diode.py from the documented PDF plots.\n'
                         'export const noiseDiodeFit = ' + json.dumps(generated, indent=4) + ';\n')
    f = np.linspace(2, 40, 500)
    a, b, c = selected5['coefficients']
    mdb = a + b * np.log(f / 10) + c * np.maximum(np.log(f / selected5['kneeGHz']), 0) ** 2
    en = np.polynomial.polynomial.polyval((f - 21) / 19, selected6['coefficients'])
    z, transfer, package = rf(f * 1e9, tau)
    sv = 2 * 1.602176634e-19 * .0167 * 10 ** (mdb / 10) * np.abs(transfer) ** 2
    sv += 4 * 1.380649e-23 * 300 * 5.43 / np.abs(package) ** 2
    tn = sv / (4 * 1.380649e-23 * z.real)
    intrinsic_enr = 10 * np.log10(tn / 290 - 1)
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.7), constrained_layout=True)
    axes[0].semilogy(f5, 10 ** (y5 / 10), '^', label='Digitized triangle series')
    axes[0].semilogy(f, 10 ** (mdb / 10), label='Segmented regression')
    axes[0].set(ylabel='Avalanche multiplier squared, M²', title='Figure 5: 16.7 mA')
    axes[1].plot(f6, y6, '^', label='Digitized on-wafer series')
    axes[1].plot(f, en, label='Quartic on-wafer fit')
    axes[1].plot(f, intrinsic_enr, '--', label='Diode-plane equations (different plane)')
    axes[1].set(ylabel='ENR (dB)', title='Figure 6: plane distinction retained')
    axes[2].plot(f, z.real, label='Real impedance')
    axes[2].plot(f, z.imag, label='Imaginary impedance')
    axes[2].set(ylabel='Impedance (Ω)', title='Figure 4: table + fitted transit time')
    for ax in axes:
        ax.set_xlabel('Frequency (GHz)')
        ax.grid(alpha=.3)
        ax.legend(fontsize=8)
    fig.suptitle('NC-406 paper: plot-derived research fits, not calibrated device data', fontsize=12)
    fig.savefig(CHART)
    fig.savefig('/tmp/np-noise-diode-fit.png', dpi=140)
    print(json.dumps({'figure4': raster, 'figure5': selected5, 'figure6': selected6}, indent=2))


if __name__ == '__main__':
    main()
