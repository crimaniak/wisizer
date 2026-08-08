// calculator.js - Pure calculation class for whistle/flute hole positioning
// No DOM dependencies - fully testable

class Tube {
	constructor(outDiameter, wall) {
		this._outDiameter = outDiameter;
		this._wall = wall;
	}
	get outDiameter() { return this._outDiameter; }
	get wall() { return this._wall; }
	bore() { return this._outDiameter - 2 * this._wall; }
}

class Calculator {
	// Physics
	static SOUND_SPEED_FACTOR = 20055;       // ≈ 331.3/√273.15 × 1000 (mm/s·√K⁻¹)
	static ABS_ZERO_OFFSET = 270.15;         // Temperature offset to Kelvin (empirical)

	// Hole acoustics
	static HOLE_END_EFFECT = 0.75;           // Air column extends ¾ past hole edge
	static CLOSED_HOLE_COEFF = 0.25;         // Closed hole correction coefficient

	// Embouchure correction (empirical)
	static WHISTLE_EMBOUCHURE_COEFF = 0.3;
	static FLUTE_EMBOUCHURE_COEFF = 11.5;

	// Music theory
	static MIDI_A4 = 57;                     // MIDI code for A4 (440 Hz)
	static LOG2_INV = 1.442741049;           // 1/ln(2) — converts ln ratio to octaves
	static SEMITONE_RATIO = 1.0293;          // ≈ 2^(1/24) — ratio for 50 cents
	static CENT_RATIO = 1.00057778950655;    // ≈ 2^(1/1200) — ratio for 1 cent

	// Optimum bore (empirical)
	static OPTIMUM_BORE_COEFF = 2620;
	static OPTIMUM_BORE_EXP = -5 / 6;

	constructor() {
		this._holeCount = 7;
		this._tube = null;
		this._Df = new Array(10);
		this._Demb1 = 0;
		this._Demb2 = 0;
		this._Ff = new Array(10);
		this._Fend = 0;
		this._Calib = 440;
		this._EndEfFactor = 0.5;
		this._TipLength = 0;
		this._embWall = 0;
		this._designType = 0;
		this._temperature = 25;

		this._Vsound = 0;
		this._Xend = 0;
		this._Xf = new Array(10);
		this._Xemb = 0;
		this._Cend = 0;
		this._Cclosed = 0;
		this._Xorg = 0;
	}

	// --- Setters (inputs) ---
	set tube(t) { this._tube = t; }
	setHoleDiameters(arr) { for (let i = 0; i < arr.length; i++) this._Df[i] = arr[i]; }
	setEmbouchureDiameters(d1, d2) { this._Demb1 = d1; this._Demb2 = d2; }
	setHoleFrequencies(arr) { for (let i = 0; i < arr.length; i++) this._Ff[i] = arr[i]; }
	set endFrequency(f) { this._Fend = f; }
	set calibration(c) { this._Calib = c; }
	set endEffectFactor(f) { this._EndEfFactor = f; }
	set tipLength(l) { this._TipLength = l; }
	set embWall(w) { this._embWall = w; }
	set designType(t) { this._designType = t; }
	set temperature(c) { this._temperature = c; }

	// --- Getters (results) ---
	get Vsound() { return this._Vsound; }
	get Xend() { return this._Xend; }
	get Xf() { return this._Xf; }
	get Xemb() { return this._Xemb; }
	get Xorg() { return this._Xorg; }
	get Cend() { return this._Cend; }
	get Cclosed() { return this._Cclosed; }
	get bore() { return this._tube ? this._tube.bore() : 0; }
	get holeCount() { return this._holeCount; }
	get tube() { return this._tube; }
	get Df() { return this._Df; }
	get Ff() { return this._Ff; }
	get Fend() { return this._Fend; }
	get Demb1() { return this._Demb1; }
	get Demb2() { return this._Demb2; }
	get Calib() { return this._Calib; }
	get TipLength() { return this._TipLength; }
	get EndEfFactor() { return this._EndEfFactor; }
	get temperature() { return this._temperature; }
	get embWall() { return this._embWall; }
	get designType() { return this._designType; }

	// effective wall thickness at open finger holes
	te(n) {
		return (1.0 * this._tube.wall) + (Calculator.HOLE_END_EFFECT * this._Df[n]);
	}

	// squared ratio of hole diameter to bore diameter
	holeDiameterRatio(n) {
		const bore = this._tube.bore();
		return (this._Df[n] / bore) ** 2;
	}

	// quarter wavelength for open pipe at given frequency
	quarterWavelength(freq) { return this._Vsound * 0.5 / freq; }

	// solve quadratic ax² + bx + c = 0, return smaller root
	static solveQuadratic(a, b, c) { return (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a); }

	// closed hole correction for tone hole n
	Cc(n) {
		const bore = this._tube.bore();
		return Calculator.CLOSED_HOLE_COEFF * this._tube.wall * this.holeDiameterRatio(n);
	}

	// end correction
	CendCalc() {
		return this._EndEfFactor * this._tube.bore();
	}

	// single hole correction
	Cs() {
		return this.te(1) / (this.holeDiameterRatio(1) + this.te(1) / (this._Xend - this._Xf[1]));
	}

	// open hole correction for hole n
	Co(n) {
		const bore = this._tube.bore();
		return ((this._Xf[n - 1] - this._Xf[n]) / 2) * (Math.sqrt(1 + 4 * (this.te(n) / (this._Xf[n - 1] - this._Xf[n])) * (bore / this._Df[n]) * (bore / this._Df[n])) - 1);
	}

	// embouchure correction
	Cemb() {
		const bore = this._tube.bore();
		const Le = this._embWall;
		const Bd = (bore * bore) / (this._Demb1 * this._Demb2);
		const De = this._Demb1 / 2 + this._Demb2 / 2;
		let Ec;
		if (this._designType == 0) {
			Ec = Bd * (1 * Le + Calculator.WHISTLE_EMBOUCHURE_COEFF * De);
		} else {
			Ec = Bd * Calculator.FLUTE_EMBOUCHURE_COEFF * Le * De / (1 * bore + 2 * Le);
		}
		return Ec;
	}

	// cutoff frequency
	fc(n) {
		if (this._Df[n] == 0) return 0;
		const bore = this._tube.bore();
		let s;
		if (n == this._holeCount) s = this._Xend - this._Xf[this._holeCount];
		else {
			if (this._Df[n + 1] > 0) s = this._Xf[n + 1] - this._Xf[n];
			else s = this._Xf[n + 2] - this._Xf[n];
		}
		const a = this._Vsound / 2 / Math.PI * this._Df[n] / bore / Math.sqrt(this.te(n) * s);
		return a / this._Ff[n];
	}

	// main calculation: hole locations measured from bottom end
	calculateHoleDistances() {
		const bore = this._tube.bore();
		let a, b, c, i, L, holeNum;

		this._Vsound = Calculator.SOUND_SPEED_FACTOR * Math.sqrt(1 * this._temperature + Calculator.ABS_ZERO_OFFSET);
		this._Xorg = this.quarterWavelength(this._Fend);
		this._Cend = this.CendCalc();
		this._Xend = this._Xorg - this._Cend;
		this._Cclosed = 0;
		for (i = 1; i <= this._holeCount; i++) this._Cclosed = this._Cclosed + this.Cc(i);
		for (i = 1; i <= this._holeCount; i++) this._Xend = this._Xend - this.Cc(i);

		// first hole (from end) location
		L = this.quarterWavelength(this._Ff[this._holeCount]);
		for (i = 2; i <= this._holeCount; i++) L = L - this.Cc(i - 1);
		a = this.holeDiameterRatio(this._holeCount);
		if (this._Df[this._holeCount] == 0) this._Xf[this._holeCount] = this._Xend;
		else {
			b = -(this._Xend + L) * a;
			c = this._Xend * L * a + this.te(this._holeCount) * (L - this._Xend);
			this._Xf[this._holeCount] = Calculator.solveQuadratic(a, b, c);
		}

		// subsequent finger hole locations
		if (this._holeCount >= 2)
			for (holeNum = this._holeCount - 1; holeNum > 0; holeNum--) {
				if (this._Df[holeNum] == 0) { this._Xf[holeNum] = this._Xf[holeNum + 1]; continue; }
				L = this.quarterWavelength(this._Ff[holeNum]);
				if (holeNum > 1 && holeNum <= this._holeCount) for (i = 1; i < holeNum; i++) L = L - this.Cc(i);
				a = 2;
				const ratio = 1 / this.holeDiameterRatio(holeNum);
				if (holeNum == 1) {
					b = -this._Xf[holeNum + 2] - 3 * L + this.te(holeNum) * ratio;
					c = this._Xf[holeNum + 2] * (L - this.te(holeNum) * ratio) + (L * L);
				} else {
					b = -this._Xf[holeNum + 1] - 3 * L + this.te(holeNum) * ratio;
					c = this._Xf[holeNum + 1] * (L - this.te(holeNum) * ratio) + (L * L);
				}
				this._Xf[holeNum] = Calculator.solveQuadratic(a, b, c);
			}
		this._Xemb = this.Cemb();
	}

	// --- Pure utility (static, no state) ---
	static midiCodeToFreq(midiCode, calib) {
		return calib * Math.pow(Math.pow(2.0, 1.0 / 12.0), midiCode - Calculator.MIDI_A4);
	}

	static centsDiff(f, calib) {
		let cv = 12 * Calculator.LOG2_INV * Math.log(f / calib);
		cv = 100 * (cv - Math.round(cv));
		cv = Math.round(cv);
		if (cv < 0) { cv = -1 * cv; cv = '-' + cv.toString(); }
		if (cv > 0) cv = '+' + cv.toString();
		return cv;
	}

	static freq2Note(f, calib) {
		const a = calib / Calculator.SEMITONE_RATIO;
		const b = calib * Calculator.SEMITONE_RATIO;
		const Nn = ["A", "Bb", "B", "C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#"];
		if (f < a / 4) f = f * 8;
		else if (f < a / 2) f = f * 4;
		else if (f < a) f = f * 2;
		else if (f > 2 * a) f = f / 2;
		else if (f > 4 * a) f = f / 2;
		for (let c = 0; c < 12; c++) {
			const d = Math.pow(2, c / 12);
			if (f > a * d && f < b * d) return Nn[c];
		}
	}

	static raiseFreq(f) {
		return Math.round(f * Calculator.CENT_RATIO * 10) / 10;
	}

	static lowerFreq(f) {
		return Math.round(f / Calculator.CENT_RATIO * 10) / 10;
	}

	static optimumBore(freqEnd) {
		return Calculator.OPTIMUM_BORE_COEFF * Math.pow(freqEnd, Calculator.OPTIMUM_BORE_EXP);
	}
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { Tube, Calculator };
}
