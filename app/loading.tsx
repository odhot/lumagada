export default function Loading() {
  return (
    <main className="container py-16">
      <div className="h-8 w-48 rounded-xl bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="card overflow-hidden" key={i}>
            <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
