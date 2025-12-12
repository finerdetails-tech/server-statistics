export type MetricNames =
    "throughput_received_kbps" |
    "throughput_transmitted_kbps" |
    "cpu_usage_percent" |
    "mem_available_kb" |
    "mem_usage_percent" |
    "cpu_temp_celsius" |
    "disk_used_kb" |
    "disk_used_percent";



export type Metric = {
    ID: number
    Name: MetricNames
    TimeStamp: number
    Value: string
}

export type MetricData = {
    TimeStamp: number;
    Value: number;
};