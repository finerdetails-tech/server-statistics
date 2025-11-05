mod get_metrics;
mod helpers;

use get_metrics::{Metric, get_cpu_info, get_mem_info};
use helpers::get_env_variable;
use tokio::time::Duration;

use std::error::Error;

async fn combine_metrics() -> Result<Vec<Metric>, Box<dyn Error>> {
    let (cpu_info, mem_info) = tokio::try_join!(get_cpu_info(), get_mem_info())?;

    let mut combined_metrics = Vec::new();
    combined_metrics.extend(cpu_info);
    combined_metrics.extend(mem_info);

    Ok(combined_metrics)
}

async fn send_http_request(metrics: Vec<Metric>) -> Result<(), Box<dyn Error>> {
    let client = reqwest::Client::new();
    let url = get_env_variable("SERVER_URL")?;
    let res = client.post(&url).json(&metrics).send().await?;

    if !res.status().is_success() {
        Err(format!("Failed to send metrics, status: {}", res.status()))?
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let interval_seconds = get_env_variable("METRICS_INTERVAL_SECONDS")
        .ok()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(30);

    let mut ticker = tokio::time::interval(Duration::from_secs(interval_seconds));
    loop {
        ticker.tick().await;
        let metrics = combine_metrics().await?;
        send_http_request(metrics).await?;
    }
}
