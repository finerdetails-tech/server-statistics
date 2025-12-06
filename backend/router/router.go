package router

import (
	"api/database"
	"api/websocket"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Router struct {
	database  *database.Database
	wsManager *websocket.Manager
	Mux       *http.ServeMux
}

func (router *Router) ping(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, "pong")
}

func (router *Router) postMetrics(w http.ResponseWriter, r *http.Request) {
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

	var rawMetrics []RawMetric
	err = json.Unmarshal(body, &rawMetrics)

	if err != nil {
		http.Error(w, "Failed to parse request body", http.StatusBadRequest)
		return
	}

	for _, rawMetric := range rawMetrics {

		convertedMetric := database.Metric{
			Name:      rawMetric.Name,
			TimeStamp: rawMetric.Timestamp,
			Value:     rawMetric.Value,
		}

		metric := router.database.InsertMetric(convertedMetric)

		router.wsManager.BroadcastMetrics([]database.Metric{metric})
		fmt.Printf("Inserted Metric: %+v\n", metric)
	}
	w.WriteHeader(http.StatusOK)

}

func NewRouter(database *database.Database) *Router {

	wsManager := websocket.NewManager(database)

	mux := http.NewServeMux()
	router := &Router{
		database:  database,
		wsManager: wsManager,
		Mux:       mux,
	}

	mux.HandleFunc("GET /api/metrics", wsManager.Connect)
	mux.HandleFunc("POST /api/metrics", router.postMetrics)
	mux.HandleFunc("GET /api/ping", router.ping)

	return router
}
