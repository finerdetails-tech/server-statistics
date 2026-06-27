import type { AxisScale } from '@visx/axis'
import {
  AxisLeft, AxisTop
} from '@visx/axis'
import { curveMonotoneX } from '@visx/curve'
import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import type { ComponentChildren } from 'preact'
import { useCallback } from 'preact/compat'
import type { MetricData } from 'types'
import {
  getDate, getMetricValue
} from '../../../utils'

const axisTopTickLabelProps = {
  fill: `var(--color-text)`,
  fontFamily: 'GoogleSansCode, monospace',
  fontSize: 10,
  style: {userSelect: 'none'},
  textAnchor: 'middle' as const
}
const axisLeftTickLabelProps = {
  dx: '-0.25em',
  dy: '0.25em',
  fill: `var(--color-text)`,
  fontFamily: 'GoogleSansCode, monospace',
  fontSize: 10,
  style: {userSelect: 'none'},
  textAnchor: 'end' as const
}

const tickLineProps = {strokeWidth: 2}


const dynamicTimeFormatter = (tick: string, _index: number, ticks: { value: string }[]) => {
  const firstTickUnix = new Date(ticks[0]?.value).getTime()
  const lastTickUnix = new Date(ticks[ticks.length - 1]?.value).getTime()
  const currentTickDate = new Date(tick)

  if (lastTickUnix - firstTickUnix < 1000 * 60 * 60 * 24) {
    return currentTickDate.toLocaleTimeString([], {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit'
    })
  }
  if (lastTickUnix - firstTickUnix < 1000 * 60 * 60 * 24 * 7) {
    return currentTickDate.toLocaleTimeString([], {
      hour: '2-digit',
      hour12: false,
      weekday: 'short'
    })
  }
  return currentTickDate.toLocaleDateString([], {
    day: 'numeric',
    month: 'short'
  })
}

function AreaChart ({
  children,
  isAxesEnabled = true,
  left,
  margin,
  metricData,
  numTicksX,
  numTicksY,
  strokeColor,
  top,
  underlay,
  xScale,
  yScale
}: {
  metricData: MetricData[],
  strokeColor: string
  xScale: AxisScale<number>
  yScale: AxisScale<number>
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number
  }
  hideBottomAxis?: boolean
  hideLeftAxis?: boolean
  top?: number
  left?: number
  children?: ComponentChildren
  underlay?: ComponentChildren
  numTicksX?: number,
  numTicksY?: number
  isAxesEnabled?: boolean
}) {

  const xAccessor = useCallback((d: MetricData) => xScale(getDate(d)) || 0, [ xScale ])
  const yAccessor = useCallback((d: MetricData) => yScale(getMetricValue(d)) || 0, [ yScale ])

  return (
    <Group
      left={left || margin?.left || 0} top={top || margin?.top || 0}>
      {underlay}
      <LinePath<MetricData>
        data={metricData}
        x={xAccessor}
        y={yAccessor}
        strokeWidth={2}
        stroke={strokeColor}
        fill="transparent"
        curve={curveMonotoneX}
      />
      {isAxesEnabled && (
        <>
          <AxisTop
            scale={xScale}
            numTicks={numTicksX}
            stroke={`var(--color-text)`}
            strokeWidth={2}
            tickStroke={`var(--color-text)`}
            tickLabelProps={axisTopTickLabelProps}
            tickFormat={dynamicTimeFormatter}
            tickLineProps={tickLineProps}
          />

          <AxisLeft
            scale={yScale}
            numTicks={numTicksY}
            stroke={`var(--color-text)`}
            strokeWidth={2}
            tickStroke={`var(--color-text)`}
            tickLineProps={tickLineProps}
            tickLabelProps={axisLeftTickLabelProps}
          />
        </>
      )}
      {children}
    </Group>
  )
}

export default AreaChart