
import {
    useMemo, useState
} from 'preact/hooks'
import type { Metric } from 'types'

function useMetricsConfig() {
    const [filteredThroughputReceived, setFilteredThroughputReceived] = useState<Metric[]>([])
    const [filteredThroughputTransmitted, setFilteredThroughputTransmitted] = useState<Metric[]>([])
    const [filteredCpuUsagePercent, setFilteredCpuUsagePercent] = useState<Metric[]>([])
    const [filteredMemAvailable, setFilteredMemAvailable] = useState<Metric[]>([])
    const [filteredMemTotal, setFilteredMemTotal] = useState<Metric[]>([])
    const [filteredMemUsage, setFilteredMemUsage] = useState<Metric[]>([])
    const [filteredCpuTemp, setFilteredCpuTemp] = useState<Metric[]>([])
    const [filteredDiskUsed, setFilteredDiskUsed] = useState<Metric[]>([])
    const [filteredDiskTotal, setFilteredDiskTotal] = useState<Metric[]>([])
    const [filteredDiskUsedPercent, setFilteredDiskUsedPercent] = useState<Metric[]>([])


    const METRICS_CONFIG = useMemo(() => ({
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
    }), [filteredCpuTemp, filteredCpuUsagePercent, filteredDiskUsed, filteredDiskUsedPercent, filteredDiskTotal, filteredMemAvailable, filteredMemTotal, filteredMemUsage, filteredThroughputReceived, filteredThroughputTransmitted])

    const metricsConfigList = Object.entries(METRICS_CONFIG)

    return { METRICS_CONFIG, metricsConfigList }
}

export default useMetricsConfig
