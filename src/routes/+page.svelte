<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page, navigating } from '$app/state';
	import { ArrowUpRight, CloudSun, Droplets, MapPin, RefreshCw, Thermometer } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import ForecastOverview from '#lib/components/forecast-overview.svelte';
	import WeatherIcon from '#lib/components/weather-icon.svelte';
	import { formatDate, formatTime, regions } from '#lib/weather.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let selectedPeriod = $state(0);
	let refreshing = $state(false);
	let interactionError = $state('');
	const cities = regions.flatMap((region) => region.cities);
	let requestedCity = $derived(page.url.searchParams.get('city') ?? '臺北市');
	let selectedCity = $derived(cities.includes(requestedCity) ? requestedCity : '臺北市');
	let forecast = $derived(data.cities.find((city) => city.name === selectedCity));
	let period = $derived(forecast?.periods[selectedPeriod] ?? forecast?.periods[0]);
	let busy = $derived(refreshing || !!navigating.to);

	async function selectCity(city: string) {
		interactionError = '';
		try {
			await goto(`${resolve('/')}?${new URLSearchParams({ city })}`, { reset: false });
		} catch {
			interactionError = '縣市切換失敗，請重試。';
		}
	}

	async function refresh() {
		refreshing = true;
		interactionError = '';
		try {
			await invalidate('weather:forecast');
		} catch {
			interactionError = '更新失敗，請稍後再試。';
		} finally {
			refreshing = false;
		}
	}
</script>

<svelte:head>
	<title>{selectedCity}今明 36 小時天氣預報｜CWA-Weather</title>
	<meta
		name="description"
		content="查看臺灣 22 縣市今明 36 小時天氣預報、氣溫、降雨機率與舒適度。資料來源：中央氣象署。"
	/>
</svelte:head>

<div class="weather-app">
	<header>
		<a class="brand" href={resolve('/')}
			><span class="brand-mark"><CloudSun size={25} /></span>CWA-Weather<small
				>中央氣象署天氣預報</small
			></a
		><a class="source-link" href="https://www.cwa.gov.tw/" target="_blank" rel="noreferrer"
			>中央氣象署 <ArrowUpRight size={15} /></a
		>
	</header>
	<main aria-busy={busy}>
		<div class="intro">
			<div>
				<p class="eyebrow">TAIWAN WEATHER FORECAST</p>
				<h1>先看天氣，再出發。</h1>
				<p class="muted">掌握今明 36 小時，讓每個日常都有好準備。</p>
			</div>
			<span class="intro-note">● 臺灣 22 縣市　 /　每 12 小時一個預報時段</span>
		</div>
		<section class="toolbar" aria-label="預報查詢">
			<form
				method="GET"
				action={resolve('/')}
				onsubmit={(event) => {
					event.preventDefault();
					void selectCity(String(new FormData(event.currentTarget).get('city')));
				}}
			>
				<MapPin size={19} aria-hidden="true" /><label for="city">查看縣市</label><select
					id="city"
					name="city"
					value={selectedCity}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
					>{#each regions as region}<optgroup label={region.name}
							>{#each region.cities as city}<option value={city}>{city}</option>{/each}</optgroup
						>{/each}</select
				><noscript><button type="submit">查詢</button></noscript>
			</form>
			<div class="refresh-area">
				<span
					>{data.fetchedAt
						? `擷取時間 ${formatDate(data.fetchedAt)} ${formatTime(data.fetchedAt)}`
						: '中央氣象署 · 今明 36 小時預報'}</span
				><Button variant="outline" onclick={refresh} disabled={busy}
					><RefreshCw size={15} class={refreshing ? 'animate-spin' : ''} />{refreshing
						? '更新中'
						: '更新預報'}</Button
				>
			</div>
		</section>
		{#if interactionError}<p role="alert" class="alert">{interactionError}</p>{/if}
		{#if data.issue}
			<section class="empty-state" role="status">
				<CloudSun size={56} strokeWidth={1.3} /><Badge variant="secondary"
					>{data.issue.kind === 'configuration' ? '等待連接氣象資料' : '資料暫時無法載入'}</Badge
				>
				<h2>{data.issue.message}</h2>
				{#if data.issue.kind === 'configuration'}<p>
						連接中央氣象署開放資料後，就能查看各縣市的最新預報。
					</p>
					<details>
						<summary>開發設定說明</summary>
						<p>複製 .env.example 為 .env，填入 CWA_API_KEY，然後重新啟動開發伺服器。</p>
					</details>
					<Button href="https://opendata.cwa.gov.tw/" target="_blank" rel="noreferrer"
						>前往氣象署開放資料平臺 <ArrowUpRight size={16} /></Button
					>
				{:else}<p>請重新取得預報，或稍後回來查看。</p>
					<Button onclick={refresh} disabled={busy}><RefreshCw size={16} />重新取得預報</Button
					>{/if}
			</section>
		{:else if !period}
			<section class="empty-state" role="status">
				<MapPin size={40} />
				<h2>{selectedCity}目前沒有預報資料</h2>
				<p>請切換其他縣市，或重新取得預報。</p>
				<Button onclick={refresh} disabled={busy}>重新取得預報</Button>
			</section>
		{:else}
			<ForecastOverview city={selectedCity} {period} />
			<section class="timeline" aria-labelledby="timeline-heading">
				<div class="section-heading">
					<div>
						<p class="eyebrow">THE NEXT 36 HOURS</p>
						<h2 id="timeline-heading">接下來的天氣</h2>
					</div>
					<span>選擇時段，查看詳細預報</span>
				</div>
				<div class="period-grid">
					{#each forecast?.periods ?? [] as item, index (item.startTime)}<button
							class="period-card"
							class:active={item === period}
							aria-pressed={item === period}
							onclick={() => (selectedPeriod = index)}
							><div class="period-header">
								<span>{formatDate(item.startTime)}</span><span class="period-tag"
									>{formatTime(item.startTime) >= '18:00' || formatTime(item.startTime) < '06:00'
										? '夜間'
										: '白天'}</span
								>
							</div>
							<p class="period-time">
								{formatTime(item.startTime)} → {formatDate(item.endTime)}
								{formatTime(item.endTime)}
							</p>
							<div class="period-weather">
								<WeatherIcon weather={item.weather} class="size-10" /><span
									>{item.weather ?? '未提供'}</span
								>
							</div>
							<div class="period-stats">
								<span
									><Thermometer size={16} />{item.minTemperature ?? '—'}–{item.maxTemperature ??
										'—'}°C</span
								><span><Droplets size={16} />{item.rainProbability ?? '—'}%</span>
							</div></button
						>{/each}
				</div>
			</section>
		{/if}
		<section class="city-section" aria-labelledby="city-heading">
			<div class="section-heading">
				<div>
					<p class="eyebrow">EXPLORE TAIWAN</p>
					<h2 id="city-heading">走到哪，都有好準備</h2>
				</div>
				<span>快速切換縣市</span>
			</div>
			<div class="city-groups">
				{#each regions as region}<div>
						<h3>{region.name}</h3>
						<div class="city-links">
							{#each region.cities as city}<a
									class:selected={city === selectedCity}
									href={`${resolve('/')}?${new URLSearchParams({ city })}`}
									aria-current={city === selectedCity ? 'page' : undefined}
									data-sveltekit-reset="false">{city}</a
								>{/each}
						</div>
					</div>{/each}
			</div>
		</section>
		<footer>
			<span>CWA-Weather，陪你準備每一天。</span>
			<p>
				資料來源：<a
					href="https://opendata.cwa.gov.tw/dist/opendata-swagger.html#/預報/get_v1_rest_datastore_F_C0032_001"
					target="_blank"
					rel="noreferrer">中央氣象署 F-C0032-001</a
				><br />時間皆為臺灣時間（UTC+8） · 此為時段預報，非即時觀測
			</p>
		</footer>
	</main>
</div>

<style>
	:global(body) {
		background: #f6f8fa;
		color: #24364a;
	}
	.weather-app {
		max-width: 1280px;
		margin: auto;
		padding: 0 48px;
	}
	header {
		height: 92px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #e2e8ee;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 11px;
		font-size: 22px;
		font-weight: 750;
		letter-spacing: 1px;
	}
	.brand-mark {
		background: #e4f1ed;
		color: #397f70;
		padding: 9px;
		border-radius: 13px;
	}
	.brand small {
		margin-left: 8px;
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 2px;
		color: #667687;
	}
	.source-link {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 12px;
		color: #647589;
	}
	main {
		padding-top: 48px;
	}
	.intro {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 24px;
		margin-bottom: 34px;
	}
	.eyebrow {
		font-size: 10px;
		letter-spacing: 2px;
		font-weight: 650;
		color: #578377;
		margin-bottom: 11px;
	}
	h1 {
		font-size: clamp(28px, 4vw, 38px);
		font-weight: 650;
		letter-spacing: 1px;
		line-height: 1.4;
	}
	.muted {
		font-size: 14px;
		color: #718091;
		margin-top: 12px;
	}
	.intro-note {
		font-size: 11px;
		color: #718091;
		padding-bottom: 3px;
	}
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: white;
		border: 1px solid #e2e8ee;
		border-radius: 12px;
		padding: 15px 20px;
		gap: 16px;
		margin-bottom: 22px;
	}
	form,
	.refresh-area {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	form > :global(svg) {
		color: #578377;
	}
	label {
		font-size: 12px;
		color: #718091;
	}
	select {
		border: 0;
		background-color: #f3f6f8;
		border-radius: 7px;
		padding: 8px 35px 8px 12px;
		min-width: 142px;
		font-size: 14px;
		font-weight: 600;
	}
	.refresh-area > span {
		font-size: 11px;
		color: #7d8b99;
	}
	.timeline,
	.city-section {
		margin-top: 38px;
	}
	.section-heading {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 20px;
		gap: 15px;
	}
	.section-heading h2 {
		font-size: 21px;
		font-weight: 650;
	}
	.section-heading .eyebrow {
		font-size: 9px;
		margin-bottom: 7px;
	}
	.section-heading > span {
		font-size: 11px;
		color: #83919f;
	}
	.period-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18px;
	}
	.period-card {
		border: 1px solid #e1e8ee;
		border-radius: 14px;
		background: white;
		padding: 22px;
		text-align: left;
		transition:
			border-color 150ms,
			background 150ms;
		cursor: pointer;
	}
	.period-card:hover {
		border-color: #93b6a9;
	}
	.period-card.active {
		background: #f0f7f4;
		border-color: #80a898;
		box-shadow: 0 0 0 1px #80a898;
	}
	.period-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 13px;
		font-weight: 600;
	}
	.period-tag {
		font-size: 10px;
		padding: 3px 8px;
		border-radius: 5px;
		background: #edf1f5;
		color: #748695;
		font-weight: 400;
	}
	.period-time {
		font-size: 10px;
		margin-top: 8px;
		color: #80919e;
	}
	.period-weather {
		display: flex;
		gap: 17px;
		align-items: center;
		margin: 26px 0;
		font-size: 14px;
	}
	.period-weather > :global(svg) {
		color: #729a8b;
		flex-shrink: 0;
	}
	.period-stats {
		display: flex;
		justify-content: space-between;
		border-top: 1px solid #e4ece8;
		padding-top: 15px;
		font-size: 13px;
	}
	.period-stats span {
		display: flex;
		gap: 7px;
		align-items: center;
	}
	.period-stats :global(svg) {
		color: #8697a5;
	}
	.city-section {
		padding-bottom: 36px;
	}
	.city-groups {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 26px;
		padding: 24px;
		background: white;
		border: 1px solid #e2e8ee;
		border-radius: 14px;
	}
	.city-groups h3 {
		font-size: 11px;
		color: #8795a2;
		margin-bottom: 12px;
	}
	.city-links {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}
	.city-links a {
		padding: 6px 9px;
		font-size: 12px;
		border-radius: 6px;
		color: #677b8b;
		background: #f6f8fa;
	}
	.city-links a:hover,
	.city-links a.selected {
		background: #e4f0ea;
		color: #3e7e68;
	}
	footer {
		border-top: 1px solid #e0e7ed;
		padding: 25px 0 32px;
		display: flex;
		justify-content: space-between;
		gap: 20px;
		align-items: center;
		color: #91a0ad;
		font-size: 10px;
		line-height: 1.9;
	}
	footer > span {
		font-size: 12px;
		color: #778999;
	}
	footer p {
		text-align: right;
	}
	footer a {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.empty-state {
		min-height: 360px;
		padding: 44px 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 17px;
		text-align: center;
		background: linear-gradient(130deg, #e8f2ed, #f0f5f8);
		border: 1px solid #dce8e2;
		border-radius: 18px;
	}
	.empty-state > :global(svg) {
		color: #659487;
	}
	.empty-state h2 {
		font-size: 22px;
		font-weight: 600;
	}
	.empty-state p {
		color: #718592;
		font-size: 13px;
		line-height: 1.8;
		max-width: 470px;
	}
	details {
		font-size: 12px;
		color: #638274;
	}
	summary {
		cursor: pointer;
	}
	details p {
		margin-top: 10px;
	}
	.alert {
		padding: 12px;
		color: #a54040;
		background: #fff1ee;
		border-radius: 8px;
		margin-bottom: 18px;
	}
	:global(a:focus-visible),
	:global(button:focus-visible),
	select:focus-visible,
	summary:focus-visible {
		outline: 3px solid #6b9f8b;
		outline-offset: 3px;
	}
	@media (max-width: 1000px) {
		.weather-app {
			padding: 0 28px;
		}
		.intro-note {
			display: none;
		}
		.city-groups {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	@media (max-width: 640px) {
		.weather-app {
			padding: 0 18px;
		}
		header {
			height: 76px;
		}
		.brand small {
			display: none;
		}
		main {
			padding-top: 30px;
		}
		.intro {
			margin-bottom: 24px;
		}
		.toolbar {
			flex-direction: column;
			align-items: stretch;
			padding: 15px;
		}
		.toolbar form {
			justify-content: space-between;
		}
		.refresh-area {
			justify-content: space-between;
		}
		.refresh-area > span {
			font-size: 10px;
		}
		.period-grid {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		.period-card {
			padding: 20px;
		}
		.period-weather {
			margin: 18px 0;
		}
		.section-heading > span {
			display: none;
		}
		.city-groups {
			grid-template-columns: repeat(2, 1fr);
			padding: 19px;
			gap: 22px;
		}
		footer {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}
		footer p {
			text-align: left;
		}
		.empty-state h2 {
			font-size: 19px;
		}
	}
</style>
