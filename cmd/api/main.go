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
	"github.com/xin2025/go-template/internal/service"
	"github.com/xin2025/go-template/pkg/logger"

	"entgo.io/ent/dialect/sql"
	_ "github.com/go-sql-driver/mysql" // MySQL driver
	_ "github.com/lib/pq"              // PostgreSQL driver
	_ "github.com/mattn/go-sqlite3"    // SQLite driver
	"github.com/xin2025/go-template/internal/ent"
)

func main() {
	// Load configuration
	cfg, err := config.Load(
		config.WithEnvironment("debug"),
		config.WithPort(8080),
		config.WithLogLevel("debug"),
		config.WithLoggerConfig(config.LoggerConfig{
			Environment:  "debug",
			Level:        "debug",
			Encoding:     "console",
			OutputPaths:  []string{"stdout"},
		}),
		config.WithMiddlewareConfig(config.MiddlewareConfig{
			Logging: config.LoggingConfig{
				SkipPaths:       []string{"/health", "/metrics"},
				LogRequestBody:  true,
				LogResponseBody: true,
				AdditionalFields: map[string]interface{}{
					"environment": "debug",
					"service":     "go-template",
				},
			},
			Error: config.ErrorConfig{
				LogStack: true,
			},
		}),
	)
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

	// Initialize SQL driver and configure connection pool
	drv, err := sql.Open(cfg.Database.Driver, cfg.Database.ConnectionString)
	if err != nil {
		logger.Fatal("Failed to open database connection", logger.ErrorField(err))
	}
	drv.DB().SetMaxOpenConns(cfg.Database.MaxOpenConns)
	drv.DB().SetMaxIdleConns(cfg.Database.MaxIdleConns)
	drv.DB().SetConnMaxLifetime(time.Duration(cfg.Database.ConnMaxLifetime) * time.Second)

	// Initialize Ent client
	client := ent.NewClient(ent.Driver(drv))
	defer client.Close()

	// Create database schema if it doesn't exist
	if err := client.Schema.Create(context.Background()); err != nil {
		logger.Fatal("Failed to create schema", logger.ErrorField(err))
	}

	// Initialize service with dependencies
	srv := service.NewService(client, cfg)
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
	)

	if err := http.ListenAndServe(addr, router); err != nil {
		logger.Fatal("Failed to start server",
			logger.ErrorField(err),
		)
	}
}
