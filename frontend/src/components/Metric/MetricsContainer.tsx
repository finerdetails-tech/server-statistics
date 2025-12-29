
import {
  useCallback, useEffect, useMemo, useState
} from 'preact/hooks'
import type { Metric } from 'types'
import useContainerDimensions from '../../hooks/useContainerDimensions'
import useHorizontalScrolling from '../../hooks/useHorizontalScrolling'
import useScrollSaving from '../../hooks/useScrollSaving'
import {removeUntilConditionIsNoLongerMet} from '../../utils'
import GroupWrapper from './GroupWrapper'
import MetricGraph from './MetricGraph'

const METRICS_RETAINING_TIME_DAYS: number = Number(import.meta.env.VISIBLE_METRICS_RETAINING_TIME_DAYS) || 30

function MetricsContainer () {
  const [ filteredThroughputReceived, setFilteredThroughputReceived ] = useState<Metric[]>([])
  const [ filteredThroughputTransmitted, setFilteredThroughputTransmitted ] = useState<Metric[]>([])
  const [ filteredCpuUsagePercent, setFilteredCpuUsagePercent ] = useState<Metric[]>([])
  const [ filteredMemAvailable, setFilteredMemAvailable ] = useState<Metric[]>([])
  const [ filteredMemTotal, setFilteredMemTotal ] = useState<Metric[]>([])
  const [ filteredMemUsage, setFilteredMemUsage ] = useState<Metric[]>([])
  const [ filteredCpuTemp, setFilteredCpuTemp ] = useState<Metric[]>([])
  const [ filteredDiskUsed, setFilteredDiskUsed ] = useState<Metric[]>([])
  const [ filteredDiskTotal, setFilteredDiskTotal ] = useState<Metric[]>([])
  const [ filteredDiskUsedPercent, setFilteredDiskUsedPercent ] = useState<Metric[]>([])

  const rowCount = 2

  const {
    isLandscape, metricHeight, metricsContainerRef, metricWidth
  } = useContainerDimensions(rowCount)

  useHorizontalScrolling(isLandscape, metricsContainerRef)
  useScrollSaving(metricsContainerRef)

  const METRIC_CONFIGS = useMemo(() => ({
    cpu_temp_celsius: {
      isLiveUpdated: true, // whether or not webhooks update data after init or not
      label: "CPU Temperature",
      setValue: setFilteredCpuTemp,
      unit: "°C",
      value: filteredCpuTemp
    },
    cpu_usage_percent: {
      isLiveUpdated: true,
      label: "CPU Usage",
      setValue: setFilteredCpuUsagePercent,
      unit: "%",
      value: filteredCpuUsagePercent
    },
    disk_total_kb: {
      isLiveUpdated: false,
      label: "Total Disk",
      setValue: setFilteredDiskTotal,
      unit: "KB",
      value: filteredDiskTotal
    },
    disk_used_kb: {
      isLiveUpdated: true,
      label: "Disk Used",
      setValue: setFilteredDiskUsed,
      unit: "KB",
      value: filteredDiskUsed
    },
    disk_used_percent: {
      isLiveUpdated: true,
      label: "Disk Usage",
      setValue: setFilteredDiskUsedPercent,
      unit: "%",
      value: filteredDiskUsedPercent
    },
    mem_available_kb: {
      isLiveUpdated: true,
      label: "Memory Available",
      setValue: setFilteredMemAvailable,
      unit: "KB",
      value: filteredMemAvailable
    },
    mem_total_kb: {
      isLiveUpdated: true,
      label: "Total Memory",
      setValue: setFilteredMemTotal,
      unit: "KB",
      value: filteredMemTotal
    },
    mem_usage_percent: {
      isLiveUpdated: true,
      label: "Memory Usage",
      setValue: setFilteredMemUsage,
      unit: "%",
      value: filteredMemUsage
    },
    throughput_received_kbps: {
      isLiveUpdated: true,
      label: "Throughput Received",
      setValue: setFilteredThroughputReceived,
      unit: "kbps",
      value: filteredThroughputReceived
    },
    throughput_transmitted_kbps: {
      isLiveUpdated: true,
      label: "Throughput Transmitted",
      setValue: setFilteredThroughputTransmitted,
      unit: "kbps",
      value: filteredThroughputTransmitted
    }
  }), [ filteredCpuTemp, filteredCpuUsagePercent, filteredDiskUsed, filteredDiskUsedPercent, filteredDiskTotal, filteredMemAvailable, filteredMemTotal, filteredMemUsage, filteredThroughputReceived, filteredThroughputTransmitted ])


  const handleMetricUpdate = useCallback((event: MessageEvent) => {
    const newMetrics = JSON.parse(event.data) as { [key: string]: Metric[] }
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (METRICS_RETAINING_TIME_DAYS * 24 * 60 * 60)
    const metricNames = Object.keys(newMetrics)

    for (const metricName of metricNames) {
      METRIC_CONFIGS[metricName].setValue((oldMetrics: Metric[]) => {
        const isNotLiveUpdated = !METRIC_CONFIGS[metricName].isLiveUpdated
        if (isNotLiveUpdated) {
          return newMetrics[metricName]
        }
        // Removing old metrics beyond retaining time
        const cleanedOldMetrics = removeUntilConditionIsNoLongerMet(oldMetrics, (metric: Metric) => metric.TimeStamp < cutoffTimestamp)
        return [ ...cleanedOldMetrics, ...newMetrics[metricName] ]
      })
    }
  }, [])

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


  return (
    <div
      class="metrics-container"
      ref={metricsContainerRef}
      style={{
        backgroundColor: '#0A0A0C',
        display: 'flex',
        flexDirection: isLandscape
          ? 'row'
          : 'column',
        flexGrow: 1,
        flexWrap: 'nowrap',
        overflow: 'auto'
      }}>
      <GroupWrapper
        isLandscape={isLandscape} rowCount={rowCount}>
        {Object.entries(METRIC_CONFIGS).map(([ name, config ]) => (
          <MetricGraph
            key={name}
            metricHeight={metricHeight}
            metricWidth={metricWidth}
            metrics={config.value}
          />
        ))}
      </GroupWrapper>
    </div>
  )
}

export default MetricsContainer