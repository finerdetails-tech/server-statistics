mod get_metrics;
mod helpers;

use get_metrics::{Metric, get_cpu_info, get_mem_info};

use http::StatusCode;
use std::error::Error;

fn combine_metrics() -> Result<Vec<Metric>, Box<dyn Error>> {
    let cpu_info = get_cpu_info()?;
    let mem_info = get_mem_info()?;

    let mut combined_metrics = Vec::new();
    combined_metrics.extend(cpu_info);
    combined_metrics.extend(mem_info);

    Ok(combined_metrics)
}

async fn send_http_request(metrics: Vec<Metric>) -> Result<StatusCode, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let res = client
        .post("http://127.0.0.1:8080/post")
        .json(&metrics)
        .send()
        .await?;

    Ok(res.status())
}

fn main() {
    let metrics = match combine_metrics() {
        Ok(m) => m,
        Err(e) => {
            eprintln!("Error collecting metrics: {}", e);
            return;
        }
    };
    send_http_request(metrics);
}
