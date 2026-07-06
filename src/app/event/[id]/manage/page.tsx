import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import EventEditForm from './EventEditForm'
import NoticeForm from './NoticeForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ManagePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [{ data: event }, { data: participants }, { data: notices }, { data: profile }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase
      .from('event_participants')
      .select('user_id, attendance, joined_at, users(nickname)')
      .eq('event_id', id)
      .order('joined_at', { ascending: true }),
    supabase
      .from('notices')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('users').select('nickname').eq('id', user.id).single(),
  ])

  if (!event) notFound()
  if (event.host_id !== user.id) redirect(`/event/${id}`)

  const attendingCount = participants?.filter((p) => p.attendance === 'attending').length ?? 0
  const absentCount = participants?.filter((p) => p.attendance === 'absent').length ?? 0
  const pendingCount = participants?.filter((p) => p.attendance === 'pending').length ?? 0
  const total = participants?.length ?? 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header userNickname={profile?.nickname} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link href={`/event/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
            ← 모임으로
          </Link>
        </div>
        <h1 className="text-xl font-bold text-gray-900">관리자 패널</h1>

        {/* 출석 현황 요약 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">출석 현황</h2>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatCard label="참가" count={attendingCount} total={total} color="text-green-600" bg="bg-green-50" />
            <StatCard label="불참" count={absentCount} total={total} color="text-red-500" bg="bg-red-50" />
            <StatCard label="미정" count={pendingCount} total={total} color="text-gray-500" bg="bg-gray-50" />
          </div>

          {/* 참여자 목록 */}
          {participants && participants.length > 0 ? (
            <div className="flex flex-col gap-2">
              {participants.map((p) => (
                <div key={p.user_id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700 font-medium">
                    {(p.users as unknown as { nickname: string } | null)?.nickname ?? '알 수 없음'}
                  </span>
                  <AttendanceBadge status={p.attendance} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              아직 참여한 멤버가 없어요.<br />초대 링크를 공유해보세요.
            </p>
          )}
        </div>

        {/* 공지 발송 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">공지 발송</h2>
          <NoticeForm eventId={id} userId={user.id} />
        </div>

        {/* 공지 목록 */}
        {notices && notices.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">발송된 공지</h2>
            <div className="flex flex-col gap-3">
              {notices.map((notice) => (
                <div key={notice.id} className="text-sm text-gray-700 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <p className="leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                      month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이벤트 수정 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">이벤트 정보 수정</h2>
          <EventEditForm event={event} />
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, count, total, color, bg }: {
  label: string; count: number; total: number; color: string; bg: string
}) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {total > 0 && (
        <p className="text-xs text-gray-400">{Math.round(count / total * 100)}%</p>
      )}
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
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${style}`}>{label}</span>
  )
}
