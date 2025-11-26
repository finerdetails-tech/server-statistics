package database

import (
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

func GetAllMetrics() []Metric {
	var metrics []Metric
	// Filtering metrics to only ones from within a month
	if res := db.Where("time_stamp > ?", unixTimeMonthAgo()).Find(&metrics); res.Error != nil {
		panic("failed to get metrics, " + res.Error.Error())
	}
	return metrics
}

func InsertMetric(m Metric) Metric {
	if res := db.Create(&m); res.Error != nil {
		panic("failed to insert metric, " + res.Error.Error())
	}

	return m
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
