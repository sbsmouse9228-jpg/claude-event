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
