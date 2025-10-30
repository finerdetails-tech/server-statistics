mod get_metrics;
mod helpers;

use get_metrics::{get_cpu_info, get_mem_info};

use std::error::Error;

fn generate_json() -> Result<String, Box<dyn Error>> {
    let cpu_info = get_cpu_info()?;
    let mem_info = get_mem_info()?;

    let mut all_metrics = Vec::new();
    all_metrics.extend(cpu_info);
    all_metrics.extend(mem_info);

    let json = serde_json::to_string(&all_metrics)?;

    Ok(json)
}

fn main() {
    match generate_json() {
        Ok(json) => println!("{}", json),
        Err(e) => eprintln!("Error generating JSON: {}", e),
    }
}
