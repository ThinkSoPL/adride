export default function CampaignLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5 animate-pulse">
            <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
            <div className="h-6 w-16 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
      {/* Map placeholder */}
      <div className="h-64 bg-gray-800 border border-gray-700 rounded-xl animate-pulse" />
    </div>
  )
}
