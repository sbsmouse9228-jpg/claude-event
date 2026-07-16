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

const OPTIONS: { value: AttendanceStatus; label: string; style: string; confirmStyle: string }[] = [
  { value: 'attending', label: '참가', style: 'bg-green-500 text-white border-green-500', confirmStyle: 'bg-green-500 hover:bg-green-600 text-white' },
  { value: 'absent', label: '불참', style: 'bg-red-400 text-white border-red-400', confirmStyle: 'bg-red-400 hover:bg-red-500 text-white' },
  { value: 'pending', label: '미정', style: 'bg-gray-200 text-gray-600 border-gray-200', confirmStyle: 'bg-gray-400 hover:bg-gray-500 text-white' },
]

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  attending: '참가 예정',
  absent: '불참 예정',
  pending: '미정',
}

export default function AttendanceButton({ eventId, userId, current, maxParticipants, attendingCount }: Props) {
  const [saved, setSaved] = useState<AttendanceStatus | null>(current)
  const [selected, setSelected] = useState<AttendanceStatus | null>(null)
  const [loading, setLoading] = useState(false)

  function handleSelect(value: AttendanceStatus) {
    if (loading) return
    setSelected(value)
  }

  async function handleConfirm() {
    if (!selected || loading) return
    setLoading(true)

    const supabase = createClient()

    if (selected === 'attending' && maxParticipants && attendingCount >= maxParticipants && saved !== 'attending') {
      alert(`최대 인원(${maxParticipants}명)이 초과되어 참가할 수 없습니다.`)
      setLoading(false)
      return
    }

    await supabase
      .from('event_participants')
      .upsert(
        { event_id: eventId, user_id: userId, attendance: selected },
        { onConflict: 'event_id,user_id' }
      )

    setSaved(selected)
    setSelected(null)
    setLoading(false)
  }

  // 화면에 표시되는 선택 상태: 미확정 선택 > 저장된 상태 순서
  const displayed = selected ?? saved

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
              ${displayed === value ? style : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selected || loading}
        className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all
          bg-indigo-600 text-white disabled:bg-gray-200 disabled:text-gray-400"
      >
        {loading
          ? '저장 중...'
          : selected
            ? `"${OPTIONS.find(o => o.value === selected)!.label}" 으로 저장하기`
            : saved
              ? `현재: ${STATUS_LABEL[saved]}`
              : '상태를 선택하세요'}
      </button>
    </div>
  )
}
