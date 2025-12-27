
import type BaseBrush from '@visx/brush/lib/BaseBrush'
import type { Bounds } from '@visx/brush/lib/types'
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
import CustomBrush from './CustomBrush'

const brushMargin = {
  bottom: 15,
  left: 0,
  right: 0,
  top: 10
}

const GRADIENT_ID = 'brush_gradient'
export const accentColor = '#bbff00ff'


function MetricGraph ({
  metricHeight,
  metrics,
  metricWidth
}: {
  metricHeight: number
  metricWidth: number
  metrics: Metric[],
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
          strokeColor={accentColor}
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
          strokeColor="#C3C3C3"
        >
          <CustomBrush
            xScale={brushDateScale}
            yScale={brushMetricScale}
            width={xBrushMax}
            height={yBrushMax}
            margin={brushMargin}
            innerRef={brushRef}
            initialBrushPosition={initialBrushPosition}
            onChange={onBrushChange}
          />
        </AreaChart>
      </svg>
    </div>
  )
}

export default MetricGraph
