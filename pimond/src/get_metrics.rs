use crate::helpers::{current_unix_time, file_lines_by_key, file_lines_by_number};
use libc::statvfs;
use serde::Serialize;
use std::error::Error;
use std::ffi::CString;
use std::thread::sleep;
use std::time::Duration;

#[derive(Serialize, Debug)]
pub enum MetricValue {
    Float(f64),
    Int(u64),
}

#[derive(Serialize, Debug)]
pub struct Metric {
    pub name: String,
    pub value: MetricValue,
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
    let cpu_usage_percent_rounded = (cpu_usage_percent_raw * 10.0).round() / 10.0;
    let cpu_usage = Metric {
        name: "cpu_usage_percent".to_string(),
        value: MetricValue::Float(cpu_usage_percent_rounded),
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

    let mem_usage_percent_raw = ((1.0 - (mem_available_kb / mem_total_kb)) * 100.0) as f64;

    let mem_usage_percent_rounded = (mem_usage_percent_raw * 10.0).round() / 10.0;

    let mem_total = Metric {
        name: "mem_total_kb".to_string(),
        value: MetricValue::Int(mem_total_kb as u64),
        timestamp: current_unix_time(),
    };

    let mem_available_kb = Metric {
        name: "mem_available_kb".to_string(),
        value: MetricValue::Int(mem_available_kb as u64),
        timestamp: current_unix_time(),
    };
    let mem_usage_percent = Metric {
        name: "mem_usage_percent".to_string(),
        value: MetricValue::Float(mem_usage_percent_rounded),
        timestamp: current_unix_time(),
    };

    Ok(Vec::from([mem_total, mem_available_kb, mem_usage_percent]))
}

pub async fn get_temp_info() -> Result<Vec<Metric>, Box<dyn Error>> {
    let temp_line = file_lines_by_number("/sys/class/thermal/thermal_zone0/temp", &[0])?;
    let temp_field = temp_line[0].trim();
    let temp = temp_field.parse::<f64>()? / 1000.0;

    Ok(Vec::from([Metric {
        name: "cpu_temp_celsius".to_string(),
        value: MetricValue::Float(temp),
        timestamp: current_unix_time(),
    }]))
}

pub async fn get_disk_info() -> Result<Vec<Metric>, Box<dyn Error>> {
    // Creating an empty pointer to hold the stats
    let mut stats: libc::statvfs = unsafe { std::mem::zeroed() };
    // Creating a C-compatible string for the root path
    let c_path = CString::new("/")?;
    let res = unsafe { statvfs(c_path.as_ptr(), &mut stats) };

    if res != 0 {
        return Err("Failed to get filesystem statistics".into());
    }

    let disk_total_kb = stats.f_blocks * stats.f_frsize;
    let disk_free_kb = stats.f_bfree * stats.f_frsize;
    let disk_used_kb = disk_total_kb - disk_free_kb;
    let disk_used_percent_raw = (disk_used_kb / disk_total_kb) as f64 * 100.0;

    let disk_used_percent = (disk_used_percent_raw * 10.0).round() / 10.0;

    let disk_total_kb = Metric {
        name: "disk_total_kb".to_string(),
        value: MetricValue::Int(disk_total_kb),
        timestamp: current_unix_time(),
    };

    let disk_used_kb = Metric {
        name: "disk_used_kb".to_string(),
        value: MetricValue::Int(disk_used_kb),
        timestamp: current_unix_time(),
    };

    let disk_used_percent = Metric {
        name: "disk_used_percent".to_string(),
        value: MetricValue::Float(disk_used_percent),
        timestamp: current_unix_time(),
    };

    Ok(Vec::from([disk_total_kb, disk_used_kb, disk_used_percent]))
}
