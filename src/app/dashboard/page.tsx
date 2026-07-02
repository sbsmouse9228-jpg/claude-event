import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Event } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // 사용자 프로필 조회 (없으면 생성)
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.from('users').insert({
      id: user.id,
      kakao_id: user.user_metadata?.provider_id ?? null,
      nickname: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '사용자',
      profile_image: user.user_metadata?.avatar_url ?? null,
    })
  }

  const nickname = profile?.nickname ?? user.user_metadata?.full_name ?? '사용자'

  // 주최한 이벤트
  const { data: hostedEvents } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('event_date', { ascending: false })

  // 참여한 이벤트
  const { data: participatingRaw } = await supabase
    .from('event_participants')
    .select('event_id, events(*)')
    .eq('user_id', user.id)
    .neq('events.host_id', user.id)

  const participatingEvents = (participatingRaw
    ?.map((p) => p.events)
    .filter(Boolean) ?? null) as unknown as Event[] | null

  return (
    <div className="min-h-screen flex flex-col">
      <Header userNickname={nickname} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">내 모임</h1>
          <Link
            href="/event/create"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + 모임 만들기
          </Link>
        </div>

        {/* 주최한 모임 */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            내가 주최한 모임
          </h2>
          {hostedEvents && hostedEvents.length > 0 ? (
            <div className="flex flex-col gap-3">
              {hostedEvents.map((event) => (
                <EventCard key={event.id} event={event} isHost />
              ))}
            </div>
          ) : (
            <EmptyState
              message="아직 주최한 모임이 없어요"
              action={
                <Link
                  href="/event/create"
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  모임 만들기
                </Link>
              }
            />
          )}
        </section>

        {/* 참여한 모임 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            참여 중인 모임
          </h2>
          {participatingEvents && participatingEvents.length > 0 ? (
            <div className="flex flex-col gap-3">
              {participatingEvents.map((event) => (
                <EventCard key={event.id} event={event} isHost={false} />
              ))}
            </div>
          ) : (
            <EmptyState message="참여 중인 모임이 없어요" />
          )}
        </section>
      </main>
    </div>
  )
}

function EventCard({ event, isHost }: { event: Event; isHost: boolean }) {
  const statusLabel: Record<string, string> = {
    scheduled: '예정',
    ongoing: '진행중',
    completed: '완료',
    cancelled: '취소',
  }
  const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-500',
  }

  const eventDate = new Date(event.event_date)
  const dateStr = eventDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const timeStr = eventDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Link href={`/event/${event.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {isHost && (
              <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                주최자
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[event.status]}`}
            >
              {statusLabel[event.status]}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-sm text-gray-500">
          <span>
            {dateStr} {timeStr}
          </span>
          <span>{event.location}</span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({
  message,
  action,
}: {
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 bg-white rounded-xl border border-dashed border-gray-200">
      <p className="text-sm text-gray-400">{message}</p>
      {action}
    </div>
  )
}
