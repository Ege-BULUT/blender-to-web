# Blender to Web

Blender sahnelerini web'e taşı. 3D galeri ve editör ile Blender exportlarını anında görüntüle, düzenle, paylaş.

## Özellikler

- **Blender Eklentisi**: glTF + meta.json export
- **3D Galeri**: Coverflow card view ile sahne önizleme
- **Web Editör**: TransformControls, ışık/mesh ekleme, GLB import/export
- **Çoklu Dil**: Türkçe / İngilizce
- **Tema**: Koyu / Açık
- **Drag & Drop**: Sahne yükleme

## Kurulum

```bash
npm install
npm run dev
```

## Blender Eklentisi

Eklentiyi [GitHub Releases](https://github.com/Ege-BULUT/blender-to-web/releases) sayfasından indir.

Blender'da `Edit > Preferences > Add-ons > Install` ile `.py` dosyasını yükle.

## Kullanım

1. Blender'da sahneni aç
2. `File > Export > Web Gallery Scene` ile export et
3. Output klasörünü `public/scenes/<slug>/` altına kopyala
4. Sitede galeride görünecek

## License

MIT