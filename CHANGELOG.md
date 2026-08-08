# Changelog

## Tests

- Added `tests/tube.test.js` (7 tests) and `tests/calculator.test.js` (74 tests) using Node's built-in `node:test` runner — zero dependencies
- Added `package.json` with `test` and `test:coverage` scripts
- Coverage: 100% lines / 99% branches on `calculator.js` (the one uncovered branch, `freq2Note`'s `f > 4*a`, is unreachable dead code shadowed by `f > 2*a`)
- Golden-value regression tests verified against the app's exact D-whistle configuration (ET intonation, key index 8, OD 16/wall 1)
- Documented legacy quirks in tests: inverted `centsDiff` sign at ±50¢, `freq2Note` returning `undefined` out of octave range
- Added `temperature`, `embWall`, `designType` getters to `Calculator` for symmetric setter/getter pairs

## Restructure

- Renamed `Bracker Music_files` directory to `assets`, updated all references in `index.html`
- Re-encoded original files from Windows-1252 to UTF-8, set `<meta charset="UTF-8">`
- Added missing `<div id="canvasheader">` and `<input name="diff2OptBore">` to HTML

## Architecture

- Extracted `Tube` class with immutable `outDiameter`/`wall` and `bore()` method
- Extracted `Calculator` class (`calculator.js`) with all pure calculation logic, zero DOM dependencies
- Refactored `whistle-designer-13.js` to thin DOM glue using `Calculator` instance
- Eliminated `with (form)` block from `Calculate()`

## Bug fixes

- Fixed `DrawWhistle()` immediate call bug (removed trailing `()`)
- Removed debug `alert(note7.value)`

## Cleanup

- Removed dead code in `skin.js` (`#topsearch`, `#topactions` blocks)
- Converted all `var` to `const`/`let` across both JS files

## Named constants

### Calculator class statics

| Constant | Value | Meaning |
|----------|-------|---------|
| `SOUND_SPEED_FACTOR` | 20055 | Speed of sound scaling factor |
| `ABS_ZERO_OFFSET` | 270.15 | Temperature offset to Kelvin |
| `HOLE_END_EFFECT` | 0.75 | Air column extension past hole edge |
| `CLOSED_HOLE_COEFF` | 0.25 | Closed hole correction coefficient |
| `WHISTLE_EMBOUCHURE_COEFF` | 0.3 | Whistle embouchure correction |
| `FLUTE_EMBOUCHURE_COEFF` | 11.5 | Flute embouchure correction |
| `MIDI_A4` | 57 | MIDI code for A4 (440 Hz) |
| `LOG2_INV` | 1.442741049 | 1/ln(2) for octave conversion |
| `SEMITONE_RATIO` | 1.0293 | Frequency ratio for 50 cents |
| `CENT_RATIO` | 1.00057778950655 | Frequency ratio for 1 cent |
| `OPTIMUM_BORE_COEFF` | 2620 | Optimum bore empirical coefficient |
| `OPTIMUM_BORE_EXP` | -5/6 | Optimum bore empirical exponent |

### Module-level constants

| Constant | Purpose |
|----------|---------|
| `DEFAULT_HOLE_DIAMETERS` | Default hole diameter proportions (HoleInit) |
| `DEFAULT_EMBOUCHURE_PROPS` | Default embouchure proportions (HoleInit) |
| `TUBE_CHANGE_HOLE_DIAMETERS` | Hole diameter proportions (TubeChange) |
| `TUBE_CHANGE_EMBOUCHURE_PROPS` | Embouchure proportions (TubeChange) |
| `MIDI_KEY_BASE` | 68 — first key option (F#5) |
| `BASS_FREQ_THRESHOLD` | 240 Hz |
| `LOW_FREQ_THRESHOLD` | 425 Hz |
| `MAX_CANVAS_WIDTH` | 1120 px |
| `RESPONSIVE_SCALE_FACTOR` | 0.92 |
| `MM_PER_INCH` | 25.4 |
| `HOLE_LABELS` | `['T1','Th','T2','T3','B1','B2','B3','B4','X','X']` |
| `INTONATION_NAMES` | `['Just','HB-trad','ET']` |
| `KEY_INDEX_RANGES` | Key-to-index lookup table |

## Extracted functions

### calculator.js

| Method | Purpose |
|--------|---------|
| `holeDiameterRatio(n)` | Squared ratio of hole diameter to bore |
| `quarterWavelength(freq)` | Quarter wavelength for open pipe |
| `solveQuadratic(a, b, c)` | Quadratic equation solver (smaller root) |

### whistle-designer-13.js

| Function | Purpose |
|----------|---------|
| `roundTo(value, precision)` | Round to N decimal places |
| `getUnitSystem()` | Returns `{K, R, U, unitLabel}` for current unit mode |
| `getKeyIndex(key)` | Maps key number to OD/WL array index |
| `getIntonationName(index)` | Returns intonation name string |
| `loadFormInputs(form, calc, K)` | Transfers form values to Calculator |
| `writeCentsdiff(form, calc)` | Writes cents difference results |
| `writeDiameters(form, calc, K, R)` | Writes calculated diameters |
| `writeResults(form, calc, K, R, U)` | Writes hole positions |
| `writeCutoffs(form, calc)` | Writes cutoff frequencies |
| `writeSpacings(form, calc, K, R, U)` | Writes hole spacings |
| `writeNotes(form, calc)` | Writes note names |
| `updateHeaders(form, calc)` | Updates key/canvas header text |
| `drawHoleLabels(jg, xf, df, gy, gz)` | Draws hole labels on canvas |
