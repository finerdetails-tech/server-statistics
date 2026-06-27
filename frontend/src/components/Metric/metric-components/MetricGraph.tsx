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
  Metric as Metric, MetricData
} from 'types'
import {
  aggregateMetrics, getDate, getMetricValue
} from '../../../utils'
import AreaChart from '../metric-components/AreaChart'
import CustomBrush, { PATTERN_ID } from '../metric-components/CustomBrush'

const brushMargin = {
  bottom: 15,
  left: 0,
  right: 0,
  top: 10
}

const GRADIENT_ID = 'brush_gradient'

const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7

export const accentColor = 'var(--color-accent)'

/*
 * visx Brush expands the reported domain by 2px (SAFE_PIXEL) on each edge when
 * converting the selection's pixel extent into domain values. We reverse that
 * here so the hatch underlay lines up exactly with the brush selection outline.
 */
const BRUSH_SAFE_PIXEL = 2

function MetricGraph ({
  isHeaderOnRight,
  metricContainerHeight,
  metricContainerWidth,
  metrics,
  surroundingPadding
}: {
  metricContainerHeight: number
  metricContainerWidth: number
  metrics: Metric[],
  isHeaderOnRight: boolean
  surroundingPadding: number
}) {

  const metricData: MetricData[] = useMemo(() => metrics.map(({
    TimeStamp, Value
  }) => ({
    TimeStamp,
    Value: parseFloat(Value)
  })), [ metrics ])

  const brushData = useMemo(() => aggregateMetrics(metricData), [ metricData ])
  const metricContainerHeightMinusBottomPadding = metricContainerHeight - (surroundingPadding)

  const metricContainerWidthMinusRightPadding = metricContainerWidth - surroundingPadding
  const metricGraphContainerWidth = isHeaderOnRight
    ? metricContainerWidthMinusRightPadding * (3 / 4)
    : metricContainerWidth
  const graphWidth = metricGraphContainerWidth - (surroundingPadding * 3)

  const metricHeight = isHeaderOnRight
    ? metricContainerHeightMinusBottomPadding
    : metricContainerHeight * (3 / 4)

  const brushHeight = (metricHeight * 1 / 8)
  const brushGraphGap = (surroundingPadding * 2)
  const graphHeight = (metricHeight * 7 / 8) - brushGraphGap


  const brushRef = useRef<BaseBrush | null>(null)


  const defaultBrushFilter = useMemo(() => {
    const latestMetricDateUnix = getDate(metricData[metricData.length - 1]).getTime()
    const dayBeforeLatestMetricDateUnix = latestMetricDateUnix - WEEK_IN_MS
    return ({
      x0: dayBeforeLatestMetricDateUnix,
      x1: latestMetricDateUnix,
      y0: 0,
      y1: max(metricData, getMetricValue) || 0
    })
  },
  [ metricData ])

  const [ brushFilter, setBrushFilter ] = useState<Bounds>(defaultBrushFilter)


  const displayData = useMemo(() => {
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

  const initialBrushPosition = useMemo(
    () => {
      const latestMetricDate = new Date(defaultBrushFilter.x0)
      const dayBeforeLatestMetricDate = new Date(defaultBrushFilter.x1)

      return ({
        end: { x: brushDateScale(latestMetricDate) },
        start: { x: brushDateScale(dayBeforeLatestMetricDate) }
      })
    }, []
  )

  /*
   * Pixel extent of the current brush selection, used to paint the hatch
   * pattern behind the overview line via the AreaChart `underlay` prop.
   */
  const brushSelectionExtent = useMemo(() => ({
    x0: brushDateScale(new Date(brushFilter.x0)) + BRUSH_SAFE_PIXEL,
    x1: brushDateScale(new Date(brushFilter.x1)) - BRUSH_SAFE_PIXEL
  }), [ brushDateScale, brushFilter ])

  return (
    <div
      style={{
        display: 'flex',
        height: metricContainerHeightMinusBottomPadding,
        paddingBottom: surroundingPadding,
        position: "relative",
        width: metricGraphContainerWidth
      }}>
      <svg
        display="block"
        width={'100%'} height={metricHeight}>
        <rect
          x={0} y={0} width={graphWidth} height={metricHeight} fill={`url(#${GRADIENT_ID})`} rx={14} />
        <AreaChart
          top={1.5 * surroundingPadding}
          metricData={displayData}
          xScale={dateScale}
          yScale={metricScale}
          strokeColor={accentColor}
          left={2 * surroundingPadding}
          underlay={(
            <rect
              x={0}
              y={0}
              width={graphWidth}
              height={graphHeight}
              fill={`url(#${PATTERN_ID})`}
            />
          )}
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
          underlay={brushSelectionExtent && (
            <rect
              x={brushSelectionExtent.x0}
              y={0}
              width={Math.max(0, brushSelectionExtent.x1 - brushSelectionExtent.x0)}
              height={brushHeight}
              fill={`url(#${PATTERN_ID})`}
            />
          )}
        >

          <CustomBrush
            isHeaderOnRight={isHeaderOnRight}
            xScale={brushDateScale}
            yScale={brushMetricScale}
            width={graphWidth}
            height={brushHeight}
            margin={brushMargin}
            innerRef={brushRef}
            initialBrushPosition={initialBrushPosition}
            onChange={(domain) => {
              if (!domain) return
              setBrushFilter(domain)
            }}
          />
        </AreaChart>
      </svg>
    </div>
  )
}

export default MetricGraph