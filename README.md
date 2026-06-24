# milestone-timeline

**[English](#english)** | **[한국어](#한국어)**

---

## English

A React component that visualizes project milestones as a horizontal SVG timeline. Automatically arranges milestone cards to prevent overlaps, detects status (early / on-time / delayed / upcoming), and provides hover tooltips with detailed information.

### Features

- **Horizontal SVG Timeline** — Clean professional axis with connecting lines
- **Automatic Lane Layout** — Prevents card overlaps with intelligent vertical positioning
- **Status Detection** — Automatically categorizes each milestone:
  - Early (green) — completed before planned date
  - On-time (dark) — completed on planned date
  - Delayed (red) — completed after planned date, or past due with no actual date
  - Upcoming (gray) — not yet due
- **i18n Support** — Built-in `ko` / `en` locales; fully customizable via `labels` prop
- **Portal Tooltips** — Hover to see plan date, actual date, and delay info
- **TODAY Badge** — Shown when the current date falls within the milestone period
- **Responsive** — Uses ResizeObserver to adapt to container width changes
- **CSS Variable Theming** — Control colors without touching component internals

### Installation

```bash
npm install milestone-timeline
```

Requires React 18+ and ReactDOM 18+.

### Usage

#### Basic

```tsx
import { MilestoneTimeline } from 'milestone-timeline'
import 'milestone-timeline/style.css'

const milestones = [
  { MilestoneName: 'Foundation', MPlanDateDO: '2023.03.01', MActualDateDO: '2023.02.20' },
  { MilestoneName: 'Structure',  MPlanDateDO: '2023.06.30', MActualDateDO: '2023.07.15' },
  { MilestoneName: 'Completion', MPlanDateDO: '2024.12.31', MActualDateDO: null },
]

export default function App() {
  return <MilestoneTimeline milestones={milestones} locale="en" />
}
```

#### Custom date format

```tsx
<MilestoneTimeline
  milestones={milestones}
  locale="en"
  formatDate={(d) => d ? d.toLocaleDateString('en-US') : '—'}
/>
```

#### Custom labels (partial override)

```tsx
<MilestoneTimeline
  milestones={milestones}
  locale="en"
  labels={{ title: 'Construction Schedule', noData: 'No data available.' }}
/>
```

#### Custom layout

```tsx
<MilestoneTimeline
  milestones={milestones}
  layout={{ cardWidth: 150, cardHeight: 70, laneGap: 16, laneStep: 80, topPad: 30 }}
/>
```

### Props

#### `MilestoneItem`

```typescript
interface MilestoneItem {
  MilestoneName: string
  MPlanDateDO: string | null        // Plan date
  MActualDateDO: string | null      // Actual completion date
  MDateDIffDA?: number              // Delay in days (auto-calculated if omitted)
}
```

**Supported date formats:**
- Korean: `"2023년 06월 30일"`
- Numeric: `"2023.06.30"` or `"2023-06-30"`
- ISO: `"2023-06-30T00:00:00Z"`

#### `MilestoneTimelineProps`

```typescript
interface MilestoneTimelineProps {
  milestones: MilestoneItem[]
  locale?: 'ko' | 'en'                      // default: 'ko'
  labels?: Partial<MilestoneLabels>          // override individual strings
  formatDate?: (date: Date | null) => string // default: YYYY-MM-DD
  layout?: LayoutConfig
}
```

#### `LayoutConfig`

```typescript
interface LayoutConfig {
  cardWidth?: number   // default: 132
  cardHeight?: number  // default: 58
  laneGap?: number     // default: 12
  laneStep?: number    // default: 64
  topPad?: number      // default: 24
}
```

#### `MilestoneLabels`

All fields are optional — unset fields fall back to the active `locale`.

```typescript
interface MilestoneLabels {
  title?: string
  early?: string
  ontime?: string
  delayed?: string
  upcoming?: string
  planDate?: string                       // tooltip field label
  actualDate?: string                     // tooltip field label
  delay?: string                          // tooltip field label
  planLabel?: string                      // card inline label
  actualLabel?: string                    // card inline label
  noData?: string
  earlyFmt?: (days: number) => string     // e.g. (d) => `Early -${d}d`
  delayedFmt?: (days: number) => string   // e.g. (d) => `Delayed +${d}d`
  noDelay?: string
}
```

### CSS Customization

```css
:root {
  --c-surface: #ffffff;     /* card / tooltip background */
  --c-border: #e2e8f0;      /* card / tooltip border */
  --c-border-2: #f1f5f9;    /* divider lines */
  --c-text: #1e293b;        /* primary text */
  --c-text-muted: #64748b;  /* secondary text */
  --c-axis: #dce0e7;        /* timeline axis line */
}
```

**Status colors (defined in component):**

| Status   | Color     |
|----------|-----------|
| Early    | `#1f8a5b` |
| On-time  | `#2b3240` |
| Delayed  | `#e5484d` |
| Upcoming | `#aeb6c2` |

### License

MIT

---

## 한국어

프로젝트 마일스톤을 수평 SVG 타임라인으로 시각화하는 React 컴포넌트입니다. 카드 겹침을 자동으로 방지하고, 상태(조기·정시·지연·예정)를 자동 판별하며, 호버 시 상세 툴팁을 제공합니다.

### 기능

- **수평 SVG 타임라인** — 연결선이 있는 깔끔한 축 렌더링
- **자동 레인 배치** — 카드 겹침 없이 위아래로 교차 배치
- **상태 자동 판별** — 마일스톤별 자동 분류:
  - 조기 (초록) — 계획일 이전에 완료
  - 정시 (어두운색) — 계획일 당일 완료
  - 지연 (빨강) — 계획일 이후 완료, 또는 계획일 경과 후 미완료
  - 예정 (회색) — 계획일 미도래
- **다국어(i18n) 지원** — `ko` / `en` 내장 로케일, `labels` prop으로 개별 문자열 오버라이드 가능
- **포털 툴팁** — 호버 시 계획일·실적일·지연 일수 표시
- **TODAY 배지** — 현재 날짜가 마일스톤 기간 내에 있을 때 표시
- **반응형** — ResizeObserver로 컨테이너 폭 변화에 자동 대응
- **CSS 변수 테마** — 컴포넌트 내부 수정 없이 색상 커스텀 가능

### 설치

```bash
npm install milestone-timeline
```

React 18+ 및 ReactDOM 18+가 필요합니다.

### 사용법

#### 기본

```tsx
import { MilestoneTimeline } from 'milestone-timeline'
import 'milestone-timeline/style.css'

const milestones = [
  { MilestoneName: '착공',       MPlanDateDO: '2023년 03월 01일', MActualDateDO: '2023년 02월 20일' },
  { MilestoneName: '기초공사 완료', MPlanDateDO: '2023년 06월 30일', MActualDateDO: '2023년 07월 15일' },
  { MilestoneName: '준공',       MPlanDateDO: '2024년 12월 31일', MActualDateDO: null },
]

export default function App() {
  return <MilestoneTimeline milestones={milestones} />
}
```

#### 날짜 형식 커스텀

```tsx
<MilestoneTimeline
  milestones={milestones}
  formatDate={(d) => d ? `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}` : '—'}
/>
```

#### 레이블 부분 오버라이드

```tsx
<MilestoneTimeline
  milestones={milestones}
  labels={{ title: '공사 일정', noData: '데이터가 없습니다.' }}
/>
```

#### 영어 로케일

```tsx
<MilestoneTimeline milestones={milestones} locale="en" />
```

#### 레이아웃 커스텀

```tsx
<MilestoneTimeline
  milestones={milestones}
  layout={{ cardWidth: 150, cardHeight: 70, laneGap: 16, laneStep: 80, topPad: 30 }}
/>
```

### Props

#### `MilestoneItem`

```typescript
interface MilestoneItem {
  MilestoneName: string
  MPlanDateDO: string | null        // 계획일
  MActualDateDO: string | null      // 실적일
  MDateDIffDA?: number              // 지연 일수 (생략 시 자동 계산)
}
```

**지원 날짜 형식:**
- 한국어: `"2023년 06월 30일"`
- 숫자: `"2023.06.30"` 또는 `"2023-06-30"`
- ISO: `"2023-06-30T00:00:00Z"`

#### `MilestoneTimelineProps`

```typescript
interface MilestoneTimelineProps {
  milestones: MilestoneItem[]
  locale?: 'ko' | 'en'                      // 기본값: 'ko'
  labels?: Partial<MilestoneLabels>          // 개별 문자열 오버라이드
  formatDate?: (date: Date | null) => string // 기본값: YYYY-MM-DD
  layout?: LayoutConfig
}
```

#### `LayoutConfig`

```typescript
interface LayoutConfig {
  cardWidth?: number   // 기본값: 132
  cardHeight?: number  // 기본값: 58
  laneGap?: number     // 기본값: 12
  laneStep?: number    // 기본값: 64
  topPad?: number      // 기본값: 24
}
```

#### `MilestoneLabels`

모든 필드는 선택 사항이며, 미지정 시 `locale` 기본값으로 폴백됩니다.

```typescript
interface MilestoneLabels {
  title?: string
  early?: string
  ontime?: string
  delayed?: string
  upcoming?: string
  planDate?: string                       // 툴팁 필드 레이블
  actualDate?: string                     // 툴팁 필드 레이블
  delay?: string                          // 툴팁 필드 레이블
  planLabel?: string                      // 카드 인라인 레이블
  actualLabel?: string                    // 카드 인라인 레이블
  noData?: string
  earlyFmt?: (days: number) => string     // 예: (d) => `조기 -${d}일`
  delayedFmt?: (days: number) => string   // 예: (d) => `지연 +${d}일`
  noDelay?: string
}
```

### CSS 커스터마이징

```css
:root {
  --c-surface: #ffffff;     /* 카드 / 툴팁 배경 */
  --c-border: #e2e8f0;      /* 카드 / 툴팁 테두리 */
  --c-border-2: #f1f5f9;    /* 구분선 */
  --c-text: #1e293b;        /* 기본 텍스트 */
  --c-text-muted: #64748b;  /* 보조 텍스트 */
  --c-axis: #dce0e7;        /* 타임라인 축선 */
}
```

**상태 색상 (컴포넌트 내부 고정값):**

| 상태 | 색상 |
|------|------|
| 조기 | `#1f8a5b` |
| 정시 | `#2b3240` |
| 지연 | `#e5484d` |
| 예정 | `#aeb6c2` |

### 라이선스

MIT
