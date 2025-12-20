
import { useScreenSize } from '@visx/responsive'
import {
  useCallback, useEffect, useMemo, useRef, useState
} from 'preact/hooks'
import type { Metric } from 'types'
import MetricGraph from './MetricGraph'
import { listCurrentAndParentElements } from './utils'

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

  const metricsRef = useRef({
    cpu_temp_celsius: [] as Metric[],
    cpu_usage_percent: [] as Metric[],
    disk_used_kb: [] as Metric[],
    disk_used_percent: [] as Metric[],
    disk_used_total: [] as Metric[],
    mem_available_kb: [] as Metric[],
    mem_total_kb: [] as Metric[],
    mem_usage_percent: [] as Metric[],
    throughput_received_kbps: [] as Metric[],
    throughput_transmitted_kbps: [] as Metric[]
  })
  const allMetrics = metricsRef.current


  const METRIC_CONFIGS = useMemo(() => ({
    cpu_temp_celsius: {
      label: "CPU Temperature",
      setValue: setFilteredCpuTemp,
      unit: "°C",
      value: filteredCpuTemp
    },
    cpu_usage_percent: {
      label: "CPU Usage",
      setValue: setFilteredCpuUsagePercent,
      unit: "%",
      value: filteredCpuUsagePercent
    },
    disk_used_kb: {
      label: "Disk Used",
      setValue: setFilteredDiskUsed,
      unit: "KB",
      value: filteredDiskUsed
    },
    disk_used_percent: {
      label: "Disk Usage",
      setValue: setFilteredDiskUsedPercent,
      unit: "%",
      value: filteredDiskUsedPercent
    },
    disk_used_total: {
      label: "Total Disk",
      setValue: setFilteredDiskTotal,
      unit: "KB",
      value: filteredDiskTotal
    },
    mem_available_kb: {
      label: "Memory Available",
      setValue: setFilteredMemAvailable,
      unit: "KB",
      value: filteredMemAvailable
    },
    mem_total_kb: {
      label: "Total Memory",
      setValue: setFilteredMemTotal,
      unit: "KB",
      value: filteredMemTotal
    },
    mem_usage_percent: {
      label: "Memory Usage",
      setValue: setFilteredMemUsage,
      unit: "%",
      value: filteredMemUsage
    },
    throughput_received_kbps: {
      label: "Throughput Received",
      setValue: setFilteredThroughputReceived,
      unit: "kbps",
      value: filteredThroughputReceived
    },
    throughput_transmitted_kbps: {
      label: "Throughput Transmitted",
      setValue: setFilteredThroughputTransmitted,
      unit: "kbps",
      value: filteredThroughputTransmitted
    }
  }), [ filteredCpuTemp, filteredCpuUsagePercent, filteredDiskUsed, filteredDiskUsedPercent, filteredDiskTotal, filteredMemAvailable, filteredMemTotal, filteredMemUsage, filteredThroughputReceived, filteredThroughputTransmitted ])

  const {
    height: viewportHeight, width: viewportWidth
  } = useScreenSize()

  const handleMetricUpdate = useCallback((event: MessageEvent) => {
    const newMetrics = JSON.parse(event.data)
    for (const newMetric of newMetrics) {
      allMetrics[newMetric.Name]?.push(newMetric)
    }

    Object.keys(METRIC_CONFIGS).forEach((metricName) => {
      METRIC_CONFIGS[metricName].setValue(allMetrics[metricName])
    })
  }, [ allMetrics, METRIC_CONFIGS ])

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
  }, [ handleMetricUpdate ])


  const metricsContainerRef = useRef<HTMLDivElement>(null)

  const {
    parentHeightStyling, parentWidthStyling
  } = useMemo(() => listCurrentAndParentElements(metricsContainerRef.current).reduce((acc, element) => {
    if (!element) return acc
    const heightProperties = [ 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth' ] as const
    const widthProperties = [ 'marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth' ] as const
    heightProperties.forEach((prop) => {
      const value = parseFloat(getComputedStyle(element)[prop]) || 0
      acc.parentHeightStyling += value
    })
    widthProperties.forEach((prop) => {
      const value = parseFloat(getComputedStyle(element)[prop]) || 0
      acc.parentWidthStyling += value
    })
    return acc
  }, {
    parentHeightStyling: 0,
    parentWidthStyling: 0
  }), [ metricsContainerRef.current ])

  const isLandscape = useMemo(() => {
    return viewportWidth > viewportHeight
  }, [ viewportWidth, viewportHeight ])

  const {
    metricHeight, metricWidth
  } = useMemo(() => {


    const metricWidth = Math.max(viewportWidth - parentWidthStyling, 100)

    const heightToWidthRatio = 2 / 3
    const availableHeight = viewportHeight - parentHeightStyling
    const targetHeight = metricWidth * heightToWidthRatio
    const fittingMetricsCount = Math.max(Math.floor(availableHeight / targetHeight), 1)
    const leftOverHeight = availableHeight % targetHeight
    const adjustedHeight = targetHeight + (leftOverHeight / (fittingMetricsCount))
    const metricHeight = adjustedHeight


    return {
      metricHeight,
      metricWidth
    }
  }, [ isLandscape, viewportHeight, viewportWidth ])


  return (
    <div
      ref={metricsContainerRef}
      style={{
        backgroundColor: '#222831',
        display: 'flex',
        flex: 1,
        flexDirection: isLandscape
          ? 'row'
          : 'column',
        width: '100%'
      }}>
      {Object.entries(METRIC_CONFIGS).map(([ name, config ]) => (
        <MetricGraph
          key={name}
          metricHeight={metricHeight}
          metricWidth={metricWidth}
          metrics={config.value}
          // label={config.label}
        />
      ))}
    </div>
  )
}

export default MetricsContainer