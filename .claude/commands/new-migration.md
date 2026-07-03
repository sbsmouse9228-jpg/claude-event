# Supabase 마이그레이션 파일 생성

`$ARGUMENTS`를 이름으로 하는 Supabase 마이그레이션 SQL 파일을 생성한다.

예시: `/new-migration add_carpool_tables` → `supabase/migrations/NNN_add_carpool_tables.sql` 생성

## 작업 순서

1. `supabase/migrations/` 폴더의 기존 파일 목록을 확인해 다음 번호(NNN)를 결정한다.
   - 파일이 없으면 `001`부터 시작, 있으면 마지막 번호 + 1.
2. `supabase/migrations/NNN_$ARGUMENTS.sql` 파일을 생성한다.
3. 파일 내용은 아래 템플릿을 기반으로 하되, `$ARGUMENTS` 이름에서 추가할 테이블/컬럼을 유추해 실제 스키마를 작성한다:

```sql
-- NNN_$ARGUMENTS.sql

-- 테이블 생성
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 컬럼 추가
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 (필수)
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "읽기: 인증된 사용자" ON table_name
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "쓰기: 본인만" ON table_name
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "수정: 본인만" ON table_name
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "삭제: 본인만" ON table_name
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

4. CLAUDE.md의 데이터 모델을 참고해 기존 테이블(users, events, event_participants 등)과의 외래 키를 정확히 연결한다.
5. 생성 완료 후 파일 경로와 "Supabase 대시보드 > SQL Editor에서 실행하세요" 안내를 출력한다.
