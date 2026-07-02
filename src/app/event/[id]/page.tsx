import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import InviteLinkBox from './InviteLinkBox'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function EventPage({ params, searchParams }: Props) {
  const { id } = await params
  const { created } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('*, users!events_host_id_fkey(nickname, profile_image)')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const isHost = user?.id === event.host_id

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const eventDate = new Date(event.event_date)
  const dateStr = eventDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const timeStr = eventDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/invite/${event.invite_token}`

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

  return (
    <div className="min-h-screen flex flex-col">
      {user && <Header userNickname={profile?.nickname} />}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* 생성 완료 배너 */}
        {created && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm font-medium text-green-700">
              모임이 생성됐어요! 아래 초대 링크를 카카오톡으로 공유하세요.
            </p>
          </div>
        )}

        {/* 이벤트 헤더 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColor[event.status]}`}
            >
              {statusLabel[event.status]}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <InfoRow icon="📅" text={`${dateStr} ${timeStr}`} />
            <InfoRow icon="📍" text={event.location} />
            {event.max_participants && (
              <InfoRow icon="👥" text={`최대 ${event.max_participants}명`} />
            )}
            {event.entry_fee != null && event.entry_fee > 0 && (
              <InfoRow icon="💰" text={`참가비 ${event.entry_fee.toLocaleString()}원`} />
            )}
            {event.users && (
              <InfoRow icon="👤" text={`주최 ${event.users.nickname}`} />
            )}
          </div>

          {event.description && (
            <p className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}
        </div>

        {/* 초대 링크 (주최자만) */}
        {isHost && (
          <div className="mb-4">
            <InviteLinkBox inviteUrl={inviteUrl} />
          </div>
        )}

        {/* 주최자 관리 버튼 */}
        {isHost && (
          <Link
            href={`/event/${id}/manage`}
            className="flex items-center justify-center w-full py-3 border border-indigo-200 text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 transition-colors text-sm mb-4"
          >
            관리자 패널 →
          </Link>
        )}

        {/* 비로그인 사용자 안내 */}
        {!user && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-gray-600 text-sm mb-4">
              출석 확인, 카풀 신청 등을 하려면<br />카카오 로그인이 필요해요
            </p>
            <Link
              href={`/?redirect=/event/${id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FEE500] text-[#3C1E1E] font-semibold rounded-xl text-sm hover:bg-[#F6DC00] transition-colors"
            >
              카카오로 로그인
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span className="text-base">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
