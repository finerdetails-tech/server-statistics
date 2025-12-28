
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

const topChartBottomMargin = remToPx(4)
const surroundingMargin = remToPx(2)

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
  const adjustedMetricHeight = useMemo(() => metricHeight - (2 * surroundingMargin), [ metricHeight, surroundingMargin ])

  const xMax = useMemo(() => metricWidth - (2 * surroundingMargin), [ metricWidth, surroundingMargin ])
  const yMax = useMemo(() => 0.8 * adjustedMetricHeight - topChartBottomMargin, [ adjustedMetricHeight, topChartBottomMargin ])
  const yBrushMax = useMemo(() => adjustedMetricHeight - yMax - topChartBottomMargin, [ adjustedMetricHeight, yMax, topChartBottomMargin ])

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
      range: [ 0, xMax ]
    }),
    [ xMax, metricData ]
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
        height: adjustedMetricHeight,
        margin: surroundingMargin,
        width: xMax
      }}>
      <svg
        display="block"
        width={xMax} height={adjustedMetricHeight}>
        <rect
          x={0} y={0} width={xMax} height={adjustedMetricHeight} fill={`url(#${GRADIENT_ID})`} rx={14} />
        <AreaChart
          metricData={displayData}
          width={xMax}
          yMax={yMax}
          xScale={dateScale}
          yScale={metricScale}
          strokeColor={accentColor}
        />
        <AreaChart
          hideBottomAxis
          hideLeftAxis
          metricData={brushData}
          width={xMax}
          yMax={yBrushMax}
          xScale={brushDateScale}
          yScale={brushMetricScale}
          margin={brushMargin}
          top={yMax + topChartBottomMargin}
          strokeColor="#C3C3C3"
        >
          <CustomBrush
            xScale={brushDateScale}
            yScale={brushMetricScale}
            width={xMax}
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
