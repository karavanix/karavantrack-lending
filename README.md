# yool.live — лендинг

Маркетинговая страница YoolLive: воронка из восьми блоков на одном экране `/ru` (uz/en — после переводов). Заявки с формы уходят в api-server. Продуктовые материалы (тексты, макеты, записи, план, журнал) — в [`docs/funnel/`](docs/funnel/README.md).

## Стек

Next.js 15 (App Router, `output: standalone`), React 19, Tailwind v4 (токены в `app/globals.css`), next-intl 3, lucide-react. Пакетный менеджер — pnpm.

```sh
pnpm dev -p 3123     # разработка (порт 3123, чтобы не пересекаться с другими проектами)
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint (eslint.config.mjs: next/core-web-vitals + next/typescript)
pnpm build && pnpm start -p 3124
```

Форма заявки локально шлёт запросы в `API_BASE_URL` (по умолчанию прод api-server) — для проверок поднимайте заглушку и задавайте `API_BASE_URL=http://127.0.0.1:3999/api/v1`.

## Структура

```
app/
  [locale]/layout.tsx   шрифты, metadata, <html lang>
  [locale]/page.tsx     порядок блоков воронки
  api/leads/route.ts    приём заявки → api-server
  globals.css           токены дизайн-системы (@theme) и типографические утилиты t-*
  robots.ts, sitemap.ts
components/
  layout/               Nav, MobileMenu, Footer
  sections/             блоки страницы в порядке появления: Hero(+HeroMedia), HowItWorks(+HowSteps),
                        Benefits, Features, Drivers, Start(+LeadForm), Faq, FinalCta
  media/                рамки и видео: BrowserFrame, PhoneFrame, WindowWithPhone, PosterVideo, LoopVideo
  ui/                   примитивы: Section, SectionHeader, Button, Eyebrow, AccentWord, Logo, StoreBadges, Rail
lib/
  site.ts               ссылки (кабинет, сторы, документы) и якоря
  media.ts              реестр записей: имя → файл с учётом локали, размеры
  content.ts            типы массивов из messages (шаги, преимущества, функции, FAQ, подписи формы)
  leads.ts              тип заявки, проверка тела запроса, отправка с клиента
  video.ts              хелперы для видео в браузере: useVisible, play/pause/rewind, reduced motion
i18n/
  routing.ts            локали: все, живые, дефолтная
  request.ts            загрузка messages для next-intl
messages/               ru.json — источник текстов (копия docs/funnel/copy/ru.json); uz/en пока копии ru
middleware.ts           префикс локали; /uz и /en → /ru, пока нет переводов
public/media/           записи <id>.<locale>.{mp4,webp} (см. lib/media.ts и docs/funnel/recordings.md)
```

## Принципы

- **Сервер по умолчанию.** Блоки — серверные компоненты: читают тексты через `useTranslations`, выбирают записи через `clip(name, locale)` и передают клиентским частям строки и объекты `Clip`. `NextIntlClientProvider` не используется, поэтому словари и intl-рантайм в браузер не попадают.
- **Клиент только там, где нужен браузер:** меню, карусель, синхронная пара роликов, переключатель шагов, форма.
- **Видео.** `PosterVideo` = постер `<img>` под `<video preload="none">`. Постер — первый кадр ролика, он же последний, поэтому цикл без скачка. Играет только то, что на экране (`useVisible`); при `prefers-reduced-motion` видео не загружается вовсе. Правила съёмки и монтажа — `docs/funnel/recordings.md`.
- **Новый блок:** серверный компонент в `components/sections/`, тексты в `messages/*.json` (и в `docs/funnel/copy/`), обёртка `Section`, при необходимости `SectionHeader`; подключить в `app/[locale]/page.tsx`.
- **Новая запись:** файлы в `public/media/` и `docs/funnel/recordings/media/`, строка в реестре `lib/media.ts`, описание в `docs/funnel/recordings.md`.
- **Новый язык:** `messages/<locale>.json`, записи `<id>.<locale>.*` (иначе показываются русские), локаль в `liveLocales` (`i18n/routing.ts`), значки магазинов на этом языке.
- Стили — Tailwind-классы с токенами из `globals.css`; классы пишутся литералами (Tailwind собирает только то, что видит в исходниках). Форматтера в репо нет, `prettier` не запускать.

## Деплой

Мерж в `main` → GitHub Actions собирает образ по `Dockerfile` и выкатывает на прод (см. `docs/funnel/plan.md`, сессия 6, и память проекта). Аналитика и UTM настраиваются переменными `NEXT_PUBLIC_YM_ID` / `NEXT_PUBLIC_GA4_ID` (сессия 5).
