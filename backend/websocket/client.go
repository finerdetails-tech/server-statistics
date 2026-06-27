package websocket

import (
	"api/database"
	"log/slog"

	"github.com/gorilla/websocket"
)

type Client struct {
	manager *Manager
	conn    *websocket.Conn
	channel Channel
}

type Clients = map[*Client]bool

func newClient(conn *websocket.Conn, manager *Manager) *Client {
	return &Client{
		manager: manager,
		conn:    conn,
		channel: make(Channel),
	}
}

func (client *Client) sendAllMetrics() {
	metrics, err := client.manager.database.GetAllMetrics()
	if err != nil {
		slog.Warn("Error getting all metrics:", "error", err)
		return
	}
	client.write(metrics)
}

func (client *Client) listenChannel() {
	for metrics := range client.channel {
		client.write(metrics)
	}
}

// Cleans up the client by removing it from the manager and closing the connection
func (client *Client) destroyClient() {
	client.manager.removeClient(client)
	close(client.channel)
	client.conn.Close()
	slog.Info("WebSocket client removed")
}

func (client *Client) write(metrics map[string][]database.Metric) {
	err := client.conn.WriteJSON(metrics)
	if err != nil {
		slog.Warn("Error writing to WebSocket:", "error", err)
		client.destroyClient()
		return
	}
}
