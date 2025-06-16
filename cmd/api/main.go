package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/internal/handler"
	"github.com/xin2025/go-template/internal/middleware"
	"github.com/xin2025/go-template/internal/repository"
	mongo_repo "github.com/xin2025/go-template/internal/repository/mongo"
	sql_repo "github.com/xin2025/go-template/internal/repository/sql"
	"github.com/xin2025/go-template/internal/service"
	"github.com/xin2025/go-template/pkg/logger"

	"entgo.io/ent/dialect/sql"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"github.com/xin2025/go-template/internal/ent"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		panic(fmt.Sprintf("Failed to load configuration: %v", err))
	}

	// Initialize logger
	err = logger.Init(cfg.Environment,
		logger.WithLevel(cfg.LogLevel),
		logger.WithEncoding(cfg.Logger.Encoding),
		logger.WithOutputPaths(cfg.Logger.OutputPaths),
		logger.WithDevelopment(cfg.Environment == "debug"),
	)
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err))
	}
	defer logger.Sync()

	// Set Gin mode
	gin.SetMode(cfg.Environment)

	// Initialize Store based on DBType
	store, err := setupStore(cfg)
	if err != nil {
		logger.Fatal("Failed to setup data store", logger.ErrorField(err))
	}

	// Initialize service with dependencies
	srv := service.NewService(store, cfg)
	h := handler.NewHandler(srv)

	// Set up Gin router
	router := gin.New()

	// Apply middleware
	router.Use(middleware.CreateLoggingMiddleware(cfg.GetLoggingMiddlewareConfig()))
	router.Use(middleware.CreateRecoveryMiddleware(cfg.GetErrorMiddlewareConfig()))

	// Register routes
	h.RegisterRoutes(router)

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Port)
	logger.Info("Starting server",
		logger.String("address", addr),
		logger.String("environment", cfg.Environment),
		logger.String("db_type", cfg.DBType),
	)

	if err := http.ListenAndServe(addr, router); err != nil {
		logger.Fatal("Failed to start server", logger.ErrorField(err))
	}
}

// setupStore initializes and returns the appropriate data store based on config
func setupStore(cfg *config.Config) (*repository.Store, error) {
	var userRepo repository.UserRepository

	switch cfg.DBType {
	case "sql":
		logger.Info("Initializing SQL database...")
		// Initialize SQL driver and configure connection pool
		drv, err := sql.Open(cfg.Database.Driver, cfg.Database.ConnectionString)
		if err != nil {
			return nil, fmt.Errorf("failed to open sql connection: %w", err)
		}
		drv.DB().SetMaxOpenConns(cfg.Database.MaxOpenConns)
		drv.DB().SetMaxIdleConns(cfg.Database.MaxIdleConns)
		drv.DB().SetConnMaxLifetime(time.Duration(cfg.Database.ConnMaxLifetime) * time.Second)

		// Initialize Ent client
		client := ent.NewClient(ent.Driver(drv))

		// Create database schema if it doesn't exist
		if err := client.Schema.Create(context.Background()); err != nil {
			return nil, fmt.Errorf("failed to create schema: %w", err)
		}
		userRepo = sql_repo.NewSQLUserRepository(client)

	case "mongo":
		logger.Info("Initializing MongoDB database...")
		client, err := mongo_repo.NewClient(cfg.Mongo)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to mongo: %w", err)
		}
		db := client.Database(cfg.Mongo.DatabaseName)
		userRepo = mongo_repo.NewMongoUserRepository(db)

	default:
		return nil, fmt.Errorf("unsupported DB_TYPE: %s", cfg.DBType)
	}

	return &repository.Store{
		UserRepo: userRepo,
	}, nil
}
