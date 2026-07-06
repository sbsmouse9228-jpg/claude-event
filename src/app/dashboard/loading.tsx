export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 스켈레톤 */}
      <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* 주최한 모임 섹션 */}
        <section className="mb-8">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => <EventCardSkeleton key={i} />)}
          </div>
        </section>

        {/* 참여 중인 모임 섹션 */}
        <section>
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-3" />
          <EventCardSkeleton />
        </section>
      </main>
    </div>
  )
}

function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
