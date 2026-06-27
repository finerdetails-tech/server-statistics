use crate::get_metrics::Metric;
use crate::helpers::current_unix_time;
use rand::Rng;
use std::error::Error;
use std::vec;

fn get_random_integer(min: u64, max: u64) -> u64 {
    let mut rng = rand::rng();
    return rng.random_range(min..max);
}

fn mock_cpu_metrics() -> Result<Vec<Metric>, Box<dyn Error>> {
    Ok(Vec::from([Metric {
        name: "cpu_usage_percent".to_string(),
        value: get_random_integer(10, 90).to_string(),
        timestamp: current_unix_time(),
    }]))
}

fn mock_mem_metrics(is_first_iteration: bool) -> Result<Vec<Metric>, Box<dyn Error>> {
    let mut metrics = vec![
        Metric {
            name: "mem_available_mb".to_string(),
            value: get_random_integer(4096, 8192).to_string(),
            timestamp: current_unix_time(),
        },
        Metric {
            name: "mem_usage_percent".to_string(),
            value: get_random_integer(10, 90).to_string(),
            timestamp: current_unix_time(),
        },
    ];

    if is_first_iteration {
        metrics.push(Metric {
            name: "mem_total_mb".to_string(),
            value: 8192.to_string(),
            timestamp: current_unix_time(),
        });
    }
    Ok(metrics)
}

fn mock_temp_metrics() -> Result<Vec<Metric>, Box<dyn Error>> {
    Ok(Vec::from([Metric {
        name: "cpu_temp_celsius".to_string(),
        value: get_random_integer(30, 80).to_string(),
        timestamp: current_unix_time(),
    }]))
}

fn mock_disk_metrics(is_first_iteration: bool) -> Result<Vec<Metric>, Box<dyn Error>> {
    let mut metrics = vec![
        Metric {
            name: "disk_used_mb".to_string(),
            value: get_random_integer(128000, 256000).to_string(),
            timestamp: current_unix_time(),
        },
        Metric {
            name: "disk_used_percent".to_string(),
            value: get_random_integer(10, 90).to_string(),
            timestamp: current_unix_time(),
        },
    ];

    if is_first_iteration {
        metrics.push(Metric {
            name: "disk_total_mb".to_string(),
            value: 256000.to_string(),
            timestamp: current_unix_time(),
        });
    }
    Ok(metrics)
}

fn mock_network_metrics() -> Result<Vec<Metric>, Box<dyn Error>> {
    Ok(Vec::from([
        Metric {
            name: "throughput_received_mbps".to_string(),
            value: get_random_integer(1, 10).to_string(),
            timestamp: current_unix_time(),
        },
        Metric {
            name: "throughput_transmitted_mbps".to_string(),
            value: get_random_integer(1, 10).to_string(),
            timestamp: current_unix_time(),
        },
    ]))
}

pub async fn mock_combine_metrics(is_first_iteration: bool) -> Result<Vec<Metric>, Box<dyn Error>> {
    let mock_cpu_metrics = mock_cpu_metrics();
    let mock_mem_metrics = mock_mem_metrics(is_first_iteration);
    let mock_temp_metrics = mock_temp_metrics();
    let mock_disk_metrics = mock_disk_metrics(is_first_iteration);
    let mock_network_metrics = mock_network_metrics();
    let mut combined_mock_metrics: Vec<Metric> = vec![];
    combined_mock_metrics.extend(mock_cpu_metrics?);
    combined_mock_metrics.extend(mock_mem_metrics?);
    combined_mock_metrics.extend(mock_temp_metrics?);
    combined_mock_metrics.extend(mock_disk_metrics?);
    combined_mock_metrics.extend(mock_network_metrics?);

    return Ok(combined_mock_metrics);
}
