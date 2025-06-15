package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/internal/handler"
	"github.com/xin2025/go-template/internal/middleware"
	"github.com/xin2025/go-template/pkg/logger"
)

func main() {

	cfg, err := config.Load(
		config.WithEnvironment("debug"),
		config.WithPort(8080),
		config.WithLogLevel("debug"),
		config.WithLoggerConfig(config.LoggerConfig{
			Environment: "debug",
			Level:      "debug",
			Encoding:   "console",
			OutputPaths: []string{"stdout"},
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


	gin.SetMode(cfg.Environment)


	router := gin.New()


	router.Use(middleware.CreateLoggingMiddleware(cfg.GetLoggingMiddlewareConfig()))
	router.Use(middleware.CreateRecoveryMiddleware(cfg.GetErrorMiddlewareConfig()))


	h := handler.NewHandler()


	h.RegisterRoutes(router)


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


