export const regions = [
	{ name: '北部', cities: ['臺北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣'] },
	{ name: '中部', cities: ['苗栗縣', '臺中市', '彰化縣', '南投縣', '雲林縣'] },
	{ name: '南部', cities: ['嘉義市', '嘉義縣', '臺南市', '高雄市', '屏東縣'] },
	{ name: '東部', cities: ['宜蘭縣', '花蓮縣', '臺東縣'] },
	{ name: '離島', cities: ['澎湖縣', '金門縣', '連江縣'] }
];

export interface ForecastPeriod {
	startTime: string;
	endTime: string;
	weather: string | null;
	minTemperature: number | null;
	maxTemperature: number | null;
	rainProbability: number | null;
	comfort: string | null;
}

export interface CityForecast {
	name: string;
	periods: ForecastPeriod[];
}

type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Invalid forecast response');
	}
	return value as JsonObject;
}

function timestamp(value: unknown): string {
	if (typeof value !== 'string') throw new Error('Invalid forecast timestamp');
	// CWA 的無時區時間為臺灣時間，明確指定 UTC+8，避免瀏覽器所在地影響。
	const normalized = value.replace(' ', 'T');
	const iso = /(?:Z|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : `${normalized}+08:00`;
	if (!Number.isFinite(Date.parse(iso))) throw new Error('Invalid forecast timestamp');
	return iso;
}

function numeric(value: string | null, minimum: number, maximum: number): number | null {
	if (value === null || value.trim() === '') return null;
	const result = Number(value);
	return Number.isFinite(result) && result >= minimum && result <= maximum ? result : null;
}

/** 依元素名稱與時間區間對齊，不依賴 API 的陣列順序。 */
export function parseForecast(payload: unknown): CityForecast[] {
	const response = object(payload);
	if (response.success !== 'true' && response.success !== true)
		throw new Error('Unsuccessful forecast response');
	const locations = object(response.records).location;
	if (!Array.isArray(locations)) throw new Error('Missing forecast locations');
	return locations.map((item) => {
		const location = object(item);
		if (typeof location.locationName !== 'string' || !Array.isArray(location.weatherElement)) {
			throw new Error('Invalid forecast location');
		}
		const periods = new Map<string, { startTime: string; endTime: string }>();
		const elements = new Map<string, Map<string, string>>();
		for (const item of location.weatherElement) {
			const element = object(item);
			if (typeof element.elementName !== 'string' || !Array.isArray(element.time))
				throw new Error('Invalid weather element');
			const values = new Map<string, string>();
			for (const item of element.time) {
				const time = object(item);
				const startTime = timestamp(time.startTime);
				const endTime = timestamp(time.endTime);
				if (Date.parse(endTime) <= Date.parse(startTime))
					throw new Error('Invalid forecast interval');
				const key = `${startTime}/${endTime}`;
				periods.set(key, { startTime, endTime });
				const name = object(time.parameter).parameterName;
				if (typeof name === 'string') values.set(key, name);
			}
			elements.set(element.elementName, values);
		}
		return {
			name: location.locationName,
			periods: [...periods]
				.map(([key, period]) => {
					const get = (element: string) => elements.get(element)?.get(key) ?? null;
					return {
						...period,
						weather: get('Wx'),
						minTemperature: numeric(get('MinT'), -50, 60),
						maxTemperature: numeric(get('MaxT'), -50, 60),
						rainProbability: numeric(get('PoP'), 0, 100),
						comfort: get('CI')
					};
				})
				.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
		};
	});
}

export function formatDate(value: string): string {
	return new Intl.DateTimeFormat('zh-TW', {
		timeZone: 'Asia/Taipei',
		month: '2-digit',
		day: '2-digit',
		weekday: 'short'
	}).format(new Date(value));
}

export function formatTime(value: string): string {
	return new Intl.DateTimeFormat('zh-TW', {
		timeZone: 'Asia/Taipei',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).format(new Date(value));
}
