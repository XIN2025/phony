package app

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/internal/domain"
	"github.com/xin2025/go-template/internal/handler"
	"github.com/xin2025/go-template/internal/middleware"
	mongo_repo "github.com/xin2025/go-template/internal/repository/mongo"
	sql_repo "github.com/xin2025/go-template/internal/repository/sql"
	"github.com/xin2025/go-template/pkg/response"

	"entgo.io/ent/dialect/sql"
	"github.com/xin2025/go-template/internal/ent"

)


type App struct {
	Config *config.Config
	Logger *logrus.Logger
	Store  *domain.Store
	Router *gin.Engine
}


func New() (*App, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load configuration: %w", err)
	}




	appLogger, err := setupLogger(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize logger: %w", err)
	}

	store, err := setupStore(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to setup data store: %w", err)
	}

	gin.SetMode(cfg.Environment)
	router := gin.New()

	app := &App{
		Config: cfg,
		Logger: appLogger,
		Store:  store,
		Router: router,
	}

	app.setupMiddleware()
	app.setupRoutes()

	return app, nil
}


func (a *App) Run() {
	addr := fmt.Sprintf(":%d", a.Config.Port)
	a.Logger.Infof("Starting server on %s", addr)

	if err := http.ListenAndServe(addr, a.Router); err != nil && err != http.ErrServerClosed {
		a.Logger.Fatalf("Failed to start server: %v", err)
	}
}


func setupLogger(cfg *config.Config) (*logrus.Logger, error) {

	log := logrus.New()
	level, err := logrus.ParseLevel(cfg.LogLevel)
	if err != nil {
		return nil, err
	}
	log.SetLevel(level)
	return log, nil
}

func setupStore(cfg *config.Config) (*domain.Store, error) {
	var userRepo domain.UserRepository
	var err error

	switch cfg.DBType {
	case "sql":
		userRepo, err = setupSQLStore(cfg)
		if err != nil {
			return nil, err
		}
	case "mongo":
		userRepo, err = setupMongoStore(cfg)
		if err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unsupported DB_TYPE: %s", cfg.DBType)
	}

	return &domain.Store{UserRepo: userRepo}, nil
}

func setupSQLStore(cfg *config.Config) (domain.UserRepository, error) {
	drv, err := sql.Open(cfg.Database.Driver, cfg.Database.ConnectionString)
	if err != nil {
		return nil, fmt.Errorf("failed to open sql connection: %w", err)
	}
	drv.DB().SetMaxOpenConns(cfg.Database.MaxOpenConns)
	drv.DB().SetMaxIdleConns(cfg.Database.MaxIdleConns)
	drv.DB().SetConnMaxLifetime(time.Duration(cfg.Database.ConnMaxLifetime) * time.Second)

	client := ent.NewClient(ent.Driver(drv))
	if err := client.Schema.Create(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to create schema: %w", err)
	}
	return sql_repo.NewSQLUserRepository(client), nil
}

func setupMongoStore(cfg *config.Config) (domain.UserRepository, error) {
	client, err := mongo_repo.NewClient(cfg.Mongo)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to mongo: %w", err)
	}
	db := client.Database(cfg.Mongo.DatabaseName)
	return mongo_repo.NewMongoUserRepository(db), nil
}

func (a *App) setupMiddleware() {
	a.Router.Use(middleware.CreateLoggingMiddleware(a.Config.GetLoggingMiddlewareConfig()))
	a.Router.Use(middleware.CreateRecoveryMiddleware(a.Config.GetErrorMiddlewareConfig()))
}

func (a *App) setupRoutes() {

	a.Router.GET("/health", func(c *gin.Context) {
		response.Success(c, http.StatusOK, gin.H{"status": "ok"}, "Service is healthy")
	})


	userHandler := handler.NewUserHandler(a.Store, a.Config)
	userHandler.RegisterRoutes(a.Router)


	protected := a.Router.Group("/api/v1/protected")
	protected.Use(middleware.AuthMiddleware(a.Config))
	protected.GET("/", func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		response.Success(c, http.StatusOK, gin.H{"message": "Hello, user " + userID.(string)}, "")
	})
}
