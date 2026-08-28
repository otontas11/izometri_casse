# İzİmza Frontend Case

## Canlı bağlantılar

| Uygulama  | Adres                                                                          |
| --------- | ------------------------------------------------------------------------------ |
| İzİmza    | [izimza.vercel.app](https://izimza.vercel.app)                                 |
| Storybook | [izimza-storybook-phi.vercel.app](https://izimza-storybook-phi.vercel.app)     |
| API       | [Cloudflare Worker](https://izimza-case-api.storycolor-cdn.workers.dev/health) |

## Projede neler var?

- Auth0 ile giriş, çıkış ve korumalı sayfalar
- Dashboard, imzalama, zaman damgalama, belge geçmişi ve profil sayfaları
- Çoklu dosya seçimi, otomatik yükleme ve ilerleme bilgisi
- Belge önizleme, indirme, silme ve e-posta ile gönderme akışları
- Arama, tarih, dosya türü ve işlem türü filtreleri
- Form doğrulama, hata yönetimi, toast bildirimleri ve skeleton ekranları
- Türkçe ve İngilizce dil desteği
- Mobil, tablet ve masaüstü uyumlu tasarım

## Teknolojiler

| Teknoloji                 | Projedeki görevi                                   |
| ------------------------- | -------------------------------------------------- |
| Vue 3 + TypeScript        | Composition API ile tip güvenli arayüz geliştirme  |
| Pinia                     | Feature bazlı state yönetimi                       |
| Vue Router                | Sayfa yönlendirmeleri ve auth guard                |
| Axios                     | API istekleri, access token ve ortak hata yönetimi |
| Auth0                     | OAuth 2.0 / OpenID Connect authentication          |
| Cloudflare Worker         | Uygulamanın API katmanı                            |
| D1 + R2                   | Kayıtların ve dosyaların saklanması                |
| Storybook                 | Componentleri bağımsız inceleme                    |
| Vitest                    | Component testleri                                 |
| ESLint + Prettier + Husky | Kod ve commit standartları                         |

## Mimari

Proje **feature-based mimari** ile yapılandırıldı. Dashboard, imzalama, zaman damgalama ve profil gibi her iş alanı; kendi componentlerini, Pinia store'unu, API fonksiyonlarını ve TypeScript tiplerini `features` altında birlikte tutar.

Uygulamadaki temel istek akışı şöyledir:

```text
Page → Pinia Store → Feature API → Axios → Cloudflare Worker → D1 / R2
                                      ↑
                               Auth0 access token
```

API çağrıları Vue componentlerinin içinde yapılmaz. Bu sayede sayfalar daha küçük kalır ve iş kuralları tek yerde yönetilir.

```text
src/
├── pages/        Sayfalar
├── features/     Feature componentleri, store, API ve tipler
├── components/   Ortak UI ve layout componentleri
├── api/          Axios ve ortak hata yönetimi
├── router/       Route ve auth guard
└── locales/      Türkçe ve İngilizce çeviriler

worker/           Cloudflare API ve D1 migrationları
mock/             İsteğe bağlı JSON Server fake API
```

## Kurulum

Node.js `24.x` ve npm gereklidir.

```bash
npm ci
cp .env.example .env.local
```

`.env.local` dosyasındaki Auth0 alanlarını doldurun:

```env
VITE_API_BASE_URL=https://izimza-case-api.storycolor-cdn.workers.dev
VITE_AUTH0_DOMAIN=<auth0-domain>
VITE_AUTH0_CLIENT_ID=<auth0-client-id>
VITE_AUTH0_AUDIENCE=https://izimza-case-api
VITE_AUTH0_DATABASE_CONNECTION=Username-Password-Authentication
```

Auth0 callback adresi `http://localhost:5173/auth/callback`, logout ve web origin adresi ise `http://localhost:5173` olmalıdır.

```bash
npm run dev
```

Worker'ı lokalde çalıştırmak için `npm run worker:migrate:local` ve `npm run worker:dev` komutlarını kullanın. Bu durumda API adresi `http://localhost:8787` olmalıdır.

Ana geliştirme ve production akışı Cloudflare Worker kullanır. JSON Server yalnızca isteğe bağlıdır; `VITE_API_BASE_URL=http://localhost:3001` ayarlandıktan sonra `npm run api` ile başlatılır.

## Temel komutlar

```bash
npm run dev          # Frontend
npm run build        # Kontroller ve production build
npm test             # Vitest
npm run storybook    # Storybook
npm run check        # Format, lint ve TypeScript kontrolü
```

## İş kuralları ve notlar

- Dosya önce taslak olarak kaydedilir; yükleme sırasında kontör düşmez.
- İmzalanan veya zaman damgalanan her dosya için 1 kontör kullanılır.
- İmzalama ve zaman damgalama sayıları ayrı tutulur.
- Dosya boyutu en fazla 25 MB olabilir.
- PDF, Word, XML, UBL ve yaygın görsel formatları desteklenir.
- Kullanıcı yalnızca kendi profil, taslak ve belge kayıtlarına erişebilir.

Gerçek elektronik imza ve SMS sağlayıcısı kullanılmadığı için 6 haneli doğrulama kodu simüle edilir. “E-posta ile gönder” işlemi de kullanıcı geri bildirimi üretir ancak gerçek e-posta göndermez.

Vitest şu anda `BaseInput` componentinin veri iletişimini ve erişilebilir hata gösterimini kontrol eder. Dashboard kartı, profil formu ve zaman damgası geçmişi Storybook üzerinden ayrıca incelenebilir.
