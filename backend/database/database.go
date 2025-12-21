package database

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type Metric struct {
	ID        uint `gorm:"primarykey"`
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
	orm *gorm.DB
}

func NewDatabase() *Database {
	var orm, err = gorm.Open(sqlite.Open("./server_statistics.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database, " + err.Error())
	}

	if err := orm.AutoMigrate(&Metric{}); err != nil {
		panic("failed to migrate database, " + err.Error())
	}

	orm.Exec("CREATE INDEX IF NOT EXISTS idx_name_timestamp ON metrics(name, time_stamp)")

	return &Database{
		orm: orm,
	}
}

func (database *Database) findMetricsBy(condition string) []Metric {
	var metrics []Metric
	if res := database.orm.Where(condition).Find(&metrics); res.Error != nil {
		panic("failed to get metrics, " + res.Error.Error())
	}
	return metrics
}

func (database *Database) GetAllMetrics() map[string][]Metric {
	condition := fmt.Sprintf("time_stamp > %d", retainingTimeUnix())
	var metrics []Metric

	database.orm.Where(condition).Order("name ASC, time_stamp ASC").Find(&metrics)

	grouped := make(map[string][]Metric)
	for _, metric := range metrics {
		grouped[metric.Name] = append(grouped[metric.Name], metric)
	}

	return grouped
}

func (database *Database) InsertMetric(newMetric Metric) Metric {
	if res := database.orm.Create(&newMetric); res.Error != nil {
		panic("failed to insert metric, " + res.Error.Error())
	}

	return newMetric
}

func (database *Database) RemoveExpiredMetrics() {
	condition := fmt.Sprintf("time_stamp < %d", retainingTimeUnix())
	expiredMetrics := database.findMetricsBy(condition)

	if res := database.orm.Delete(&expiredMetrics); res.Error != nil {
		panic("failed to delete old metrics, " + res.Error.Error())
	}
}

func (database *Database) CleanupExpiredMetrics() {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		database.RemoveExpiredMetrics()
	}
}
