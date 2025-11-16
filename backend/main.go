package main

import (
	"api/database"
	"api/router"
)

func main() {
	database.InitDb()
	router.InitRouter()
}
