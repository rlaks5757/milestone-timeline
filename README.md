# milestone-timeline

A React component that visualizes project milestones as a horizontal SVG timeline. Automatically arranges milestone cards to prevent overlaps, detects status (early/on-time/delayed/pending), and provides hover tooltips with detailed information.

## Features

- **Horizontal SVG Timeline** — Renders milestones on a clean, professional axis
- **Automatic Lane Arrangement** — Prevents card overlaps with intelligent vertical positioning
- **Status Detection** — Automatically categorizes milestones:
  - Early (green) — completed before planned date
  - On-time (dark) — completed on or near planned date
  - Delayed (red) — completed after planned date
  - Pending (gray) — not yet completed
- **Portal Tooltips** — Hover to see plan date, actual date, and delay days
- **TODAY Badge** — Displays when current date falls within milestone period
- **Responsive Layout** — Uses ResizeObserver to adapt to container width
- **CSS Customization** — Control colors via CSS variables
- **Date Format Flexibility** — Supports multiple date formats (Korean, ISO, numeric)

## Installation

```bash
npm install milestone-timeline
```

Requires React 18+ and ReactDOM 18+.

## Usage

### Basic Example

```tsx
import { MilestoneTimeline } from 'milestone-timeline'
import 'milestone-timeline/style.css'

const milestones = [
  {
    MilestoneName: '착공',
    MPlanDateDO: '2023년 03월 01일',
    MActualDateDO: '2023년 02월 20일'
  },
  {
    MilestoneName: '기초공사 완료',
    MPlanDateDO: '2023년 06월 30일',
    MActualDateDO: '2023년 07월 15일'
  },
  {
    MilestoneName: '준공',
    MPlanDateDO: '2024년 12월 31일',
    MActualDateDO: null
  }
]

export default function App() {
  return <MilestoneTimeline milestones={milestones} />
}
```

### With Custom Formatting

```tsx
import { MilestoneTimeline } from 'milestone-timeline'
import 'milestone-timeline/style.css'

function formatDateShort(date) {
  if (!date) return ''
  return date.toLocaleDateString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\./g, '-')
}

export default function App() {
  return (
    <MilestoneTimeline
      milestones={milestones}
      formatDate={formatDateShort}
    />
  )
}
```

### With Custom Layout

```tsx
<MilestoneTimeline
  milestones={milestones}
  layout={{
    cardWidth: 150,
    cardHeight: 70,
    laneGap: 16,
    laneStep: 80,
    topPad: 30
  }}
/>
```

## Props

### `MilestoneItem`

```typescript
interface MilestoneItem {
  MilestoneName: string
  MPlanDateDO: string | null        // Plan date (supports multiple formats)
  MActualDateDO: string | null      // Actual completion date
  MDateDIffDA?: number              // Delay in days (auto-calculated if omitted)
}
```

**Date Format Support:**
- Korean: `"2023년 06월 30일"`
- Numeric: `"2023.06.30"` or `"2023-06-30"`
- ISO: `"2023-06-30T00:00:00Z"`
- Any valid JavaScript Date string

### `MilestoneTimelineProps`

```typescript
interface MilestoneTimelineProps {
  milestones: MilestoneItem[]
  formatDate?: (date: Date | null) => string
  layout?: LayoutConfig
}
```

**`formatDate`** — Optional function to format dates in the tooltip. Default returns `YYYY-MM-DD` format.

**`layout`** — Optional layout configuration object.

### `LayoutConfig`

```typescript
interface LayoutConfig {
  cardWidth?: number        // Default: 132 (pixels)
  cardHeight?: number       // Default: 58 (pixels)
  laneGap?: number         // Default: 12 (gap between lanes, pixels)
  laneStep?: number        // Default: 64 (vertical offset per lane, pixels)
  topPad?: number          // Default: 24 (top padding before axis, pixels)
}
```

## CSS Customization

The component uses CSS variables for theming. Override in your stylesheet:

```css
:root {
  --c-surface: #ffffff;           /* Card background */
  --c-border: #e2e8f0;            /* Card border */
  --c-border-2: #f1f5f9;          /* Secondary border */
  --c-text: #1e293b;              /* Primary text */
  --c-text-muted: #64748b;        /* Secondary text */
  --c-axis: #dce0e7;              /* Timeline axis line */
}
```

### Status Colors (defined in component)

- **Early**: `#1f8a5b` (green)
- **On-time**: `#2b3240` (dark)
- **Delayed**: `#e5484d` (red)
- **Pending**: `#aeb6c2` (gray)

## How It Works

### Date Parsing

The component automatically detects and parses dates in multiple formats:

```
Korean:    "2023년 06월 30일" → Date object
Numeric:   "2023.06.30"       → Date object
ISO:       "2023-06-30"       → Date object
```

### Status Detection

Each milestone's status is determined by comparing actual vs. planned date:

```
Actual < Plan (by 1+ day)  → Early (green)
Actual ≈ Plan (±0 days)    → On-time (dark)
Actual > Plan (by 1+ day)  → Delayed (red)
Actual is null             → Pending (gray)
```

### Card Layout Algorithm

Cards are placed in "lanes" (rows) to prevent overlaps:

1. Cards are sorted by plan date left-to-right
2. Each card is assigned to the topmost available lane
3. Lanes are vertically offset by `laneStep` pixels
4. Connecting lines show relationship between plan date and actual date on each card

## Browser Support

Modern browsers with:
- ES2020+ support
- ResizeObserver API
- SVG rendering

Tested on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.

## Accessibility

- Milestone names are readable as text (not just visual)
- Hover tooltips provide detailed date information
- TODAY badge indicates current date clearly
- Sufficient color contrast for status indicators

## Performance

- Uses SVG for efficient rendering of large timelines
- ResizeObserver handles responsive layout without excessive reflows
- Card lane assignment uses O(n) algorithm

## License

MIT

## Contributing

Pull requests and issues welcome. Please include test cases for new features.
