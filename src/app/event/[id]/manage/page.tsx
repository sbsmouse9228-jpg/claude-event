import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import EventEditForm from './EventEditForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ManagePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()
  if (event.host_id !== user.id) redirect(`/event/${id}`)

  const { data: profile } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <Header userNickname={profile?.nickname} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/event/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
            ← 모임으로
          </Link>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-6">관리자 패널</h1>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-4">이벤트 정보 수정</h2>
          <EventEditForm event={event} />
        </div>
      </main>
    </div>
  )
}
