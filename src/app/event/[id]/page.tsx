import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import InviteLinkBox from './InviteLinkBox'
import AttendanceButton from './AttendanceButton'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function EventPage({ params, searchParams }: Props) {
  const { id } = await params
  const { created } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: event }, { data: participants }, { data: notices }, { data: carpoolCars }, { data: settlements }] = await Promise.all([
    supabase
      .from('events')
      .select('*, users!events_host_id_fkey(nickname, profile_image)')
      .eq('id', id)
      .single(),
    supabase
      .from('event_participants')
      .select('user_id, attendance, users(nickname, profile_image)')
      .eq('event_id', id),
    supabase
      .from('notices')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('carpool_cars')
      .select('id, driver_id, available_seats, carpool_requests(status)')
      .eq('event_id', id),
    supabase
      .from('settlements')
      .select('amount, settlement_payments(paid_at)')
      .eq('event_id', id),
  ])

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

  const myParticipant = participants?.find((p) => p.user_id === user?.id)
  const attendingCount = participants?.filter((p) => p.attendance === 'attending').length ?? 0

  type RawCarpoolCar = { id: string; driver_id: string; available_seats: number; carpool_requests: { status: string }[] }
  const carpoolAssigned = (carpoolCars as RawCarpoolCar[] ?? []).reduce((acc, car) => {
    const accepted = car.carpool_requests.filter(r => r.status === 'accepted').length
    return acc + accepted + 1 // +1 for driver
  }, 0)
  const hasCarpoolCars = (carpoolCars?.length ?? 0) > 0

  type RawSettlement = { amount: number; settlement_payments: { paid_at: string | null }[] }
  const settlementList = (settlements as unknown as RawSettlement[] ?? [])
  const totalSettlementAmount = settlementList.reduce((sum, s) => sum + s.amount, 0)
  const allSettlementPayments = settlementList.flatMap(s => s.settlement_payments)
  const paidPaymentsCount = allSettlementPayments.filter(p => p.paid_at).length
  const hasSettlements = settlementList.length > 0

  const eventDate = new Date(event.event_date)
  const dateStr = eventDate.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })
  const timeStr = eventDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${event.invite_token}`

  const statusLabel: Record<string, string> = {
    scheduled: '예정', ongoing: '진행중', completed: '완료', cancelled: '취소',
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
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">

        {created && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm font-medium text-green-700">
              모임이 생성됐어요! 아래 초대 링크를 카카오톡으로 공유하세요.
            </p>
          </div>
        )}

        {/* 이벤트 정보 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColor[event.status]}`}>
              {statusLabel[event.status]}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <InfoRow icon="📅" text={`${dateStr} ${timeStr}`} />
            <InfoRow icon="📍" text={event.location} />
            {event.max_participants && (
              <InfoRow icon="👥" text={`${attendingCount}/${event.max_participants}명 참가`} />
            )}
            {!event.max_participants && attendingCount > 0 && (
              <InfoRow icon="👥" text={`${attendingCount}명 참가 예정`} />
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

        {/* 출석 확인 (로그인 사용자 + 비주최자) */}
        {user && !isHost && (
          <AttendanceButton
            eventId={id}
            userId={user.id}
            current={myParticipant?.attendance ?? null}
            maxParticipants={event.max_participants}
            attendingCount={attendingCount}
          />
        )}

        {/* 초대 링크 (주최자) */}
        {isHost && <InviteLinkBox inviteUrl={inviteUrl} />}

        {/* 주최자 관리 버튼 */}
        {isHost && (
          <Link
            href={`/event/${id}/manage`}
            className="flex items-center justify-center w-full py-3 border border-indigo-200 text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 transition-colors text-sm"
          >
            관리자 패널 →
          </Link>
        )}

        {/* 카풀 현황 위젯 */}
        <Link href={`/event/${id}/carpool`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🚗</span>
                <span className="text-sm font-semibold text-gray-800">카풀</span>
              </div>
              <span className="text-xs text-indigo-500 font-medium">자세히 →</span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              {hasCarpoolCars
                ? `${carpoolCars?.length}대 등록 · ${carpoolAssigned}명 배정 완료`
                : '아직 등록된 차량이 없어요'}
            </p>
          </div>
        </Link>

        {/* 정산 현황 위젯 */}
        <Link href={`/event/${id}/settle`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💰</span>
                <span className="text-sm font-semibold text-gray-800">정산</span>
              </div>
              <span className="text-xs text-indigo-500 font-medium">자세히 →</span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              {hasSettlements
                ? `총 ${totalSettlementAmount.toLocaleString()}원 · ${paidPaymentsCount}/${allSettlementPayments.length}명 납부 완료`
                : '아직 정산 항목이 없어요'}
            </p>
          </div>
        </Link>

        {/* 공지 목록 */}
        {notices && notices.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">공지사항</h2>
            <div className="flex flex-col gap-3">
              {notices.map((notice) => (
                <div key={notice.id} className="text-sm text-gray-700 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <p className="leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                      month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 참여자 현황 (주최자) */}
        {isHost && participants && participants.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">
              참여자 현황
              <span className="ml-2 text-sm font-normal text-gray-500">
                {attendingCount}명 참가 · {participants.filter(p => p.attendance === 'pending').length}명 미정
              </span>
            </h2>
            <div className="flex flex-col gap-2">
              {participants.map((p) => (
                <div key={p.user_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{(p.users as unknown as { nickname: string } | null)?.nickname ?? '알 수 없음'}</span>
                  <AttendanceBadge status={p.attendance} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 비로그인 안내 */}
        {!user && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-gray-600 text-sm mb-4">
              출석 확인을 하려면<br />카카오 로그인이 필요해요
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
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function AttendanceBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; style: string }> = {
    attending: { label: '참가', style: 'bg-green-100 text-green-700' },
    absent: { label: '불참', style: 'bg-red-100 text-red-500' },
    pending: { label: '미정', style: 'bg-gray-100 text-gray-500' },
  }
  const { label, style } = map[status] ?? map.pending
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>{label}</span>
  )
}
