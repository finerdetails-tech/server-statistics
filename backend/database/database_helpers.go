package database

import (
	"database/sql"
	"fmt"

	_ "github.com/glebarez/go-sqlite"
)

func createTable(db *sql.DB) (sql.Result, error) {
	sql := `CREATE TABLE IF NOT EXISTS metrics (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			timestamp DATETIME,
			name TEXT,
			value TEXT
		);`
	return db.Exec(sql)
}

type Metric struct {
	Name      string
	TimeStamp int64
	Value     string
}

func InsertMetric(m Metric) (int64, error) {
	db, err := sql.Open("sqlite", "./my.db")

	if err != nil {
		fmt.Println("Error connecting to database:", err)
		return 0, err
	}

	defer db.Close()

	sql := `INSERT INTO metrics (name, timestamp, value) 
            VALUES (?, ?, ?);`
	result, err := db.Exec(sql, m.Name, m.TimeStamp, m.Value)

	if err != nil {
		fmt.Println("Error inserting metric to database:", err)
		return 0, err
	}

	return result.LastInsertId()
}

func InitDb() {
	db, err := sql.Open("sqlite", "./my.db")

	if err != nil {
		fmt.Println(err)
		return
	}

	defer db.Close()
	fmt.Println("Connected to the SQLite database successfully.")

	var sqliteVersion string
	err = db.QueryRow("select sqlite_version()").Scan(&sqliteVersion)

	if err != nil {
		fmt.Println("Error querying SQLite version:", err)
		return
	}

	fmt.Println("SQLite version:", sqliteVersion)

	_, err = createTable(db)
	if err != nil {
		fmt.Println("Error creating table:", err)
		return
	}
}
