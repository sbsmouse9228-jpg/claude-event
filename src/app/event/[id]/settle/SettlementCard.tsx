'use client'

import { useState, useTransition } from 'react'
import { deleteSettlement } from './actions'
import PaymentRow from './PaymentRow'

interface Payment {
  id: string
  user_id: string
  amount_due: number
  paid_at: string | null
  user: { nickname: string } | null
}

interface Props {
  settlement: {
    id: string
    item_name: string
    amount: number
  }
  payments: Payment[]
  eventId: string
  isHost: boolean
  currentUserId: string | null
}

export default function SettlementCard({ settlement, payments, eventId, isHost, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const paidCount = payments.filter(p => p.paid_at).length
  const totalCount = payments.length

  function handleDelete() {
    if (!confirm('이 정산 항목을 삭제할까요? 납부 내역도 모두 삭제됩니다.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteSettlement(settlement.id, eventId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-gray-900">{settlement.item_name}</h3>
        <span className="text-base font-bold text-gray-900 shrink-0">
          {settlement.amount.toLocaleString()}원
        </span>
      </div>

      {/* 납부 진행률 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all"
            style={{ width: totalCount > 0 ? `${(paidCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{paidCount}/{totalCount}명 납부</span>
      </div>

      {/* 납부 내역 목록 */}
      <div>
        {payments.map(p => (
          <PaymentRow
            key={p.id}
            payment={p}
            eventId={eventId}
            canToggle={isHost || p.user_id === currentUserId}
          />
        ))}
      </div>

      {/* 주최자: 항목 삭제 */}
      {isHost && (
        <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
          >
            항목 삭제
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
