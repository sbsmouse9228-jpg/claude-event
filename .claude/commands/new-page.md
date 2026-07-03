# 새 App Router 페이지 생성

`$ARGUMENTS`에 지정한 경로로 Next.js App Router 페이지를 생성한다.

예시: `/new-page event/[id]/carpool` → `src/app/event/[id]/carpool/page.tsx` 생성

## 작업 순서

1. `src/app/$ARGUMENTS/` 디렉토리가 없으면 생성한다.
2. `src/app/$ARGUMENTS/page.tsx` 파일을 생성한다.
   - 경로에 `[id]` 같은 동적 세그먼트가 있으면 `params: { id: string }` Props 타입을 포함한다.
   - `manage` 등 주최자 전용 페이지면 Supabase 서버 클라이언트로 세션을 검증하고 미인증 시 `/` 로 redirect한다.
   - 컴포넌트명은 경로 마지막 세그먼트를 PascalCase로 변환한다 (예: `carpool` → `CarpoolPage`).
3. 보일러플레이트 구조:

```tsx
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }> // 동적 세그먼트가 있을 때만
}

export default async function XxxPage({ params }: Props) {
  const { id } = await params

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-xl font-bold">{/* 페이지 제목 */}</h1>
    </main>
  )
}
```

4. 생성 후 파일 경로와 간략한 다음 작업(데이터 페칭, 컴포넌트 분리 등)을 안내한다.
