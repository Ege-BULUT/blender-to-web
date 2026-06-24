# Notes from Installer Agent - blender_to_web_vercel

Bu dosya, `installer_agent_init_notes.md` kurallari geregi, projeyi devralacak LLM'in/geliştiricinin tüm bağlami geri kazanmasi için yazildi. Kardes repo: `D:\projeler\blender_to_web\notes_from_installer_agent.md`.

## Proje Özeti
- **Ad:** blender_to_web_vercel
- **Amaç:** Blender eklentisinden çikan glTF + meta.json outputlarini web'de showcase gallery ve fullscreen editor ile sunan Next.js sitesi. Vercel'de deploy.
- **Kaynak:** Sifirdan gelistirildi, create-next-app kullanilmadi (manuel scaffold, ponytail: en kisa çalisir diff).

## Klasör Yeri
- `D:\projeler\blender_to_web_vercel\`
- Kardes (Blender eklentisi): `D:\projeler\blender_to_web\`

## Seçilen Kurulum Yöntemi ve Gerekçesi
- **Framework:** Next.js 14 App Router + React Three Fiber + drei. Neden: Vercel native, R3F three.js'i React idiomatik yapar, drei hazir OrbitControls/TransformControls/CameraControls/Grid/GizmoHelper. Ponytail: stdlib/yerlesik öncelikli.
- **Scaffold yöntemi:** Manuel (package.json + tsconfig + next.config.js elle yazildi). Neden: create-next-app fazla dosya üretiyor, ponytail "en az dosya" kurali.
- **Deploy:** Vercel CLI ile, GitHub baglantisi yok (simdilik), direkt `npx vercel --prod`.

## Atilan Adimlar ve Kullanilan Komutlar

### 1. Klasör olusturma
```powershell
New-Item -ItemType Directory -Path "D:\projeler\blender_to_web_vercel\app\api\scenes\[slug]"
New-Item -ItemType Directory -Path "D:\projeler\blender_to_web_vercel\app\scene\[slug]"
New-Item -ItemType Directory -Path "D:\projeler\blender_to_web_vercel\components"
New-Item -ItemType Directory -Path "D:\projeler\blender_to_web_vercel\lib"
New-Item -ItemType Directory -Path "D:\projeler\blender_to_web_vercel\public\scenes"
```

### 2. Konfigürasyon dosyalari
- `package.json` - Bagimliliklar ve script'ler.
- `tsconfig.json` - Strict TypeScript, `@/*` path alias.
- `next.config.js` - `transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"]` (R3F/drei ESM transpile gerekli).
- `next-env.d.ts`, `.gitignore`.

### 3. Bagimliliklar
```powershell
npm install --no-audit --no-fund
npm install next@14.2.35   # security patch (14.2.15 vuln uyarisi)
```

Versiyonlar:
- next 14.2.35
- react / react-dom 18.3.1
- three 0.169.0
- @react-three/fiber 8.17.10
- @react-three/drei 9.114.0
- typescript 5.6.2, @types/node 20.16.11, @types/react 18.3.11, @types/three 0.169.0

### 4. Site bilesenleri yazildi
- `lib/types.ts` - SceneMeta, SceneEntry tipleri.
- `lib/scenes.ts` - `listScenes()` ve `getScene(slug)`, fs.readdir + meta.json okuma.
- `app/api/scenes/route.ts` - GET tüm scene listesi JSON.
- `app/api/scenes/[slug]/route.ts` - GET tek scene JSON.
- `app/layout.tsx` - Root layout, metadata.
- `app/globals.css` - Gallery + editor stilleri (dark theme).
- `app/page.tsx` - Gallery server component, listScenes() -> GalleryClient dynamic import (ssr: false).
- `app/scene/[slug]/page.tsx` - Editor server component, getScene() -> EditorClient dynamic import (ssr: false).
- `components/GalleryClient.tsx` - Gallery client: kart grid, ok navigasyonu, klavye ArrowLeft/Right/Enter.
- `components/ScenePreview.tsx` - Kart içinde R3F Canvas, auto-rotate spinner, ambient + 2 directional light.
- `components/EditorClient.tsx` - Tam ekran editor: Canvas, CameraControls (UE fly), TransformControls, Grid, Gizmo, scene tree, Add Light/Mesh menu, Inspector (position/rotation/scale/intensity/color), Duplicate/Copy/Paste/Delete, Export .glb (GLTFExporter client-side).

### 5. Sample scene'ler
Khronos glTF sample modelleri indirildi:
- `public/scenes/sample_box/scene.glb` - Box.glb (1664 byte) + meta.json
- `public/scenes/sample_duck/scene.glb` - Duck.glb (120484 byte) + meta.json

Node ile GLTFExporter çalistirilamadi (FileReader yok), ponytail: internetten hazir sample.

### 6. Build test
```powershell
npm run build
```
Sonuç: Compiled successfully, 0 type error.
- Route / : 1.51 kB, First Load 323 kB
- Route /scene/[slug] : 23.7 kB, First Load 345 kB

### 7. Local dev test
```powershell
npm run dev   # http://localhost:3000
```
Playwright ile doğrulandi:
- `/` gallery: 2 kart (Sample Box, Rubber Duck), ok navigasyonu, klavye ArrowRight + Enter ile Duck scene açildi.
- `/scene/sample_box` editor: scene tree (1 mesh), Add Light (4 tip), Add Mesh (3 sekil), inspector (position/rotation/scale/intensity/color), Duplicate/Copy/Paste/Delete, Export .glb (indirme tetiklendi `sample_box_edited.glb`), 0 console error.

### 8. Vercel deploy
```powershell
npx vercel whoami   # ege-bulut
npx vercel --yes --cwd D:\projeler\blender_to_web_vercel
```
Sonuç: Production deploy (target: production, aliased).
- **Can URL:** https://blendertowebvercel.vercel.app
- Inspector: https://vercel.com/egebs-projects-92d6afb6/blender_to_web_vercel/r7jEoNdhREDve13v8jZRaeB6z3Jo

Can ortam Playwright ile doğrulandi: gallery + editor açildi, 0 console error.

## Ortam Degiskenleri
- Yok. Statik hosting, backend yok, auth yok, DB yok.

## Çalistirma / Baslatma Komutlari
```powershell
cd D:\projeler\blender_to_web_vercel
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # production server
npx vercel       # preview deploy
npx vercel --prod # production deploy
```

## Scene Ekleme Akisi
1. Blender eklentisinden export al: `~/blender_to_web_exports/<slug>/{scene.glb, meta.json}`.
2. Klasörü `D:\projeler\blender_to_web_vercel\public\scenes\<slug>\` altina kopyala.
3. Redeploy: `npx vercel --prod`.

## Karsilasilan Sorunlar ve Cozumler

### Sorun 1: useGLTF SSR'da relative URL hatasi (500)
- **Hata:** `TypeError: Failed to parse URL from /scenes/sample_box/scene.glb`. useGLTF Node SSR'da relative URL'i çözemiyor.
- **Cozum:** `app/page.tsx` ve `app/scene/[slug]/page.tsx` içinde GalleryClient ve EditorClient `next/dynamic` ile `ssr: false` yüklendi.

### Sorun 2: `dynamic` import ile `export const dynamic` isim çakismasi
- **Hata:** `the name 'dynamic' is defined multiple times`. next/dynamic import ve `export const dynamic = "force-dynamic"` ayni isim.
- **Cozum:** Page'lerde `export const dynamic = "force-dynamic"` -> `export const revalidate = 0` olarak degistirildi. API route'larda `dynamic` export kaliyor (orada dynamic import yok).

### Sorun 3: Next.js 14.2.15 security vulnerability
- **Hata:** npm install'da `next@14.2.15` security vuln uyaris.
- **Cozum:** `npm install next@14.2.35` ile patched versiyona güncellendi.

### Sorun 4: GLTFExporter Node'da FileReader yok
- **Hata:** Sample glb üretmek için three GLTFExporter Node'da çalistirinca `ReferenceError: FileReader is not defined`.
- **Cozum:** Khronos sample modelleri indirildi, Node ile glb üretmekten vazgeçildi.

## Projeyi Devralacak LLM/Gelistirici Için Bağlam

### Mimari
- Server components (`app/page.tsx`, `app/scene/[slug]/page.tsx`) fs ile scene listesi okur.
- Client components (`GalleryClient`, `EditorClient`) `next/dynamic` ssr:false ile yüklenir (useGLTF SSR sorunlu).
- API route'lar `/api/scenes` ve `/api/scenes/[slug]` JSON döndürür (runtime, force-dynamic).
- `public/scenes/<slug>/` statik glb + meta.json.

### Editor Özellikleri (teslim edildi)
- Kamera: drei `<CameraControls>`, UE tarzi fly (WASD + sag-tik drag pan, scroll dolly, orta-tik orbit).
- TransformControls: Move/Rotate/Scale mod toggle (üst panel).
- Scene Tree: mesh + light listesi, seç.
- Add Light: ambient, point, directional, spot.
- Add Mesh: box, sphere, plane.
- Inspector: position/rotation/scale vec3, intensity + color (isiklar için).
- Actions: Duplicate, Copy, Paste, Delete.
- Export: GLTFExporter -> .glb Blob -> indirme (client-side, backend yok).

### Ponytail Notlari (bu projede uygulandi)
- Backend yok, DB yok, auth yok, save-to-server yok.
- Custom serializer yok, Khronos sample + Blender yerlesik glTF exporter.
- Tek dosya editor (EditorClient.tsx), parça parça component'lere bölünmedi (simdilik yeterli, 250 LOC sinirina yaklasiyor, bölünmeyi gerektiginde yap).
- Inspector aktif objeyi takip etmiyor, key ile remount (obj.uuid) tetikleniyor.

### Sinirlar (v0.1.0)
- Save-to-server yok, export lokal indirme.
- Auth yok.
- Scene sayisi 50+ olunca manifest tarama yavas olabilir.
- Kamera fly mode WebGL pointer lock gerektirebilir, tarayici izim bagimliligi.
- EditorClient.tsx ~400 LOC, ponytail 250 sinirini asiyor. Bölme: CameraRig, ObjectPanel, Inspector, AddMenu ayri dosyalar (simdilik yapilmadi, gerekirse yapilir).

### Devam Edilebilecek Yollar
- Vercel projeyi GitHub'a bagla, otomatik deploy.
- Scene ekleme akisini otomatize et (Blender eklentisi direkt buraya yazabilir).
- Auth + save-to-server (backend gerekir).
- Daha zengin editor: material editor, animation timeline, multi-select, undo/redo.
- EditorClient.tsx bölme (250 LOC kurali).

## Önemli Uyarilar
- **Karakter kurali:** em dash (,) ve en dash (-) bu projede KULLANILMADI. Devam ederken ayni kural geçerli.
- **Mevcut projelere dokunulmadi:** Sadece `D:\projeler\blender_to_web\` ve `D:\projeler\blender_to_web_vercel\` olusturuldu.
- **Blender eklentisi gerçek Blender'da test edilmedi:** Python sözdizimi hatasiz, ama Blender API runtime davranis için Blender 4.x'te manuel test gerekli (kardes repodaki `notes_from_installer_agent.md`'ye bak).