/**
 * Loading skeleton dla dashboard (force-dynamic routes)
 */

export default function DashboardLoading() {
  return (
    <div className="p-6">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Status banner skeleton */}
      <div className="mb-8 h-20 bg-gray-800 rounded-xl animate-pulse" />

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-800 border border-gray-700 rounded-xl p-5 animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
            <div className="h-6 w-16 bg-gray-700 rounded" />
          </div>
        ))}
      </div>

      {/* Section skeleton */}
      <div className="mb-8">
        <div className="h-5 w-32 bg-gray-800 rounded-lg animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
