# PR `landing/funnel` → `main`

Открыть: https://github.com/karavanix/karavantrack-lending/compare/main...landing/funnel?expand=1

## Перед мержем: GitHub Variables

Репозиторий → Settings → Secrets and variables → Actions → вкладка **Variables** (не Secrets: `NEXT_PUBLIC_*` вшиваются в сборку и видны в браузере).

| Variable | Значение |
|---|---|
| `NEXT_PUBLIC_YM_ID` | `113981562` |
| `NEXT_PUBLIC_GA4_ID` | `G-JG2S0B2V30` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | пусто (нужно только при подтверждении мета-тегом) |
| `NEXT_PUBLIC_YANDEX_VERIFICATION` | пусто (то же) |

`NEXT_PUBLIC_APP_URL` остаётся как есть. Без первых двух переменных сайт соберётся и будет работать, просто без счётчиков.

## Заголовок

`Лендинг-воронка вместо 3D-сцены: продающая страница с записями продукта, формой заявки, счётчиками и SEO`

## Описание

Новая главная yool.live по макету `docs/funnel/design/landing.html`: первый экран «Хватит звонить водителю», «Как это работает» (шаги + сцена с роликами), 12 преимуществ, три функции с записями, «Водителям», тёмный блок старта с формой «Большой автопарк?», вопросы, финал. 3D-сцена и three.js удалены.

- **Стек:** Next 15.1 / React 19 / Tailwind v4 / next-intl; блоки — серверные компоненты, клиентские только видео, шаги, карусель, форма, меню, аналитика. ESLint подключён, `pnpm lint` в CI.
- **Записи продукта:** `public/media/` (ролики 1–1,5 МБ с постерами), реестр `lib/media.ts`; играют только на экране, при `prefers-reduced-motion` — постеры.
- **Форма заявки:** `/api/leads` → api-server, honeypot, проверка полей (`lib/leads.ts`).
- **Аналитика:** Яндекс Метрика + GA4 через `NEXT_PUBLIC_YM_ID` / `NEXT_PUBLIC_GA4_ID` (загрузка после `load`); цели `hero_cta`, `nav_cta`, `start_cta`, `final_cta`, `driver_cta`, `login`, `store_google`, `store_apple`, `lead_submit`, `lead_success`; `utm_*`/`yclid`/`gclid` переносятся в ссылки регистрации и входа (хранятся 30 дней).
- **SEO:** title/description, canonical, OG-картинка `og.ru.png`, JSON-LD (Organization, SoftwareApplication), `robots.txt`, `sitemap.xml`, иконки; коды подтверждения поисковиков через env.
- **Языки:** пока только `/ru`; `/uz` и `/en` → 307 на `/ru` до переводов (`i18n/routing.ts` → `liveLocales`).
- **Бюджеты (прод-сборка, 360×640, CPU ×4, 1,6 Мбит/с):** LCP 0,75 с (прод сейчас 3,7 с), CLS 0, свой JS 117 КБ (прод 199 КБ; из них 105 КБ — база Next + React), шрифты 143 КБ.
- Скриншоты: `docs/funnel/design/built-{360,390,1440}.png`. Журнал сессий: `docs/funnel/plan.md`.

Не проверено на настоящем телефоне (adb без устройства) — посмотреть прод на Honor после выкладки: автозапуск роликов, плавность прокрутки, меню.

## После выкладки

1. Открыть https://yool.live/ru, в `view-source` убедиться, что есть `mc.yandex.ru/watch/113981562` в `<noscript>` (значит, переменные дошли до сборки). В Метрике через 10–15 минут появятся визиты; в GA4 → Отчёты → В реальном времени.
2. Метрика → Цели → «Добавить цель» → тип **JavaScript-событие**, идентификаторы: `hero_cta`, `nav_cta`, `start_cta`, `final_cta`, `driver_cta`, `login`, `store_google`, `store_apple`, `lead_submit`, `lead_success`. GA4: Администратор → События — появятся сами после первых кликов; `lead_submit` и `*_cta` отметить как ключевые.
3. Google Search Console (ресурс «Доменный» `yool.live`, TXT в DNS) и Яндекс Вебмастер (DNS или мета-тег → тогда коды в переменные выше и пересобрать) → отправить `https://yool.live/sitemap.xml`.
4. Превью ссылки: в Telegram написать `@WebpageBot` адрес `https://yool.live/ru` (сбросит кэш и покажет карточку с `og.ru.png`); https://developers.facebook.com/tools/debug/ и https://www.opengraph.xyz/ — то же.
5. Проверить `https://yool.live/robots.txt`, `https://yool.live/sitemap.xml`, редирект `https://yool.live/uz` → `/ru`.
6. UTM для рекламы: `utm_source` (telegram, instagram, google, yandex), `utm_medium` (cpc, post, story, qr), `utm_campaign` (например `launch_ru_2026_11`); цель «регистрация» внутри app.yool.live — отдельная задача в репо кабинета.
