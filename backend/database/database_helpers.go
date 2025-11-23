package database

import (
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var db, err = gorm.Open(sqlite.Open("./server_statistics.db"), &gorm.Config{})

type Metric struct {
	gorm.Model
	Name      string
	TimeStamp int64
	Value     string
}

func unixTimeMonthAgo() int64 {
	return time.Now().AddDate(0, -1, 0).Unix()
}

func GetMetrics() []Metric {
	var metrics []Metric
	if err != nil {
		panic("failed to connect database, " + err.Error())
	}
	if res := db.Where("timestamp > ?", unixTimeMonthAgo()).Find(&metrics); res.Error != nil {
		panic("failed to get metrics, " + res.Error.Error())
	}
	return metrics
}

func InsertMetric(m Metric) Metric {
	if err != nil {
		panic("failed to connect database, " + err.Error())
	}
	if res := db.Create(&m); res.Error != nil {
		panic("failed to insert metric, " + res.Error.Error())
	}

	return m
}

func InitDb() {
	db.AutoMigrate(&Metric{})
}
