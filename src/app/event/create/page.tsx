import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import EventCreateForm from './EventCreateForm'

export default async function EventCreatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <Header userNickname={profile?.nickname} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">모임 만들기</h1>
        <EventCreateForm />
      </main>
    </div>
  )
}
