
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
const backgroundColor = '#1a1a1aff'

const topChartBottomMargin = remToPx(4)
const surroundingMargin = remToPx(2)
const surroundingPadding = remToPx(2)

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
  const adjustedMetricHeight = useMemo(() => metricHeight - (4 * surroundingMargin), [ metricHeight, surroundingMargin ])

  const xMax = useMemo(() => metricWidth - ((2 * surroundingMargin) + (2 * surroundingPadding)), [ metricWidth, surroundingMargin, surroundingPadding ])
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

  const containerWidth = useMemo(() => xMax + surroundingMargin * 2, [ xMax, surroundingMargin ])

  const patternLineWidth = 2
  const numTicks = useMemo(() => Math.floor(containerWidth / remToPx(4)), [ containerWidth ])

  const {
    backgroundSizeUnit,
    xOffset,
    yOffset
  } = useMemo(() => {
    const ticks = dateScale.ticks(numTicks)
    if (ticks.length < 2) return null

    const firstTickPos = dateScale(ticks[0]) || 0
    const secondTickPos = dateScale(ticks[1]) || 0
    const tickSpacing = Math.abs(secondTickPos - firstTickPos)


    const xOffset = firstTickPos + surroundingPadding
    const backgroundSizeUnit = tickSpacing / 4
    const yOffset = ((yMax + surroundingPadding) % backgroundSizeUnit) - (patternLineWidth / 2)
    return {
      backgroundSizeUnit,
      xOffset,
      yOffset
    }

  }, [ dateScale, numTicks ])


  return (
    <div
      style={{
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(${backgroundColor} ${patternLineWidth}px, transparent ${patternLineWidth}px), linear-gradient(to right, ${backgroundColor} ${patternLineWidth}px, transparent ${patternLineWidth}px)`,
        backgroundPosition: `${xOffset}px ${yOffset}px`,
        backgroundSize: `${backgroundSizeUnit}px ${backgroundSizeUnit}px`,
        height: adjustedMetricHeight + surroundingMargin * 2,
        margin: surroundingMargin,
        padding: surroundingPadding,
        width: containerWidth
      }}>
      <svg
        display="block"
        width={xMax} height={adjustedMetricHeight}>
        <rect
          x={0} y={0} width={xMax} height={adjustedMetricHeight} fill={`url(#${GRADIENT_ID})`} rx={14} />
        <AreaChart
          metricData={displayData}
          yMax={yMax}
          xScale={dateScale}
          yScale={metricScale}
          strokeColor={accentColor}
          numTicks={numTicks}
        />
        <AreaChart
          hideBottomAxis
          hideLeftAxis
          metricData={brushData}
          yMax={yBrushMax}
          xScale={brushDateScale}
          yScale={brushMetricScale}
          margin={brushMargin}
          top={yMax + topChartBottomMargin}
          strokeColor={accentColor}
          isAxesEnabled={false}
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
