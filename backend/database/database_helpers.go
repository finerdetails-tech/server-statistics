package database

import (
	"fmt"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

type Metric struct {
	ID        uint `gorm:"primarykey"`
	Name      string
	TimeStamp int64
	Value     string
}

func unixTimeMonthAgo() int64 {
	return time.Now().AddDate(0, -1, 0).Unix()
}

func findMetricsBy(condition string) []Metric {
	var metrics []Metric
	if res := db.Where(condition).Find(&metrics); res.Error != nil {
		panic("failed to get metrics, " + res.Error.Error())
	}
	return metrics
}

func GetAllMetrics() []Metric {
	condition := fmt.Sprintf("time_stamp > %d", unixTimeMonthAgo())
	return findMetricsBy(condition)
}

func InsertMetric(newMetric Metric) Metric {
	if res := db.Create(&newMetric); res.Error != nil {
		panic("failed to insert metric, " + res.Error.Error())
	}

	return newMetric
}

func RemoveExpiredMetrics() {
	condition := fmt.Sprintf("time_stamp < %d", unixTimeMonthAgo())
	expiredMetrics := findMetricsBy(condition)

	if res := db.Delete(&expiredMetrics); res.Error != nil {
		panic("failed to delete old metrics, " + res.Error.Error())
	}
}

func InitDb() {
	var err error
	db, err = gorm.Open(sqlite.Open("./server_statistics.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database, " + err.Error())
	}

	if err := db.AutoMigrate(&Metric{}); err != nil {
		panic("failed to migrate database, " + err.Error())
	}
}
