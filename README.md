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
original/                 Original source files (Windows-1252)
```

## Usage

Open `src/index.html` in a browser. No server required.

## License

See original Bracker Music source for licensing terms.
