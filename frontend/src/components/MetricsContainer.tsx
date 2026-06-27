
import type { RefObject } from 'preact/compat'
import {
  useCallback, useEffect, useRef
} from 'preact/hooks'
import type {
  Metric as MetricType, MetricNames
} from 'types'
import useMetricDimensions from '../hooks/useMetricDimensions'
import useMetricsConfig from '../hooks/useMetricsConfig'
import { removeUntilConditionIsNoLongerMet } from '../utils'
import Metric from './Metric'

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
    metricContainerHeight, metricContainerWidth, metricsContainerRowCount
  } = useMetricDimensions(metricPadding, scrollContainerRef)


  const handleMetricUpdate = useCallback((event: MessageEvent) => {
    const newMetrics = JSON.parse(event.data) as { [key: string]: MetricType[] }
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (METRICS_RETAINING_TIME_DAYS * 24 * 60 * 60)
    const metricNames = Object.keys(newMetrics) as MetricNames[]

    for (const metricName of metricNames) {
      METRICS_CONFIG[metricName].setValue((oldMetrics: MetricType[]) => {
        const isNotLiveUpdated = !METRICS_CONFIG[metricName].isLiveUpdated
        if (isNotLiveUpdated) {
          return newMetrics[metricName]
        }
        // Removing old metrics beyond retaining time
        const cleanedOldMetrics = removeUntilConditionIsNoLongerMet(oldMetrics, (metric: MetricType) => metric.TimeStamp < cutoffTimestamp)
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
        <Metric
          isHeaderOnRight={isLandscape}
          key={name}
          label={config.label}
          metricContainerHeight={metricContainerHeight}
          metricContainerWidth={metricContainerWidth}
          metrics={config.value}
        />
      ))}
    </div>
  )
}

export default MetricsContainer