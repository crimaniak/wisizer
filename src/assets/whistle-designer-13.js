//whistle-designer-13.js

// Default hole proportions (diameter / bore)
const DEFAULT_HOLE_DIAMETERS = [0, 0.39, 0.36, 0.46, 0.43, 0.36, 0.57, 0.54];
const DEFAULT_EMBOUCHURE_PROPS = { wallFrac: 0.16, lenFrac: 0.31, widFrac: 0.62 };
const TUBE_CHANGE_HOLE_DIAMETERS = [0, 0.39, 0.39, 0.46, 0.43, 0.36, 0.57, 0.50];
const TUBE_CHANGE_EMBOUCHURE_PROPS = { lenFrac: 0.32, widFrac: 0.57 };

// Key/midi
const MIDI_KEY_BASE = 68;             // First key option (F#5)

// Frequency thresholds for instrument naming
const BASS_FREQ_THRESHOLD = 240;
const LOW_FREQ_THRESHOLD = 425;

// Canvas layout
const MAX_CANVAS_WIDTH = 1120;
const RESPONSIVE_SCALE_FACTOR = 0.92;

// Unit conversion
const MM_PER_INCH = 25.4;

const HOLE_LABELS = ['T1', 'Th', 'T2', 'T3', 'B1', 'B2', 'B3', 'B4', 'X', 'X'];
const INTONATION_NAMES = ['Just', 'HB-trad', 'ET'];

const KEY_INDEX_RANGES = [
	[0,1,0], [2,3,1], [4,5,2], [6,7,3], [8,9,4],
	[10,11,6], [12,13,8], [14,16,9], [17,19,10],
	[20,21,11], [22,25,12], [26,28,13], [29,32,14]
];

function roundTo(value, precision) {
	const p = Math.pow(10, precision);
	return Math.round(value * p) / p;
}

function roundUnit(value, K, R) { return Math.round(R / K * value) / R; }

function getUnitSystem() {
	if (form.convert.selectedIndex == 0)
		return { K: 1, R: 10, U: '', unitLabel: 'mm' };
	return { K: MM_PER_INCH, R: 1000, U: '"', unitLabel: '"' };
}

function getKeyIndex(key) {
	for (const [lo, hi, idx] of KEY_INDEX_RANGES)
		if (key >= lo && key <= hi) return idx;
	return 0;
}

function getIntonationName(selectedIndex) {
	return INTONATION_NAMES[selectedIndex];
}

function loadFormInputs(form, calc, K) {
	calc.tube = new Tube(K * form.OuterDiam.value, K * form.wall.value);
	calc.calibration = form.calib.value;
	calc.temperature = form.tempC.value;
	calc.endEffectFactor = form.endEfFactor.value;
	calc.tipLength = K * form.tipLength.value;
	calc.embWall = K * form.embWall.value;
	calc.designType = form.design.selectedIndex;
	calc.setEmbouchureDiameters(K * form.diamEmb1.value, K * form.diamEmb2.value);
	calc.setHoleDiameters([
		0,
		K * form.diam1.value, K * form.diam2.value, K * form.diam3.value,
		K * form.diam4.value, K * form.diam5.value, K * form.diam6.value,
		K * form.diam7.value
	]);
	const ff = [0,
		form.freq1.value, form.freq2.value, form.freq3.value,
		form.freq4.value, form.freq5.value, form.freq6.value,
		form.freq7.value
	];
	for (let i = 1; i <= calc.holeCount; i++) if (ff[i] == 0) calc.Df[i] = 0;
	calc.setHoleFrequencies(ff);
	calc.endFrequency = 1 * form.freqEnd.value;
}

function writeCentsdiff(form, calc) {
	for (let i = 1; i <= 7; i++)
		form['centsdiff' + i].value = Calculator.centsDiff(calc.Ff[i], calc.Calib);
	form.centsdiffEnd.value = Calculator.centsDiff(calc.Fend, calc.Calib);
}

function writeDiameters(form, calc, K, R) {
	form.diamEmb1.value = roundUnit(calc.Demb1, K, R);
	form.diamEmb2.value = roundUnit(calc.Demb2, K, R);
	for (let i = 1; i <= 7; i++)
		form['diam' + i].value = roundUnit(calc.Df[i], K, R);
}

function writeResults(form, calc, K, R, U) {
	form.tipLength.value = roundUnit(calc.TipLength, K, R);
	form.resultLength.value = (parseFloat(calc.TipLength / K) + roundUnit(calc.Xend - calc.Xemb, K, R)) + U;
	form.resultEmb.value = roundUnit(calc.Xend - calc.Xemb, K, R) + U;
	for (let i = 1; i <= 7; i++)
		form['result' + i].value = calc.Df[i] == 0 ? 0 : roundUnit(calc.Xend - calc.Xf[i], K, R) + U;
}

function writeCutoffs(form, calc) {
	for (let i = 1; i <= 7; i++)
		form['cutoff' + i].value = calc.Df[i] == 0 ? 0 : roundTo(10 * calc.fc(i), 1);
}

function writeSpacings(form, calc, K, R, U) {
	form.spacing1.value = roundUnit(calc.Xf[3] - calc.Xf[1], K, R) + U;
	form.spacing2.value = calc.Df[2] == 0 ? 0 : roundUnit(calc.Xf[2] - calc.Xf[1], K, R) + U;
	form.spacing3.value = roundUnit(calc.Xf[4] - calc.Xf[3], K, R) + U;
	form.spacing4.value = roundUnit(calc.Xf[4] - calc.Xf[1], K, R) + U;
	form.spacing5.value = roundUnit(calc.Xf[6] - calc.Xf[5], K, R) + U;
	form.spacing6.value = roundUnit(calc.Xf[7] - calc.Xf[6], K, R) + U;
	form.spacing7.value = roundUnit(calc.Xf[7] - calc.Xf[5], K, R) + U;
}

function writeNotes(form, calc) {
	for (let i = 1; i <= 7; i++)
		form['note' + i].value = Calculator.freq2Note(form['freq' + i].value, calc.Calib);
	form.noteEnd.value = Calculator.freq2Note(form.freqEnd.value, calc.Calib);
}

function updateHeaders(form, calc) {
	const n = form.freqEnd.value;
	let low;
	if (n == 0) low = "key ";
	else if (n < BASS_FREQ_THRESHOLD) low = "Bass ";
	else if (n < LOW_FREQ_THRESHOLD) low = "Low ";
	else low = "";
	const c = form.calib.value;
	let cal;
	if (c == 440) cal = "";
	else cal = "<span style='font-size:smaller; padding-left:1em;'><em> A=" + c + "</em></span>";
	document.getElementById('keyheader').innerHTML = low + Calculator.freq2Note(form.freqEnd.value, calc.Calib) + cal;
	document.getElementById('canvasheader').innerHTML = "Diagram: " + low + Calculator.freq2Note(form.freqEnd.value, calc.Calib);
	window.addEventListener('resize', DrawWhistle, false);
}

const holeCount = 7;
let tube;
let form;
const calc = new Calculator();

//setting initial hole diameters relative to bore size
//called by changes in OD and wall
function HoleInit() {
    form = document.forms.fluteForm;
    const C = 1;
	tube = new Tube(C * form.OuterDiam.value, C * form.wall.value);
	calc.tube = tube;
	calc.calibration = form.calib.value;
	calc.temperature = form.tempC.value;
	calc.endEffectFactor = form.endEfFactor.value;
	const bore = tube.bore();
	form.embWall.value = roundTo(bore * DEFAULT_EMBOUCHURE_PROPS.wallFrac, 1) / C;
	form.diamEmb1.value = roundTo(bore * DEFAULT_EMBOUCHURE_PROPS.lenFrac, 1) / C;
	form.diamEmb2.value = roundTo(bore * DEFAULT_EMBOUCHURE_PROPS.widFrac, 1) / C;
	form.diam1.value = Math.round(2 * bore * DEFAULT_HOLE_DIAMETERS[1]) / 2 / C;
	form.diam2.value = Math.round(2 * bore * DEFAULT_HOLE_DIAMETERS[2]) / 2 / C;
	form.diam3.value = Math.round(2 * bore * DEFAULT_HOLE_DIAMETERS[3]) / 2 / C;
	form.diam4.value = Math.round(2 * bore * DEFAULT_HOLE_DIAMETERS[4]) / 2 / C;
	form.diam5.value = Math.round(2 * bore * DEFAULT_HOLE_DIAMETERS[5]) / 2 / C;
	form.diam6.value = Math.round(2 * bore * DEFAULT_HOLE_DIAMETERS[6]) / 2 / C;
	form.diam7.value = Math.round(2 * bore * DEFAULT_HOLE_DIAMETERS[7]) / 2 / C;
	Calculate();
}

// setting tube diameter and wall thickness according to change in key
function TubeChange(key) {
    const { K, R } = getUnitSystem();
	const index = getKeyIndex(key);
	let OD, WL;
    if (K == 1)
		OD = [12, 13, 14, 15, 16, 16.6, 18, 19, 20, 22.2, 25.4, 28, 30, 32, 35];
    else
		OD = [15/32, 1/2, 9/16, 19/32, 5/8, 21/32, 11/16, 3/4, 13/16, 7/8, 1, 9/8, 5/4, 11/8, 3/2];
	WL = [1, 1, 1, 1, 1, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1, 1, 1.2, 1.2];
	form.OuterDiam.value = Math.round(R * OD[index]) / R;
    if (K == 1)
	    form.wall.value = Math.round(R / K * WL[index]) / R;
    else
        form.wall.value = Math.round(R * 3 / 64) / R;

	tube = new Tube(K * form.OuterDiam.value, K * form.wall.value);
	calc.tube = tube;
	const bore = tube.bore();
	const wall = tube.wall;
	form.embWall.value = 2 * wall;
	form.diamEmb1.value = Math.round(R / K * bore * TUBE_CHANGE_EMBOUCHURE_PROPS.lenFrac) / R;
	form.diamEmb2.value = Math.round(R / K * bore * TUBE_CHANGE_EMBOUCHURE_PROPS.widFrac) / R;
	form.diam1.value = Math.round(R / K * bore * TUBE_CHANGE_HOLE_DIAMETERS[1]) / R;
	form.diam2.value = Math.round(R / K * bore * TUBE_CHANGE_HOLE_DIAMETERS[2]) / R;
	form.diam3.value = Math.round(R / K * bore * TUBE_CHANGE_HOLE_DIAMETERS[3]) / R;
	form.diam4.value = Math.round(R / K * bore * TUBE_CHANGE_HOLE_DIAMETERS[4]) / R;
	form.diam5.value = Math.round(R / K * bore * TUBE_CHANGE_HOLE_DIAMETERS[5]) / R;
	form.diam6.value = Math.round(R / K * bore * TUBE_CHANGE_HOLE_DIAMETERS[6]) / R;
	form.diam7.value = Math.round(R / K * bore * TUBE_CHANGE_HOLE_DIAMETERS[7]) / R;
}

// sets input frequencies according to key and intonation chosen
// sets tube size
// goes on to Calculate()
function KeyChange(key) {
    form = document.forms.fluteForm;
    key = form.key.selectedIndex;
	calc.calibration = form.calib.value;
	const calib = calc.Calib;
	const keyMidiCode = MIDI_KEY_BASE - key;
	form.key2.value = form.key.value;
	const int = form.intonation;
	const intonation = getIntonationName(int.selectedIndex);
	const ME = [11, 10, 9, 7, 5, 4, 2, 0];
	const MJ = [15/8, 16/9, 5/3, 3/2, 4/3, 5/4, 9/8, 1];
	const MH1 = [1.866066, 1.777778, 1.679720, 1.498380, 1.333333, 1.254890, 1.123790, 1];
	const Fi = new Array(8);
	for (let i = 1; i <= calc.holeCount + 1; i++) {
		if (intonation == "Just")
			Fi[i] = Calculator.midiCodeToFreq(keyMidiCode, calib) * MJ[i - 1];
		else if (intonation == "HB-trad")
			Fi[i] = Calculator.midiCodeToFreq(keyMidiCode, calib) * MH1[i - 1];
		else if (intonation == "ET")
			Fi[i] = Calculator.midiCodeToFreq(keyMidiCode + ME[i - 1], calib);
	}
	for (let i = 1; i <= 8; i++)
		form['freq' + (i < 8 ? i : 'End')].value = roundTo(Fi[i], 1);

	TubeChange(key);
	Calculate();
}

function IncrDiam(d) {
    let y = 0.1;
    if (form.convert.selectedIndex == 1)
        y = 0.01;
    return roundTo(1 * d + y, 2);
}

function DecrDiam(d) {
    let y = 0.25;
    if (form.convert.selectedIndex == 1)
         y = 0.01;
    return roundTo(d - y, 3);
}

function RaiseFreq(f) { return Calculator.raiseFreq(f); }
function LowerFreq(f) { return Calculator.lowerFreq(f); }

function Temp(t) {
	form.tempC.value = t;
	form.tempF.value = t * 9 / 5 - (-1) * 32;
	Calculate();
}

function Slide() {
	const cents = form.slideCents.value;
	const f = calc.Fend * Math.pow(2, cents / 1200);
	const slide = calc.quarterWavelength(calc.Fend) - calc.quarterWavelength(f);
	const { K, R, unitLabel } = getUnitSystem();
	form.slideLength.value = roundUnit(slide, K, R) + unitLabel;
}

function Calculate() {
	const { K, R, U } = getUnitSystem();

	// read inputs from form into calculator
	loadFormInputs(form, calc, K);

	// calculate
	calc.calculateHoleDistances();

	// draw
	DrawWhistle();

	// write results to form
	writeCentsdiff(form, calc);
	writeDiameters(form, calc, K, R);
	writeResults(form, calc, K, R, U);
	writeCutoffs(form, calc);
	writeSpacings(form, calc, K, R, U);
	writeNotes(form, calc);
	Slide();
	form.bore.value = roundUnit(calc.bore, K, R) + U;
	form.bore2.value = roundUnit(calc.bore, K, R) + U;
	form.optimumBore.value = roundUnit(Calculator.optimumBore(form.freqEnd.value), K, R) + U;

	updateHeaders(form, calc);
}

function drawHoleLabels(jg, xf, df, gy, gz) {
	jg.setColor("maroon");
	for (let i = 1; i <= 10; i++)
		if (calc.Df[i] > 0) jg.drawString(HOLE_LABELS[i - 1], xf[i] - df[i] + 2, gy + gz);
}

function DrawWhistle() {
	const jg = new jsGraphics("canvas");
	const win = window.innerWidth;
	let sc;
	if (win >= 1200) sc = MAX_CANVAS_WIDTH / calc.Xend;
	else sc = RESPONSIVE_SCALE_FACTOR * win / calc.Xend;
	const gx = sc * calc.Xend;
	const gy = sc * calc.bore;
	const gz = sc * calc.tube.wall;
	const xf = new Array(10);
	const df = new Array(10);
	for (let i = 1; i <= calc.holeCount + 1; i++)
		xf[i] = sc * calc.Xf[i];
	for (let i = 1; i <= calc.holeCount + 1; i++)
		df[i] = sc * calc.Df[i];
	jg.setColor("#ffffff");
	jg.fillRect(-1 * (gz + 10), -1 * (gz + 10), gx + gz + 30, gy + gz + 40);
	jg.setColor("#bdb");
	jg.fillRect(0, 0, gx, gy);
	jg.setColor("green");
	jg.setStroke(gz);
	jg.drawRect(-1 * gz, -1 * gz, gx + gz, gy + gz);
	jg.setStroke(1);
	const t = Math.ceil(calc.Xf[1] / 10) + 2;
	jg.setColor("white");
	for (let i = 1; i <= t; i++)
		jg.drawLine(sc * (calc.Xend - 10 * i), gy - 5, sc * (calc.Xend - 10 * i), gy);
	jg.setColor("maroon");
	jg.fillRect(0, (gy - sc * calc.Demb2) / 2, sc * calc.Demb1, sc * calc.Demb2);
	jg.setColor("#990000");
	for (let i = 1; i <= calc.holeCount + 1; i++)
		jg.fillEllipse(xf[i] - df[i], gy / 2 - df[i] / 2, df[i], df[i]);
	jg.setColor("#FF9494");
	jg.fillEllipse(xf[2] - df[2], gy / 2 - df[2] / 2, df[2], df[2]);
	drawHoleLabels(jg, xf, df, gy, gz);
	jg.paint();
}
