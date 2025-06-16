package tests

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"testing"
	"time"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"github.com/stretchr/testify/assert"
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/internal/ent"
	"github.com/xin2025/go-template/internal/ent/user"
	"github.com/xin2025/go-template/pkg/logger"
)

func getTestConfig() *config.Config {
	dbDriver := os.Getenv("DB_DRIVER")
	if dbDriver == "" {
		dbDriver = "postgres" 
	}
	dbConn := os.Getenv("DB_CONNECTION_STRING")
	if dbConn == "" {
		if dbDriver == "sqlite3" {
			dbConn = "file:ent_test?mode=memory&cache=shared&_fk=1"
		} else if dbDriver == "postgres" {
			dbConn = "host=localhost port=5432 user=postgres password=postgres dbname=ent_test sslmode=disable"
		} else if dbDriver == "mysql" {
			dbConn = "root:password@tcp(localhost:3306)/ent_test?parseTime=True"
		}
	}
	return &config.Config{
		Database: config.DatabaseConfig{
			Driver:           dbDriver,
			ConnectionString: dbConn,
			MaxOpenConns:     10,
			MaxIdleConns:     5,
			ConnMaxLifetime:  60,
		},
	}
}

func ensurePostgresDatabaseExists() {
	db, err := sql.Open("postgres", "host=localhost port=5432 user=postgres password=postgres dbname=postgres sslmode=disable")
	if err != nil {
		panic(fmt.Sprintf("failed to connect to postgres for db creation: %v", err))
	}
	defer db.Close()
	_, err = db.Exec("CREATE DATABASE ent_test;")
	if err != nil && !isDuplicateDatabaseError(err) {
		panic(fmt.Sprintf("failed to create ent_test database: %v", err))
	}
}

func isDuplicateDatabaseError(err error) bool {

	return err != nil && (err.Error() == "pq: database \"ent_test\" already exists" ||
		(err.Error() != "" && (len(err.Error()) > 0 && err.Error()[0:2] == "42")))
}

func isMySQLAvailable() bool {
	db, err := sql.Open("mysql", "root:password@tcp(localhost:3306)/ent_test?parseTime=True")
	if err != nil {
		return false
	}
	defer db.Close()
	err = db.Ping()
	return err == nil
}

func TestEntIntegration(t *testing.T) {
	cfg := getTestConfig()
	if cfg.Database.Driver == "postgres" {
		ensurePostgresDatabaseExists()
	}
	ctx := context.Background()

	drv, err := ent.Open(cfg.Database.Driver, cfg.Database.ConnectionString)
	assert.NoError(t, err)
	defer drv.Close()


	err = drv.Schema.Create(ctx)
	assert.NoError(t, err)


	now := time.Now()
	createdUser, err := drv.User.Create().
		SetUsername("testuser").
		SetEmail("test@example.com").
		SetPasswordHash("hash").
		SetCreatedAt(now).
		SetUpdatedAt(now).
		Save(ctx)
	logger.Info("Created user", logger.Any("user", createdUser))
	assert.NoError(t, err)
	assert.Equal(t, "testuser", createdUser.Username)

	user2, err := drv.User.Query().Where(user.UsernameEQ("testuser")).Only(ctx)
	logger.Info("Queried user", logger.Any("user", user2))
	assert.NoError(t, err)
	assert.Equal(t, createdUser.ID, user2.ID)


	updated, err := drv.User.UpdateOneID(createdUser.ID).SetEmail("new@example.com").Save(ctx)
	logger.Info("Updated user", logger.Any("user", updated))
	assert.NoError(t, err)
	assert.Equal(t, "new@example.com", updated.Email)


	err = drv.User.DeleteOneID(createdUser.ID).Exec(ctx)
	logger.Info("Deleted user", logger.Int("user_id", createdUser.ID))
	assert.NoError(t, err)


	count, err := drv.User.Query().Count(ctx)
	logger.Info("User count after delete", logger.Int("count", count))
	assert.NoError(t, err)
	assert.Equal(t, 0, count)
}

func TestEntAllDatabases(t *testing.T) {
	dbs := []struct {
		driver string
		conn   string
	}{
		{"sqlite3", "file:ent_test?mode=memory&cache=shared&_fk=1"},
		{"postgres", "host=localhost port=5432 user=postgres password=postgres dbname=ent_test sslmode=disable"},
		{"mysql", "root:password@tcp(localhost:3306)/ent_test?parseTime=True"},
	}

	for _, db := range dbs {
		if db.driver == "mysql" && !isMySQLAvailable() {
			t.Logf("Skipping MySQL test: MySQL server not available on localhost:3306")
			continue
		}
		t.Run(db.driver, func(t *testing.T) {
			os.Setenv("DB_DRIVER", db.driver)
			os.Setenv("DB_CONNECTION_STRING", db.conn)
			TestEntIntegration(t)
		})
	}
} 
