package tests

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/internal/domain"
	"github.com/xin2025/go-template/internal/ent"
	"github.com/xin2025/go-template/internal/handler"
	mongo_repo "github.com/xin2025/go-template/internal/repository/mongo"
	sql_repo "github.com/xin2025/go-template/internal/repository/sql"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)



func setupTestApp(t *testing.T, cfg *config.Config) (*gin.Engine, func()) {

	var store *domain.Store
	var cleanupFunc func()

	switch cfg.DBType {
	case "sql":

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()


		var client *ent.Client
		var err error
		for i := 0; i < 5; i++ {
			client, err = ent.Open(cfg.Database.Driver, cfg.Database.ConnectionString)
			if err == nil {

				if db, err := sql.Open(cfg.Database.Driver, cfg.Database.ConnectionString); err == nil {
					if err := db.PingContext(ctx); err == nil {
						db.Close()
						break
					}
					db.Close()
				}
			}
			time.Sleep(time.Second)
		}
		assert.NoError(t, err, "Failed to connect to database after multiple attempts")


		err = client.Schema.Create(context.Background())
		assert.NoError(t, err)

		userRepo := sql_repo.NewSQLUserRepository(client)
		store = &domain.Store{UserRepo: userRepo}

		cleanupFunc = func() {

			_, err := client.User.Delete().Exec(context.Background())
			assert.NoError(t, err)

		}

	case "mongo":

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()


		var client *mongo.Client
		var err error
		for i := 0; i < 5; i++ {
			client, err = mongo.Connect(ctx, options.Client().ApplyURI(cfg.Mongo.URI))
			if err == nil {

				if err := client.Ping(ctx, nil); err == nil {
					break
				}
			}
			time.Sleep(time.Second)
		}
		assert.NoError(t, err, "Failed to connect to MongoDB after multiple attempts")

		db := client.Database(cfg.Mongo.DatabaseName)
		userRepo := mongo_repo.NewMongoUserRepository(db)
		store = &domain.Store{UserRepo: userRepo}

		cleanupFunc = func() {

			err := db.Collection("users").Drop(context.Background())

			if err != nil && !mongo.IsNetworkError(err) && err.Error() != "ns not found" {
				assert.NoError(t, err)
			}

		}

	default:
		t.Fatalf("Unsupported DBType for testing: %s", cfg.DBType)
	}


	appHandler := handler.NewUserHandler(store, cfg)


	gin.SetMode(gin.TestMode)
	router := gin.New()
	appHandler.RegisterRoutes(router)

	return router, cleanupFunc
}


func isDBAvailable(driver, connStr string) bool {
	if os.Getenv("SKIP_DB_TESTS") != "" {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if driver == "mongo" {
		client, err := mongo.Connect(ctx, options.Client().ApplyURI(connStr))
		if err != nil {
			return false
		}
		defer client.Disconnect(ctx)
		return client.Ping(ctx, nil) == nil
	}


	sqldb, err := sql.Open(driver, connStr)
	if err != nil {
		return false
	}
	defer sqldb.Close()
	return sqldb.PingContext(ctx) == nil
}


func TestFullApplicationFlow(t *testing.T) {


	testCases := []struct {
		name   string
		config *config.Config
		skip   bool
	}{
		{
			name: "SQLite",
			config: &config.Config{
				DBType: "sql",
				Database: config.DatabaseConfig{
					Driver:           "sqlite3",
					ConnectionString: fmt.Sprintf("file:test_full_%d.db?mode=memory&cache=shared&_fk=1", time.Now().UnixNano()),
				},
				JWT: config.JWTConfig{Secret: "test-secret"},
			},
		},
		{
			name: "PostgreSQL",
			config: &config.Config{
				DBType: "sql",
				Database: config.DatabaseConfig{
					Driver:           "postgres",
					ConnectionString: "host=localhost port=5432 user=postgres password=postgres dbname=ent_test sslmode=disable",
				},
				JWT: config.JWTConfig{Secret: "test-secret"},
			},
			skip: !isDBAvailable("postgres", "host=localhost port=5432 user=postgres password=postgres dbname=ent_test sslmode=disable"),
		},
		{
			name: "MySQL",
			config: &config.Config{
				DBType: "sql",
				Database: config.DatabaseConfig{
					Driver:           "mysql",
					ConnectionString: "root:password@tcp(localhost:3306)/ent_test?parseTime=True",
				},
				JWT: config.JWTConfig{Secret: "test-secret"},
			},
			skip: !isDBAvailable("mysql", "root:password@tcp(localhost:3306)/ent_test?parseTime=True"),
		},
		{
			name: "MongoDB",
			config: &config.Config{
				DBType: "mongo",
				Mongo: config.MongoConfig{
					URI:          "mongodb://localhost:27017",
					DatabaseName: "go_template_test_db",
				},
				JWT: config.JWTConfig{Secret: "test-secret"},
			},
			skip: !isDBAvailable("mongo", "mongodb://localhost:27017"),
		},
	}


	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.skip {
				t.Skipf("Skipping %s test: Database not available or configured to skip.", tc.name)
			}


			router, cleanup := setupTestApp(t, tc.config)
			defer cleanup() 


			uniqueEmail := fmt.Sprintf("testuser_%d@example.com", time.Now().UnixNano())
			password := "strongpassword123"


			regBody := gin.H{
				"username": "testuser",
				"email":    uniqueEmail,
				"password": password,
			}
			regJSON, _ := json.Marshal(regBody)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/v1/users/register", bytes.NewBuffer(regJSON))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)


			t.Logf("Register Response: %s", w.Body.String())

			assert.Equal(t, http.StatusCreated, w.Code)
			var regResponse map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &regResponse)
			assert.NoError(t, err)
			

			data, ok := regResponse["data"].(map[string]interface{})
			assert.True(t, ok, "Response should have a 'data' field")
			if ok {
				assert.Equal(t, "testuser", data["username"])
				assert.Equal(t, uniqueEmail, data["email"])
				assert.NotEmpty(t, data["id"])
			}


			loginBody := gin.H{
				"email":    uniqueEmail,
				"password": password,
			}
			loginJSON, _ := json.Marshal(loginBody)

			w = httptest.NewRecorder()
			req, _ = http.NewRequest("POST", "/api/v1/users/login", bytes.NewBuffer(loginJSON))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)


			t.Logf("Login Response: %s", w.Body.String())

			assert.Equal(t, http.StatusOK, w.Code)
			var loginResponse map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &loginResponse)
			assert.NoError(t, err)
			

			tokenData, ok := loginResponse["data"].(map[string]interface{})
			assert.True(t, ok, "Response should have a 'data' field")
			if ok {
				assert.NotEmpty(t, tokenData["token"], "Token should not be empty on successful login")
			}


			w = httptest.NewRecorder()
			req, _ = http.NewRequest("POST", "/api/v1/users/register", bytes.NewBuffer(regJSON))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)


			assert.Equal(t, http.StatusConflict, w.Code, "Should fail to register a duplicate user")


			badLoginBody := gin.H{
				"email":    uniqueEmail,
				"password": "wrongpassword",
			}
			badLoginJSON, _ := json.Marshal(badLoginBody)

			w = httptest.NewRecorder()
			req, _ = http.NewRequest("POST", "/api/v1/users/login", bytes.NewBuffer(badLoginJSON))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusUnauthorized, w.Code, "Should fail to login with a bad password")
		})
	}
}
