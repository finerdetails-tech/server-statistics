package router

import (
	"api/database"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

func getAllMetrics(w http.ResponseWriter, r *http.Request) {
	metrics := database.GetAllMetrics()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func postMetrics(w http.ResponseWriter, r *http.Request) {

	body, err := io.ReadAll(r.Body)

	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	type RawMetric struct {
		Name      string `json:"name"`
		Timestamp int64  `json:"timestamp"`
		Value     string `json:"value"`
	}

	var metrics []RawMetric
	err = json.Unmarshal(body, &metrics)

	if err != nil {
		http.Error(w, "Failed to parse request body", http.StatusBadRequest)
		return
	}

	for _, metric := range metrics {

		convertedMetric := database.Metric{
			Name:      metric.Name,
			TimeStamp: metric.Timestamp,
			Value:     metric.Value,
		}

		returnedMetric := database.InsertMetric(convertedMetric)

		fmt.Printf("Inserted Metric: %+v\n", returnedMetric)
	}

	w.WriteHeader(http.StatusOK)

}

func InitRouter() {

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/metrics", getAllMetrics)
	mux.HandleFunc("POST /api/metrics", postMetrics)

	log.Fatal(http.ListenAndServe(":8080", mux))
}
