import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-indigo-600 mb-2">404</p>
      <h1 className="text-xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-gray-500 mb-6">
        요청하신 페이지가 존재하지 않거나 삭제되었어요.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
