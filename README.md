# Whistle & Flute Hole Designer

A browser-based tool for calculating hole positions on whistles and flutes, based on the Bracker Music acoustic model.

## Features

- Calculates hole positions from desired frequencies
- Supports Just, Helmholtz-Barthold (HB-trad), and Equal Temperament intonation
- Metric (mm) and imperial (inch) unit systems
- Temperature-corrected speed of sound
- Visual diagram of the instrument with hole positions
- Optimum bore estimation
- Transposition via slide (cents)

## Project Structure

```
src/
  index.html              Main page
  assets/
    calculator.js         Pure calculation class (no DOM)
    whistle-designer-13.js DOM interaction and UI logic
    skin.js               Graphics library (jsGraphics)
    wz_jsgraphics.js      Graphics library (jsGraphics)
    common_tubing.json    Tubing materials data
    tube_sizes.json       Standard tube sizes data
tests/
  calculator.test.js      Unit tests for Calculator
  tube.test.js            Unit tests for Tube
original/                 Original source files (Windows-1252)
```

## Testing

Unit tests use Node's built-in test runner (no dependencies required).

```sh
npm test                  # run tests
npm run test:coverage     # run tests with coverage report
```

The `Calculator` class in `src/assets/calculator.js` is DOM-free: inputs are set
via setters, results read via getters, making it fully testable in Node.

## Usage

Open `src/index.html` in a browser. No server required.

## License

See original Bracker Music source for licensing terms.
