import type { AxisScale } from '@visx/axis'
import {
  AxisBottom, AxisLeft
} from '@visx/axis'
import { curveMonotoneX } from '@visx/curve'
import { Group } from '@visx/group'
import { AreaClosed } from '@visx/shape'
import { timeFormat } from '@visx/vendor/d3-time-format'
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
  textAnchor: 'middle' as const
}
const axisLeftTickLabelProps = {
  dx: '-0.25em',
  dy: '0.25em',
  fill: axisColor,
  fontFamily: 'Arial',
  fontSize: 10,
  textAnchor: 'end' as const
}


const format24Hour = timeFormat('%H:%M')

function AreaChart ({
  children,
  left,
  margin,
  metricData,
  strokeColor,
  top,
  width,
  xScale,
  yMax,
  yScale
}: {
  metricData: MetricData[],
  strokeColor: string
  xScale: AxisScale<number>
  yScale: AxisScale<number>
  width: number
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
      <AxisBottom
        top={yMax}
        scale={xScale}
        numTicks={
          width > 520
            ? 10
            : 5
        }
        stroke={axisColor}
        tickStroke={axisColor}
        tickLabelProps={axisBottomTickLabelProps}
        tickFormat={format24Hour}
      />

      <AxisLeft
        scale={yScale}
        numTicks={5}
        stroke={axisColor}
        tickStroke={axisColor}
        tickLabelProps={axisLeftTickLabelProps}
      />
      {children}
    </Group>
  )
}

export default AreaChart