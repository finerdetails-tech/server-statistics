package database

import (
	"database/sql"
	"fmt"
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

func NewDatabase() *Database {
	db, err := sql.Open("sqlite", "./server_statistics.db")
	if err != nil {
		panic("failed to connect database, " + err.Error())
	}

	db.Exec("CREATE TABLE IF NOT EXISTS metrics (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, time_stamp INTEGER, value TEXT)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_name_timestamp ON metrics(name, time_stamp)")

	return &Database{db}
}

func (database *Database) findMetricsBy(condition string) []Metric {
	var metrics []Metric
	queryString := fmt.Sprintf("SELECT * FROM metrics WHERE %s", condition)
	rows, error := database.Query(queryString)
	if error != nil {
		panic("failed to get metrics, " + error.Error())
	}
	defer rows.Close()

	for rows.Next() {
		var metric Metric
		if err := rows.Scan(&metric.ID, &metric.Name, &metric.TimeStamp, &metric.Value); err != nil {
			panic("failed to scan metric, " + err.Error())
		}
		metrics = append(metrics, metric)
	}

	return metrics
}

func (database *Database) GetAllMetrics() map[string][]Metric {
	condition := fmt.Sprintf("time_stamp > %d ORDER BY name ASC, time_stamp ASC", retainingTimeUnix())
	metrics := database.findMetricsBy(condition)

	grouped := make(map[string][]Metric)
	for _, metric := range metrics {
		grouped[metric.Name] = append(grouped[metric.Name], metric)
	}

	return grouped
}

func (database *Database) InsertMetric(newMetric Metric) Metric {
	_, err := database.Exec("INSERT INTO metrics (name, time_stamp, value) VALUES (?, ?, ?)", newMetric.Name, newMetric.TimeStamp, newMetric.Value)
	if err != nil {
		panic("failed to insert metric, " + err.Error())
	}

	return newMetric
}

func (database *Database) RemoveExpiredMetrics() {
	condition := fmt.Sprintf("time_stamp < %d", retainingTimeUnix())

	_, err := database.Exec(fmt.Sprintf("DELETE FROM metrics WHERE %s", condition))
	if err != nil {
		panic("failed to delete old metrics, " + err.Error())
	}
}

func (database *Database) CleanupExpiredMetrics() {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		database.RemoveExpiredMetrics()
	}
}
