import Link from 'next/link'

export default function InviteNotFound() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-center px-4 text-center gap-6">
      <span className="text-5xl">🔗</span>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-gray-900">초대 링크를 찾을 수 없어요</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          링크가 만료되었거나 잘못된 주소예요.<br />
          주최자에게 다시 요청해보세요.
        </p>
      </div>
      <Link
        href="/"
        className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
      >
        홈으로 가기
      </Link>
    </main>
  )
}
