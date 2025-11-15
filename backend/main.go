package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/glebarez/go-sqlite"
)

func getMetrics(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(os.Stdout, "GET Metrics endpoint called")
}

func postMetrics(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(os.Stdout, "POST Metrics endpoint called")
}

func createTable(db *sql.DB) (sql.Result, error) {
	sql := `CREATE TABLE IF NOT EXISTS metrics (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			timestamp DATETIME,
			metric TEXT,
			value REAL
		);`
	return db.Exec(sql)
}

func initDb() {
	db, err := sql.Open("sqlite", "./my.db")

	if err != nil {
		fmt.Println(err)
		return
	}

	createTable(db)

	defer db.Close()
	fmt.Println("Connected to the SQLite database successfully.")

	var sqliteVersion string
	err = db.QueryRow("select sqlite_version()").Scan(&sqliteVersion)
	_, err = createTable(db)
	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println(sqliteVersion)
}

func main() {
	initDb()
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/metrics", getMetrics)
	mux.HandleFunc("POST /api/metrics", postMetrics)

	log.Fatal(http.ListenAndServe(":8080", mux))
}
