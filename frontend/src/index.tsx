
import { render } from 'preact'
import {
  useMemo, useState
} from 'preact/hooks'
import type { Metric } from 'types'
import MetricGraph from './components/Graph/MetricGraph'

export function App () {

  const [ throughputReceived, setThroughputReceived ] = useState<Metric[]>([])
  const [ throughputTransmitted, setThroughputTransmitted ] = useState<Metric[]>([])
  const [ cpuUsagePercent, setCpuUsagePercent ] = useState<Metric[]>([])
  const [ memAvailable, setMemAvailable ] = useState<Metric[]>([])
  const [ memUsage, setMemUsage ] = useState<Metric[]>([])
  const [ cpuTemp, setCpuTemp ] = useState<Metric[]>([])
  const [ diskUsed, setDiskUsed ] = useState<Metric[]>([])
  const [ diskUsedPercent, setDiskUsedPercent ] = useState<Metric[]>([])

  const handleMetricUpdate = (newMetric: Metric) => {
    switch (newMetric.Name) {
      case "throughput_received_kbps":
        setThroughputReceived((oldMetrics) => [ ...oldMetrics, newMetric ])
        break
      case "throughput_transmitted_kbps":
        setThroughputTransmitted((oldMetrics) => [ ...oldMetrics, newMetric ])
        break
      case "cpu_usage_percent":
        setCpuUsagePercent((oldMetrics) => [ ...oldMetrics, newMetric ])
        break
      case "mem_available_kb":
        setMemAvailable((oldMetrics) => [ ...oldMetrics, newMetric ])
        break
      case "mem_usage_percent":
        setMemUsage((oldMetrics) => [ ...oldMetrics, newMetric ])
        break
      case "cpu_temp_celsius":
        setCpuTemp((oldMetrics) => [ ...oldMetrics, newMetric ])
        break
      case "disk_used_kb":
        setDiskUsed((oldMetrics) => [ ...oldMetrics, newMetric ])
        break
      case "disk_used_percent":
        setDiskUsedPercent((oldMetrics) => [ ...oldMetrics, newMetric ])
        break
    }
  }

  const websocket = useMemo(() => new WebSocket('ws://localhost:8080/api/metrics'), [])
  websocket.onmessage = (event) => {
    const newMetrics = JSON.parse(event.data)
    for (const metric of newMetrics) {
      handleMetricUpdate(metric)
    }
  }

  return (
    <div>
      <MetricGraph
        metrics={throughputReceived} />
      <MetricGraph
        metrics={throughputTransmitted} />
      <MetricGraph
        metrics={cpuUsagePercent} />
      <MetricGraph
        metrics={memAvailable} />
      <MetricGraph
        metrics={memUsage} />
      <MetricGraph
        metrics={cpuTemp} />
      <MetricGraph
        metrics={diskUsed} />
      <MetricGraph
        metrics={diskUsedPercent} />
    </div>
  )
}


render(
  <App />, document.getElementById('app'))
