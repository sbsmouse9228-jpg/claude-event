import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, users!events_host_id_fkey(nickname)')
    .eq('invite_token', token)
    .single()

  if (!event) notFound()

  // 로그인 사용자라면 이벤트 페이지로 바로 이동
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    // 참여자로 등록 (없으면 insert)
    await supabase
      .from('event_participants')
      .upsert(
        { event_id: event.id, user_id: user.id, attendance: 'pending' },
        { onConflict: 'event_id,user_id', ignoreDuplicates: true }
      )
    redirect(`/event/${event.id}`)
  }

  const eventDate = new Date(event.event_date)
  const dateStr = eventDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  })
  const timeStr = eventDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-sm mx-auto w-full px-4 py-10 flex flex-col gap-6">
        {/* 초대 배너 */}
        <div className="text-center">
          <span className="text-4xl">🎉</span>
          <h2 className="text-lg font-bold text-gray-900 mt-3">
            {event.users?.nickname}님이 초대했어요!
          </h2>
        </div>

        {/* 이벤트 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
          <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>

          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{dateStr} {timeStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{event.location}</span>
            </div>
            {event.max_participants && (
              <div className="flex items-center gap-2">
                <span>👥</span>
                <span>최대 {event.max_participants}명</span>
              </div>
            )}
            {event.entry_fee != null && event.entry_fee > 0 && (
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span>참가비 {event.entry_fee.toLocaleString()}원</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-gray-500 pt-3 border-t border-gray-100 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}
        </div>

        {/* 로그인 유도 */}
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm text-gray-600">
            출석 확인, 카풀 신청을 하려면<br />카카오 로그인이 필요해요
          </p>
          <Link
            href={`/?redirect=/invite/${token}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#FEE500] text-[#3C1E1E] font-semibold rounded-xl hover:bg-[#F6DC00] transition-colors"
          >
            <KakaoIcon />
            카카오로 참여하기
          </Link>
          <Link
            href={`/event/${event.id}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            로그인 없이 보기만 할게요
          </Link>
        </div>
      </main>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.736 1.606 5.14 4.035 6.572l-.985 3.65a.3.3 0 0 0 .455.327l4.284-2.83A10.7 10.7 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
    </svg>
  )
}
