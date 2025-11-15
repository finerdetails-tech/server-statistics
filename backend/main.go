package main

import (
	"fmt"
	"log"
	"net/http"
)

func getMetrics(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "GET Metrics endpoint")
}

func postMetrics(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "POST Metrics endpoint")
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/metrics", getMetrics)
	mux.HandleFunc("POST /api/metrics", postMetrics)

	log.Fatal(http.ListenAndServe(":8080", mux))
}
