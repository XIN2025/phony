package config

import (
	"os"
	"strconv"
)

type ConfigOption func(*Config)

func WithEnvironment(env string) ConfigOption {
	return func(c *Config) {
		if env == "" {
			env = "debug"
		} else if env != "debug" && env != "release" && env != "test" {
			env = "debug"
		}
		c.Environment = env
	}
}

func WithPort(port int) ConfigOption {
	return func(c *Config) {
		if port < 1 || port > 65535 {
			port = 8080
		}
		c.Port = port
	}
}

func WithLogLevel(level string) ConfigOption {
	return func(c *Config) {
		validLevels := map[string]bool{
			"debug":   true,
			"info":    true,
			"warn":    true,
			"warning": true,
			"error":   true,
			"fatal":   true,
		}
		if level == "" || !validLevels[level] {
			level = "info"
		}
		c.LogLevel = level
	}
}

func WithLoggerConfig(loggerConfig LoggerConfig) ConfigOption {
	return func(c *Config) {
		c.Logger = loggerConfig
	}
}

func WithMiddlewareConfig(middlewareConfig MiddlewareConfig) ConfigOption {
	return func(c *Config) {
		c.Middleware = middlewareConfig
	}
}

func WithDatabaseConfig(dbConfig DatabaseConfig) ConfigOption {
	return func(c *Config) {
		c.Database = dbConfig
	}
}

func WithMongoConfig(mongoConfig MongoConfig) ConfigOption {
	return func(c *Config) {
		c.Mongo = mongoConfig
	}
}

type Config struct {
	Environment string
	Port        int
	LogLevel    string
	DBType      string // "sql" or "mongo"
	Logger      LoggerConfig
	Middleware  MiddlewareConfig
	Database    DatabaseConfig // For SQL
	Mongo       MongoConfig    // For MongoDB
	JWT         JWTConfig
}

type LoggerConfig struct {
	Environment string
	Level       string
	Encoding    string
	OutputPaths []string
}

type MiddlewareConfig struct {
	Logging LoggingConfig
	Error   ErrorConfig
}

type LoggingConfig struct {
	SkipPaths        []string
	LogRequestBody   bool
	LogResponseBody  bool
	AdditionalFields map[string]interface{}
}

type ErrorConfig struct {
	LogStack bool
}

// DatabaseConfig is for SQL databases
type DatabaseConfig struct {
	Driver           string
	ConnectionString string
	MaxOpenConns     int
	MaxIdleConns     int
	ConnMaxLifetime  int // in seconds
}

// MongoConfig is for MongoDB
type MongoConfig struct {
	URI          string
	DatabaseName string
}

type JWTConfig struct {
	Secret string
}

func Load(options ...ConfigOption) (*Config, error) {
	cfg := &Config{}

	// Apply default environment
	WithEnvironment(os.Getenv("APP_ENV"))(cfg)

	// Port from env or default
	portStr := os.Getenv("PORT")
	if portStr == "" {
		portStr = "8080"
	}
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, err
	}
	WithPort(port)(cfg)

	// Log level from env or default
	WithLogLevel(os.Getenv("LOG_LEVEL"))(cfg)

	// Default DB Type
	cfg.DBType = "sql"
	if dbType := os.Getenv("DB_TYPE"); dbType == "mongo" {
		cfg.DBType = "mongo"
	}

	// Default logger config
	cfg.Logger = LoggerConfig{
		Environment: cfg.Environment,
		Level:       cfg.LogLevel,
		Encoding:    "json",
		OutputPaths: []string{"stdout"},
	}

	// Default middleware config
	cfg.Middleware = MiddlewareConfig{
		Logging: LoggingConfig{
			SkipPaths:       []string{"/health", "/metrics"},
			LogRequestBody:  false,
			LogResponseBody: false,
			AdditionalFields: map[string]interface{}{
				"environment": cfg.Environment,
				"service":     "go-template",
			},
		},
		Error: ErrorConfig{
			LogStack: true,
		},
	}

	// Default SQL database config
	cfg.Database = DatabaseConfig{
		Driver:           "sqlite3",
		ConnectionString: "file:ent?mode=memory&cache=shared&_fk=1",
		MaxOpenConns:     25,
		MaxIdleConns:     25,
		ConnMaxLifetime:  300, // 5 minutes
	}

	// Override SQL config with environment variables if set
	if driver := os.Getenv("DB_DRIVER"); driver != "" {
		cfg.Database.Driver = driver
	}
	if connStr := os.Getenv("DB_CONNECTION_STRING"); connStr != "" {
		cfg.Database.ConnectionString = connStr
	}
	// ... (rest of SQL env vars) ...

	// Default MongoDB config
	cfg.Mongo = MongoConfig{
		URI:          "mongodb://localhost:27017",
		DatabaseName: "template_db",
	}

	// Override Mongo config with environment variables if set
	if uri := os.Getenv("MONGO_URI"); uri != "" {
		cfg.Mongo.URI = uri
	}
	if dbName := os.Getenv("MONGO_DATABASE"); dbName != "" {
		cfg.Mongo.DatabaseName = dbName
	}

	// Default JWT config
	cfg.JWT = JWTConfig{
		Secret: "default-secret", // Override with env var in production
	}
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		cfg.JWT.Secret = secret
	}

	// Apply provided options
	for _, option := range options {
		option(cfg)
	}

	return cfg, nil
}

func (c *Config) GetLoggerConfig() *LoggerConfig {
	return &c.Logger
}

func (c *Config) GetLoggingMiddlewareConfig() *LoggingConfig {
	return &c.Middleware.Logging
}

func (c *Config) GetErrorMiddlewareConfig() *ErrorConfig {
	return &c.Middleware.Error
}
