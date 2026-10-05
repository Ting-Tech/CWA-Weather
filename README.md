# CWA-Weather

以 Svelte 5、SvelteKit 3、TypeScript、Tailwind CSS 4 與官方 registry 安裝的 shadcn-svelte 元件，呈現中央氣象署今明 36 小時天氣預報。

## 啟動

使用 Node.js 22.16 以上版本及 pnpm。

```sh
pnpm install
cp .env.example .env
```

在 [中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/)申請會員授權碼，在 `.env` 設定：

```dotenv
CWA_API_KEY=你的授權碼
```

```sh
pnpm dev
```

修改 `.env` 後需重新啟動。未設定金鑰時顯示設定提示，不使用模擬資料冒充預報。授權碼僅在伺服器使用，不可改成 public 變數。

## 功能

- 22 縣市查詢，依北／中／南／東／離島分組；縣市寫入 URL，可分享與使用瀏覽器上一頁。
- 各縣市三個預報時段，切換時段可查看天氣現象、最低／最高氣溫、降雨機率與舒適度。
- 手動更新、更新中停用按鈕、連線逾時、授權失敗、空資料及缺少欄位的處理。
- 響應式版面、鍵盤焦點、表單標籤與選取狀態；時間固定為 Asia/Taipei。

## 架構

```text
src/env.ts                              私有環境變數定義
src/lib/weather.ts                      型別、縣市、純資料解析與時間格式
src/lib/server/weather.ts               氣象署請求及安全的錯誤訊息
src/routes/+page.server.ts              SSR load 與更新依賴
src/routes/+page.svelte                  頁面、URL 縣市狀態與時段選取
src/lib/components/forecast-overview.svelte  所選時段摘要
src/lib/components/weather-icon.svelte  天氣圖示
src/lib/components/ui/                  官方 shadcn-svelte 元件
tests/weather.test.mjs                  解析、缺值、時間對齊與時區測試
```

依 [SvelteKit load 文件](https://svelte.dev/docs/kit/load)，使用 `+page.server.ts` 取得資料，再透過產生的 `PageProps` 傳入頁面；API 不在 `onMount` 呼叫。依 [SvelteKit 3 環境變數文件](https://svelte.dev/docs/kit/environment-variables)，使用 `defineEnvVars` 與 `$app/env/private`。畫面使用 Svelte 5 的 `$props`、`$state`、`$derived` 與事件屬性。

伺服器一次取得全部縣市；切換縣市使用既有資料，手動更新透過 `invalidate('weather:forecast')` 重新請求。沒有跨請求的全域使用者狀態。

## API

[官方 Swagger 文件](https://opendata.cwa.gov.tw/dist/opendata-swagger.html#/預報/get_v1_rest_datastore_F_C0032_001)

`GET https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001`

請求參數：`Authorization`（私有授權碼）、`format=JSON`、`sort=time`。未指定 `locationName` 與 `elementName`，取得全部縣市與五個元素：`Wx`、`PoP`、`MinT`、`MaxT`、`CI`。

解析 `records.location[].weatherElement[].time[]`，依元素名稱與完整起訖時間對齊，不依賴元素或時段順序。缺值或無效數值顯示「—」。API 無時區時間明確轉為 UTC+8。畫面的「擷取時間」指本次取得資料的時間，不代表氣象署發布時間。此資料是每 12 小時的時段預報，不是即時觀測或逐小時預報。

## 檢查與部署

```sh
pnpm check
pnpm test
pnpm format:check
pnpm build
```

保留初始專案的 `adapter-auto`。部署到支援的平台時設定伺服器環境變數 `CWA_API_KEY`；若平台不受 `adapter-auto` 支援，依 [官方 adapters 文件](https://svelte.dev/docs/kit/adapters)選用對應 adapter。此專案需要伺服器執行私有 API 請求，不能直接當成純靜態網站部署。
