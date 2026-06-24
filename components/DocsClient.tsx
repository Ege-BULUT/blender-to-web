"use client";

import { useState } from "react";

type DocPage = "changelog" | "blender-plugin" | "web-editor" | "site-overview";

interface SidebarItem {
  id: DocPage;
  title: string;
  group: string;
}

const sidebarItems: SidebarItem[] = [
  { id: "changelog", title: "What's New", group: "Genel" },
  { id: "site-overview", title: "Site Rehberi", group: "Genel" },
  { id: "blender-plugin", title: "Blender Eklentisi", group: "Eklenti" },
  { id: "web-editor", title: "Web Editör", group: "Editör" },
];

export default function DocsClient() {
  const [activePage, setActivePage] = useState<DocPage>("changelog");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = sidebarItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <div className="docs-sidebar-header">
          <a href="/" className="docs-logo">
            <span className="docs-logo-icon">B</span>
            <span>Blender to Web</span>
          </a>
        </div>

        <div className="docs-search">
          <input
            type="text"
            placeholder="Dokümantasyonda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="docs-search-input"
          />
        </div>

        <nav className="docs-nav">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              className={`docs-nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              {item.title}
            </button>
          ))}
        </nav>
      </aside>

      <main className="docs-content">
        {activePage === "changelog" && <ChangelogPage />}
        {activePage === "blender-plugin" && <BlenderPluginPage />}
        {activePage === "web-editor" && <WebEditorPage />}
        {activePage === "site-overview" && <SiteOverviewPage />}
      </main>
    </div>
  );
}

function ChangelogPage() {
  return (
    <div className="docs-article">
      <h1>What&apos;s New</h1>
      <p className="docs-subtitle">Blender to Web güncellemeleri ve yeni özellikler.</p>

      <div className="changelog-entry">
        <div className="changelog-version">v0.3.0</div>
        <div className="changelog-date">25 Haziran 2026</div>
        <ul>
          <li><strong>Texture boyut limiti:</strong> Max Texture Size ayarı ile texture&apos;ları otomatik küçültme (varsayılan: 1024px)</li>
          <li><strong>JPEG kalitesi:</strong> Texture&apos;ları JPEG formatında export etme, kalite ayarlanabilir (varsayılan: %85)</li>
          <li><strong>Texture bake:</strong> Tüm texture&apos;ları diffuse&apos;a bake etme seçeneği (dosya boyutunu ciddi şekilde küçültür)</li>
          <li><strong>Export settings:</strong> Tüm export ayarları meta.json&apos;a kaydediliyor</li>
          <li><strong>Büyük dosya temizliği:</strong> Git history&apos;den 193MB test dosyası temizlendi</li>
        </ul>
      </div>

      <div className="changelog-entry">
        <div className="changelog-version">v0.2.0</div>
        <div className="changelog-date">25 Haziran 2026</div>
        <ul>
          <li><strong>Blender 5.1 uyumluluğu:</strong> TOPBAR_MT_file_export hatası düzeltildi</li>
          <li><strong>Author field:</strong> Blender eklentisine, upload modal&apos;a ve export&apos;a yazar alanı eklendi</li>
          <li><strong>ZIP export:</strong> Eklenti artık scene.glb + meta.json&apos;ı tek ZIP olarak export ediyor</li>
          <li><strong>ZIP import:</strong> Site upload ZIP dosyalarını destekliyor</li>
          <li><strong>Publish Scene:</strong> Yeni sahne ekleme butonu yeniden tasarlandı. &quot;Publish to Public&quot; toggle&apos;ı ile galeriye ekleme veya sadece editörde açma seçeneği</li>
          <li><strong>Mobil responsive:</strong> Editör tablet ve mobilde çalışır hale getirildi</li>
          <li><strong>Dark/Light tema:</strong> Profesyonel renk paletleri (#222831 dark, #FDF4AF light)</li>
          <li><strong>Çoklu dil:</strong> Türkçe/İngilizce dil desteği</li>
          <li><strong>Local upload service:</strong> HTTPS destekli yerel servis, virus tarama ve otomatik git push</li>
        </ul>
      </div>

      <div className="changelog-entry">
        <div className="changelog-version">v0.1.0</div>
        <div className="changelog-date">24 Haziran 2026</div>
        <ul>
          <li><strong>İlk release:</strong> Blender eklentisi, web galerisi ve editörü</li>
          <li><strong>Blender eklentisi:</strong> glTF + meta.json export</li>
          <li><strong>Web galerisi:</strong> Coverflow card view, 3D perspective</li>
          <li><strong>Web editör:</strong> TransformControls, ışık/mesh ekleme, GLB import/export</li>
          <li><strong>Tema desteği:</strong> Dark ve light tema</li>
          <li><strong>Dil desteği:</strong> Türkçe ve İngilizce</li>
        </ul>
      </div>
    </div>
  );
}

function BlenderPluginPage() {
  return (
    <div className="docs-article">
      <h1>Blender Eklentisi</h1>
      <p className="docs-subtitle">Blender sahnelerini web formatında export eden eklenti.</p>

      <h2>Gereksinimler</h2>
      <ul>
        <li>Blender 4.0 veya üzeri (test edildi: Blender 5.1)</li>
        <li>glTF export desteği (Blender&apos;a yerleşik)</li>
      </ul>

      <h2>Kurulum</h2>
      <ol>
        <li>
          <strong>Eklentiyi indir:</strong>{" "}
          <a href="https://github.com/Ege-BULUT/blender-to-web/releases/latest/download/blender_to_web.py" download>
            blender_to_web.py
          </a>
        </li>
        <li>Blender&apos;ı aç</li>
        <li>Edit &gt; Preferences &gt; Add-ons &gt; Install</li>
        <li>İndirdiğin <code>blender_to_web.py</code> dosyasını seç</li>
        <li>Eklentiyi aktifleştir (checkbox&apos;a tıkla)</li>
      </ol>

      <h2>Kullanım</h2>
      <ol>
        <li>Sahneni Blender&apos;da aç</li>
        <li>File &gt; Export &gt; Web Gallery Scene (.glb + meta) seç</li>
        <li>Açılan dialog&apos;da:
          <ul>
            <li><strong>Title:</strong> Galeride görünecek başlık</li>
            <li><strong>Description:</strong> Kısa açıklama</li>
            <li><strong>Author:</strong> Sahne sahibi / yazar</li>
            <li><strong>Tags:</strong> Virgülle ayrılmış etiketler (örn: interior, morning)</li>
            <li><strong>Slug:</strong> URL ve klasör adı (boş bırakırsan title&apos;dan üretilir)</li>
            <li><strong>Output Directory:</strong> Export klasörü</li>
            <li><strong>Include Cameras:</strong> Kameraları da export et</li>
            <li><strong>Include Lights:</strong> Işıkları da export et</li>
            <li><strong>Max Texture Size:</strong> Texture&apos;ları bu boyuta kadar küçült (varsayılan: 1024, 0 = limitsiz)</li>
            <li><strong>JPEG Quality:</strong> Texture kalitesi 1-100 arası (varsayılan: 85)</li>
            <li><strong>Bake Textures:</strong> Tüm texture&apos;ları diffuse&apos;a bake et (dosya boyutunu küçültür)</li>
          </ul>
        </li>
        <li>Export butonuna bas</li>
        <li>Output klasöründe <code>scene.glb</code>, <code>meta.json</code> ve <code>slug.zip</code> oluşur</li>
      </ol>

      <h2>Texture Optimizasyonu</h2>
      <p>
        Eklenti artık texture&apos;ları otomatik olarak optimize eder:
      </p>
      <ul>
        <li><strong>Max Texture Size:</strong> Tüm texture&apos;ları belirtilen boyuta kadar küçültür (1024, 2048, 4096)</li>
        <li><strong>JPEG Quality:</strong> Texture&apos;ları JPEG formatında export eder (1-100 arası kalite)</li>
        <li><strong>Bake Textures:</strong> Tüm texture&apos;ları diffuse&apos;a bake eder (en etkili boyut küçültme yöntemi)</li>
      </ul>
      <p>
        <strong>Önerilen ayarlar:</strong> Hızlı web gösterimi için Max Texture: 1024, JPEG Quality: 85.
        Yüksek kalite için Max Texture: 2048, JPEG Quality: 90.
      </p>

      <h2>ZIP Export</h2>
      <p>
        Eklenti artık otomatik olarak ZIP dosyası da oluşturur. Bu ZIP dosyasını siteye yükleyebilirsin.
        ZIP içinde <code>scene.glb</code> ve <code>meta.json</code> bulunur.
      </p>

      <h2>Siteye Yükleme</h2>
      <p>İki yol var:</p>
      <ol>
        <li>
          <strong>Manuel:</strong> Output klasörünü <code>public/scenes/&lt;slug&gt;/</code> altına kopyala
        </li>
        <li>
          <strong>Upload:</strong> Sitedeki &quot;Publish Scene&quot; butonunu kullanarak ZIP veya dosyaları yükle
        </li>
      </ol>

      <h2>API</h2>
      <p>Eklenti şu alanları meta.json&apos;a yazar:</p>
      <table>
        <thead>
          <tr><th>Alan</th><th>Zorunlu</th><th>Açıklama</th></tr>
        </thead>
        <tbody>
          <tr><td><code>slug</code></td><td>Evet</td><td>URL ve klasör adı</td></tr>
          <tr><td><code>title</code></td><td>Evet</td><td>Galeride görünecek başlık</td></tr>
          <tr><td><code>description</code></td><td>Hayır</td><td>Kısa açıklama</td></tr>
          <tr><td><code>author</code></td><td>Hayır</td><td>Sahne sahibi / yazar</td></tr>
          <tr><td><code>tags</code></td><td>Hayır</td><td>Etiket listesi (array)</td></tr>
          <tr><td><code>created_at</code></td><td>Otomatik</td><td>Oluşturulma tarihi</td></tr>
          <tr><td><code>blender_version</code></td><td>Otomatik</td><td>Blender versiyonu</td></tr>
          <tr><td><code>exporter_version</code></td><td>Otomatik</td><td>Eklenti versiyonu</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function WebEditorPage() {
  return (
    <div className="docs-article">
      <h1>Web Editör</h1>
      <p className="docs-subtitle">Sahneleri tarayıcıda düzenle, ışık ve mesh ekle.</p>

      <h2>Erişim</h2>
      <p>
        Galerideki bir sahneye tıklayarak veya <code>/scene/&lt;slug&gt;</code> URL&apos;i ile editöre gidilir.
      </p>

      <h2>Kamera Kontrolleri</h2>
      <table>
        <thead>
          <tr><th>İşlem</th><th>Tuş</th></tr>
        </thead>
        <tbody>
          <tr><td>Fly (süzülme)</td><td>Sağ tık + WASD</td></tr>
          <tr><td>Orbit (dönme)</td><td>Orta tık sürükle</td></tr>
          <tr><td>Zoom (yakınlaşma)</td><td>Scroll tekerlek</td></tr>
          <tr><td>Dolly</td><td>Ctrl + Scroll</td></tr>
        </tbody>
      </table>

      <h2>Objeleri Seçme</h2>
      <ul>
        <li>Sol tık ile obje seç</li>
        <li>Seçili obje sahne ağacında (sol panel) vurgulanır</li>
        <li>Sağ panelde pozisyon, döndürme ve ölçek değerleri görünür</li>
      </ul>

      <h2>Transform Modları</h2>
      <p>Üst paneldeki Move / Rotate / Scale butonları ile:</p>
      <ul>
        <li><strong>Move:</strong> Objeyi taşı</li>
        <li><strong>Rotate:</strong> Objeyi döndür</li>
        <li><strong>Scale:</strong> Objeyi ölçekle</li>
      </ul>

      <h2>Yeni Obje Ekleme</h2>
      <p>Sol paneldeki &quot;Add Light&quot; ve &quot;Add Mesh&quot; bölümlerinden:</p>
      <ul>
        <li><strong>Işıklar:</strong> Ambient, Point, Directional, Spot</li>
        <li><strong>Mesh:</strong> Box, Sphere, Plane</li>
      </ul>

      <h2>Işık Ayarlama</h2>
      <p>Sol panelden bir ışık seçildiğinde sağ panelde ayarlar görünür:</p>
      <ul>
        <li><strong>Intensity:</strong> Işık şiddeti</li>
        <li><strong>Color:</strong> Işık rengi</li>
      </ul>

      <h2>Dosya İşlemleri</h2>
      <p>Hamburger menüsünden (☰):</p>
      <ul>
        <li><strong>Import GLB:</strong> Yeni bir .glb dosyası yükle</li>
        <li><strong>Export GLB:</strong> Mevcut sahneyi dışa aktar (metadata modal ile)</li>
        <li><strong>Tema değiştir:</strong> Dark / Light tema</li>
        <li><strong>Back to Gallery:</strong> Galeriye dön</li>
      </ul>

      <h2>Export Metadata</h2>
      <p>
        Export GLB butonuna tıklandığında metadata modal&apos;ı açılır.
        Slug, başlık, açıklama, etiketler ve yazar alanı düzenlenebilir.
        Hem <code>scene.glb</code> hem <code>meta.json</code> aynı anda indirilir.
      </p>

      <h2>Klavye Kısayolları</h2>
      <table>
        <thead>
          <tr><th>Kısayol</th><th>İşlem</th></tr>
        </thead>
        <tbody>
          <tr><td>Delete</td><td>Seçili objeyi sil</td></tr>
          <tr><td>Ctrl+C</td><td>Seçili objeyi kopyala</td></tr>
          <tr><td>Ctrl+V</td><td>Kopyalanan objeyi yapıştır</td></tr>
          <tr><td>Ctrl+D</td><td>Seçili objeyi çoğalt</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function SiteOverviewPage() {
  return (
    <div className="docs-article">
      <h1>Site Rehberi</h1>
      <p className="docs-subtitle">Blender to Web platformunun genel yapısı ve kullanımı.</p>

      <h2>Genel Bakış</h2>
      <p>
        Blender to Web, Blender sahnelerini web&apos;de canlı olarak sergilemenizi sağlayan bir platformdur.
        Blender eklentisi ile sahnelerinizi export edebilir, web galerisinde görüntüleyebilir
        ve editörde düzenleyebilirsiniz.
      </p>

      <h2>Ana Sayfa</h2>
      <ul>
        <li><strong>Hero:</strong> Platform tanıtımı ve ana CTA</li>
        <li><strong>Scene Gallery:</strong> Tüm sahnelerin 3D coverflow görünümü</li>
        <li><strong>Publish Scene:</strong> Yeni sahne yükleme (ZIP veya dosya)</li>
        <li><strong>Nasıl Çalışır:</strong> 4 adımlık kurulum rehberi</li>
        <li><strong>Download:</strong> Blender eklentisi indirme</li>
      </ul>

      <h2>Scene Gallery</h2>
      <p>
        Galerideki kartlara tıklayarak 3D editöre gidebilirsin.
        Ok tuşları veya fare ile sahneler arası geçiş yapabilirsin.
      </p>
      <ul>
        <li>Yakınlaştırma: Scroll tekerlek</li>
        <li>Geri/İleri: ← → ok tuşları veya ok butonları</li>
        <li>Aç: Enter tuşu veya karta tıkla</li>
      </ul>

      <h2>Publish Scene</h2>
      <p>Yeni sahne eklemek için &quot;Publish Scene&quot; butonuna bas:</p>
      <ol>
        <li>Dosyaları sürükle-bırak veya &quot;Dosya Seç&quot; ile seç</li>
        <li>Desteklenen formatlar: <code>.glb</code>, <code>.gltf</code>, <code>.zip</code></li>
        <li>Metadata formunu doldur (slug, başlık, açıklama, etiketler, yazar)</li>
        <li><strong>Publish to Public</strong> toggle&apos;ını ayarla:
          <ul>
            <li><strong>Açık (True):</strong> Sahne galeriye eklenir, herkes tarafından görülür</li>
            <li><strong>Kapalı (False):</strong> Sadece editörde açılır, galeriye eklenmez</li>
          </ul>
        </li>
        <li>&quot;Web&apos;e Yayınla&quot; veya &quot;Editörde Aç&quot; butonuna bas</li>
      </ol>
      <p>
        <strong>Not:</strong> Publish to Public ile yükleme sonrası sahne birkaç dakika içinde galeride görünür.
        GitHub&apos;a commit atılır, Vercel otomatik redeploy eder.
      </p>

      <h2>Tema ve Dil</h2>
      <p>Header&apos;da:</p>
      <ul>
        <li><strong>Dil:</strong> 🇹🇷 TR / 🇬🇧 EN</li>
        <li><strong>Tema:</strong> ☀️/🌙 emoji ile toggle (dark/light)</li>
      </ul>
      <p>Seçimleriniz tarayıcıda saklanır ve bir sonraki ziyaretinizde hatırlanır.</p>

      <h2>Self-Host</h2>
      <p>Projeyi kendi sunucunda çalıştır:</p>
      <pre><code>{`git clone https://github.com/Ege-BULUT/blender-to-web.git
cd blender-to-web
npm install
npm run dev`}</code></pre>
      <p>Local upload servisi:</p>
      <pre><code>{`cd local-service
npm install
node server.js`}</code></pre>
      <p>
        Local servis <code>http://localhost:3456</code> (HTTP) ve{" "}
        <code>https://localhost:3457</code> (HTTPS) portlarında çalışır.
        İlk HTTPS bağlantısında sertifika uyarısını kabul etmeniz gerekir.
      </p>
    </div>
  );
}