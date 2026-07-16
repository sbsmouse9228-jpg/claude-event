import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import KakaoLoginButton from '@/components/KakaoLoginButton'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // 익명 사용자는 랜딩 페이지에 머물게 함
  if (user && !user.is_anonymous) {
    redirect('/dashboard')
  }

  return (
    <main className="flex flex-col min-h-screen items-center px-4 py-14">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
        {/* 로고 */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl font-bold tracking-tight text-primary">MOA</span>
          <span className="text-muted-foreground text-sm">모아</span>
        </div>

        {/* 소개 */}
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-foreground leading-snug">
            모임 관리,<br />링크 하나로 끝
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            공지 · 출석 확인 · 카풀 · 정산을<br />초대 링크 하나로 처리하세요
          </p>
        </div>

        {/* 기능 요약 */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {[
            { icon: '📣', label: '공지 발행' },
            { icon: '✅', label: '출석 확인' },
            { icon: '🚗', label: '카풀 매칭' },
            { icon: '💰', label: '정산 관리' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 py-4 bg-card rounded-xl shadow-sm border border-border"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-medium text-card-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* 카카오 로그인 */}
        <Suspense>
          <KakaoLoginButton />
        </Suspense>

        <p className="text-xs text-muted-foreground">
          로그인 시 서비스 이용약관에 동의하는 것으로 간주합니다
        </p>
      </div>
    </main>
  )
}
