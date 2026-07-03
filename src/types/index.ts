export type EventStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
export type AttendanceStatus = 'attending' | 'absent' | 'pending'

export interface User {
  id: string
  kakao_id: string | null
  nickname: string
  profile_image: string | null
  created_at: string
}

export interface Event {
  id: string
  host_id: string
  title: string
  description: string | null
  location: string
  event_date: string
  max_participants: number | null
  invite_token: string
  status: EventStatus
  entry_fee: number | null
  created_at: string
  host?: User
}

export interface EventParticipant {
  event_id: string
  user_id: string
  attendance: AttendanceStatus
  joined_at: string
  user?: User
}

export type CarpoolRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface CarpoolRequest {
  id: string
  car_id: string
  passenger_id: string
  status: CarpoolRequestStatus
  created_at: string
  user?: User
}

export interface CarpoolCar {
  id: string
  event_id: string
  driver_id: string
  departure_location: string
  departure_time: string
  available_seats: number
  created_at: string
  driver?: User
  carpool_requests?: CarpoolRequest[]
}
