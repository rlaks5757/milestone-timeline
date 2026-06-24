export interface MilestoneItem {
  MilestoneName: string
  MPlanDateDO: string | null
  MActualDateDO: string | null
  MDateDIffDA?: number
}

export interface LayoutConfig {
  cardWidth?: number   // default 132
  cardHeight?: number  // default 58
  laneGap?: number     // default 12
  laneStep?: number    // default 64
  topPad?: number      // default 24
  legendPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'  // default 'top-right'
}

export interface MilestoneLabels {
  title?: string
  early?: string
  ontime?: string
  delayed?: string
  upcoming?: string
  planDate?: string
  actualDate?: string
  delay?: string
  planLabel?: string
  actualLabel?: string
  noData?: string
  earlyFmt?: (days: number) => string
  delayedFmt?: (days: number) => string
  noDelay?: string
}
