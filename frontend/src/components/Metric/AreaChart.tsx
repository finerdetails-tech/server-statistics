import type { AxisScale } from '@visx/axis'
import {
  AxisBottom, AxisLeft
} from '@visx/axis'
import { curveMonotoneX } from '@visx/curve'
import { Group } from '@visx/group'
import { AreaClosed } from '@visx/shape'
import type { ComponentChildren } from 'preact'
import { useCallback } from 'preact/compat'
import type { MetricData } from 'types'
import {
  getDate, getMetricValue
} from '../../utils'

const axisColor = '#F5F7F2'
const axisBottomTickLabelProps = {
  fill: axisColor,
  fontFamily: 'Arial',
  fontSize: 10,
  style: {userSelect: 'none'},
  textAnchor: 'middle' as const
}
const axisLeftTickLabelProps = {
  dx: '-0.25em',
  dy: '0.25em',
  fill: axisColor,
  fontFamily: 'Arial',
  fontSize: 10,
  style: {userSelect: 'none'},
  textAnchor: 'end' as const
}


const dynamicTimeFormatter = (tick: string, _index: number, ticks: { value: string }[]) => {
  const firstTickUnix = new Date(ticks[0]?.value).getTime()
  const lastTickUnix = new Date(ticks.at(-1)?.value).getTime()
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
  numTicks,
  strokeColor,
  top,
  xScale,
  yMax,
  yScale
}: {
  metricData: MetricData[],
  strokeColor: string
  xScale: AxisScale<number>
  yScale: AxisScale<number>
  yMax: number
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
  numTicks?: number,
  isAxesEnabled?: boolean
}) {

  const xAccessor = useCallback((d: MetricData) => xScale(getDate(d)) || 0, [ xScale ])
  const yAccessor = useCallback((d: MetricData) => yScale(getMetricValue(d)) || 0, [ yScale ])

  return (
    <Group
      left={left || margin?.left || 0} top={top || margin?.top || 0}>
      <AreaClosed<MetricData>
        data={metricData}
        x={xAccessor}
        y={yAccessor}
        yScale={yScale}
        strokeWidth={2}
        stroke={strokeColor}
        fill="transparent"
        curve={curveMonotoneX}
      />
      {isAxesEnabled && (
        <>
          <AxisBottom
            top={yMax}
            scale={xScale}
            numTicks={numTicks}
            stroke={axisColor}
            tickStroke={axisColor}
            tickLabelProps={axisBottomTickLabelProps}
            tickFormat={dynamicTimeFormatter}
          />

          <AxisLeft
            scale={yScale}
            numTicks={5}
            stroke={axisColor}
            tickStroke={axisColor}
            tickLabelProps={axisLeftTickLabelProps}
          />
        </>
      )}
      {children}
    </Group>
  )
}

export default AreaChart