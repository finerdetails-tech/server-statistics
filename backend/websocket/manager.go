package websocket

import (
	"api/database"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Channel = chan []database.Metric

type Manager struct {
	clients Clients
	sync.RWMutex
}

func newManager() *Manager {
	return &Manager{
		clients: make(Clients),
	}
}

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func (manager *Manager) serveWs(w http.ResponseWriter, r *http.Request) {
	log.Println("Initializing new WebSocket connection")
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	wsClient := manager.addClient(conn)
	wsClient.sendAllMetrics()
	go wsClient.listenChannel()
	conn.Close()
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

func (manager *Manager) BroadcastMetrics(metrics []database.Metric) {
	for client := range manager.clients {
		client.write(metrics)
	}
}

func Connect(w http.ResponseWriter, r *http.Request) {
	wsManager := newManager()
	wsManager.serveWs(w, r)

}
