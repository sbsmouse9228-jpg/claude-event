'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AttendanceStatus } from '@/types'

interface Props {
  eventId: string
  userId: string
  current: AttendanceStatus | null
  maxParticipants: number | null
  attendingCount: number
}

const OPTIONS: { value: AttendanceStatus; label: string; style: string }[] = [
  { value: 'attending', label: '참가', style: 'bg-green-500 text-white border-green-500' },
  { value: 'absent', label: '불참', style: 'bg-red-400 text-white border-red-400' },
  { value: 'pending', label: '미정', style: 'bg-gray-200 text-gray-600 border-gray-200' },
]

export default function AttendanceButton({ eventId, userId, current, maxParticipants, attendingCount }: Props) {
  const [status, setStatus] = useState<AttendanceStatus | null>(current)
  const [loading, setLoading] = useState(false)

  async function handleSelect(value: AttendanceStatus) {
    if (loading) return
    setLoading(true)

    const supabase = createClient()

    if (value === 'attending' && maxParticipants && attendingCount >= maxParticipants && status !== 'attending') {
      alert(`최대 인원(${maxParticipants}명)이 초과되어 참가할 수 없습니다.`)
      setLoading(false)
      return
    }

    await supabase
      .from('event_participants')
      .upsert(
        { event_id: eventId, user_id: userId, attendance: value },
        { onConflict: 'event_id,user_id' }
      )

    setStatus(value)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-sm font-semibold text-gray-700 mb-3">출석 확인</p>
      <div className="flex gap-2">
        {OPTIONS.map(({ value, label, style }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-60
              ${status === value ? style : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {status && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          {status === 'attending' ? '참가 예정입니다' : status === 'absent' ? '불참 예정입니다' : '아직 미정입니다'}
        </p>
      )}
    </div>
  )
}
