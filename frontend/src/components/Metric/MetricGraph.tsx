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
import MetricHeader from './MetricHeader'

const brushMargin = {
  bottom: 15,
  left: 0,
  right: 0,
  top: 10
}

const GRADIENT_ID = 'brush_gradient'
export const accentColor = 'var(--color-accent)'

const surroundingPadding = remToPx(2)

function MetricGraph ({
  label,
  metricHeight,
  metrics,
  metricWidth
}: {
  metricHeight: number
  metricWidth: number
  metrics: Metric[],
  label: string
}) {


  const metricData: MetricData[] = useMemo(() => metrics.map(({
    TimeStamp, Value
  }) => ({
    TimeStamp,
    Value: parseFloat(Value)
  })), [ metrics ])

  const brushData = useMemo(() => aggregateMetrics(metricData), [ metricData ])
  const metricHeightMinusBottomPadding = metricHeight - (surroundingPadding)


  const metricWidthMinusRightPadding = metricWidth - surroundingPadding
  const metricDataWidth = metricWidthMinusRightPadding * (3 / 4)
  const graphWidth = metricDataWidth - (surroundingPadding * 3)

  const metricHeaderWidth = metricWidthMinusRightPadding * (1 / 4)
  const brushHeight = (metricHeightMinusBottomPadding * 1 / 8)
  const brushGraphGap = (surroundingPadding * 2)
  const graphHeight = (metricHeightMinusBottomPadding * 7 / 8) - brushGraphGap


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
      range: [ 0, graphWidth ]
    }),
    [ graphWidth, displayData ]
  )
  const metricScale = useMemo(
    () => scaleLinear<number>({
      domain: [ min(displayData, getMetricValue) || 0, max(displayData, getMetricValue) || 0 ],
      nice: true,
      range: [ graphHeight, 0 ]
    }),
    [ graphHeight, displayData ]
  )
  const brushDateScale = useMemo(
    () => scaleTime<number>({
      domain: extent(metricData, getDate) as [Date, Date],
      range: [ 0, graphWidth ]
    }),
    [ graphWidth, metricData ]
  )
  const brushMetricScale = useMemo(
    () => scaleLinear({
      domain: [ 0, max(metricData, getMetricValue) || 0 ],
      nice: true,
      range: [ brushHeight, 0 ]
    }),
    [ brushHeight, metricData ]
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
      class="metric-background"
      style={{
        alignItems: 'flex-start',
        display: 'flex',
        flexDirection: 'row',
        height: metricHeightMinusBottomPadding,
        mixBlendMode: 'difference',
        paddingBottom: surroundingPadding,
        width: metricWidth,
        zIndex: -2
      }}>
      <MetricHeader
        metricName={label}
        style={{
          backgroundColor: 'var(--color-minGlyph)',
          display: 'flex',
          height: metricHeightMinusBottomPadding,
          maxWidth: metricHeaderWidth,
          paddingLeft: surroundingPadding,
          paddingTop: surroundingPadding,
          width: metricHeaderWidth
        }}
      />
      <div
        style={{
          display: 'flex',
          height: metricHeightMinusBottomPadding,
          position: "relative",
          width: metricDataWidth
        }}>
        <svg
          display="block"
          width={'100%'} height={metricHeightMinusBottomPadding}>
          <rect
            x={0} y={0} width={graphWidth} height={metricHeightMinusBottomPadding} fill={`url(#${GRADIENT_ID})`} rx={14} />
          <AreaChart
            top={1.5 * surroundingPadding}
            metricData={displayData}
            xScale={dateScale}
            yScale={metricScale}
            strokeColor={accentColor}
            left={2 * surroundingPadding}
          />
          <AreaChart
            top={graphHeight + brushGraphGap}
            hideBottomAxis
            hideLeftAxis
            metricData={brushData}
            xScale={brushDateScale}
            yScale={brushMetricScale}
            margin={brushMargin}
            left={2 * surroundingPadding}
            strokeColor={accentColor}
            isAxesEnabled={false}
          >
            <CustomBrush
              xScale={brushDateScale}
              yScale={brushMetricScale}
              width={graphWidth}
              height={brushHeight}
              margin={brushMargin}
              innerRef={brushRef}
              initialBrushPosition={initialBrushPosition}
              onChange={setBrushFilter}
            />
          </AreaChart>
        </svg>
      </div>
    </div>
  )
}

export default MetricGraph
