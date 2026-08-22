package websocket

import (
	"api/database"
	"log/slog"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/websocket"
)

type Channel = chan map[string][]database.Metric

type Manager struct {
	clients  Clients
	database *database.Database
	sync.RWMutex
}

func NewManager(database *database.Database) *Manager {
	return &Manager{
		clients:  make(Clients),
		database: database,
	}
}

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  0,
	WriteBufferSize: 524288,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		frontendURI := os.Getenv("FRONTEND_URI")
		frontendURL := "https://" + frontendURI
		return origin == frontendURL
	},
}

func (manager *Manager) serveWebsocket(w http.ResponseWriter, r *http.Request) {
	slog.Info("Initializing new WebSocket connection")
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade WebSocket connection", "error", err)
		return
	}
	wsClient := manager.addClient(conn)
	go wsClient.sendAllMetrics()
	go wsClient.listenChannel()
}

func (manager *Manager) addClient(conn *websocket.Conn) *Client {
	manager.Lock()
	defer manager.Unlock()
	wsClient := newClient(conn, manager)
	manager.clients[wsClient] = true
	return wsClient

}

// Removes a client from the manager's client list
func (manager *Manager) removeClient(c *Client) {
	manager.Lock()
	defer manager.Unlock()
	delete(manager.clients, c)
}

func (manager *Manager) BroadcastMetrics(metrics map[string][]database.Metric) {
	manager.RLock()
	defer manager.RUnlock()
	for client := range manager.clients {
		client.channel <- metrics
	}
}

func (manager *Manager) Connect(w http.ResponseWriter, r *http.Request) {
	manager.serveWebsocket(w, r)

}
