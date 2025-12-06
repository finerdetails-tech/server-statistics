mod get_metrics;
mod helpers;
mod mocks;

use get_metrics::{
    Metric, get_cpu_info, get_disk_info, get_mem_info, get_network_info, get_temp_info,
};
use helpers::get_env_variable;
use mocks::mock_combine_metrics;
use tokio::time::Duration;

use std::error::Error;

async fn combine_metrics(is_first_iteration: bool) -> Result<Vec<Metric>, Box<dyn Error>> {
    let (cpu_info, mem_info, temp_info, disk_info, network_info) = tokio::try_join!(
        get_cpu_info(),
        get_mem_info(is_first_iteration),
        get_temp_info(),
        get_disk_info(is_first_iteration),
        get_network_info()
    )?;

    let mut combined_metrics = Vec::new();
    combined_metrics.extend(cpu_info);
    combined_metrics.extend(mem_info);
    combined_metrics.extend(temp_info);
    combined_metrics.extend(disk_info);
    combined_metrics.extend(network_info);

    Ok(combined_metrics)
}

async fn send_http_request(metrics: Vec<Metric>) -> Result<(), Box<dyn Error>> {
    let client = reqwest::Client::new();
    let backend_url = get_env_variable("BACKEND_URL")?;
    let res = client
        .post(&format!("{}/api/metrics", backend_url))
        .json(&metrics)
        .send()
        .await?;

    if !res.status().is_success() {
        Err(format!(
            "Failed to send metrics, response: {}",
            res.text().await?
        ))?
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let interval_seconds = get_env_variable("METRICS_SENDING_INTERVAL_SECONDS")
        .ok()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(30);

    let mut ticker = tokio::time::interval(Duration::from_secs(interval_seconds));

    let env = get_env_variable("ENV");
    let is_dev = match &env {
        Ok(val) if val == "dev" => true,
        _ => false,
    };
    let mut is_first_iteration = true;

    loop {
        ticker.tick().await;
        let metrics = if is_dev {
            mock_combine_metrics(is_first_iteration).await?
        } else {
            combine_metrics(is_first_iteration).await?
        };
        print!("Sending metrics: {:?}\n", metrics);
        send_http_request(metrics).await?;

        is_first_iteration = false;
    }
}
