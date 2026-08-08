const { test, describe } = require('node:test');
const assert = require('node:assert');
const { Tube } = require('../src/assets/calculator.js');

describe('Tube', () => {
	test('stores outDiameter and wall on construction', () => {
		const t = new Tube(16, 1);
		assert.strictEqual(t.outDiameter, 16);
		assert.strictEqual(t.wall, 1);
	});

	test('getters return exact stored values', () => {
		const t = new Tube(19, 1.2);
		assert.strictEqual(t.outDiameter, 19);
		assert.strictEqual(t.wall, 1.2);
	});

	test('bore() is outDiameter minus twice the wall', () => {
		assert.strictEqual(new Tube(16, 1).bore(), 14);
		assert.strictEqual(new Tube(19, 1.2).bore(), 16.6);
	});

	test('bore() with zero wall equals outDiameter', () => {
		assert.strictEqual(new Tube(20, 0).bore(), 20);
	});

	test('bore() with thick wall is mathematically negative', () => {
		assert.strictEqual(new Tube(10, 6).bore(), -2);
	});

	test('accepts non-integer dimensions', () => {
		const t = new Tube(15.5, 0.75);
		assert.strictEqual(t.bore(), 14);
	});

	test('supports imperial units directly (inches)', () => {
		const t = new Tube(1, 0.03125);
		assert.strictEqual(t.bore(), 0.9375);
	});
});
