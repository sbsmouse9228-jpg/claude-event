# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**MOA(모아)** — 소규모 모임(5~15명) 주최자가 공지·출석 확인·카풀·정산을 하나의 초대 링크로 처리하는 이벤트 관리 웹 플랫폼. 현재 기획 단계이며 `docs/` 폴더에 PRD, 로드맵, 린 캔버스가 있다.

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **스타일링**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Realtime)
- **인증**: Supabase Auth — 카카오 OAuth 2.0
- **배포**: Vercel
- **알림 (MVP)**: Web Push API

## 개발 명령어

프로젝트가 아직 초기화되지 않았으나, 초기화 후 사용할 표준 명령어:

```bash
# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 린트
npm run lint

# 타입 체크
npx tsc --noEmit
```

## 라우팅 구조 (App Router)

```
/                           랜딩 페이지 (카카오 로그인)
/dashboard                  내 모임 목록 (주최 / 참여 탭)
/event/create               이벤트 생성 폼
/event/[id]                 이벤트 메인 (참여자 뷰)
/event/[id]/manage          주최자 관리 패널
/event/[id]/carpool         카풀 등록 / 탑승 신청
/event/[id]/settle          정산 비용 입력 / 납부 확인
/invite/[token]             초대 링크 진입점 (비회원 접근 가능)
```

`/invite/[token]`은 비회원도 조회 가능하며, 출석 확인 등 액션 시 카카오 로그인 후 해당 이벤트로 자동 리다이렉트.

## 데이터 모델

```
users               id, kakao_id, nickname, profile_image
events              id, host_id, title, description, location, event_date,
                    max_participants, invite_token (UUID v4), status
                    status: scheduled | ongoing | completed | cancelled
event_participants  event_id, user_id, attendance (attending | absent | pending)
notices             event_id, author_id, content, created_at
carpool_cars        event_id, driver_id, departure_location, departure_time, available_seats
carpool_requests    car_id, passenger_id, status (pending | accepted | rejected)
settlements         event_id, item_name, amount, split_type (equal | custom)
settlement_payments settlement_id, user_id, amount_due, paid_at (null이면 미납)
```

모든 테이블에 Row Level Security(RLS) 정책 필수. `invite_token`은 이벤트 삭제 시 무효화되며 별도 만료 없음.

## 핵심 아키텍처 결정사항

- **비회원 접근**: `/invite/[token]`과 `/event/[id]` 이벤트 조회는 미인증 접근 허용. Supabase RLS로 읽기 권한 범위 제어.
- **주최자 권한 분리**: `events.host_id === auth.uid()`인 경우만 `/event/[id]/manage` 접근 및 공지 작성·리마인드·정산 입력 가능.
- **카풀 수락 흐름**: 탑승 신청(pending) → 차량 제공자 수락(accepted) → 탑승자에게 제공자 연락처·출발 장소 알림 전송.
- **정산 계산**: 더치페이 기본, 원 단위 반올림 시 마지막 인원이 나머지 부담.
- **D-1 자동 리마인드**: Supabase Edge Function + Cron으로 처리.
- **실시간 출석 현황**: Supabase Realtime 구독으로 주최자 관리 패널에 즉시 반영.

## 개발 순서 (로드맵 기준)

v0.1 → 인증·이벤트 생성·초대 링크  
v0.2 → 공지·출석 확인·대시보드  
v0.3 → 카풀 매칭  
v0.4 → 정산 시스템  
v1.0 → 통합 테스트·배포
