'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function registerCar(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const departure_location = formData.get('departure_location') as string
  const departure_time = formData.get('departure_time') as string
  const available_seats = parseInt(formData.get('available_seats') as string, 10)

  if (!departure_location || !departure_time || isNaN(available_seats)) {
    return { error: '모든 항목을 입력해주세요.' }
  }

  const { error } = await supabase.from('carpool_cars').insert({
    event_id: eventId,
    driver_id: user.id,
    departure_location,
    departure_time,
    available_seats,
  })

  if (error) return { error: '차량 등록에 실패했어요.' }

  revalidatePath(`/event/${eventId}/carpool`)
  revalidatePath(`/event/${eventId}`)
  return { success: true }
}

export async function requestRide(carId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const { error } = await supabase.from('carpool_requests').insert({
    car_id: carId,
    passenger_id: user.id,
  })

  if (error) return { error: '탑승 신청에 실패했어요.' }

  revalidatePath(`/event/${eventId}/carpool`)
  return { success: true }
}

export async function cancelRequest(requestId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const { error } = await supabase
    .from('carpool_requests')
    .delete()
    .eq('id', requestId)
    .eq('passenger_id', user.id)

  if (error) return { error: '신청 취소에 실패했어요.' }

  revalidatePath(`/event/${eventId}/carpool`)
  return { success: true }
}

export async function respondToRequest(
  requestId: string,
  status: 'accepted' | 'rejected',
  eventId: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const { error } = await supabase
    .from('carpool_requests')
    .update({ status })
    .eq('id', requestId)

  if (error) return { error: '처리에 실패했어요.' }

  revalidatePath(`/event/${eventId}/carpool`)
  revalidatePath(`/event/${eventId}`)
  return { success: true }
}

export async function deleteCar(carId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const { error } = await supabase
    .from('carpool_cars')
    .delete()
    .eq('id', carId)
    .eq('driver_id', user.id)

  if (error) return { error: '삭제에 실패했어요.' }

  revalidatePath(`/event/${eventId}/carpool`)
  revalidatePath(`/event/${eventId}`)
  return { success: true }
}
