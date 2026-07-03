import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import SettlementCard from './SettlementCard'
import SettlementForm from './SettlementForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SettlePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: event }, { data: settlementsRaw }, { data: participantsRaw }, { data: profile }] = await Promise.all([
    supabase.from('events').select('id, title, host_id').eq('id', id).single(),
    supabase
      .from('settlements')
      .select(`
        id, item_name, amount, created_at,
        settlement_payments(
          id, user_id, amount_due, paid_at,
          users!settlement_payments_user_id_fkey(nickname)
        )
      `)
      .eq('event_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('event_participants')
      .select('user_id')
      .eq('event_id', id)
      .eq('attendance', 'attending'),
    user
      ? supabase.from('users').select('nickname').eq('id', user.id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!event) notFound()

  const isHost = user?.id === event.host_id

  type RawPayment = {
    id: string
    user_id: string
    amount_due: number
    paid_at: string | null
    users: { nickname: string } | null
  }
  type RawSettlement = {
    id: string
    item_name: string
    amount: number
    created_at: string
    settlement_payments: RawPayment[]
  }

  const settlements = ((settlementsRaw ?? []) as unknown as RawSettlement[]).map(s => ({
    ...s,
    payments: s.settlement_payments.map(p => ({
      id: p.id,
      user_id: p.user_id,
      amount_due: p.amount_due,
      paid_at: p.paid_at,
      user: p.users,
    })),
  }))

  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0)
  const allPayments = settlements.flatMap(s => s.payments)
  const paidCount = allPayments.filter(p => p.paid_at).length

  // 내 총 납부액
  const myPayments = user ? allPayments.filter(p => p.user_id === user.id) : []
  const myTotal = myPayments.reduce((sum, p) => sum + p.amount_due, 0)
  const myPaidTotal = myPayments.filter(p => p.paid_at).reduce((sum, p) => sum + p.amount_due, 0)

  // 정산 대상 참여자 수 (더치페이 미리보기용)
  const attendingCount = (participantsRaw?.length ?? 0) || 1
  // 주최자가 event_participants에 없으면 +1
  const splitCount = participantsRaw?.some(p => p.user_id === event.host_id)
    ? attendingCount
    : attendingCount + 1

  return (
    <div className="min-h-screen flex flex-col">
      {user && <Header userNickname={(profile as { nickname?: string } | null)?.nickname} />}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        <Link href={`/event/${id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← 모임으로
        </Link>

        {/* 요약 헤더 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-3">정산</h1>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{totalAmount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">총 금액 (원)</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-600">{paidCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">납부 완료</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-400">{allPayments.length - paidCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">미납</p>
            </div>
          </div>

          {/* 내 납부 현황 */}
          {user && myPayments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">내 납부 현황</p>
              <p className="text-sm font-medium text-gray-800">
                {myPaidTotal.toLocaleString()}원 납부 완료
                <span className="text-gray-400 font-normal"> / 총 {myTotal.toLocaleString()}원</span>
              </p>
            </div>
          )}
        </div>

        {/* 정산 항목 목록 */}
        {settlements.length > 0 ? (
          <div className="flex flex-col gap-3">
            {settlements.map(s => (
              <SettlementCard
                key={s.id}
                settlement={{ id: s.id, item_name: s.item_name, amount: s.amount }}
                payments={s.payments}
                eventId={id}
                isHost={isHost}
                currentUserId={user?.id ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-400 mb-1">아직 정산 항목이 없어요</p>
            {isHost && <p className="text-xs text-gray-400">아래에서 비용 항목을 추가해주세요</p>}
          </div>
        )}

        {/* 주최자: 항목 추가 */}
        {isHost && (
          <SettlementForm eventId={id} participantCount={splitCount} />
        )}

        {/* 비로그인 안내 */}
        {!user && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-500 mb-4">납부 확인은 로그인이 필요해요</p>
            <Link
              href={`/?redirect=/event/${id}/settle`}
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
