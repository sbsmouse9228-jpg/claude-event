'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function EventError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <h1 className="text-xl font-bold text-gray-900 mb-2">페이지를 불러올 수 없어요</h1>
      <p className="text-sm text-gray-500 mb-6">
        일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          다시 시도
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          내 모임으로
        </Link>
      </div>
      {params.id && (
        <p className="mt-4 text-xs text-gray-300">이벤트 ID: {params.id}</p>
      )}
    </div>
  )
}
