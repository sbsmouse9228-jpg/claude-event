'use client'

import { useState, useTransition } from 'react'
import { requestRide, cancelRequest, respondToRequest, deleteCar } from './actions'

interface Request {
  id: string
  passenger_id: string
  status: string
  user: { nickname: string } | null
}

interface Car {
  id: string
  driver_id: string
  departure_location: string
  departure_time: string
  available_seats: number
  driver: { nickname: string } | null
  carpool_requests: Request[]
}

interface Props {
  car: Car
  eventId: string
  currentUserId: string | null
}

export default function CarpoolCarCard({ car, eventId, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isDriver = currentUserId === car.driver_id
  const acceptedRequests = car.carpool_requests.filter(r => r.status === 'accepted')
  const pendingRequests = car.carpool_requests.filter(r => r.status === 'pending')
  const filledSeats = acceptedRequests.length
  const availableSeats = car.available_seats - filledSeats
  const myRequest = car.carpool_requests.find(r => r.passenger_id === currentUserId)

  const departureDate = new Date(car.departure_time)
  const dateStr = departureDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' })
  const timeStr = departureDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })

  function act(fn: () => Promise<{ error?: string; success?: boolean } | undefined>) {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className={`bg-white rounded-xl border p-4 flex flex-col gap-3 ${isDriver ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'}`}>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">
              {car.driver?.nickname ?? '운전자'}
            </span>
            {isDriver && (
              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-medium">내 차량</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 text-xs text-gray-500">
            <span>출발 {dateStr} {timeStr}</span>
            <span>{car.departure_location}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xl font-bold ${availableSeats > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
            {availableSeats > 0 ? `${availableSeats}석` : '마감'}
          </p>
          <p className="text-xs text-gray-400">{filledSeats}/{car.available_seats}명 탑승</p>
        </div>
      </div>

      {/* 확정된 탑승자 */}
      {acceptedRequests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {acceptedRequests.map(r => (
            <span key={r.id} className="text-xs px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100">
              {r.user?.nickname ?? '탑승자'}
            </span>
          ))}
        </div>
      )}

      {/* 드라이버 뷰: 대기 신청자 관리 */}
      {isDriver && pendingRequests.length > 0 && (
        <div className="border-t border-indigo-100 pt-3">
          <p className="text-xs font-medium text-gray-600 mb-2">탑승 신청 대기 ({pendingRequests.length}명)</p>
          <div className="flex flex-col gap-2">
            {pendingRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-700 truncate">{r.user?.nickname ?? '신청자'}</span>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => act(() => respondToRequest(r.id, 'accepted', eventId))}
                    disabled={isPending || availableSeats <= 0}
                    className="text-xs px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-40 font-medium min-h-[36px]"
                  >
                    수락
                  </button>
                  <button
                    onClick={() => act(() => respondToRequest(r.id, 'rejected', eventId))}
                    disabled={isPending}
                    className="text-xs px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-40 min-h-[36px]"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 탑승 신청/취소 버튼 (비드라이버 로그인 사용자) */}
      {currentUserId && !isDriver && (
        <div>
          {myRequest?.status === 'accepted' ? (
            <div className="text-center py-2 text-sm text-green-700 font-medium bg-green-50 rounded-lg border border-green-100">
              탑승 확정
            </div>
          ) : myRequest?.status === 'pending' ? (
            <button
              onClick={() => act(() => cancelRequest(myRequest.id, eventId))}
              disabled={isPending}
              className="w-full py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              신청 취소 (수락 대기중)
            </button>
          ) : myRequest?.status === 'rejected' ? (
            <div className="text-center py-2 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
              신청이 거절됐어요
            </div>
          ) : availableSeats > 0 ? (
            <button
              onClick={() => act(() => requestRide(car.id, eventId))}
              disabled={isPending}
              className="w-full py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
            >
              탑승 신청
            </button>
          ) : (
            <div className="text-center py-2 text-sm text-gray-400 bg-gray-50 rounded-lg">
              잔여석이 없어요
            </div>
          )}
        </div>
      )}

      {/* 드라이버: 차량 삭제 */}
      {isDriver && (
        <div className="flex justify-end border-t border-indigo-100 pt-2">
          <button
            onClick={() => {
              if (confirm('차량 등록을 삭제할까요? 탑승 신청도 모두 취소됩니다.')) {
                act(() => deleteCar(car.id, eventId))
              }
            }}
            disabled={isPending}
            className="text-xs px-3 py-2 text-gray-400 hover:text-red-400 disabled:opacity-50 min-h-[36px]"
          >
            차량 삭제
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
