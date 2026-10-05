import { ForecastError, getForecast } from '#lib/server/weather.js';
import type { CityForecast } from '#lib/weather.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, depends }) => {
	depends('weather:forecast');
	try {
		return { ...(await getForecast(fetch)), issue: null };
	} catch (error) {
		if (!(error instanceof ForecastError)) throw error;
		return {
			cities: [] as CityForecast[],
			fetchedAt: null,
			issue: { kind: error.kind, message: error.message }
		};
	}
};
