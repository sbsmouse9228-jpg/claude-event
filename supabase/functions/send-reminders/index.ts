import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  'mailto:sbsmouse9228@gmail.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

Deno.serve(async () => {
  // 내일(KST) 이벤트 범위 계산
  const kstOffsetMs = 9 * 60 * 60 * 1000
  const kstNow = new Date(Date.now() + kstOffsetMs)
  const y = kstNow.getUTCFullYear()
  const m = kstNow.getUTCMonth()
  const d = kstNow.getUTCDate() + 1 // 내일 날짜 (KST 기준)

  const tomorrowStart = new Date(Date.UTC(y, m, d) - kstOffsetMs)
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000)

  // D-1 이벤트 조회
  const { data: events } = await supabase
    .from('events')
    .select('id, title, location, event_date, host_id')
    .gte('event_date', tomorrowStart.toISOString())
    .lt('event_date', tomorrowEnd.toISOString())
    .neq('status', 'cancelled')

  if (!events?.length) {
    return new Response(JSON.stringify({ message: '내일 예정 이벤트 없음', sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let noticeCount = 0
  let pushCount = 0

  for (const event of events) {
    const eventDate = new Date(event.event_date)
    const timeStr = eventDate.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
    })

    // 참가 확정 참여자 조회
    const { data: participants } = await supabase
      .from('event_participants')
      .select('user_id')
      .eq('event_id', event.id)
      .eq('attendance', 'attending')

    const userIds = (participants ?? []).map((p: { user_id: string }) => p.user_id)

    // 공지 자동 생성
    await supabase.from('notices').insert({
      event_id: event.id,
      author_id: event.host_id,
      content: `📢 내일 모임이 있어요!\n${event.title}이 내일 ${timeStr}에 ${event.location}에서 진행됩니다. 잊지 마세요!`,
    })
    noticeCount++

    if (!userIds.length) continue

    // 참여자 Push 구독 조회
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', userIds)

    for (const sub of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: `📢 ${event.title} — 내일이에요!`,
            body: `${timeStr} · ${event.location}`,
            url: `/event/${event.id}`,
          }),
        )
        pushCount++
      } catch (e: unknown) {
        // 만료된 구독 삭제 (410 Gone)
        if (e instanceof Error && 'statusCode' in e && (e as { statusCode: number }).statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ events: events.length, notices: noticeCount, pushes: pushCount }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
