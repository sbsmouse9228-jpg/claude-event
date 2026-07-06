'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function registerCar(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요해요.' }

  const departure_location = formData.get('departure_location') as string
  const departure_time_raw = formData.get('departure_time') as string
  const available_seats = parseInt(formData.get('available_seats') as string, 10)

  if (!departure_location || !departure_time_raw || isNaN(available_seats)) {
    return { error: '모든 항목을 입력해주세요.' }
  }

  // datetime-local 값(timezone 없음)을 KST로 해석해 UTC ISO로 변환
  const departure_time = new Date(departure_time_raw + ':00+09:00').toISOString()

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

  // 이미 이 이벤트의 다른 차량에 신청했는지 확인
  const { data: existingRequest } = await supabase
    .from('carpool_requests')
    .select('id, carpool_cars!inner(event_id)')
    .eq('passenger_id', user.id)
    .eq('carpool_cars.event_id', eventId)
    .not('status', 'eq', 'rejected')
    .maybeSingle()

  if (existingRequest) return { error: '이미 다른 차량에 탑승 신청했어요.' }

  // 운전자 본인이 신청하는지 확인
  const { data: car } = await supabase
    .from('carpool_cars')
    .select('driver_id, available_seats, carpool_requests(status)')
    .eq('id', carId)
    .single()

  if (!car) return { error: '차량 정보를 찾을 수 없어요.' }
  if (car.driver_id === user.id) return { error: '본인 차량에는 탑승 신청할 수 없어요.' }

  const acceptedCount = (car.carpool_requests as { status: string }[]).filter(r => r.status === 'accepted').length
  if (acceptedCount >= car.available_seats) return { error: '해당 차량의 잔여석이 없어요.' }

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

  // 요청한 차량의 드라이버인지 확인
  const { data: request } = await supabase
    .from('carpool_requests')
    .select('carpool_cars!inner(driver_id)')
    .eq('id', requestId)
    .single()

  const driverId = (request?.carpool_cars as unknown as { driver_id: string } | null)?.driver_id
  if (!driverId || driverId !== user.id) return { error: '권한이 없어요.' }

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
