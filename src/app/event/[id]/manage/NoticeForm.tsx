'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NoticeForm({ eventId }: { eventId: string; userId: string }) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ pushSent?: number; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/send-notice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, content: content.trim() }),
    })
    const data = await res.json()

    setLoading(false)
    if (data.error) {
      setResult({ error: data.error })
      return
    }
    setContent('')
    setResult({ pushSent: data.pushSent })
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="참여자에게 전달할 공지를 입력하세요"
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      {result?.error && (
        <p className="text-sm text-red-500">{result.error}</p>
      )}
      {result?.pushSent !== undefined && (
        <p className="text-sm text-green-600">
          공지가 발송됐어요.{result.pushSent > 0 ? ` (푸시 알림 ${result.pushSent}명)` : ' (알림 수신자 없음)'}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="self-end px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '발송 중...' : '공지 발송'}
      </button>
    </form>
  )
}
