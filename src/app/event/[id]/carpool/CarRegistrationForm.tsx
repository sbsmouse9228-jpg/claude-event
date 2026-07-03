'use client'

import { useRef, useState, useTransition } from 'react'
import { registerCar } from './actions'

interface Props {
  eventId: string
}

export default function CarRegistrationForm({ eventId }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors font-medium"
      >
        + 내 차량 등록하기
      </button>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await registerCar(eventId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        setOpen(false)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-indigo-50 rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-indigo-800">차량 등록</h3>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">출발 위치</label>
        <input
          name="departure_location"
          type="text"
          placeholder="예: 강남역 2번 출구"
          required
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">출발 시간</label>
        <input
          name="departure_time"
          type="datetime-local"
          required
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">탑승 가능 인원</label>
        <input
          name="available_seats"
          type="number"
          min="1"
          max="9"
          placeholder="최대 탑승 인원"
          required
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 bg-white rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
  )
}
