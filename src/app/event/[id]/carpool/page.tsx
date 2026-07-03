import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import CarpoolCarCard from './CarpoolCarCard'
import CarRegistrationForm from './CarRegistrationForm'

interface Props {
  params: Promise<{ id: string }>
}

interface NormalizedRequest {
  id: string
  passenger_id: string
  status: string
  user: { nickname: string } | null
}

interface NormalizedCar {
  id: string
  driver_id: string
  departure_location: string
  departure_time: string
  available_seats: number
  driver: { nickname: string } | null
  carpool_requests: NormalizedRequest[]
}

export default async function CarpoolPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: event }, { data: carsRaw }, { data: participantsRaw }, { data: profile }] = await Promise.all([
    supabase.from('events').select('id, title, host_id').eq('id', id).single(),
    supabase
      .from('carpool_cars')
      .select(`
        id, driver_id, departure_location, departure_time, available_seats,
        users!carpool_cars_driver_id_fkey(nickname),
        carpool_requests(
          id, passenger_id, status,
          users!carpool_requests_passenger_id_fkey(nickname)
        )
      `)
      .eq('event_id', id)
      .order('departure_time', { ascending: true }),
    supabase
      .from('event_participants')
      .select('user_id, users(nickname)')
      .eq('event_id', id),
    user
      ? supabase.from('users').select('nickname').eq('id', user.id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!event) notFound()

  // Supabase join 결과를 정규화 (joined row는 unknown으로 캐스팅)
  const cars: NormalizedCar[] = ((carsRaw ?? []) as unknown as Array<{
    id: string
    driver_id: string
    departure_location: string
    departure_time: string
    available_seats: number
    users: { nickname: string } | null
    carpool_requests: Array<{
      id: string
      passenger_id: string
      status: string
      users: { nickname: string } | null
    }>
  }>).map(car => ({
    id: car.id,
    driver_id: car.driver_id,
    departure_location: car.departure_location,
    departure_time: car.departure_time,
    available_seats: car.available_seats,
    driver: car.users,
    carpool_requests: (car.carpool_requests ?? []).map(r => ({
      id: r.id,
      passenger_id: r.passenger_id,
      status: r.status,
      user: r.users,
    })),
  }))

  const participants = ((participantsRaw ?? []) as unknown as Array<{
    user_id: string
    users: { nickname: string } | null
  }>)

  const driverIds = new Set(cars.map(c => c.driver_id))
  const acceptedPassengerIds = new Set(
    cars.flatMap(car =>
      car.carpool_requests.filter(r => r.status === 'accepted').map(r => r.passenger_id)
    )
  )

  const unassigned = participants.filter(
    p => !driverIds.has(p.user_id) && !acceptedPassengerIds.has(p.user_id)
  )

  const isUserDriver = user ? driverIds.has(user.id) : false
  const assignedCount = driverIds.size + acceptedPassengerIds.size

  return (
    <div className="min-h-screen flex flex-col">
      {user && <Header userNickname={(profile as { nickname?: string } | null)?.nickname} />}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        <Link href={`/event/${id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← 모임으로
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">카풀</h1>
          {participants.length > 0 && (
            <span className="text-sm text-gray-500">
              {assignedCount}명 배정 완료
            </span>
          )}
        </div>

        {/* 차량 목록 */}
        {cars.length > 0 ? (
          <div className="flex flex-col gap-3">
            {cars.map(car => (
              <CarpoolCarCard
                key={car.id}
                car={car}
                eventId={id}
                currentUserId={user?.id ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-400 mb-1">아직 등록된 차량이 없어요</p>
            <p className="text-xs text-gray-400">차량이 있으면 아래에서 등록해주세요</p>
          </div>
        )}

        {/* 차량 등록 (로그인 + 아직 드라이버 아닌 경우) */}
        {user && !isUserDriver && (
          <CarRegistrationForm eventId={id} />
        )}

        {/* 비로그인 안내 */}
        {!user && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-500 mb-4">카풀 신청·등록은 로그인이 필요해요</p>
            <Link
              href={`/?redirect=/event/${id}/carpool`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FEE500] text-[#3C1E1E] font-semibold rounded-xl text-sm hover:bg-[#F6DC00] transition-colors"
            >
              카카오로 로그인
            </Link>
          </div>
        )}

        {/* 미배정 참여자 */}
        {unassigned.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              미배정 참여자
              <span className="ml-1.5 font-normal text-gray-400">({unassigned.length}명)</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {unassigned.map(p => (
                <span
                  key={p.user_id}
                  className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full"
                >
                  {p.users?.nickname ?? '참여자'}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
