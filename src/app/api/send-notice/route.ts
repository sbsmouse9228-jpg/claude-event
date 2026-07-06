import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  'mailto:sbsmouse9228@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId, content } = await req.json()
  if (!eventId || !content?.trim()) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  // 주최자 확인
  const { data: event } = await supabase
    .from('events')
    .select('host_id, title')
    .eq('id', eventId)
    .single()

  if (!event || event.host_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  // 공지 저장
  const { error: insertError } = await supabase.from('notices').insert({
    event_id: eventId,
    author_id: user.id,
    content: content.trim(),
  })
  if (insertError) {
    return NextResponse.json({ error: '공지 저장에 실패했어요.' }, { status: 500 })
  }

  // 참가 확정 참여자 push 구독 조회
  const { data: participants } = await supabase
    .from('event_participants')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('attendance', 'attending')
    .neq('user_id', user.id) // 주최자 본인 제외

  const userIds = participants?.map(p => p.user_id) ?? []

  let pushSent = 0
  if (userIds.length > 0) {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', userIds)

    const payload = JSON.stringify({
      title: `📢 ${event.title}`,
      body: content.trim().slice(0, 100),
      url: `/event/${eventId}`,
    })

    await Promise.allSettled(
      (subscriptions ?? []).map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          )
          pushSent++
        } catch (e: unknown) {
          if (e instanceof Error && 'statusCode' in e && (e as { statusCode: number }).statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        }
      }),
    )
  }

  return NextResponse.json({ success: true, pushSent })
}
