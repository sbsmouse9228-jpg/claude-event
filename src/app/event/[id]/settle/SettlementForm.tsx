'use client'

import { useRef, useState, useTransition } from 'react'
import { createSettlement } from './actions'

interface Props {
  eventId: string
  participantCount: number
}

export default function SettlementForm({ eventId, participantCount }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const perPerson = amount && participantCount > 0
    ? Math.floor(parseInt(amount, 10) / participantCount)
    : null

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors font-medium"
      >
        + 정산 항목 추가
      </button>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createSettlement(eventId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        setAmount('')
        setOpen(false)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-indigo-50 rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-indigo-800">정산 항목 추가</h3>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">항목명</label>
        <input
          name="item_name"
          type="text"
          placeholder="예: 식사비, 장소 대여료"
          required
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">금액 (원)</label>
        <input
          name="amount"
          type="number"
          min="1"
          placeholder="예: 120000"
          required
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        {perPerson !== null && !isNaN(perPerson) && (
          <p className="text-xs text-indigo-600 mt-0.5">
            1인당 약 {perPerson.toLocaleString()}원 ({participantCount}명 더치페이)
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); setAmount('') }}
          className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 bg-white rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? '추가 중...' : '추가'}
        </button>
      </div>
    </form>
  )
}
