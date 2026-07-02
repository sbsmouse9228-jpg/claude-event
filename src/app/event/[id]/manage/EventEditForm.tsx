'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types'

export default function EventEditForm({ event }: { event: Event }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const eventDate = new Date(event.event_date)
  const dateStr = eventDate.toISOString().split('T')[0]
  const timeStr = eventDate.toTimeString().slice(0, 5)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error: dbError } = await supabase
      .from('events')
      .update({
        title: (formData.get('title') as string).trim(),
        location: (formData.get('location') as string).trim(),
        event_date: `${formData.get('event_date')}T${formData.get('event_time')}:00`,
        description: (formData.get('description') as string).trim() || null,
        max_participants: formData.get('max_participants')
          ? parseInt(formData.get('max_participants') as string)
          : null,
        entry_fee: formData.get('entry_fee')
          ? parseInt(formData.get('entry_fee') as string)
          : null,
        status: formData.get('status') as string,
      })
      .eq('id', event.id)

    setLoading(false)
    if (dbError) {
      setError('수정 중 오류가 발생했습니다.')
      return
    }
    router.push(`/event/${event.id}`)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('events').delete().eq('id', event.id)
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">모임 이름</label>
        <input
          name="title"
          type="text"
          required
          defaultValue={event.title}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">날짜</label>
          <input
            name="event_date"
            type="date"
            required
            defaultValue={dateStr}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">시간</label>
          <input
            name="event_time"
            type="time"
            required
            defaultValue={timeStr}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">장소</label>
        <input
          name="location"
          type="text"
          required
          defaultValue={event.location}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">상태</label>
        <select
          name="status"
          defaultValue={event.status}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="scheduled">예정</option>
          <option value="ongoing">진행중</option>
          <option value="completed">완료</option>
          <option value="cancelled">취소</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">설명</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={event.description ?? ''}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">최대 인원</label>
          <input
            name="max_participants"
            type="number"
            min="2"
            defaultValue={event.max_participants ?? ''}
            placeholder="제한 없음"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">참가비</label>
          <input
            name="entry_fee"
            type="number"
            min="0"
            defaultValue={event.entry_fee ?? ''}
            placeholder="0원"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {loading ? '저장 중...' : '저장하기'}
      </button>

      {/* 삭제 */}
      <div className="pt-4 border-t border-gray-100">
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            모임 삭제
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-600">
              정말 삭제할까요? 초대 링크도 함께 무효화됩니다.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleting ? '삭제 중...' : '삭제 확인'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
