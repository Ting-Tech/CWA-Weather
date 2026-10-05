<script lang="ts">
	import { MapPin, Droplets, Smile, Umbrella } from '@lucide/svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import WeatherIcon from './weather-icon.svelte';
	import { formatDate, formatTime, type ForecastPeriod } from '#lib/weather.js';
	let { city, period }: { city: string; period: ForecastPeriod } = $props();
	let rainAdvice = $derived(
		period.rainProbability === null
			? '等待降雨預報'
			: period.rainProbability >= 50
				? '出門記得帶把傘'
				: period.rainProbability >= 30
					? '隨身帶傘，更安心'
					: '降雨機率較低'
	);
</script>

<div class="forecast-layout">
	<section class="hero-card" aria-label={`${city}所選時段預報`}>
		<div class="hero-top">
			<span><MapPin size={17} />{city}</span><Badge class="hero-badge">時段預報</Badge>
		</div>
		<p class="hero-date">
			{formatDate(period.startTime)}
			{formatTime(period.startTime)} — {formatDate(period.endTime)}
			{formatTime(period.endTime)}
		</p>
		<div class="hero-weather">
			<div>
				<p class="temperature">
					{period.minTemperature ?? '—'}<span>–</span>{period.maxTemperature ?? '—'}<sup>°C</sup>
				</p>
				<h2>{period.weather ?? '天氣現象未提供'}</h2>
				<p>{period.comfort ?? '舒適度未提供'}</p>
			</div>
			<WeatherIcon weather={period.weather} class="hero-icon" />
		</div>
		<div class="hero-bottom">
			<span>最低 {period.minTemperature ?? '—'}°C</span><span
				>最高 {period.maxTemperature ?? '—'}°C</span
			><small>預報氣溫範圍</small>
		</div>
	</section>
	<div class="metric-grid">
		<Card.Root class="metric"
			><Card.Content
				><div class="metric-title"><span>降雨機率</span><Droplets size={20} /></div>
				<p class="metric-number">{period.rainProbability ?? '—'}<span>%</span></p>
				<div class="rain-track" aria-hidden="true">
					<div style:width={`${period.rainProbability ?? 0}%`}></div>
				</div>
				<p class="metric-description">{rainAdvice}</p></Card.Content
			></Card.Root
		><Card.Root class="metric"
			><Card.Content
				><div class="metric-title"><span>舒適度</span><Smile size={20} /></div>
				<p class="comfort-value">{period.comfort ?? '未提供'}</p>
				<p class="metric-description">依氣象署所選時段預報</p></Card.Content
			></Card.Root
		>
		<div class="daily-note">
			<Umbrella size={22} />
			<div>
				<strong>出門小提醒</strong>
				<p>
					{rainAdvice}。{period.minTemperature !== null && period.minTemperature < 20
						? '早晚偏涼，記得加件外套。'
						: '依氣溫調整穿著，出門前再確認預報。'}
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.forecast-layout {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: 22px;
	}
	.hero-card {
		background: #e5f0ed;
		border: 1px solid #d6e6e0;
		border-radius: 18px;
		padding: 28px 30px 22px;
		overflow: hidden;
	}
	.hero-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.hero-top > span {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 21px;
		font-weight: 650;
	}
	:global(.hero-badge) {
		background: #ffffff80;
		color: #49796c;
		border: 0;
	}
	.hero-date {
		color: #6b817a;
		font-size: 11px;
		margin-top: 13px;
	}
	.hero-weather {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 30px 0;
	}
	.temperature {
		font-size: clamp(38px, 5vw, 62px);
		line-height: 1.2;
		letter-spacing: -3px;
		font-weight: 500;
	}
	.temperature > span {
		padding: 0 4px;
		font-size: 35px;
		color: #76998d;
	}
	.temperature > sup {
		font-size: 22px;
		letter-spacing: 0;
		margin-left: 7px;
		top: -1em;
	}
	.hero-weather h2 {
		font-size: 19px;
		margin-top: 17px;
		font-weight: 550;
	}
	.hero-weather h2 + p {
		color: #6b817a;
		font-size: 13px;
		margin-top: 5px;
	}
	:global(.hero-icon) {
		width: 102px;
		height: 102px;
		stroke-width: 1.2;
		color: #528777;
		flex-shrink: 0;
	}
	.hero-bottom {
		border-top: 1px solid #cbded6;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 18px;
		padding-top: 18px;
		font-size: 12px;
	}
	.hero-bottom small {
		margin-left: auto;
		color: #7b9389;
		font-size: 10px;
	}
	.metric-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18px;
	}
	:global(.metric) {
		border-radius: 15px;
		box-shadow: none;
	}
	.metric-title {
		display: flex;
		justify-content: space-between;
		color: #728293;
		font-size: 12px;
	}
	.metric-title > :global(svg) {
		color: #6c978d;
	}
	.metric-number {
		font-size: 48px;
		letter-spacing: -2px;
		font-weight: 550;
		margin: 22px 0 12px;
	}
	.metric-number span {
		font-size: 20px;
		color: #9ba8b4;
		margin-left: 4px;
	}
	.rain-track {
		height: 4px;
		border-radius: 4px;
		background: #e9f0f4;
		overflow: hidden;
	}
	.rain-track div {
		height: 100%;
		background: #729eaf;
	}
	.metric-description {
		font-size: 11px;
		color: #81909e;
		margin-top: 13px;
	}
	.comfort-value {
		font-size: 22px;
		font-weight: 600;
		line-height: 1.5;
		margin: 28px 0 25px;
	}
	.daily-note {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: 15px;
		border-radius: 12px;
		background: #edf1f5;
		padding: 20px;
	}
	.daily-note > :global(svg) {
		color: #768b9c;
		flex-shrink: 0;
	}
	.daily-note strong {
		font-size: 12px;
		font-weight: 600;
	}
	.daily-note p {
		font-size: 11px;
		line-height: 1.7;
		color: #7c8c9b;
		margin-top: 5px;
	}
	@media (max-width: 1000px) {
		.forecast-layout {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.hero-card {
			padding: 24px 22px;
		}
		.hero-date {
			font-size: 10px;
		}
		.temperature {
			font-size: 46px;
		}
		:global(.hero-icon) {
			width: 77px;
			height: 77px;
		}
		.hero-bottom {
			gap: 12px;
		}
		.hero-bottom small {
			display: none;
		}
		.metric-grid {
			gap: 12px;
		}
		.comfort-value {
			font-size: 19px;
		}
	}
</style>
