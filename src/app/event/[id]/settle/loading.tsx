export default function SettleLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />

        {/* 정산 요약 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex justify-between mb-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* 정산 항목 카드 2개 */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
