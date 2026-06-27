import type { Metric as MetricType } from 'types'
import { remToPx } from '../../utils'
import MetricGraph from './metric-components/MetricGraph'
import MetricHeader from './metric-components/MetricHeader'
import MetricText from './metric-components/MetricText'

export const accentColor = 'var(--color-accent)'

const surroundingPadding = remToPx(2)

function Metric ({
  isHeaderOnRight,
  isLiveUpdated,
  label,
  metricContainerHeight,
  metricContainerWidth,
  metrics
}: {
  metricContainerHeight: number
  metricContainerWidth: number
  metrics: MetricType[],
  label: string,
  isHeaderOnRight: boolean,
  isLiveUpdated: boolean
}) {

  if (metrics.length === 0) return null

  const metricContainerHeightMinusBottomPadding = metricContainerHeight - (surroundingPadding)

  const metricContainerWidthMinusRightPadding = metricContainerWidth - surroundingPadding

  const metricHeaderWidth = isHeaderOnRight
    ? metricContainerWidthMinusRightPadding * (1 / 4)
    : metricContainerWidth

  const metricHeaderHeight = isHeaderOnRight
    ? metricContainerHeightMinusBottomPadding
    : metricContainerHeight * (1 / 4)


  const headerPadding = isHeaderOnRight
    ? surroundingPadding
    : 0


  const MetricComponent = isLiveUpdated
    ? MetricGraph
    : MetricText

  return (
    <div
      class="metric-background"
      style={{
        alignItems: 'flex-start',
        display: 'flex',
        flexDirection: isHeaderOnRight
          ? 'row'
          : 'column',
        height: metricContainerHeight,
        mixBlendMode: 'difference',
        width: metricContainerWidth,
        zIndex: -2
      }}>
      <MetricHeader
        metricName={label}
        style={{
          alignItems: isHeaderOnRight
            ? 'flex-start'
            : 'center',
          backgroundColor: 'var(--color-minGlyph)',
          display: 'flex',
          fontSize: isHeaderOnRight
            ? metricHeaderWidth * 0.125
            : metricHeaderHeight * 0.25,
          height: metricHeaderHeight,
          justifyContent: isHeaderOnRight
            ? 'flex-start'
            : 'center',
          maxWidth: metricHeaderWidth,
          paddingLeft: headerPadding,
          paddingTop: headerPadding
            ? surroundingPadding
            : 0,
          width: metricHeaderWidth
        }}
      />
      <MetricComponent
        isHeaderOnRight={isHeaderOnRight} metrics={metrics} metricContainerHeight={metricContainerHeight} metricContainerWidth={metricContainerWidth} surroundingPadding={surroundingPadding} />
    </div>
  )
}

export default Metric
