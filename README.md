# İzİmza Frontend Case

## Canlı bağlantılar

| Uygulama  | Adres                                                                          |
| --------- | ------------------------------------------------------------------------------ |
| İzİmza    | [izimza.vercel.app](https://izimza.vercel.app)                                 |
| Storybook | [izimza-storybook-phi.vercel.app](https://izimza-storybook-phi.vercel.app)     |
| API       | [Cloudflare Worker](https://izimza-case-api.storycolor-cdn.workers.dev/health) |

## Neler yapıldı?

- Auth0 ile giriş, çıkış, korumalı sayfalar ve şifre sıfırlama
- Dashboard, imzalama, zaman damgalama, belge geçmişi ve profil sayfaları
- Çoklu dosya seçimi, otomatik yükleme ve yükleme ilerleme bilgisi
- Belge önizleme, indirme, silme ve e-posta ile gönderme akışları
- Arama, tarih, dosya türü ve işlem türü filtreleri
- Form doğrulama, hata mesajları, toast bildirimleri ve skeleton ekranları
- Türkçe ve İngilizce dil desteği
- Mobil, tablet ve masaüstü uyumlu arayüz

## Kullanılan teknolojiler

- Vue 3 Composition API ve TypeScript
- Pinia, Vue Router ve Axios
- Auth0 OAuth 2.0 / OpenID Connect
- Cloudflare Workers, D1 ve R2
- JSON Server
- Vue I18n, Vitest ve Vue Test Utils
- Storybook, ESLint, Prettier ve Husky
- Vite ve Vercel

## Nasıl çalışıyor?

```text
Kullanıcı
   ↓
Vue 3 uygulaması · Vercel
   ├── Auth0 → giriş ve access token
   └── Axios → API istekleri
                    ↓
             Cloudflare Worker
               ├── Auth0 token doğrulama
               ├── D1 → kayıtlar
               └── R2 → dosyalar
```

Axios bütün frontend API isteklerinin ortak noktasıdır..

Hem lokal geliştirmede hem production ortamında ana backend Cloudflare Worker'dır. 
JSON Server yalnızca case kapsamında tutuldu, isteğe bağlı fake API eklendi.
`npm run api` çalıştırılmadığı ve API adresi `localhost:3001` yapılmadığı sürece mock veriler kullanılmaz.

## Proje yapısı

```text
src/
├── pages/          Route karşılığı sayfalar
├── features/       İş alanına özel component, store, API ve tipler
├── components/     Ortak UI ve layout componentleri
├── api/            Axios ve ortak hata yönetimi
├── router/         Route tanımları ve auth guard
├── stores/         Global Pinia modülleri
├── locales/        Türkçe ve İngilizce çeviriler
└── styles/         Design token ve global stiller

worker/
├── src/            Cloudflare Worker API
└── migrations/     D1 migration dosyaları
```

Sayfalar yalnızca ekran akışını kurar. API çağrıları, Pinia state'i ve TypeScript tipleri ilgili feature klasöründe birlikte tutulur.

## Kurulum

Node.js 20 veya üzeri ve npm gereklidir.

```bash
npm ci
cp .env.example .env.local
```

`.env.local` dosyasını kendi Auth0 bilgilerinizle doldurun:

```env
VITE_API_BASE_URL=https://izimza-case-api.storycolor-cdn.workers.dev
VITE_AUTH0_DOMAIN=<auth0-domain>
VITE_AUTH0_CLIENT_ID=<auth0-client-id>
VITE_AUTH0_AUDIENCE=https://izimza-case-api
VITE_AUTH0_DATABASE_CONNECTION=Username-Password-Authentication
```

`VITE_` ile başlayan değerler tarayıcıya açıktır; bu alanlara secret yazılmamalıdır.

Auth0 uygulamasında şu adreslere izin verin:

```text
Callback URL:  http://localhost:5173/auth/callback
Logout URL:    http://localhost:5173
Web Origin:    http://localhost:5173
```

Ardından uygulamayı başlatın:

```bash
npm run dev
```

### Worker'ı lokalde çalıştırmak

```bash
cp worker/.dev.vars.example worker/.dev.vars
npm run worker:migrate:local
npm run worker:dev
```

Bu durumda `VITE_API_BASE_URL=http://localhost:8787` kullanılmalıdır.

### İsteğe bağlı JSON Server

Fake API'yi denemek isterseniz API adresini `http://localhost:3001` yapıp ayrı bir terminalde şu komutu çalıştırın:

```bash
npm run api
```

## Komutlar

| Komut                | Ne yapar?                                    |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Frontend'i başlatır                          |
| `npm run api`        | İsteğe bağlı JSON Server'ı başlatır          |
| `npm run worker:dev` | Worker'ı lokalde başlatır                    |
| `npm run build`      | Kontrolleri ve production build'i çalıştırır |
| `npm test`           | Vitest testlerini çalıştırır                 |
| `npm run storybook`  | Storybook'u `localhost:6006` üzerinde açar   |
| `npm run check`      | Format, lint ve TypeScript kontrolü yapar    |

## İş kuralları

- Yüklenen dosya önce taslak olarak kaydedilir; bu aşamada kontör düşmez.
- İmzalanan veya zaman damgalanan her dosya için 1 kontör kullanılır.
- İmzalama ve zaman damgalama sayıları ayrı tutulur.
- Dosya boyutu en fazla 25 MB olabilir.
- PDF, Word, XML, UBL ve yaygın görsel formatları desteklenir.
- Kullanıcı yalnızca kendi profil, taslak ve belge kayıtlarına erişebilir.

## Notlar

Gerçek elektronik imza ve SMS sağlayıcısı kullanılmadığı için 6 haneli doğrulama kodu simüle edilir. “E-posta ile gönder” işlemi de bildirim gösterir ancak gerçek e-posta göndermez.

Vitest şu anda `BaseInput` componentinin veri iletişimini ve erişilebilir hata gösterimini kontrol eder. UI componentleri ayrıca Storybook üzerinden bağımsız olarak incelenebilir.
