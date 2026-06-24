import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="simple-page">
      <h1>Docs</h1>
      <p>Dokümantasyon hazırlanıyor.</p>
      <p style={{ color: "#666", marginTop: 8, fontSize: 14 }}>Yakında.</p>
      <Link href="/" className="btn-primary" style={{ marginTop: 32 }}>Ana Sayfaya Dön</Link>
    </div>
  );
}
