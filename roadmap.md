# Roadmap — Blender to Web

Mevcut durum, eksikler ve iyileştirme fikirleri.

## Mevcut Durum

### Çalışıyor
- [x] Landing page (hero, gallery, how it works, download CTA, footer)
- [x] Coverflow card view gallery (3D perspective, 2-3 kart desteği)
- [x] Web editör (`/scene/[slug]`): TransformControls, ışık/mesh ekleme, duplicate/copy/paste/delete, GLB import/export, scene tree, inspector
- [x] Dil switch (TR/EN) header'da dropdown
- [x] Tema toggle (güneş/ay emoji) header'da
- [x] Dark theme: #222831 / #393E46 / #948979 / #DFD0B8 palette
- [x] Light theme: #FDF4AF / #A5E9DD / #6FBEB2 / #34908B palette
- [x] Drag & drop upload modal (meta.json otomatik parse, editlenebilir metadata)
- [x] Upload API: local filesystem + GitHub API commit (GITHUB_TOKEN varsa)
- [x] Blender eklentisi: glTF + meta.json export
- [x] GitHub repo: Ege-BULUT/blender-to-web
- [x] GitHub Actions: plugin değişince otomatik release
- [x] Download butonu: GitHub latest release URL
- [x] Vercel alias: blender-to-web.vercel.app
- [x] Custom 404 + docs WIP page
- [x] Editor export'ta metadata modal (scene.glb + meta.json birlikte indir)

### Eksik / Bilinen Sorunlar

#### Kritik
- [ ] **Upload production'da test edilmedi** — GITHUB_TOKEN eklendi ama akış tam test edilmedi. Upload → GitHub commit → Vercel redeploy → gallery'de görünme akışı uçtan uca doğrulanmalı.
- [ ] **Vercel redeploy trigger** — GitHub'a commit push'lanınca Vercel otomatik redeploy etmeli. Vercel GitHub integration'ı aktif mi? Yoksa webhook gerekir.
- [ ] **Editor tema kalıcılığı** — Editor'de tema değişince AppContext'e yazıyor ama editor kendi `data-theme`'ini shell'e set etmeyi bıraktı (global root'a güvendi). Editor CSS'i `[data-theme="light"]` global selector'ı kullanıyor. Çalışıyor ama kırılgan.

#### Orta
- [ ] **Upload sonrası gallery güncellenmiyor** — `window.location.reload()` var ama GitHub commit'in Vercel redeploy'u async. Reload hemen yapılırsa yeni sahneyi göremeyebilir. Polling veya webhook gerekir.
- [ ] **Editor export download iki dosya** — scene.glb + meta.json ayrı ayrı indiriliyor. ZIP ile tek dosya daha iyi. JSZip eklemeden basit bir blob concat yeterli olabilir ama GLB+JSON ayrı formatlar, ZIP daha temiz.
- [ ] **Tag input UX** — Tag'leri chip olarak göster, Enter ile ekle, backspace ile sil. Şu an raw comma string.
- [ ] **Mobil responsive** — Landing page OK ama editor mobilde kullanışsız değil (grid 3 kolon). En azından tablet boyutunda fallback.
- [ ] **A11y** — Carousel oklarında aria-label var ama modal'da focus trap yok. Klavye ile modal'da gezerken tab dışarı kaçıyor.
- [ ] **Editor undo/redo** — Yok. En basit history stack yapılabilir.
- [ ] **Editor multi-select** — Tek obje seç. Shift+click multi-select yok.

#### Düşük
- [ ] **Docs sayfası** — "Yakında" placeholder. Gerçek dokümantasyon yazılmalı (eklenti kurulumu, API, self-host).
- [ ] **SEO** — Meta tags temel. Open Graph, sitemap, robots.txt yok.
- [ ] **Analytics** — Yok. Vercel Analytics veya Plausible eklenebilir.
- [ ] **Performans** — Gallery'de her kart için ayrı Canvas + R3F instance. 3 kart için 3 Canvas. Daha verimli: tek Canvas, multiple viewports. Ama karmaşık.
- [ ] **Editor'da material editor** — Mesh rengini değiştirebiliyorsun ama roughness/metalness yok.
- [ ] **Editor'da animation timeline** — glTF animasyonları oynatılamıyor.
- [ ] **Scene thumbnail** — Galeri kartları için otomatik thumbnail üretimi (server-side render ile).

## İyileştirme Fikirleri

### Editör
- **Material inspector** — Roughness, metalness, emissive, opacity slider'ları
- **Multi-select + group** — Shift+click ile çoklu seçim, grupla transform
- **Snap to grid** — Transform'da snap increment ayarı
- **Measure tool** — Mesafe ölçer
- **Clone brush** — Bir objeden çok kopya fırça ile
- **Light helper gizmo** — Işık yönünü gösteren arrow
- **Camera bookmark** — Kamera açılarını kaydet, hızlı geç
- **Keyboard shortcuts panel** — `?` ile kısayol yardım modalı
- **Gizmo size ayarı** — TransformControls boyutu

### Galeri
- **Search / filter** — Tag, title'a göre filtrele
- **Sort** — Yeni/eski, alfabetik
- **Grid view toggle** — Coverflow yerine grid
- **Lightbox** — Kart tıklayınca tam ekran önizleme
- **Scene detail page** — `/scene/[slug]` editor öncesi preview sayfası
- **Share button** — Sosyal medya share linkleri
- **Embed code** — Sahneyi başka siteye embed için iframe kodu

### Upload
- **ZIP destek** — Tek ZIP dosyası yükle, otomatik extract
- **Drag to reorder** — Kart sıralamasını drag ile değiştir
- **Edit existing scene** — Mevcut sahne üstüne düzenle, yeni slug ile kaydet
- **Bulk upload** — Çoklu klasör drag
- **Progress bar** — Upload sırasında yüzde göster
- **Validation** — Dosya boyutu, format kontrolü
- **Error recovery** — Başarısız upload'da retry

### Site
- **Blog / changelog** — Yeni özellikler duyurusu
- **Kullanıcı hesabı** — Sahne sahipliği, private sahneler
- **Comments** — Sahne altına yorum
- **Fork scene** — Bir sahneyi fork edip kendi versiyonunu yap
- **API dokümantasyonu** — Public API için Swagger/redoc
- **CLI tool** — `npx blender-to-web upload <folder>` ile CLI upload

### Eklenti (Blender)
- **Material/texture export** — Şu an glTF default. Material ayarları expose edilebilir
- **Multi-scene export** — Tek seferde birden fazla sahne
- **Auto upload** — Eklenti direkt siteye POST atar (token ile)
- **Live preview** — Blender'da değişince web'de anında güncellenir (WebSocket)
- **Version control** — Sahne versiyonları, diff
- **Animation export** — glTF animasyon klip desteği

### Altyapı
- **Database** — Şu an filesystem. Sahne metadata DB'de tutulursa query/serach kolay
- **Object storage** — glTF dosyaları S3/R2 gibi object storage'a
- **CDN** — Static asset'ler için CDN
- **Image optimization** — next/image ile otomatik optimize
- **Bundle analysis** — Editor 259kB, gallery 92kB. Code splitting ile azaltılabilir
- **Error monitoring** — Sentry
- **Rate limiting** — Upload API'da
- **CSRF protection** — Formlarda

## Öncelik Sırası (Önerilen)

1. **Vercel redeploy trigger** — Upload sonrası sahne görünmesi için kritik
2. **Editor'da ZIP export** — UX iyileştirmesi
3. **Mobil responsive editor** — Tablet desteği
4. **A11y (modal focus trap)** — Erişilebilirlik
5. **Search/filter gallery** — Sahne sayısı artınca lazım
6. **Docs sayfası** — Gerçek içerik
7. **Material inspector** — Editör gücü
8. **Undo/redo** — Editör temel özellik

## Notlar

- Ponytail modunda: en kısa çalışan yol, over-engineering yok. Bu liste "nice to have" değil, "gerçekten eksik" maddeler.
- Her madde tek PR/commit olmalı, atomic.
- Önce kritik (upload'un gerçekten çalışması), sonra UX, sonra özellik.