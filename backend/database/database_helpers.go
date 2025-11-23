package database

import (
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

func InsertMetric(m Metric) Metric {
	if res := db.Create(&m); res.Error != nil {
		panic("failed to insert metric, " + res.Error.Error())
	}

	return m
}

func InitDb() {
	db.AutoMigrate(&Metric{})
}
