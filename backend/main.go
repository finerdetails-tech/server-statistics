package main

import (
	"api/database"
	"api/router"
	"time"
)

func cleanupExpiredMetrics() {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		database.RemoveExpiredMetrics()
	}
}

func main() {
	database.InitDb()
	go cleanupExpiredMetrics()
	router.InitRouter()
}
