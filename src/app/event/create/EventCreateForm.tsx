'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EventCreateForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const location = formData.get('location') as string
    const eventDate = formData.get('event_date') as string
    const eventTime = formData.get('event_time') as string
    const description = formData.get('description') as string
    const maxParticipants = formData.get('max_participants') as string
    const entryFee = formData.get('entry_fee') as string

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }

    const { data, error: dbError } = await supabase
      .from('events')
      .insert({
        host_id: user.id,
        title: title.trim(),
        location: location.trim(),
        event_date: new Date(`${eventDate}T${eventTime}:00`).toISOString(),
        description: description.trim() || null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        entry_fee: entryFee ? parseInt(entryFee) : null,
        status: 'scheduled',
      })
      .select()
      .single()

    if (dbError) {
      setError('모임 생성 중 오류가 발생했습니다.')
      setLoading(false)
      return
    }

    router.push(`/event/${data.id}?created=1`)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          모임 이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="예: 7월 수영 모임"
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="event_date" className="text-sm font-medium text-gray-700">
            날짜 <span className="text-red-500">*</span>
          </label>
          <input
            id="event_date"
            name="event_date"
            type="date"
            required
            min={today}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="event_time" className="text-sm font-medium text-gray-700">
            시간 <span className="text-red-500">*</span>
          </label>
          <input
            id="event_time"
            name="event_time"
            type="time"
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="location" className="text-sm font-medium text-gray-700">
          장소 <span className="text-red-500">*</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          placeholder="예: 강남 수영장"
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">
          설명 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="모임에 대해 간단히 설명해주세요"
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="max_participants" className="text-sm font-medium text-gray-700">
            최대 인원 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <input
            id="max_participants"
            name="max_participants"
            type="number"
            min="2"
            max="100"
            placeholder="제한 없음"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="entry_fee" className="text-sm font-medium text-gray-700">
            참가비 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <input
            id="entry_fee"
            name="entry_fee"
            type="number"
            min="0"
            step="100"
            placeholder="0원"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
      >
        {loading ? '생성 중...' : '모임 만들기'}
      </button>
    </form>
  )
}
