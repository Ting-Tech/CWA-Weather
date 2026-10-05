import { CWA_API_KEY } from '$app/env/private';
import { parseForecast } from '#lib/weather.js';

export class ForecastError extends Error {
	constructor(
		public readonly kind: 'configuration' | 'authorization' | 'unavailable',
		message: string
	) {
		super(message);
	}
}

export async function getForecast(fetcher: typeof fetch) {
	if (!CWA_API_KEY) throw new ForecastError('configuration', '尚未設定氣象署 API 授權碼');
	const url = new URL('https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001');
	url.search = new URLSearchParams({
		Authorization: CWA_API_KEY,
		format: 'JSON',
		sort: 'time'
	}).toString();
	try {
		const response = await fetcher(url, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(10_000)
		});
		if (response.status === 401 || response.status === 403) {
			throw new ForecastError('authorization', '氣象署授權碼無效，請確認伺服器設定後重試。');
		}
		if (!response.ok) throw new Error('Upstream request failed');
		const cities = parseForecast(await response.json());
		return { cities, fetchedAt: new Date().toISOString() };
	} catch (error) {
		if (error instanceof ForecastError) throw error;
		// 不傳回上游例外，避免含授權碼的請求網址出現在頁面或記錄中。
		throw new ForecastError('unavailable', '暫時無法取得氣象署預報，請稍後再試。');
	}
}
