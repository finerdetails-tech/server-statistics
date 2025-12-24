
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
  useCallback, useMemo, useRef, useState
} from 'preact/hooks'
import type {
  Metric, MetricData
} from 'types'
import { remToPx } from '../../utils'
import {
  aggregateMetrics, getDate, getMetricValue
} from '../../utils'
import AreaChart from './AreaChart'

const brushMargin = {
  bottom: 15,
  left: 0,
  right: 0,
  top: 10
}

const GRADIENT_ID = 'brush_gradient'
export const accentColor = '#bbff00ff'
const selectedBrushStyle = {
  fill: 'blue',
  stroke: 'white'
}

function MetricGraph ({
  metricHeight,
  metrics,
  metricWidth
}: {
  metricHeight: number
  metricWidth: number
  metrics: Metric[]
}) {

  const metricData: MetricData[] = useMemo(() => metrics.map(({
    TimeStamp, Value
  }) => ({
    TimeStamp,
    Value: parseFloat(Value)
  })), [ metrics ])

  const brushData = useMemo(() => aggregateMetrics(metricData), [ metricData ])

  const topChartBottomMargin = remToPx(4)
  const surroundingMargin = remToPx(1)

  const adjustedMetricHeight = 0.8 * metricHeight - 2 * surroundingMargin
  const adjustedMetricWidth = metricWidth - 2 * surroundingMargin

  const topChartHeight = adjustedMetricHeight - topChartBottomMargin
  const bottomChartHeight = adjustedMetricHeight - topChartHeight

  // bounds
  const xMax = Math.max(adjustedMetricWidth, 0)
  const yMax = Math.max(topChartHeight, 0)
  const xBrushMax = Math.max(adjustedMetricWidth, 0)
  const yBrushMax = Math.max(bottomChartHeight, 0)

  const brushRef = useRef<BaseBrush | null>(null)
  const [ brushFilter, setBrushFilter ] = useState<Bounds | null>(null)

  if (metricData.length === 0) return null

  const displayData = useMemo(() => {
    // TODO set default brushfilter and remove this?
    if (!brushFilter) return aggregateMetrics(metricData)

    const {
      x0, x1
    } = brushFilter

    const filteredMetricData = metricData.filter((metric) => {
      const x = getDate(metric).getTime()
      return x > x0 && x < x1
    })

    return aggregateMetrics(filteredMetricData)
  }, [ metricData, brushFilter ])

  const onBrushChange = useCallback((domain: Bounds | null) => {
    setBrushFilter(domain)
  }, [])


  // scales
  const dateScale = useMemo(
    () => scaleTime<number>({
      domain: extent(displayData, getDate) as [Date, Date],
      range: [ 0, xMax ]
    }),
    [ xMax, displayData ]
  )
  const metricScale = useMemo(
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
    [ xBrushMax, metricData ]
  )
  const brushMetricScale = useMemo(
    () => scaleLinear({
      domain: [ 0, max(metricData, getMetricValue) || 0 ],
      nice: true,
      range: [ yBrushMax, 0 ]
    }),
    [ yBrushMax, metricData ]
  )

  const hasInitializedBrush = useRef(false)
  const initialBrushPosition = useMemo(
    () => {
      if (metricData.length === 0 || hasInitializedBrush.current) return undefined

      hasInitializedBrush.current = true
      const latestMetricDate = getDate(metricData[metricData.length - 1])
      const dayBeforeLatestMetricDate = new Date(latestMetricDate.getTime() - 1000 * 60 * 60 * 24)

      return ({
        end: { x: brushDateScale(latestMetricDate) },
        start: { x: brushDateScale(dayBeforeLatestMetricDate) }
      })
    }, []
  )


  return (
    <div
      style={{
        height: metricHeight,
        margin: surroundingMargin,
        width: adjustedMetricWidth
      }}>
      <svg
        display="block"
        width={adjustedMetricWidth} height={metricHeight}>
        <rect
          x={0} y={0} width={adjustedMetricWidth} height={adjustedMetricHeight} fill={`url(#${GRADIENT_ID})`} rx={14} />
        <AreaChart
          metricData={displayData}
          width={adjustedMetricWidth}
          yMax={yMax}
          xScale={dateScale}
          yScale={metricScale}
        />
        <AreaChart
          hideBottomAxis
          hideLeftAxis
          metricData={brushData}
          width={adjustedMetricWidth}
          yMax={yBrushMax}
          xScale={brushDateScale}
          yScale={brushMetricScale}
          margin={brushMargin}
          top={topChartHeight + topChartBottomMargin}
        >
          <Brush
            xScale={brushDateScale}
            yScale={brushMetricScale}
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
              height={yBrushMax}
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

export default MetricGraph
