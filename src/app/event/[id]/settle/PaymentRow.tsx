'use client'

import { useState, useTransition } from 'react'
import { markPaid, markUnpaid } from './actions'

interface Props {
  payment: {
    id: string
    user_id: string
    amount_due: number
    paid_at: string | null
    user: { nickname: string } | null
  }
  eventId: string
  canToggle: boolean
}

export default function PaymentRow({ payment, eventId, canToggle }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const fn = payment.paid_at ? markUnpaid : markPaid
      const result = await fn(payment.id, eventId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full shrink-0 ${payment.paid_at ? 'bg-green-400' : 'bg-gray-300'}`} />
        <span className="text-sm text-gray-700">{payment.user?.nickname ?? '참여자'}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-800">
          {payment.amount_due.toLocaleString()}원
        </span>
        {canToggle ? (
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium disabled:opacity-50 transition-colors ${
              payment.paid_at
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {payment.paid_at ? '납부 완료' : '미납'}
          </button>
        ) : (
          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
            payment.paid_at
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-400'
          }`}>
            {payment.paid_at ? '납부 완료' : '미납'}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 absolute">{error}</p>}
    </div>
  )
}
