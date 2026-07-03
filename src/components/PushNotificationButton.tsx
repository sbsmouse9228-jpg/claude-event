'use client'

import { useEffect, useState } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'idle'

export default function PushNotificationButton() {
  const [status, setStatus] = useState<Status>('loading')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      if (sub) setStatus('subscribed')
      else if (Notification.permission === 'denied') setStatus('denied')
      else setStatus('idle')
    })
  }, [])

  async function subscribe() {
    setPending(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      setStatus('subscribed')
    } finally {
      setPending(false)
    }
  }

  async function unsubscribe() {
    setPending(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push-subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('idle')
    } finally {
      setPending(false)
    }
  }

  if (status === 'loading' || status === 'unsupported' || status === 'denied') return null

  return (
    <button
      onClick={status === 'subscribed' ? unsubscribe : subscribe}
      disabled={pending}
      title={status === 'subscribed' ? '알림 끄기' : '모임 알림 받기'}
      className="text-lg leading-none disabled:opacity-50 transition-opacity"
    >
      {status === 'subscribed' ? '🔔' : '🔕'}
    </button>
  )
}
