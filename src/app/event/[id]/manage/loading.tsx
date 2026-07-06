export default function ManageLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />

        {/* 참여자 현황 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* 공지 작성 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-24 bg-gray-200 rounded-xl animate-pulse mb-3" />
          <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* 이벤트 수정 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
