use crate::helpers::{file_lines_by_key, file_lines_by_number};
use serde::Serialize;
use std::error::Error;
use std::thread::sleep;
use std::time::Duration;

#[derive(Serialize)]
pub struct Metric {
    name: String,
    value: f64,
    unit: String,
}

pub fn get_cpu_info() -> Result<Vec<Metric>, Box<dyn Error>> {
    fn measure_cpu_stats() -> Result<[f64; 2], Box<dyn Error>> {
        /* eg. "cpu  2790135 3862 707001 250717019 54271 0 18160 0 0 0" */
        let cpu_line = file_lines_by_number("/proc/stat", &[0])?;

        let mut cpu_fields = cpu_line[0].split_whitespace();

        cpu_fields.next(); // skipping "cpu" label

        let cpu_numbers: Vec<f64> = cpu_fields.filter_map(|s| s.parse::<f64>().ok()).collect();

        let total: f64 = cpu_numbers.iter().sum();
        let idle = cpu_numbers[3];
        let iowait = cpu_numbers[4];
        let inactive = idle + iowait;

        Ok([total, inactive])
    }
    let [total_1, inactive_1] = measure_cpu_stats()?;

    sleep(Duration::from_secs(1));

    let [cpu_total_2, cpu_inactive_2] = measure_cpu_stats()?;

    let total_delta = cpu_total_2 - total_1;
    let inactive_delta = cpu_inactive_2 - inactive_1;

    let cpu_usage_percent_raw = (1.00 - (inactive_delta / total_delta)) * 100.0;
    let cpu_usage_percent_rounded_value = (cpu_usage_percent_raw * 10.0).round() / 10.0;
    let cpu_usage = Metric {
        name: "cpu_usage_percent".to_string(),
        value: cpu_usage_percent_rounded_value,
        unit: "%".to_string(),
    };

    Ok(Vec::from([cpu_usage]))
}

pub fn get_mem_info() -> Result<Vec<Metric>, Box<dyn Error>> {
    let mem_lines = file_lines_by_key("/proc/meminfo", &["MemTotal:", "MemAvailable:"])?;

    let mut mem_total_line = mem_lines[0].split_whitespace();
    let mut mem_available_line = mem_lines[1].split_whitespace();

    let mem_total_raw = mem_total_line
        .nth(1)
        .ok_or("Could not read value in mem_total_line")?
        .parse::<f64>()?;
    let mem_available_raw = mem_available_line
        .nth(1)
        .ok_or("Could not read value in mem_available_line")?
        .parse::<f64>()?;

    let mem_total_mb_value = mem_total_raw / 1000.0;
    let mem_available_mb_value = mem_available_raw / 1000.0;
    let mem_usage_percent_raw = (1.0 - (mem_available_mb_value / mem_total_mb_value)) * 100.0;
    let mem_usage_percent_rounded_value = (mem_usage_percent_raw * 10.0).round() / 10.0;

    let mem_total = Metric {
        name: "mem_total_mb".to_string(),
        value: mem_total_mb_value,
        unit: "MB".to_string(),
    };

    let mem_available_mb = Metric {
        name: "mem_available_mb".to_string(),
        value: mem_available_mb_value,
        unit: "MB".to_string(),
    };
    let mem_usage_percent = Metric {
        name: "mem_usage_percent".to_string(),
        value: mem_usage_percent_rounded_value,
        unit: "%".to_string(),
    };

    Ok(Vec::from([mem_total, mem_available_mb, mem_usage_percent]))
}
