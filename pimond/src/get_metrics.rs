use crate::helpers::{current_unix_time, file_lines_by_key, file_lines_by_number};
use serde::Serialize;
use std::error::Error;
use std::thread::sleep;
use std::time::Duration;

#[derive(Serialize, Debug)]
pub struct Metric {
    pub name: String,
    pub value: f64,
    pub timestamp: i64,
}

pub async fn get_cpu_info() -> Result<Vec<Metric>, Box<dyn Error>> {
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
        timestamp: current_unix_time(),
    };

    Ok(Vec::from([cpu_usage]))
}

pub async fn get_mem_info() -> Result<Vec<Metric>, Box<dyn Error>> {
    let mem_lines = file_lines_by_key("/proc/meminfo", &["MemTotal:", "MemAvailable:"])?;

    let mut mem_total_line = mem_lines[0].split_whitespace();
    let mut mem_available_line = mem_lines[1].split_whitespace();

    let mem_total_kb = mem_total_line
        .nth(1)
        .ok_or("Could not read value in mem_total_line")?
        .parse::<f64>()?;
    let mem_available_kb = mem_available_line
        .nth(1)
        .ok_or("Could not read value in mem_available_line")?
        .parse::<f64>()?;

    let mem_usage_percent_raw = (1.0 - (mem_available_kb / mem_total_kb)) * 100.0;
    let mem_usage_percent_rounded_value = (mem_usage_percent_raw * 10.0).round() / 10.0;

    let mem_total = Metric {
        name: "mem_total_kb".to_string(),
        value: mem_total_kb,
        timestamp: current_unix_time(),
    };

    let mem_available_kb = Metric {
        name: "mem_available_kb".to_string(),
        value: mem_available_kb,
        timestamp: current_unix_time(),
    };
    let mem_usage_percent = Metric {
        name: "mem_usage_percent".to_string(),
        value: mem_usage_percent_rounded_value,
        timestamp: current_unix_time(),
    };

    Ok(Vec::from([mem_total, mem_available_kb, mem_usage_percent]))
}

pub async fn get_temp_info() -> Result<Vec<Metric>, Box<dyn Error>> {
    let temp_line = file_lines_by_number("/sys/class/thermal/thermal_zone0/temp", &[0])?;
    let temp_field = temp_line[0].trim();
    let temp_value = temp_field.parse::<f64>()? / 1000.0;

    Ok(Vec::from([Metric {
        name: "cpu_temp_celsius".to_string(),
        value: temp_value,
        timestamp: current_unix_time(),
    }]))
}
