import type { Metric } from 'types'

function MetricText ({
  isHeaderOnRight,
  metricContainerHeight,
  metricContainerWidth,
  metrics
}: {
  metricContainerHeight: number
  metricContainerWidth: number
  metrics: Metric[],
  isHeaderOnRight: boolean
}) {
  const fontSize = isHeaderOnRight
    ? metricContainerWidth * 0.125
    : metricContainerHeight * 0.125

  const metricTextStyle = {
    alignItems: 'center',
    color: 'var(--color-accent)',
    fontFamily: 'GoogleSansCode, monospace',
    fontSize,
    margin: 0,
    maxWidth: '100%',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre-wrap'
  }

  const value = metrics[metrics.length - 1]?.Value

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        width: '100%'
      }}>
      <h2
        style={metricTextStyle}>{value}
      </h2>
    </div>
  )
}

export default MetricText