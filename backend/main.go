package main

import (
	"api/database"
	"api/router"
	"log/slog"
	"net/http"
	"os"
)

func main() {
	database, err := database.NewDatabase()
	if err != nil {
		slog.Error("Failed to initialize database:", "error", err)
		os.Exit(1)
	}
	go database.CleanupExpiredMetrics()
	router := router.NewRouter(database)
	slog.Error("Failed to start server", "error", http.ListenAndServe("0.0.0.0:8080", router.Mux))
	os.Exit(1)
}
