const { test, describe } = require('node:test');
const assert = require('node:assert');
const { Tube, Calculator } = require('../src/assets/calculator.js');

// Standard whistle configuration matching the app's KeyChange/TubeChange
// defaults for key index 8 (D whistle): OD=16, wall=1, ET intonation.
const ET_OFFSETS = [11, 10, 9, 7, 5, 4, 2, 0];
const DEFAULT_HOLES = [0, 5.5, 5.5, 6.4, 6.0, 5.0, 8.0, 7.0];
const KEY_MIDI_CODE = 68 - 8;

function holeFrequencies(keyMidiCode = KEY_MIDI_CODE, calib = 440) {
	const Fi = new Array(8);
	for (let i = 1; i <= 8; i++)
		Fi[i] = Calculator.midiCodeToFreq(keyMidiCode + ET_OFFSETS[i - 1], calib);
	return Fi;
}

function build(opts = {}) {
	const c = new Calculator();
	c.tube = new Tube(opts.OD ?? 16, opts.wall ?? 1);
	c.calibration = opts.calib ?? 440;
	c.endEffectFactor = opts.eef ?? 0.5;
	c.temperature = opts.temp ?? 25;
	c.embWall = opts.embWall ?? 2;
	c.designType = opts.design ?? 0;
	c.setEmbouchureDiameters(opts.e1 ?? 4.5, opts.e2 ?? 8.0);
	c.setHoleDiameters(opts.holes ?? DEFAULT_HOLES);
	c.setHoleFrequencies(opts.ff ?? holeFrequencies());
	c.endFrequency = opts.fend ?? c.Ff[8];
	return c;
}

describe('Calculator', () => {
	describe('static constants', () => {
		test('physics constants', () => {
			assert.strictEqual(Calculator.SOUND_SPEED_FACTOR, 20055);
			assert.strictEqual(Calculator.ABS_ZERO_OFFSET, 270.15);
		});

		test('hole acoustics constants', () => {
			assert.strictEqual(Calculator.HOLE_END_EFFECT, 0.75);
			assert.strictEqual(Calculator.CLOSED_HOLE_COEFF, 0.25);
		});

		test('embouchure constants', () => {
			assert.strictEqual(Calculator.WHISTLE_EMBOUCHURE_COEFF, 0.3);
			assert.strictEqual(Calculator.FLUTE_EMBOUCHURE_COEFF, 11.5);
		});

		test('music theory constants', () => {
			assert.strictEqual(Calculator.MIDI_A4, 57);
			assert.strictEqual(Calculator.LOG2_INV, 1.442741049);
			assert.strictEqual(Calculator.SEMITONE_RATIO, 1.0293);
			assert.strictEqual(Calculator.CENT_RATIO, 1.00057778950655);
		});

		test('optimum bore constants', () => {
			assert.strictEqual(Calculator.OPTIMUM_BORE_COEFF, 2620);
			assert.strictEqual(Calculator.OPTIMUM_BORE_EXP, -5 / 6);
		});
	});

	describe('constructor defaults', () => {
		test('hole count is 7', () => {
			assert.strictEqual(new Calculator().holeCount, 7);
		});

		test('no tube set: bore getter returns 0', () => {
			const c = new Calculator();
			assert.strictEqual(c.tube, null);
			assert.strictEqual(c.bore, 0);
		});

		test('hole diameter/frequency arrays are zero-filled length 10', () => {
			const c = new Calculator();
			assert.strictEqual(c.Df.length, 10);
			assert.strictEqual(c.Ff.length, 10);
			assert.ok(c.Df.every((v) => v === 0));
			assert.ok(c.Ff.every((v) => v === 0));
		});

		test('input defaults', () => {
			const c = new Calculator();
			assert.strictEqual(c.Calib, 440);
			assert.strictEqual(c.EndEfFactor, 0.5);
			assert.strictEqual(c.temperature, 25);
			assert.strictEqual(c.Demb1, 0);
			assert.strictEqual(c.Demb2, 0);
			assert.strictEqual(c.Fend, 0);
			assert.strictEqual(c.TipLength, 0);
			assert.strictEqual(c.embWall, 0);
			assert.strictEqual(c.designType, 0);
		});

		test('result fields start at zero', () => {
			const c = new Calculator();
			assert.strictEqual(c.Vsound, 0);
			assert.strictEqual(c.Xend, 0);
			assert.strictEqual(c.Xorg, 0);
			assert.strictEqual(c.Xemb, 0);
			assert.strictEqual(c.Cend, 0);
			assert.strictEqual(c.Cclosed, 0);
			assert.ok(c.Xf.every((v) => v === 0));
		});
	});

	describe('setters and getters', () => {
		test('scalar setters round-trip through getters', () => {
			const c = new Calculator();
			c.calibration = 442;
			assert.strictEqual(c.Calib, 442);
			c.endEffectFactor = 0.6;
			assert.strictEqual(c.EndEfFactor, 0.6);
			c.tipLength = 20.5;
			assert.strictEqual(c.TipLength, 20.5);
			c.embWall = 3;
			assert.strictEqual(c.embWall, 3);
			c.designType = 1;
			assert.strictEqual(c.designType, 1);
			c.temperature = 30;
			assert.strictEqual(c.temperature, 30);
			c.endFrequency = 440;
			assert.strictEqual(c.Fend, 440);
		});

		test('tube setter and getter', () => {
			const c = new Calculator();
			const t = new Tube(19, 1.2);
			c.tube = t;
			assert.strictEqual(c.tube, t);
			assert.strictEqual(c.bore, 16.6);
		});

		test('setHoleDiameters copies values by index', () => {
			const c = new Calculator();
			const arr = [0, 5, 6, 7, 8, 9, 10, 11];
			c.setHoleDiameters(arr);
			arr[1] = 999; // mutation after copy must not affect calculator
			assert.strictEqual(c.Df[1], 5);
			assert.strictEqual(c.Df[7], 11);
			assert.strictEqual(c.Df[9], undefined);
		});

		test('setHoleFrequencies copies values by index', () => {
			const c = new Calculator();
			const arr = [0, 440, 494, 523, 587, 659, 698, 784];
			c.setHoleFrequencies(arr);
			arr[2] = 0;
			assert.strictEqual(c.Ff[2], 494);
		});

		test('setEmbouchureDiameters sets both values', () => {
			const c = new Calculator();
			c.setEmbouchureDiameters(4.5, 8);
			assert.strictEqual(c.Demb1, 4.5);
			assert.strictEqual(c.Demb2, 8);
		});
	});

	describe('acoustics helpers', () => {
		const c = build();

		test('te(n): effective wall = wall + HOLE_END_EFFECT * hole diameter', () => {
			assert.strictEqual(c.te(2), 1 + 0.75 * 5.5);
			assert.strictEqual(c.te(1), 5.125);
		});

		test('te(n) with zero hole diameter equals wall thickness', () => {
			const c0 = build({ holes: [0, 0, 5.5, 5, 5, 5, 5, 5] });
			assert.strictEqual(c0.te(1), 1);
		});

		test('holeDiameterRatio(n): squared hole/bore ratio', () => {
			assert.strictEqual(c.holeDiameterRatio(2), (5.5 / 14) ** 2);
		});

		test('holeDiameterRatio(n) with zero hole is 0', () => {
			const c0 = build({ holes: [0, 0, 5.5, 5, 5, 5, 5, 5] });
			assert.strictEqual(c0.holeDiameterRatio(1), 0);
		});

		test('holeDiameterRatio(n) can exceed 1 for oversized holes', () => {
			const cBig = build({ holes: [0, 16, 5, 5, 5, 5, 5, 5] });
			assert.ok(cBig.holeDiameterRatio(1) > 1);
		});

		test('quarterWavelength(freq): Vsound * 0.5 / freq', () => {
			const cq = build();
			cq.calculateHoleDistances();
			assert.strictEqual(cq.quarterWavelength(440), cq.Vsound * 0.5 / 440);
			assert.ok(Math.abs(cq.quarterWavelength(440) - 391.5267) < 0.01);
		});

		test('quarterWavelength before calculation (Vsound=0) is 0', () => {
			assert.strictEqual(new Calculator().quarterWavelength(440), 0);
		});

		test('quarterWavelength with zero frequency is Infinity', () => {
			const cq = build();
			cq.calculateHoleDistances();
			assert.strictEqual(cq.quarterWavelength(0), Infinity);
		});
	});

	describe('solveQuadratic', () => {
		test('returns the smaller root', () => {
			assert.strictEqual(Calculator.solveQuadratic(1, -5, 6), 2); // roots 2, 3
			assert.strictEqual(Calculator.solveQuadratic(2, -8, 6), 1); // roots 1, 3
		});

		test('handles a double root', () => {
			assert.strictEqual(Calculator.solveQuadratic(1, -2, 1), 1); // (x-1)^2
		});

		test('handles a negative root', () => {
			assert.strictEqual(Calculator.solveQuadratic(1, 0, -4), -2); // roots -2, 2
		});

		test('returns NaN for a negative discriminant', () => {
			assert.ok(Number.isNaN(Calculator.solveQuadratic(1, 2, 5)));
		});
	});

	describe('correction terms', () => {
		test('Cc(n): CLOSED_HOLE_COEFF * wall * holeDiameterRatio(n)', () => {
			const c = build();
			assert.strictEqual(c.Cc(2), 0.25 * 1 * (5.5 / 14) ** 2);
			assert.ok(Math.abs(c.Cc(3) - 0.0522) < 0.0001);
		});

		test('Cc(n) is zero for a closed hole', () => {
			const c = build({ holes: [0, 0, 5.5, 5, 5, 5, 5, 5] });
			assert.strictEqual(c.Cc(1), 0);
		});

		test('CendCalc(): EndEfFactor * bore', () => {
			const c = build();
			c.calculateHoleDistances();
			assert.strictEqual(c.CendCalc(), 7);
			assert.strictEqual(c.Cend, 7);
		});

		test('CendCalc() with EndEfFactor=0 is 0', () => {
			const c = build({ eef: 0 });
			c.calculateHoleDistances();
			assert.strictEqual(c.Cend, 0);
		});

		test('Cs(): single hole correction after full calculation', () => {
			const c = build();
			c.calculateHoleDistances();
			assert.ok(Math.abs(c.Cs() - 27.6742) < 0.0001);
		});

		test('Co(n): open hole correction with well-defined spacing', () => {
			const c = build();
			c._Xf = [0, 200, 150, 0, 0, 0, 0, 0, 0, 0];
			c._Df = [0, 5.5, 5.5, 0, 0, 0, 0, 0, 0, 0];
			assert.ok(Math.abs(c.Co(2) - 22.8051) < 0.0001);
		});

		test('Co(1) uses Xf[0] (zero) as its neighbour', () => {
			const c = build();
			c._Xf = [0, 200, 150, 0, 0, 0, 0, 0, 0, 0];
			c._Df = [0, 5.5, 5.5, 0, 0, 0, 0, 0, 0, 0];
			assert.ok(Math.abs(c.Co(1) - 42.0459) < 0.0001);
		});
	});

	describe('Cemb embouchure correction', () => {
		test('whistle formula (designType 0)', () => {
			const c = build();
			c.calculateHoleDistances();
			assert.ok(Math.abs(c.Xemb - 21.0972) < 0.0001);
		});

		test('flute formula (designType 1) differs from whistle', () => {
			const c = build({ design: 1 });
			c.calculateHoleDistances();
			assert.ok(Math.abs(c.Xemb - 43.4799) < 0.0001);
			assert.notStrictEqual(c.Xemb, build().Cemb());
		});

		test('design type does not affect hole positions, only Xemb', () => {
			const w = build({ design: 0 });
			const f = build({ design: 1 });
			w.calculateHoleDistances();
			f.calculateHoleDistances();
			for (let i = 1; i <= 7; i++)
				assert.strictEqual(w.Xf[i], f.Xf[i]);
		});
	});

	describe('fc cutoff frequency', () => {
		test('returns 0 when the hole is closed', () => {
			const c = build();
			c.calculateHoleDistances();
			c._Df[3] = 0;
			assert.strictEqual(c.fc(3), 0);
		});

		test('n === holeCount uses spacing to the end', () => {
			const c = build();
			c.calculateHoleDistances();
			assert.ok(Math.abs(c.fc(7) - 2.7861) < 0.0001);
		});

		test('open next hole uses Xf[n+1] - Xf[n] spacing', () => {
			const c = build();
			c.calculateHoleDistances();
			assert.ok(Math.abs(c.fc(5) - 2.9663) < 0.0001);
		});

		test('closed next hole uses Xf[n+2] - Xf[n] spacing', () => {
			const c = build();
			c.calculateHoleDistances();
			c._Df[6] = 0;
			assert.ok(Math.abs(c.fc(5) - 1.8346) < 0.0001);
		});

		test('full sweep across all holes', () => {
			const c = build();
			c.calculateHoleDistances();
			const expected = [2.3476, 3.8663, 2.5076, 2.5090, 2.9663, 3.2601, 2.7861];
			for (let n = 1; n <= 7; n++)
				assert.ok(Math.abs(c.fc(n) - expected[n - 1]) < 0.0001, `fc(${n})`);
		});
	});

	describe('calculateHoleDistances integration', () => {
		test('computes sound speed from temperature', () => {
			const c = build({ temp: 25 });
			c.calculateHoleDistances();
			assert.ok(Math.abs(c.Vsound - 344543.4992) < 0.1);
			assert.strictEqual(c.Vsound, 20055 * Math.sqrt(25 + 270.15));
		});

		test('lower temperature gives lower sound speed', () => {
			const c20 = build({ temp: 20 });
			c20.calculateHoleDistances();
			const c25 = build({ temp: 25 });
			c25.calculateHoleDistances();
			assert.ok(c20.Vsound < c25.Vsound);
			assert.ok(Math.abs(c20.Vsound - 341612.6574) < 0.1);
		});

		test('freezing point temperature', () => {
			const c0 = build({ temp: 0 });
			c0.calculateHoleDistances();
			assert.ok(Math.abs(c0.Vsound - 329628.8021) < 0.1);
		});

		test('computes Xorg, Xend, Cend, Cclosed and Xemb', () => {
			const c = build();
			c.calculateHoleDistances();
			assert.ok(Math.abs(c.Xorg - 329.2334) < 0.01);
			assert.ok(Math.abs(c.Xend - 321.8820) < 0.01);
			assert.strictEqual(c.Cend, 7);
			assert.ok(Math.abs(c.Cclosed - 0.3514) < 0.0001);
			assert.ok(Math.abs(c.Xemb - 21.0972) < 0.0001);
		});

		test('hole positions match golden values (key 8 D whistle)', () => {
			const c = build();
			c.calculateHoleDistances();
			const expected = [155.7757, 172.6155, 179.5846, 201.8344, 227.7877, 246.5986, 276.9638];
			for (let n = 1; n <= 7; n++)
				assert.ok(Math.abs(c.Xf[n] - expected[n - 1]) < 0.01, `Xf[${n}] = ${c.Xf[n]}`);
		});

		test('hole positions are monotonic increasing from hole 1 to hole 7', () => {
			const c = build();
			c.calculateHoleDistances();
			for (let n = 2; n <= 7; n++)
				assert.ok(c.Xf[n] >= c.Xf[n - 1], `Xf[${n}] >= Xf[${n - 1}]`);
		});

		test('last hole closed: Xf[holeCount] equals Xend', () => {
			const c = build({ holes: [0, 5.5, 5.5, 6.4, 6.0, 5.0, 8.0, 0] });
			c.calculateHoleDistances();
			assert.strictEqual(c.Xf[7], c.Xend);
			assert.ok(Math.abs(c.Xend - 321.9445) < 0.01);
		});

		test('middle hole closed: position copies the next open hole', () => {
			const c = build({ holes: [0, 5.5, 0, 6.4, 6.0, 5.0, 8.0, 7.0] });
			c.calculateHoleDistances();
			assert.strictEqual(c.Xf[2], c.Xf[3]);
			assert.ok(Math.abs(c.Xf[2] - 179.6232) < 0.01);
		});

		test('top hole (hole 1) present: uses the holeNum == 1 special path', () => {
			const c = build();
			c.calculateHoleDistances();
			assert.ok(c.Xf[1] > 0);
			assert.ok(c.Xf[1] < c.Xf[3]);
		});

		test('all holes closed yields Xend for every hole position', () => {
			const c = build({ holes: [0, 0, 0, 0, 0, 0, 0, 0] });
			c.calculateHoleDistances();
			for (let n = 1; n <= 7; n++)
				assert.strictEqual(c.Xf[n], c.Xend);
		});

		test('throws without a tube', () => {
			const c = new Calculator();
			c.setHoleDiameters(DEFAULT_HOLES);
			c.setHoleFrequencies(holeFrequencies());
			c.endFrequency = 523.25;
			assert.throws(() => c.calculateHoleDistances(), TypeError);
		});

		test('custom calibration scales positions proportionally', () => {
			const base = build();
			base.calculateHoleDistances();
			const high = build({ calib: 442, ff: holeFrequencies(KEY_MIDI_CODE, 442) });
			high.calculateHoleDistances();
			const ratio = 440 / 442;
			// Frequencies scale exactly with the calibration ratio...
			assert.ok(Math.abs(high.Fend / base.Fend - 442 / 440) < 1e-9);
			assert.ok(Math.abs(high.Ff[7] / base.Ff[7] - 442 / 440) < 1e-9);
			// ...and hole positions scale (nearly) proportionally in reverse
			assert.ok(Math.abs(high.Xend / base.Xend - ratio) < 0.001);
			assert.ok(Math.abs(high.Xf[7] / base.Xf[7] - ratio) < 0.001);
			// A higher calibration (smaller wavelengths) yields shorter positions
			assert.ok(high.Xend < base.Xend);
			assert.ok(high.Xf[7] < base.Xf[7]);
		});
	});

	describe('static utilities', () => {
		describe('midiCodeToFreq', () => {
			test('A4 (MIDI 57) maps to the calibration frequency', () => {
				assert.strictEqual(Calculator.midiCodeToFreq(57, 440), 440);
				assert.strictEqual(Calculator.midiCodeToFreq(57, 442), 442);
			});

			test('one octave above A4 doubles the frequency', () => {
				assert.ok(Math.abs(Calculator.midiCodeToFreq(69, 440) - 880) < 1e-6);
			});

			test('one octave below A4 halves the frequency', () => {
				assert.ok(Math.abs(Calculator.midiCodeToFreq(45, 440) - 220) < 1e-6);
			});

			test('A3, A5 and A6 landmarks', () => {
				assert.ok(Math.abs(Calculator.midiCodeToFreq(45, 440) - 220) < 1e-6);
				assert.ok(Math.abs(Calculator.midiCodeToFreq(81, 440) - 1760) < 1e-3);
			});
		});

		describe('centsDiff', () => {
			test('identical frequency yields 0', () => {
				assert.strictEqual(Calculator.centsDiff(440, 440), 0);
			});

			test('exactly one semitone above yields 0 (diff is within semitone)', () => {
				assert.strictEqual(Calculator.centsDiff(440 * 2 ** (1 / 12), 440), 0);
			});

			test('rounds to nearest cent with +/- sign prefix', () => {
				assert.strictEqual(Calculator.centsDiff(440.5, 440), '+2');
				assert.strictEqual(Calculator.centsDiff(439.5, 440), '-2');
				assert.strictEqual(Calculator.centsDiff(440 * 2 ** (10 / 1200), 440), '+10');
				assert.strictEqual(Calculator.centsDiff(440 * 2 ** (-10 / 1200), 440), '-10');
			});

			test('at +/- 50 cents the sign is inverted (legacy quirk)', () => {
				// 50 cents is the mid-point of the semitone; Math.round(0.5) rounds up
				// in JS, producing a negative diff for +50c and positive for -50c.
				assert.strictEqual(Calculator.centsDiff(440 * 2 ** (50 / 1200), 440), '-50');
				assert.strictEqual(Calculator.centsDiff(440 * 2 ** (-50 / 1200), 440), '+50');
			});
		});

		describe('freq2Note', () => {
			const calib = 440;
			test('maps the chromatic scale within one octave', () => {
				const expected = {
					440: 'A', 466: 'Bb', 494: 'B', 523: 'C', 554: 'C#',
					587: 'D', 622: 'Eb', 659: 'E', 698: 'F', 740: 'F#',
					784: 'G', 831: 'G#'
				};
				for (const [freq, note] of Object.entries(expected))
					assert.strictEqual(Calculator.freq2Note(+freq, calib), note, `freq ${freq}`);
			});

			test('octave multiplication normalisation', () => {
				assert.strictEqual(Calculator.freq2Note(880, calib), 'A');
				assert.strictEqual(Calculator.freq2Note(220, calib), 'A');
				assert.strictEqual(Calculator.freq2Note(110, calib), 'A');
			});

			test('octave-multiplying branches', () => {
				assert.strictEqual(Calculator.freq2Note(100, calib), 'G'); // x8
				assert.strictEqual(Calculator.freq2Note(200, calib), 'G'); // x4
				assert.strictEqual(Calculator.freq2Note(400, calib), 'G'); // x2
			});

			test('octave-dividing branch', () => {
				assert.strictEqual(Calculator.freq2Note(900, calib), 'A'); // /2
			});

			test('out-of-range frequencies return undefined', () => {
				assert.strictEqual(Calculator.freq2Note(3520, calib), undefined);
				assert.strictEqual(Calculator.freq2Note(1760, calib), undefined);
				assert.strictEqual(Calculator.freq2Note(5, calib), undefined);
			});

			test('honours the calibration reference', () => {
				assert.strictEqual(Calculator.freq2Note(442, 442), 'A');
				// 880 is above the normalized octave band, so it falls through to 440 -> A
				assert.strictEqual(Calculator.freq2Note(880, 442), 'A');
				assert.strictEqual(Calculator.freq2Note(466, 442), 'Bb'); // 442-calibrated Bb
			});
		});

		describe('raiseFreq / lowerFreq', () => {
			test('raiseFreq nudges up ~1 cent then rounds to 0.1 Hz', () => {
				assert.strictEqual(Calculator.raiseFreq(440), 440.3);
				assert.strictEqual(Calculator.raiseFreq(587.33), 587.7);
			});

			test('lowerFreq nudges down ~1 cent', () => {
				assert.strictEqual(Calculator.lowerFreq(440.3), 440);
				assert.strictEqual(Calculator.lowerFreq(587.64), 587.3);
			});

			test('round-trip raise then lower restores the value', () => {
				assert.strictEqual(Calculator.lowerFreq(Calculator.raiseFreq(494)), 494);
				assert.strictEqual(Calculator.lowerFreq(Calculator.raiseFreq(523.25)), 523.3);
			});
		});

		describe('optimumBore', () => {
			test('known reference values', () => {
				assert.ok(Math.abs(Calculator.optimumBore(440) - 16.4219) < 0.0001);
				assert.ok(Math.abs(Calculator.optimumBore(220) - 29.2605) < 0.0001);
				assert.ok(Math.abs(Calculator.optimumBore(880) - 9.2165) < 0.0001);
				assert.ok(Math.abs(Calculator.optimumBore(622.25) - 12.3026) < 0.0001);
			});

			test('decreases monotonically with frequency', () => {
				assert.ok(Calculator.optimumBore(220) > Calculator.optimumBore(440));
				assert.ok(Calculator.optimumBore(440) > Calculator.optimumBore(880));
			});

			test('matches the closed-form formula', () => {
				assert.strictEqual(Calculator.optimumBore(440), 2620 * 440 ** (-5 / 6));
			});
		});
	});
});
