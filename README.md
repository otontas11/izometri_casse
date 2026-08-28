# İzİmza Frontend Case
Vue 3 ve TypeScript ile tasarlandı. 
Kimlik doğrulama, dosya yükleme, kontör kullanımı, veri yönetimi ve kullanıcı geri bildirimleri

## Canlı ortamlar

| Uygulama              | Adres                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| İzİmza                | [izimza.vercel.app](https://izimza.vercel.app)                                                          |
| Storybook             | [izimza-storybook-phi.vercel.app](https://izimza-storybook-phi.vercel.app)                              |
| Cloudflare Worker API | [izimza-case-api.storycolor-cdn.workers.dev](https://izimza-case-api.storycolor-cdn.workers.dev/health) |

## Uygulamada neler var?

- Auth0 ile giriş, çıkış, oturum koruması ve uygun database kullanıcıları için şifre sıfırlama
- İmzalama ve zaman damgalama için çoklu dosya yükleme
- Dosya seçildikten sonra otomatik taslak yükleme ve yükleme ilerleme bilgisi
- İşlem öncesinde 6 haneli doğrulama adımı
- Başarıyla işlenen her dosya için 1 kontör kullanımı
- Dashboard metrikleri, son belgeler ve devam eden işlem kartı
- Belge önizleme, indirme, silme ve e-posta ile gönderme akışları
- Arama, tarih, dosya türü ve işlem türü filtrelerine sahip sayfalı belge geçmişi
- Profil görüntüleme, düzenleme ve doğrulama bilgileri
- Türkçe ve İngilizce dil desteği
- Form doğrulama, hata yönetimi, toast bildirimleri ve responsive skeleton ekranları

## Mimari

Frontend, sayfa ve iş alanı sorumluluklarını birbirinden ayıran Feature-based bir yapıya sahiptir.

```text
Kullanıcı
   ↓
Vue 3 SPA · Vercel
   ├── Auth0 → giriş ve access token
   └── Axios → Bearer token ile API isteği
                    ↓
             Cloudflare Worker
               ├── Auth0 JWT doğrulama
               ├── D1 → profil ve belge kayıtları
               └── R2 → yüklenen dosyalar
```

Ana uygulama ve Storybook aynı Git deposundan, iki ayrı Vercel projesi olarak yayınlandı. API ise Cloudflare Worker üzerinde bağımsız çalışıyor.

Temel klasörlerin sorumlulukları:

```text
src/
├── pages/          Route karşılığı sayfalar
├── features/       İş alanına özel component, store, API ve tipler
├── components/     Ortak UI ve layout componentleri
├── api/            Axios instance, interceptor ve ortak hata dönüşümü
├── router/         Route tanımları ve authentication guard
├── stores/         Global Pinia modülleri
├── locales/        Türkçe ve İngilizce metinler
└── styles/         Design token ve global stiller

worker/
├── src/            Cloudflare Worker API, Auth0 doğrulama ve veri katmanı
└── migrations/     D1 veritabanı migration dosyaları
```

Her feature kendi API, Pinia store, component ve TypeScript tiplerini birlikte tutar. 

## Kullanılan teknolojiler

| Alan               | Teknolojiler                                              |
| ------------------ | --------------------------------------------------------- |
| Frontend           | Vue 3 Composition API, TypeScript, Vite                   |
| State ve routing   | Pinia, Vue Router, route guards                           |
| API                | Axios, request/response interceptors, JSON Server         |
| Authentication     | Auth0 OAuth 2.0 / OpenID Connect, JWT                     |
| Backend ve storage | Cloudflare Workers, D1, R2                                |
| Arayüz             | CSS design, responsive tasarım, i18n            |
| Kalite             | Vitest, Vue Test Utils, Storybook, ESLint, Prettier, Husky |
| Deployment         | Vercel ve Cloudflare                                      |

## Yerel kurulum

Node.js 20 veya üzeri ve npm gereklidir.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde açılır.

### Ortam değişkenleri

`.env.local` dosyasındaki Auth0 alanlarını kendi uygulama bilgilerinizle doldurun:

```env
VITE_API_BASE_URL=https://izimza-case-api.storycolor-cdn.workers.dev
VITE_AUTH0_DOMAIN=<auth0-domain>
VITE_AUTH0_CLIENT_ID=<auth0-client-id>
VITE_AUTH0_AUDIENCE=https://izimza-case-api
VITE_AUTH0_DATABASE_CONNECTION=Username-Password-Authentication
```

`VITE_` ile başlayan değerler tarayıcıya açıktır; bu alanlara secret yazılmamalıdır. Gerçek değerler `.env.local` içinde tutulur ve Git tarafından takip edilmez.

Auth0 uygulamasında yerel geliştirme için şu adreslere izin verilmelidir:

```text
Callback URL:  http://localhost:5173/auth/callback
Logout URL:    http://localhost:5173
Web Origin:    http://localhost:5173
```

Production ortamında karşılıkları şöyledir:

```text
Callback URL:  https://izimza.vercel.app/auth/callback
Logout URL:    https://izimza.vercel.app
Web Origin:    https://izimza.vercel.app
```

### Lokal fake API

Case kriterindeki JSON Server entegrasyonunu çalıştırmak için `.env.local` içindeki API adresini değiştirin:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Ardından iki ayrı terminal kullanın:

```bash
npm run api
npm run dev
```

### Lokal Cloudflare Worker

Gerçek Worker mimarisini yerelde çalıştırmak için:

```bash
cp worker/.dev.vars.example worker/.dev.vars
npm run worker:migrate:local
npm run worker:dev
```

Bu kullanımda frontend API adresi `http://localhost:8787` olarak ayarlanır.

## Komutlar

| Komut                     | Açıklama                                                |
| ------------------------- | ------------------------------------------------------- |
| `npm run dev`             | Frontend geliştirme sunucusunu başlatır                 |
| `npm run api`             | JSON Server fake API'yi başlatır                        |
| `npm run worker:dev`      | Cloudflare Worker'ı yerelde başlatır                    |
| `npm run build`           | Kontrolleri çalıştırır ve production build oluşturur    |
| `npm test`                | Vitest testlerini terminalde çalıştırır                 |
| `npm run storybook`       | Storybook'u `localhost:6006` üzerinde açar              |
| `npm run build-storybook` | Storybook production çıktısını oluşturur                |
| `npm run check`           | Prettier, ESLint ve TypeScript kontrollerini çalıştırır |
| `npm run format`          | Kod formatını düzenler                                  |

## Temel iş kuralları

- Dosya yüklendiğinde taslak olarak kaydedilir; bu aşamada kontör kullanılmaz.
- İmzalama veya zaman damgalama başarıyla tamamlandığında her dosya için 1 kontör düşer.
- İmzalanan ve zaman damgalanan belge sayıları ayrı metriklerdir.
- Dosya başına üst sınır 25 MB'dır.
- PDF, Word, XML, UBL ve yaygın görsel formatları yüklenebilir.
- Kullanıcı yalnızca kendi profil, taslak ve belge kayıtlarına erişebilir.

## Test ve kod kalitesi

Vitest testi, `BaseInput` componentinin `v-model` iletişimini ve erişilebilir hata gösterimini kontrol eder. Storybook; dashboard kartı, profil formu ve zaman damgası geçmişinin farklı durumlarını bağımsız incelemek için kullanılır.

Kodda açıklayıcı isimlendirme, feature sınırları ve componentlere ait BEM tabanlı CSS sınıfları kullanılır. Husky, commit başlıklarını `<tür>: <açıklama>` formatında ve en fazla 50 karakter olacak şekilde doğrular.

## Simüle edilen işlemler

Case kapsamında gerçek elektronik imza sağlayıcısı ve SMS servisi kullanılmadığı için 6 haneli doğrulama kodu simüle edilir. “E-posta ile gönder” işlemi de kullanıcı geri bildirimi üretir ancak gerçek e-posta göndermez.
