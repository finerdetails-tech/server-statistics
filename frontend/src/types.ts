export type MetricNames =
  "throughput_received_mbps" |
  "throughput_transmitted_mbps" |
  "cpu_usage_percent" |
  "mem_available_mb" |
  "mem_usage_percent" |
  "cpu_temp_celsius" |
  "disk_used_mb" |
  "disk_used_percent" |
  "disk_total_mb" |
  "mem_total_mb"

export type Metric = {
  ID: number
  Name: MetricNames
  TimeStamp: number
  Value: string
}

export type MetricData = {
  TimeStamp: number
  Value: number
}

export type ScrollPercent = {
  verticalPercent: number,
  horizontalPercent: number
}