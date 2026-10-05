import test from 'node:test';
import assert from 'node:assert/strict';
import { parseForecast, formatTime, regions } from '../src/lib/weather.ts';

const slot = (value, start = '2026-10-05 18:00:00', end = '2026-10-06 06:00:00') => ({
	startTime: start,
	endTime: end,
	parameter: { parameterName: value }
});
const element = (name, values) => ({ elementName: name, time: values });
const payload = (elements) => ({
	success: 'true',
	records: { location: [{ locationName: '臺北市', weatherElement: elements }] }
});

test('aligns shuffled weather elements and intervals by timestamps', () => {
	const first = (value) => slot(value, '2026-10-05 06:00:00', '2026-10-05 18:00:00');
	const [city] = parseForecast(
		payload([
			element('PoP', [slot('0'), first('70')]),
			element('MaxT', [slot('25'), first('30')]),
			element('Wx', [slot('多雲'), first('短暫雨')]),
			element('MinT', [first('23'), slot('20')]),
			element('CI', [slot('舒適'), first('悶熱')])
		])
	);
	assert.equal(city.name, '臺北市');
	assert.equal(city.periods[0].weather, '短暫雨');
	assert.equal(city.periods[0].rainProbability, 70);
	assert.equal(city.periods[0].minTemperature, 23);
	assert.equal(city.periods[1].rainProbability, 0);
	assert.equal(city.periods[1].comfort, '舒適');
});

test('missing and invalid numeric values remain null rather than zero', () => {
	const [city] = parseForecast(
		payload([
			element('Wx', [slot('晴')]),
			element('PoP', [slot('101')]),
			element('MinT', [slot('')]),
			element('MaxT', [slot('NaN')])
		])
	);
	assert.equal(city.periods[0].rainProbability, null);
	assert.equal(city.periods[0].minTemperature, null);
	assert.equal(city.periods[0].maxTemperature, null);
	assert.equal(city.periods[0].comfort, null);
});

test('does not use values from a different forecast interval', () => {
	const [city] = parseForecast(
		payload([
			element('Wx', [slot('晴')]),
			element('PoP', [slot('60', '2026-10-05 06:00:00', '2026-10-05 18:00:00')])
		])
	);
	assert.equal(city.periods[1].rainProbability, null);
});

test('normalizes CWA timestamps to Taiwan time independently of host timezone', () => {
	const [city] = parseForecast(payload([element('Wx', [slot('晴')])]));
	assert.equal(city.periods[0].startTime, '2026-10-05T18:00:00+08:00');
	assert.equal(formatTime(city.periods[0].startTime), '18:00');
});

test('rejects unsuccessful or malformed upstream responses', () => {
	for (const value of [
		null,
		{},
		{ success: 'false' },
		{ success: 'true', records: {} },
		payload([element('Wx', [slot('晴', 'invalid')])]),
		payload([element('Wx', [slot('晴', '2026-10-06 06:00:00', '2026-10-05 18:00:00')])])
	]) {
		assert.throws(() => parseForecast(value));
	}
});

test('offers 22 unique counties and cities', () => {
	assert.equal(new Set(regions.flatMap((region) => region.cities)).size, 22);
});
