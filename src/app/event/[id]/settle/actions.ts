'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// 원 단위 더치페이: 마지막 인원이 나머지 부담
function splitEqually(total: number, count: number): number[] {
  if (count === 0) return []
  const base = Math.floor(total / count)
  const amounts = Array(count).fill(base)
  amounts[count - 1] += total - base * count
  return amounts
}

export async function createSettlement(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const { data: event } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single()

  if (!event || event.host_id !== user.id) return { error: '주최자만 정산을 추가할 수 있어요.' }

  const item_name = formData.get('item_name') as string
  const amount = parseInt(formData.get('amount') as string, 10)

  if (!item_name?.trim() || isNaN(amount) || amount <= 0) {
    return { error: '항목명과 금액을 올바르게 입력해주세요.' }
  }

  // 참가 확정 참여자
  const { data: participants } = await supabase
    .from('event_participants')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('attendance', 'attending')

  const participantIds = participants?.map(p => p.user_id) ?? []

  // 주최자가 event_participants에 없으면 포함
  if (!participantIds.includes(user.id)) {
    participantIds.push(user.id)
  }

  if (participantIds.length === 0) return { error: '참가 확정 멤버가 없어요.' }

  const { data: settlement, error: se } = await supabase
    .from('settlements')
    .insert({ event_id: eventId, item_name: item_name.trim(), amount })
    .select('id')
    .single()

  if (se || !settlement) return { error: '정산 항목 생성에 실패했어요.' }

  const amounts = splitEqually(amount, participantIds.length)
  const payments = participantIds.map((uid, i) => ({
    settlement_id: settlement.id,
    user_id: uid,
    amount_due: amounts[i],
  }))

  const { error: pe } = await supabase.from('settlement_payments').insert(payments)
  if (pe) return { error: '납부 내역 생성에 실패했어요.' }

  revalidatePath(`/event/${eventId}/settle`)
  revalidatePath(`/event/${eventId}`)
  return { success: true }
}

export async function markPaid(paymentId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const { error } = await supabase
    .from('settlement_payments')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', paymentId)

  if (error) return { error: '처리에 실패했어요.' }

  revalidatePath(`/event/${eventId}/settle`)
  revalidatePath(`/event/${eventId}`)
  return { success: true }
}

export async function markUnpaid(paymentId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const { error } = await supabase
    .from('settlement_payments')
    .update({ paid_at: null })
    .eq('id', paymentId)

  if (error) return { error: '처리에 실패했어요.' }

  revalidatePath(`/event/${eventId}/settle`)
  revalidatePath(`/event/${eventId}`)
  return { success: true }
}

export async function deleteSettlement(settlementId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', settlementId)

  if (error) return { error: '삭제에 실패했어요.' }

  revalidatePath(`/event/${eventId}/settle`)
  revalidatePath(`/event/${eventId}`)
  return { success: true }
}
