import type { AxisScale } from '@visx/axis'
import {
  AxisBottom, AxisLeft
} from '@visx/axis'
import { curveMonotoneX } from '@visx/curve'
import { Group } from '@visx/group'
import { AreaClosed } from '@visx/shape'
import { timeFormat } from '@visx/vendor/d3-time-format'
import type { MetricData } from 'types'
import {
  getDate, getMetricValue
} from './utils'

const axisColor = '#fff'
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

const accentColor = '#bbff00'
function AreaChart ({
  children,
  hideBottomAxis = false,
  hideLeftAxis = false,
  left,
  margin,
  metricData,
  top,
  width,
  xScale,
  yMax,
  yScale
}: {
  metricData: MetricData[]
  xScale: AxisScale<number>
  yScale: AxisScale<number>
  width: number
  yMax: number
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number
  }
  hideBottomAxis?: boolean
  hideLeftAxis?: boolean
  top?: number
  left?: number
  children?: React.ReactNode
}) {

  return (
    <Group
      left={left || margin.left} top={top || margin.top}>
      <AreaClosed<MetricData>
        data={metricData}
        x={(d) => xScale(getDate(d)) || 0}
        y={(d) => yScale(getMetricValue(d)) || 0}
        yScale={yScale}
        strokeWidth={1}
        stroke={accentColor}
        fill="transparent"
        curve={curveMonotoneX}
      />
      {!hideBottomAxis && (
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
      )}
      {!hideLeftAxis && (
        <AxisLeft
          scale={yScale}
          numTicks={5}
          stroke={axisColor}
          tickStroke={axisColor}
          tickLabelProps={axisLeftTickLabelProps}
        />
      )}
      {children}
    </Group>
  )
}

export default AreaChart