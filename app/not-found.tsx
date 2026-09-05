export default function NotFound() {
  return (
    <main className="container py-24 text-center">
      <div className="text-6xl font-black text-green-600">404</div>
      <h1 className="text-3xl font-black mt-4">Iklan tidak ditemukan</h1>
      <p className="text-gray-500 mt-2">Iklan mungkin sudah dihapus atau tidak tersedia.</p>
      <a href="/" className="btn btn-primary mt-7">Kembali ke Lumagada</a>
    </main>
  );
}
