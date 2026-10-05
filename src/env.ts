import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	CWA_API_KEY: { schema: (value) => value?.trim() ?? '' }
});
