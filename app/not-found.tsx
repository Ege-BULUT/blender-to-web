import Link from "next/link";

export default function NotFound() {
  return (
    <div className="simple-page">
      <h1>404</h1>
      <p>Bu sayfa bulunamadı.</p>
      <Link href="/" className="btn-primary">Ana Sayfaya Dön</Link>
    </div>
  );
}
