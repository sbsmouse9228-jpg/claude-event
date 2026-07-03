# 새 API Route 핸들러 생성

`$ARGUMENTS`에 지정한 경로로 Next.js App Router route.ts 파일을 생성한다.

예시: `/new-api event/[id]/notices` → `src/app/api/event/[id]/notices/route.ts` 생성

## 작업 순서

1. `src/app/api/$ARGUMENTS/` 디렉토리가 없으면 생성한다.
2. `src/app/api/$ARGUMENTS/route.ts` 파일을 생성한다.
3. 경로 이름에서 필요한 HTTP 메서드를 유추한다:
   - 목록 조회 → `GET`
   - 생성 → `POST`
   - 수정 → `PUT` 또는 `PATCH`
   - 삭제 → `DELETE`
   - 확신할 수 없으면 `GET`과 `POST` 모두 포함한다.
4. 보일러플레이트 구조:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface Params {
  params: Promise<{ id: string }> // 동적 세그먼트가 있을 때만
}

export async function GET(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params
  const body = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('table_name')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

5. CLAUDE.md의 "주최자 권한 분리" 아키텍처를 참고해, 주최자 전용 엔드포인트면 `events.host_id === user.id` 검증 로직을 추가한다.
6. 생성 완료 후 파일 경로와 사용 예시(fetch URL)를 출력한다.
