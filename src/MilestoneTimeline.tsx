import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { MilestoneItem, LayoutConfig } from './types'
import './MilestoneTimeline.css'

// ─── 날짜 파싱 ───────────────────────────────────────────────────────────────

// "2022년 12월" / "2024.01.15" / ISO datetime → Date
function parseFlexDate(str: string | null | undefined): Date | null {
  if (!str) return null
  const s = str.trim()
  const kor = s.match(/(\d{4})년\s*(\d{1,2})월(?:\s*(\d{1,2})일)?/)
  if (kor) return new Date(+kor[1], +kor[2] - 1, kor[3] ? +kor[3] : 1)
  const dot = s.match(/^(\d{4})\.(\d{2})\.(\d{2})/)
  if (dot) return new Date(+dot[1], +dot[2] - 1, +dot[3])
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────────────────────

function defaultFormatDate(d: Date | null): string {
  if (!d) return '—'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// TODAY 배지용 로컬 날짜 포맷 (date-fns 제거)
function fmtLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── 마일스톤 상태 ────────────────────────────────────────────────────────────

type MsState = 'ontime' | 'early' | 'delayed' | 'upcoming'

function getMsState(planDate: Date | null, actualDate: Date | null, today: Date): MsState {
  if (!actualDate) {
    return planDate && planDate <= today ? 'delayed' : 'upcoming'
  }
  if (!planDate) return 'ontime'
  const diff = actualDate.getTime() - planDate.getTime()
  if (diff < 0) return 'early'
  if (diff > 0) return 'delayed'
  return 'ontime'
}

const MS_STYLE = {
  ontime: { markerFill: '#2b3240', markerBorder: '#2b3240', titleColor: '#2b3240', actualColor: '#2b3240', legendLabel: '정시', tooltipStatus: '정시', tooltipBg: '#edf4fc', tooltipFg: '#2b3240' },
  early: { markerFill: '#ffffff', markerBorder: '#1f8a5b', titleColor: '#1f8a5b', actualColor: '#1f8a5b', legendLabel: '조기', tooltipStatus: '조기', tooltipBg: '#e6f5ee', tooltipFg: '#1f8a5b' },
  delayed: { markerFill: '#ffffff', markerBorder: '#e5484d', titleColor: '#e5484d', actualColor: '#e5484d', legendLabel: '지연', tooltipStatus: '지연', tooltipBg: '#ffe1e2', tooltipFg: '#e5484d' },
  upcoming: { markerFill: '#aeb6c2', markerBorder: '#aeb6c2', titleColor: '#3a4250', actualColor: '#8a94a6', legendLabel: '예정', tooltipStatus: '예정', tooltipBg: '#f3f4f6', tooltipFg: '#6b7488' },
}

// ─── PlacedMs 타입 ────────────────────────────────────────────────────────────

interface PlacedMs {
  m: MilestoneItem
  planDate: Date | null
  actualDate: Date | null
  delayDays: number
  state: MsState
  pct: number
  x: number
  cx: number
  side: 'above' | 'below'
  lane: number
}

// ─── 레인 패킹 레이아웃 ──────────────────────────────────────────────────────

// chip center 기준 레인 패킹 (밀집·중복 처리)
function layoutLanes(
  items: { m: MilestoneItem; planDate: Date | null; actualDate: Date | null; delayDays: number; state: MsState; pct: number }[],
  containerW: number,
  cardHalf: number,
): PlacedMs[] {
  const lo = cardHalf, hi = containerW - cardHalf, gap = 8
  const withX = items.map(item => ({
    ...item,
    x: (item.pct / 100) * containerW,
    cx: Math.max(lo, Math.min(hi, (item.pct / 100) * containerW)),
    side: 'above' as 'above' | 'below',
    lane: 0,
  }))
  withX.sort((a, b) => a.cx - b.cx)
  const aboveEnds: number[] = [], belowEnds: number[] = []
  withX.forEach((it, i) => {
    const order: ('above' | 'below')[] = i % 2 === 0 ? ['above', 'below'] : ['below', 'above']
    let done = false
    for (let l = 0; l < 12 && !done; l++) {
      for (const side of order) {
        const ends = side === 'above' ? aboveEnds : belowEnds
        if ((ends[l] ?? -Infinity) <= it.cx - cardHalf - gap) {
          ends[l] = it.cx + cardHalf
          it.side = side
          it.lane = l
          done = true
          break
        }
      }
    }
    if (!done) { it.side = 'above'; it.lane = 11 }
  })
  return withX
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MilestoneTimelineProps {
  milestones: MilestoneItem[]
  formatDate?: (date: Date | null) => string
  layout?: LayoutConfig
}

// ─── MilestoneTimeline 컴포넌트 ───────────────────────────────────────────────

export function MilestoneTimeline({ milestones, formatDate, layout }: MilestoneTimelineProps) {
  const fmt = formatDate ?? defaultFormatDate

  // layout 상수: prop으로 오버라이드 가능, 기본값은 원본과 동일
  const CARD_W = layout?.cardWidth ?? 132
  const CARD_HALF = CARD_W / 2
  const CARD_H = layout?.cardHeight ?? 58
  const LANE_GAP = layout?.laneGap ?? 12
  const LANE_STEP = layout?.laneStep ?? 64
  const TOP_PAD = layout?.topPad ?? 24

  const data = milestones.length > 0 ? milestones : []
  const containerRef = useRef<HTMLDivElement>(null)
  const [cw, setCw] = useState(900)
  const [tooltipData, setTooltipData] = useState<{
    idx: number
    p: PlacedMs
    anchorX: number
    anchorY: number
    above: boolean
  } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setCw(el.offsetWidth)
    const ro = new ResizeObserver(() => setCw(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 실적 있으면 actual-plan, 없고 계획일 지났으면 today-plan (미완료 지연)
  function resolveDelayDays(m: MilestoneItem, planDate: Date | null, actualDate: Date | null): number {
    if (actualDate && planDate) {
      return Math.round((actualDate.getTime() - planDate.getTime()) / 86400_000)
    }
    if (!actualDate && planDate && planDate < today) {
      return Math.round((today.getTime() - planDate.getTime()) / 86400_000)
    }
    return m.MDateDIffDA ?? 0
  }

  const withDates = data.map(m => {
    const planDate = parseFlexDate(m.MPlanDateDO)
    const actualDate = parseFlexDate(m.MActualDateDO)
    const delayDays = resolveDelayDays(m, planDate, actualDate)
    const state = getMsState(planDate, actualDate, today)
    return { m, planDate, actualDate, delayDays, state }
  })

  const times = withDates.map(x => x.planDate?.getTime() ?? 0).filter(t => t > 0)
  const minT = times.length ? Math.min(...times) : 0
  const maxT = times.length ? Math.max(...times) : minT + 1
  const padL = (maxT - minT) * 0.04 || 7 * 86400_000
  const padR = (maxT - minT) * 0.04 || 7 * 86400_000
  const axisStart = minT - padL
  const axisEnd = maxT + padR
  const axisRange = axisEnd - axisStart || 1

  function getPos(d: Date | null) {
    if (!d) return 50
    return Math.max(1, Math.min(99, ((d.getTime() - axisStart) / axisRange) * 100))
  }

  // 기간: 계획일 + 실적일 전체에서 min ~ max
  const allDates = withDates.flatMap(x => [x.planDate, x.actualDate]).filter((d): d is Date => !!d)
  const rangeStart = allDates.length ? fmt(new Date(Math.min(...allDates.map(d => d.getTime())))) : ''
  const rangeEnd = allDates.length ? fmt(new Date(Math.max(...allDates.map(d => d.getTime())))) : ''

  const sorted = withDates
    .map(x => ({ ...x, pct: getPos(x.planDate) }))
    .sort((a, b) => a.pct - b.pct)

  const placed = layoutLanes(sorted, cw, CARD_HALF)

  const maxAbove = placed.filter(p => p.side === 'above').reduce((m, p) => Math.max(m, p.lane), -1) + 1
  const maxBelow = placed.filter(p => p.side === 'below').reduce((m, p) => Math.max(m, p.lane), -1) + 1
  const axisY = TOP_PAD + CARD_H + LANE_GAP + Math.max(0, maxAbove - 1) * LANE_STEP
  const totalH = axisY + LANE_GAP + CARD_H + Math.max(0, maxBelow - 1) * LANE_STEP + LANE_GAP

  function getCardTop(p: PlacedMs): number {
    if (p.side === 'above') return axisY - LANE_GAP - CARD_H - p.lane * LANE_STEP
    return axisY + LANE_GAP + p.lane * LANE_STEP
  }

  // 오늘이 마일스톤 실제 기간(minT~maxT) 안에 있을 때만 표시
  const todayInRange = times.length > 0 && today.getTime() >= minT && today.getTime() <= maxT
  const todayPct = todayInRange ? getPos(today) : -1
  const todayX = todayInRange ? (todayPct / 100) * cw : -1
  // 배지 중심을 [BADGE_HALF, cw-BADGE_HALF] 안으로 clamp (수직선은 todayX 그대로)
  const BADGE_HALF = 72
  const todayBadgeX = todayX >= 0 ? Math.max(BADGE_HALF, Math.min(todayX, cw - BADGE_HALF)) : -1

  return (
    <>
      <div className="mst__card">
        <div className="mst__header">
          <h3 className="mst__title">Project Milestone</h3>
          <div className="mst__legendRow">
            {/* 범례: 원형 도트, 조기/지연/정시/예정 순 */}
            <div className="mst__legendList">
              {(['early', 'delayed', 'ontime', 'upcoming'] as MsState[]).map((state) => {
                const s = MS_STYLE[state]
                return (
                  <div key={state} className="mst__legendItem">
                    <span style={{
                      width: 11, height: 11, borderRadius: '50%', boxSizing: 'border-box',
                      background: s.markerFill, border: `2.5px solid ${s.markerBorder}`,
                      display: 'inline-block', flexShrink: 0,
                    }} />
                    <span className="mst__legendLabel">{s.legendLabel}</span>
                  </div>
                )
              })}
            </div>
            {/* 기간: 계획/실적 전체 min ~ max */}
            {(rangeStart || rangeEnd) && (
              <span className="mst__rangeText">
                {rangeStart} ~ {rangeEnd}
              </span>
            )}
          </div>
        </div>
        <div className="mst__scrollArea">
          <div className="mst__inner">
            <div ref={containerRef} className="mst__timelineWrap" style={{ height: sorted.length ? totalH : undefined }}>
              {sorted.length === 0 ? (
                <p className="mst__noData">마일스톤 데이터가 없습니다.</p>
              ) : (
                <>
                  {/* Today pill badge — 차트 맨 위 */}
                  {todayPct > 0 && todayPct < 100 && (
                    <div style={{
                      position: 'absolute', left: todayBadgeX, top: 4,
                      transform: 'translateX(-50%)',
                      zIndex: 50, display: 'flex', alignItems: 'center', gap: 5,
                      background: '#e5484d', color: '#ffffff',
                      fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.03em',
                      padding: '3px 9px', borderRadius: 999,
                      boxShadow: 'rgba(229,72,77,0.35) 0px 3px 8px',
                      whiteSpace: 'nowrap',
                    }}>
                      TODAY · {fmtLocalDate(today)}
                    </div>
                  )}

                  {/* 축 라인 + polyline L자형 스템 + Today 점선 */}
                  <svg
                    className="mst__svg"
                    width={cw}
                    height={totalH}
                  >
                    {/* Today 점선 */}
                    {todayPct > 0 && todayPct < 100 && (
                      <line
                        x1={todayX} y1={0} x2={todayX} y2={totalH - 12}
                        stroke="#e5484d" strokeWidth={1} strokeDasharray="3 4" opacity={0.35}
                      />
                    )}
                    <line x1={0} y1={axisY} x2={cw} y2={axisY} stroke="var(--c-axis, #dce0e7)" strokeWidth={2} />
                    {placed.map((p, i) => {
                      const cardTop = getCardTop(p)
                      const isAbove = p.side === 'above'
                      // 카드 실제 높이가 CARD_H보다 작을 수 있으므로 카드 중앙까지 connector 연장
                      const cardEdge = cardTop + Math.round(CARD_H / 2)
                      const midY = isAbove ? axisY - Math.floor(LANE_GAP / 2) : axisY + Math.floor(LANE_GAP / 2)
                      const pts = `${p.x},${axisY} ${p.x},${midY} ${p.cx},${midY} ${p.cx},${cardEdge}`
                      return (
                        <polyline
                          key={i}
                          points={pts}
                          fill="none"
                          stroke={tooltipData?.idx === i ? MS_STYLE[p.state].markerBorder : '#dce0e7'}
                          strokeWidth={tooltipData?.idx === i ? 1.5 : 1}
                        />
                      )
                    })}
                  </svg>

                  {/* 원형 마커 */}
                  {placed.map((p, i) => {
                    const s = MS_STYLE[p.state]
                    return (
                      <div
                        key={`d-${i}`}
                        style={{
                          position: 'absolute', left: p.x, top: axisY,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 20, padding: 5, cursor: 'default',
                        }}
                      >
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%', boxSizing: 'border-box',
                          background: s.markerFill, border: `2.5px solid ${s.markerBorder}`,
                          boxShadow: 'none', transition: 'box-shadow 0.12s',
                        }} />
                      </div>
                    )
                  })}

                  {/* 컴팩트 카드 */}
                  {placed.map((p, i) => {
                    const s = MS_STYLE[p.state]
                    const cardTop = getCardTop(p)
                    const isHov = tooltipData?.idx === i
                    return (
                      <div
                        key={`c-${i}`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const above = p.side === 'above'
                          setTooltipData({
                            idx: i, p, above,
                            anchorX: rect.left + rect.width / 2,
                            anchorY: above ? rect.top - 10 : rect.bottom + 10,
                          })
                        }}
                        onMouseLeave={() => setTooltipData(null)}
                        style={{
                          position: 'absolute',
                          left: p.cx - CARD_HALF, top: cardTop,
                          width: CARD_W,
                          background: 'var(--c-surface, #ffffff)',
                          border: `1px solid ${isHov ? '#d0d7e3' : 'var(--c-border, #e2e8f0)'}`,
                          borderRadius: 7,
                          padding: '5px 9px 6px',
                          boxShadow: isHov ? '0 6px 18px rgba(20,25,40,0.12)' : '0 1px 2px rgba(20,25,40,0.05)',
                          zIndex: isHov ? 75 : 30,
                          cursor: 'default',
                          boxSizing: 'border-box',
                          transition: 'box-shadow 0.12s, border-color 0.12s',
                        }}
                      >
                        <p style={{
                          fontSize: '0.857rem', fontWeight: 700,
                          color: s.titleColor,
                          letterSpacing: '-0.01em', lineHeight: 1.2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          textAlign: 'center',
                          margin: 0,
                        }}>
                          {p.m.MilestoneName}
                        </p>
                        <div style={{ marginTop: 2, fontSize: '0.714rem', color: 'var(--c-text-muted, #64748b)', lineHeight: 1.36, textAlign: 'center' }}>
                          <div>계획: {fmt(p.planDate)}</div>
                          {p.actualDate && (
                            <div style={{ color: s.actualColor }}>실적: {fmt(p.actualDate)}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 포털 툴팁 — overflow 컨테이너 밖, position: fixed */}
      {tooltipData && createPortal(
        (() => {
          const { p, anchorX, anchorY, above } = tooltipData
          const s = MS_STYLE[p.state]
          const days = p.delayDays
          const delayValue = p.state === 'early'
            ? `조기 -${Math.abs(days)}일`
            : p.state === 'delayed'
              ? `지연 +${days}일`
              : '없음'

          const TW = 212, TH = 182, GAP = 10, MARGIN = 8
          const vw = window.innerWidth, vh = window.innerHeight

          // 위/아래 표시 결정: 원하는 방향이 뷰포트를 벗어나면 반전
          let showAbove = above
          if (showAbove && anchorY - TH - GAP < MARGIN) showAbove = false
          if (!showAbove && anchorY + TH + GAP > vh - MARGIN) showAbove = true

          const rawTop = showAbove ? anchorY - TH - GAP : anchorY + GAP
          const finalTop = Math.max(MARGIN, Math.min(vh - TH - MARGIN, rawTop))

          // 수평 클램핑
          const rawLeft = anchorX - TW / 2
          const finalLeft = Math.max(MARGIN, Math.min(vw - TW - MARGIN, rawLeft))

          // 화살표 수평 위치 (툴팁 기준)
          const arrowLeft = Math.max(16, Math.min(TW - 16, anchorX - finalLeft))

          return (
            <div
              style={{
                position: 'fixed',
                left: finalLeft,
                top: finalTop,
                width: TW,
                background: 'var(--c-surface, #ffffff)',
                border: '1px solid var(--c-border, #e2e8f0)',
                borderRadius: 12,
                boxShadow: '0 10px 30px rgba(20,25,40,.18)', padding: '12px 14px',
                zIndex: 9999, pointerEvents: 'none',
              }}
            >
              <p style={{ fontSize: '0.929rem', fontWeight: 800, color: 'var(--c-text, #1e293b)', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                {p.m.MilestoneName}
              </p>
              <div style={{ height: 1, background: 'var(--c-border-2, #f1f5f9)', marginBottom: 4 }} />
              {([
                { label: '계획일', value: fmt(p.planDate), valueColor: 'var(--c-text, #1e293b)' },
                { label: '실적일', value: fmt(p.actualDate), valueColor: s.actualColor },
                { label: '지연', value: delayValue, valueColor: s.tooltipFg },
              ] as { label: string; value: string; valueColor: string }[]).map(({ label, value, valueColor }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: '4px 0' }}>
                  <span style={{ fontSize: '0.786rem', color: 'var(--c-text-muted, #64748b)', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '0.857rem', color: valueColor, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, marginTop: 4, borderTop: '1px solid var(--c-border-2, #f1f5f9)' }}>
                <span style={{ fontSize: '0.786rem', color: 'var(--c-text-muted, #64748b)', fontWeight: 600 }}>상태</span>
                <span style={{ fontSize: '0.786rem', fontWeight: 700, color: s.tooltipFg, background: s.tooltipBg, padding: '2px 9px', borderRadius: 999 }}>
                  {s.tooltipStatus}
                </span>
              </div>
              {/* 화살표 — 툴팁이 위면 아래쪽에, 아래면 위쪽에 */}
              <div style={{
                position: 'absolute', left: arrowLeft,
                ...(showAbove ? { bottom: -6 } : { top: -6 }),
                transform: 'translateX(-50%) rotate(45deg)',
                width: 11, height: 11, background: 'var(--c-surface, #ffffff)',
                ...(showAbove
                  ? { borderRight: '1px solid var(--c-border, #e2e8f0)', borderBottom: '1px solid var(--c-border, #e2e8f0)' }
                  : { borderLeft: '1px solid var(--c-border, #e2e8f0)', borderTop: '1px solid var(--c-border, #e2e8f0)' }),
              }} />
            </div>
          )
        })(),
        document.body
      )}
    </>
  )
}
