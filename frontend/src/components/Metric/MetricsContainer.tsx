
import type { RefObject } from 'preact/compat'
import {
  useCallback, useEffect, useRef
} from 'preact/hooks'
import type {
  Metric, MetricNames
} from 'types'
import useMetricDimensions from '../../hooks/useMetricDimensions'
import useMetricsConfig from '../../hooks/useMetricsConfig'
import {removeUntilConditionIsNoLongerMet} from '../../utils'
import MetricGraph from './MetricGraph'

const METRICS_RETAINING_TIME_DAYS: number = Number(import.meta.env.VISIBLE_METRICS_RETAINING_TIME_DAYS) || 30

function MetricsContainer ({
  isLandscape, metricPadding, scrollContainerRef, setIsMetricsLoaded
}: {
  isLandscape: boolean
  setIsMetricsLoaded: (loaded: boolean) => void
  scrollContainerRef: RefObject<HTMLDivElement>
  metricPadding: number
}) {

  const { METRICS_CONFIG } = useMetricsConfig()
  const metricsContainerRef = useRef<HTMLDivElement>(null)
  const {
    metricHeight, metricsContainerRowCount, metricWidth
  } = useMetricDimensions(metricPadding, scrollContainerRef)


  const handleMetricUpdate = useCallback((event: MessageEvent) => {
    const newMetrics = JSON.parse(event.data) as { [key: string]: Metric[] }
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (METRICS_RETAINING_TIME_DAYS * 24 * 60 * 60)
    const metricNames = Object.keys(newMetrics) as MetricNames[]

    for (const metricName of metricNames) {
      METRICS_CONFIG[metricName].setValue((oldMetrics: Metric[]) => {
        const isNotLiveUpdated = !METRICS_CONFIG[metricName].isLiveUpdated
        if (isNotLiveUpdated) {
          return newMetrics[metricName]
        }
        // Removing old metrics beyond retaining time
        const cleanedOldMetrics = removeUntilConditionIsNoLongerMet(oldMetrics, (metric: Metric) => metric.TimeStamp < cutoffTimestamp)
        return [ ...cleanedOldMetrics, ...newMetrics[metricName] ]
      })
    }

    setIsMetricsLoaded(true)
  }, [ setIsMetricsLoaded ])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/api/metrics')

    ws.onmessage = handleMetricUpdate

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    return () => {
      ws.close()
    }
  }, [])

  const metricConfigList = Object.entries(METRICS_CONFIG)
  const landScapeColumns = Math.ceil(metricConfigList.length / metricsContainerRowCount)
  const gridLayout = isLandscape
    ? {
      gridTemplateColumns: `repeat(${landScapeColumns}, 1fr)`,
      gridTemplateRows: `repeat(${metricsContainerRowCount}, 1fr)`
    }
    : {
      gridTemplateColumns: '1fr',
      gridTemplateRows: `repeat(${metricConfigList.length}, 1fr)`
    }

  return (
    <div
      class="metrics-container"
      style={{
        display: 'grid',
        gap: metricPadding,
        padding: metricPadding,
        zIndex: 2,
        ...gridLayout
      }}
      ref={metricsContainerRef}>
      {metricConfigList.map(([ name, config ]) => (
        <MetricGraph
          key={name}
          label={config.label}
          metricHeight={metricHeight}
          metricWidth={metricWidth}
          metrics={config.value}

        />
      ))}
    </div>
  )
}

export default MetricsContainer