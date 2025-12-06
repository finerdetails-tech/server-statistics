package websocket

import (
	"api/database"
	"log"

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
	metrics := client.manager.database.GetAllMetrics()
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
	log.Println("WebSocket client removed")
}

func (client *Client) write(metrics []database.Metric) {
	err := client.conn.WriteJSON(metrics)
	if err != nil {
		log.Println("Error writing to WebSocket:", err)
		client.destroyClient()
		return
	}
}
