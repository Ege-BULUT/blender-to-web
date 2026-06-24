# Roadmap - Blender to Web

## Mevcut Durum

### Çalışıyor
- [x] Landing page (hero, gallery, how it works, download CTA, footer)
- [x] Coverflow card view gallery (3D perspective, 2-3 kart desteği)
- [x] Web editör: TransformControls, ışık/mesh ekleme, duplicate/copy/paste/delete, GLB import/export, scene tree, inspector
- [x] Dil switch (TR/EN) header'da dropdown
- [x] Tema toggle (güneş/ay emoji) header'da
- [x] Dark theme: #222831 / #393E46 / #948979 / #DFD0B8
- [x] Light theme: #FDF4AF / #A5E9DD / #6FBEB2 / #34908B
- [x] Drag & drop upload modal (meta.json parse, editlenebilir metadata, author field)
- [x] Upload API: local filesystem + GitHub API commit (GITHUB_TOKEN varsa)
- [x] Local upload service (HTTPS, virus scan, git push)
- [x] Blender eklentisi: glTF + meta.json + ZIP export
- [x] ZIP import (local service + upload modal)
- [x] GitHub repo: Ege-BULUT/blender-to-web
- [x] GitHub Actions: plugin changesince auto release
- [x] Download butonu: GitHub latest release URL
- [x] Vercel alias: blender-to-web.vercel.app
- [x] Custom 404 + docs WIP page
- [x] Editor export'ta metadata modal (scene.glb + meta.json + author)
- [x] Mobil responsive editor (tablet fallback)
- [x] Blender 5.1 TOPBAR_MT_file_export uyumlulugu

### Çalismadi / Eksik
- [ ] Vercel GitHub integration (manuel dashboard adımı gerekli)
- [ ] A11y modal focus trap
- [ ] Editor undo/redo
- [ ] Editor multi-select
- [ ] Docs sayfası (gerçek içerik)

## Öncelik Sırası

1. ~~Vercel redeploy trigger~~ (local service git push ile çözüldü)
2. ~~ZIP export~~ (blender plugin + site upload)
3. ~~Mobil responsive editor~~
4. A11y (modal focus trap)
5. Docs sayfası (gerçek içerik)
6. Material inspector
7. Undo/redo

## Notlar

- Ponytail modu: en kısa çalışan yol, over-engineering yok.
- Her madde tek commit, atomic.
- Önce kritik (upload), sonra UX, sonra özellik.
