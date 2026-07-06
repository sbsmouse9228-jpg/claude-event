export default function EventLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* 이벤트 정보 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-44 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* 출석 확인 스켈레톤 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-11 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* 카풀 위젯 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* 정산 위젯 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
        </div>
      </main>
    </div>
  )
}
