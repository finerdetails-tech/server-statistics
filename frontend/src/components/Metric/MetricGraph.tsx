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

  const chartLeftOffset = 2 * surroundingPadding
  const svgWidth = metricWidth - (surroundingPadding * 2)
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

  const containerHeight = yMax

  const patternLineWidth = 2

  const {
    backgroundSizeX,
    backgroundSizeY,
    xOffset,
    yOffset
  } = useMemo(() => {
    const xTicks = dateScale.ticks()
    const yTicks = metricScale.ticks()

    const firstXTickPos = dateScale(xTicks[0]) || 0
    const secondXTickPos = dateScale(xTicks[1]) || 0
    const backgroundSizeX = Math.abs(secondXTickPos - firstXTickPos)
    const xOffset = firstXTickPos + chartLeftOffset - (patternLineWidth / 2)

    const firstYTickPos = metricScale(yTicks[0]) || 0
    const secondYTickPos = metricScale(yTicks[1]) || 0
    const backgroundSizeY = Math.abs(secondYTickPos - firstYTickPos)
    const yOffset = firstYTickPos + chartLeftOffset - (patternLineWidth / 2)

    return {
      backgroundSizeX,
      backgroundSizeY,
      xOffset,
      yOffset
    }

  }, [ dateScale, metricScale, containerHeight ])

  const widthToHeightRatio = Math.round(metricWidth / containerHeight)


  return (
    <div
      style={{
        alignItems: 'center',
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(${backgroundColor} ${patternLineWidth}px, transparent ${patternLineWidth}px), linear-gradient(to right, ${backgroundColor} ${patternLineWidth}px, transparent ${patternLineWidth}px)`,
        backgroundPosition: `${xOffset}px ${yOffset}px`,
        backgroundSize: `${(backgroundSizeX / widthToHeightRatio) * 0.5}px ${backgroundSizeY * 0.5}px`,
        borderRadius: 14,
        display: 'flex',
        height: adjustedMetricHeight + (2 * surroundingPadding),
        justifySelf: 'center',
        maskComposite: 'intersect',
        maskImage: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
        overflow: 'hidden',
        WebkitMaskComposite: 'destination-in',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
        width: metricWidth
      }}>
      <svg
        display="block"
        width={metricWidth} height={adjustedMetricHeight}>
        <rect
          x={0} y={0} width={metricWidth} height={adjustedMetricHeight - (surroundingPadding * 2)} fill={`url(#${GRADIENT_ID})`} rx={14} />
        <AreaChart
          metricData={displayData}
          xScale={dateScale}
          yScale={metricScale}
          strokeColor={accentColor}
          left={2 * surroundingPadding} top={surroundingPadding}
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
