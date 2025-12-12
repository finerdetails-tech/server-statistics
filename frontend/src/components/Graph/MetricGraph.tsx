
import { Brush } from '@visx/brush'
import type BaseBrush from '@visx/brush/lib/BaseBrush'
import type { BrushHandleRenderProps } from '@visx/brush/lib/BrushHandle'
import type { Bounds } from '@visx/brush/lib/types'
import { Group } from '@visx/group'
import {
  scaleLinear, scaleTime
} from '@visx/scale'
import {
  extent, max
} from '@visx/vendor/d3-array'
import {
  useMemo, useRef, useState
} from 'preact/hooks'
import type {
  Metric, MetricData
} from 'types'
import AreaChart from './AreaChart'
import {
  getDate, getMetricValue
} from './utils'

// Initialize some variables
const brushMargin = {
  bottom: 15,
  left: 50,
  right: 20,
  top: 10
}
const chartSeparation = 30
const GRADIENT_ID = 'brush_gradient'
export const accentColor = '#bbff00ff'
const selectedBrushStyle = {
  fill: 'blue',
  stroke: 'white'
}

function BrushChart ({
  compact = false,
  height = 600,
  margin = {
    bottom: 20,
    left: 50,
    right: 20,
    top: 20
  },
  metrics,
  width = 800
}: {
  width?: number
  height?: number
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number
  }
  compact?: boolean
  metrics: Metric[]
}) {

  const metricData: MetricData[] = metrics.map(({
    TimeStamp, Value
  }) => ({
    TimeStamp,
    Value: parseFloat(Value)
  }))

  const brushRef = useRef<BaseBrush | null>(null)
  const [ brushFilter, setBrushFilter ] = useState<Bounds | null>(null)

  if (metricData.length === 0) return null

  const displayData = useMemo(() => {
    if (!brushFilter) return metricData

    const {
      x0, x1, y0, y1
    } = brushFilter
    return metricData.filter((metric) => {
      const x = getDate(metric).getTime()
      const y = getMetricValue(metric)
      return x > x0 && x < x1 && y > y0 && y < y1
    })
  }, [ metricData, brushFilter ])

  const onBrushChange = (domain: Bounds | null) => {
    setBrushFilter(domain)
  }

  const innerHeight = height - margin.top - margin.bottom
  const topChartBottomMargin = compact
    ? chartSeparation / 2
    : chartSeparation + 10
  const topChartHeight = 0.8 * innerHeight - topChartBottomMargin
  const bottomChartHeight = innerHeight - topChartHeight - chartSeparation

  // bounds
  const xMax = Math.max(width - margin.left - margin.right, 0)
  const yMax = Math.max(topChartHeight, 0)
  const xBrushMax = Math.max(width - brushMargin.left - brushMargin.right, 0)
  const yBrushMax = Math.max(bottomChartHeight - brushMargin.top - brushMargin.bottom, 0)

  // scales
  const dateScale = useMemo(
    () => scaleTime<number>({
      domain: extent(displayData, getDate) as [Date, Date],
      range: [ 0, xMax ]
    }),
    [ xMax, displayData ]
  )
  const stockScale = useMemo(
    () => scaleLinear<number>({
      domain: [ 0, max(displayData, getMetricValue) || 0 ],
      nice: true,
      range: [ yMax, 0 ]
    }),
    [ yMax, displayData ]
  )
  const brushDateScale = useMemo(
    () => scaleTime<number>({
      domain: extent(metricData, getDate) as [Date, Date],
      range: [ 0, xBrushMax ]
    }),
    [ xBrushMax ]
  )
  const brushStockScale = useMemo(
    () => scaleLinear({
      domain: [ 0, max(metricData, getMetricValue) || 0 ],
      nice: true,
      range: [ yBrushMax, 0 ]
    }),
    [ yBrushMax ]
  )

  const initialBrushPosition = useMemo(
    () => {
      const latestMetricDate = getDate(metricData.at(-1))
      const dayBeforeLatestMetricDate = new Date(latestMetricDate.getTime() - 1000 * 60 * 60 * 24)
      return ({
        end: { x: brushDateScale(getDate(metricData.at(-1))) },
        start: { x: brushDateScale(dayBeforeLatestMetricDate) }
      })
    },
    [ brushDateScale ]
  )

  return (
    <div>
      <svg
        width={width} height={height}>
        <rect
          x={0} y={0} width={width} height={height} fill={`url(#${GRADIENT_ID})`} rx={14} />
        <AreaChart
          hideBottomAxis={compact}
          metricData={displayData}
          width={width}
          margin={{
            ...margin,
            bottom: topChartBottomMargin
          }}
          yMax={yMax}
          xScale={dateScale}
          yScale={stockScale}
        />
        <AreaChart
          hideBottomAxis
          hideLeftAxis
          metricData={metricData}
          width={width}
          yMax={yBrushMax}
          xScale={brushDateScale}
          yScale={brushStockScale}
          margin={brushMargin}
          top={topChartHeight + topChartBottomMargin + margin.top}
        >
          <Brush
            xScale={brushDateScale}
            yScale={brushStockScale}
            width={xBrushMax}
            height={yBrushMax}
            margin={brushMargin}
            handleSize={8}
            innerRef={brushRef}
            resizeTriggerAreas={[ 'left', 'right' ]}
            brushDirection="horizontal"
            initialBrushPosition={initialBrushPosition}
            onChange={onBrushChange}
            selectedBoxStyle={selectedBrushStyle}
            useWindowMoveEvents
            renderBrushHandle={(props) => (<BrushHandle
              {...props} />)}
          />
        </AreaChart>
      </svg>
    </div>
  )
}
// We need to manually offset the handles for them to be rendered at the right position
function BrushHandle ({
  height, isBrushActive, x
}: BrushHandleRenderProps) {
  const pathWidth = 8
  const pathHeight = 15
  if (!isBrushActive) {
    return null
  }
  return (
    <Group
      left={x + pathWidth / 2} top={(height - pathHeight) / 2}>
      <path
        fill="#f2f2f2"
        d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
        stroke="#999999"
        strokeWidth="1"
        style={{ cursor: 'ew-resize' }}
      />
    </Group>
  )
}

export default BrushChart
