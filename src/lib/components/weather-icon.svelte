<script lang="ts">
	import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Sun } from '@lucide/svelte';
	let { weather, class: className = 'size-8' }: { weather: string | null; class?: string } =
		$props();
	let Icon = $derived(
		weather?.includes('雷')
			? CloudLightning
			: weather?.includes('毛毛')
				? CloudDrizzle
				: weather?.includes('雨')
					? CloudRain
					: weather?.includes('晴') && weather?.includes('雲')
						? CloudSun
						: weather?.includes('晴')
							? Sun
							: Cloud
	);
</script>

<Icon class={className} aria-hidden="true" />
