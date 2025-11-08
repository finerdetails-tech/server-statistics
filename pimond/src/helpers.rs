use dotenv;
use std::error::Error;
use std::fs::File;
use std::io::{BufRead, BufReader};

pub fn file_lines_by_number(
    path: &str,
    lines_to_read: &[usize],
) -> Result<Vec<String>, Box<dyn Error>> {
    let file = File::open(path).map_err(|e| format!("Failed to open file '{}': {}", path, e))?;
    let reader = BufReader::new(file);
    let mut result: Vec<String> = Vec::new();

    for (index, line) in reader.lines().enumerate() {
        if lines_to_read.contains(&index) {
            result.push(line?);
        }
    }

    Ok(result)
}

pub fn file_lines_by_key(path: &str, keys_to_read: &[&str]) -> Result<Vec<String>, Box<dyn Error>> {
    let file = File::open(path).map_err(|e| format!("Failed to open file '{}': {}", path, e))?;
    let reader = BufReader::new(file);
    let mut result: Vec<String> = Vec::new();

    fn does_line_start_with_key(line: &str, keys: &[&str]) -> bool {
        for key in keys {
            if line.starts_with(key) {
                return true;
            }
        }
        return false;
    }

    for line in reader.lines() {
        let line_content = line?;
        if does_line_start_with_key(&line_content, keys_to_read) {
            result.push(line_content);
        }
    }
    Ok(result)
}

pub fn current_unix_time() -> i64 {
    use chrono::prelude::*;
    let utc: DateTime<Utc> = Utc::now();
    utc.timestamp()
}

pub fn get_env_variable(key: &str) -> Result<String, std::env::VarError> {
    // Using OS environment variable in prod, fallback to .env file in dev
    match std::env::var(&key) {
        Ok(url) => Ok(url),
        Err(_) => {
            dotenv::dotenv().ok();
            std::env::var(&key)
        }
    }
}
