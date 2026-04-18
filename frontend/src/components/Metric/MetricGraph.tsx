
import type BaseBrush from '@visx/brush/lib/BaseBrush'
import type { Bounds } from '@visx/brush/lib/types'
import {
  scaleLinear, scaleTime
} from '@visx/scale'
import {
  extent, max, min
} from '@visx/vendor/d3-array'
import {
  useMemo, useRef, useState
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
  const adjustedMetricHeight = metricHeight - (2 * surroundingPadding)

  const xMax = metricWidth - (2 * surroundingPadding)

  const chartLeftOffset = 2 * surroundingPadding
  const svgWidth = xMax - (surroundingPadding * 2)
  const innerXMax = svgWidth - chartLeftOffset
  const yMax = 0.8 * adjustedMetricHeight - topChartBottomMargin
  const yBrushMax = adjustedMetricHeight - yMax - topChartBottomMargin

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


  // scales
  const dateScale = useMemo(
    () => scaleTime<number>({
      domain: extent(displayData, getDate) as [Date, Date],
      range: [ 0, innerXMax ]
    }),
    [ innerXMax, displayData ]
  )
  const metricScale = useMemo(
    () => scaleLinear<number>({
      domain: [ min(displayData, getMetricValue) || 0, max(displayData, getMetricValue) || 0 ],
      nice: true,
      range: [ yMax, 0 ]
    }),
    [ yMax, displayData ]
  )
  const brushDateScale = useMemo(
    () => scaleTime<number>({
      domain: extent(metricData, getDate) as [Date, Date],
      range: [ 0, innerXMax ]
    }),
    [ innerXMax, metricData ]
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

  const containerWidth = xMax
  const containerHeight = yMax

  const patternLineWidth = 2
  const numTicksX = Math.floor(containerWidth / remToPx(4))

  const {
    backgroundSizeUnit,
    tickSpacing,
    xOffset,
    yOffset
  } = useMemo(() => {
    const ticks = dateScale.ticks(numTicksX)
    if (ticks.length < 2) return null

    const firstTickPos = dateScale(ticks[0]) || 0
    const secondTickPos = dateScale(ticks[1]) || 0
    const tickSpacing = Math.abs(secondTickPos - firstTickPos)


    const xOffset = firstTickPos + surroundingPadding
    const backgroundSizeUnit = tickSpacing / 4
    const yOffset = ((yMax + surroundingPadding) % backgroundSizeUnit) - (patternLineWidth / 2)
    return {
      backgroundSizeUnit,
      tickSpacing,
      xOffset,
      yOffset
    }

  }, [ dateScale, numTicksX ])

  const numTicksY = Math.floor(containerHeight / tickSpacing)


  return (
    <div
      style={{
        alignItems: 'center',
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(${backgroundColor} ${patternLineWidth}px, transparent ${patternLineWidth}px), linear-gradient(to right, ${backgroundColor} ${patternLineWidth}px, transparent ${patternLineWidth}px)`,
        backgroundPosition: `${xOffset}px ${yOffset}px`,
        backgroundSize: `${backgroundSizeUnit}px ${backgroundSizeUnit}px`,
        display: 'flex',
        height: adjustedMetricHeight + (2 * surroundingPadding),
        justifyContent: 'left',
        justifySelf: 'center',
        width: containerWidth
      }}>
      <svg
        display="block"
        width={xMax - (surroundingPadding * 2)} height={adjustedMetricHeight}>
        <rect
          x={0} y={0} width={xMax - (surroundingPadding * 2)} height={adjustedMetricHeight - (surroundingPadding * 2)} fill={`url(#${GRADIENT_ID})`} rx={14} />
        <AreaChart
          metricData={displayData}
          xScale={dateScale}
          yScale={metricScale}
          strokeColor={accentColor}
          left={2 * surroundingPadding} top={surroundingPadding}
          numTicksX={numTicksX}
          numTicksY={numTicksY}
        />
        <AreaChart
          hideBottomAxis
          hideLeftAxis
          metricData={brushData}
          xScale={brushDateScale}
          yScale={brushMetricScale}
          margin={brushMargin}
          top={yMax + topChartBottomMargin}
          left={2 * surroundingPadding}
          strokeColor={accentColor}
          isAxesEnabled={false}
        >
          <CustomBrush
            xScale={brushDateScale}
            yScale={brushMetricScale}
            width={innerXMax}
            height={yBrushMax}
            margin={brushMargin}
            innerRef={brushRef}
            initialBrushPosition={initialBrushPosition}
            onChange={setBrushFilter}
          />
        </AreaChart>
      </svg>
    </div>
  )
}

export default MetricGraph
