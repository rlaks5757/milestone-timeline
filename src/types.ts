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
}
