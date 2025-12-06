package main

import (
	"api/database"
	"api/router"
	"log"
	"net/http"
)

func main() {
	database := database.NewDatabase()
	go database.CleanupExpiredMetrics()
	router := router.NewRouter(database)
	log.Fatal(http.ListenAndServe("0.0.0.0:8080", router.Mux))
}
