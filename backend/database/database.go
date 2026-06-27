package database

import (
	"database/sql"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"time"

	_ "modernc.org/sqlite"
)

type Metric struct {
	ID        uint
	Name      string
	TimeStamp int64
	Value     string
}

func retainingTimeUnix() int64 {
	retainingTimeStr := os.Getenv("VISIBLE_METRICS_RETAINING_TIME_DAYS")
	retainingTime, err := strconv.Atoi(retainingTimeStr)
	if err != nil {
		retainingTime = 30
	}
	return time.Now().AddDate(0, 0, -retainingTime).Unix()
}

type Database struct {
	*sql.DB
}

func NewDatabase() (*Database, error) {
	db, err := sql.Open("sqlite", "./server_statistics.db")
	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %w", err)
	}

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS metrics (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, time_stamp INTEGER, value TEXT)")
	if err != nil {
		return nil, fmt.Errorf("failed to create metrics table: %w", err)
	}

	_, err = db.Exec("CREATE INDEX IF NOT EXISTS idx_name_timestamp ON metrics(name, time_stamp)")
	if err != nil {
		return nil, fmt.Errorf("failed to create index: %w", err)
	}

	return &Database{db}, nil
}

func (database *Database) findMetricsBy(condition string) ([]Metric, error) {
	var metrics []Metric
	queryString := fmt.Sprintf("SELECT * FROM metrics WHERE %s", condition)
	rows, err := database.Query(queryString)
	if err != nil {
		return []Metric{}, fmt.Errorf("failed to query metrics: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var metric Metric
		if err := rows.Scan(&metric.ID, &metric.Name, &metric.TimeStamp, &metric.Value); err != nil {
			return []Metric{}, fmt.Errorf("failed to scan metric: %w", err)
		} else {
			metrics = append(metrics, metric)
		}
	}

	return metrics, nil
}

func (database *Database) GetAllMetrics() (map[string][]Metric, error) {
	condition := fmt.Sprintf("time_stamp > %d ORDER BY name ASC, time_stamp ASC", retainingTimeUnix())
	metrics, err := database.findMetricsBy(condition)
	if err != nil {
		return nil, err
	}

	grouped := make(map[string][]Metric)
	for _, metric := range metrics {
		grouped[metric.Name] = append(grouped[metric.Name], metric)
	}

	return grouped, nil
}

func (database *Database) InsertMetric(newMetric Metric) (Metric, error) {
	_, err := database.Exec("INSERT INTO metrics (name, time_stamp, value) VALUES (?, ?, ?)", newMetric.Name, newMetric.TimeStamp, newMetric.Value)
	if err != nil {
		return Metric{}, fmt.Errorf("failed to insert metric: %w", err)
	}

	return newMetric, nil
}

func (database *Database) RemoveExpiredMetrics() {
	condition := fmt.Sprintf("time_stamp < %d", retainingTimeUnix())

	_, err := database.Exec(fmt.Sprintf("DELETE FROM metrics WHERE %s", condition))
	if err != nil {
		slog.Error("Failed to delete old metrics", "error", err)
	}
}

func (database *Database) CleanupExpiredMetrics() {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		database.RemoveExpiredMetrics()
	}
}
