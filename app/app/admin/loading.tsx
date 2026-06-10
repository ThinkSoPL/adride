export default function AdminLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-56 bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-800 border border-gray-700 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
