# Go Project Template

![Go Version](https://img.shields.io/badge/Go-1.16%2B-blue.svg)

This is a comprehensive template for building RESTful APIs in Go using the Gin framework. It’s designed to provide a solid foundation for Golang projects with features like configuration management, logging, middleware, standardized responses, and testing. Whether you’re building a small service or a large-scale application, this template helps you get started quickly with best practices in mind.

## What This Template Can Do

-   **RESTful API Development**: Create scalable APIs with predefined routes and handlers.
-   **Configuration Flexibility**: Customize settings via environment variables or code with validation.
-   **Robust Logging**: Log requests, errors, and custom messages with configurable levels and outputs.
-   **Middleware Support**: Handle request logging and panic recovery out of the box.
-   **Standardized Responses**: Ensure consistent API responses for success and error cases.
-   **Testing**: Run unit tests for critical components.
-   **Build Automation**: Use Makefile commands for streamlined workflows.

## What This Template Cannot Do

-   **Database Integration**: No built-in database support (e.g., SQL, NoSQL); you’ll need to add your own.
-   **Authentication**: Basic user endpoints exist, but full auth (e.g., JWT, OAuth) isn’t implemented.
-   **Complex Business Logic**: Focused on structure, not specific application logic.
-   **Frontend**: This is a backend-only template; no UI components are included.

## Features

-   **Configuration Management**: Load settings from environment variables or code with defaults and validation.
-   **Custom Logging**: Built with Zap for flexible, high-performance logging.
-   **Middleware**: Includes logging and error recovery middleware with customization options.
-   **Handlers**: Predefined routes for health checks and user management, easily extensible.
-   **Response Formatting**: Consistent JSON responses with a customizable structure.
-   **Testing Suite**: Unit tests for config, logger, and middleware.
-   **Makefile**: Commands for building, testing, and running the app.

## Directory Structure

```
.
├── cmd
│   └── api
│       └── main.go          # Application entry point
├── internal
│   ├── config
│   │   └── config.go        # Configuration management
│   ├── handler
│   │   └── handler.go       # HTTP handlers and routes
│   └── middleware
│       └── middleware.go    # Middleware for logging and recovery
├── pkg
│   ├── logger
│   │   └── logger.go        # Custom Zap-based logger
│   └── response
│       └── response.go      # Standardized API response formatting
├── tests
│   ├── config_test.go       # Tests for configuration
│   ├── logger_test.go       # Tests for logger
│   └── middleware_test.go   # Tests for middleware
└── Makefile                 # Build and run automation
```

### File Descriptions

-   `cmd/api/main.go`: The entry point. Initializes config, logger, middleware, routes, and starts the server.
-   `internal/config/config.go`: Manages app settings (e.g., port, log level) with an options pattern.
-   `internal/handler/handler.go`: Defines API endpoints like `/health`, `/users/register`, and `/users/login`.
-   `internal/middleware/middleware.go`: Provides logging and panic recovery middleware.
-   `pkg/logger/logger.go`: A reusable Zap logger with customizable levels, encoding, and outputs.
-   `pkg/response/response.go`: Formats API responses consistently (e.g., `{ "status": "success", "data": {...} }`).
-   `tests/*_test.go`: Unit tests for key components.
-   `Makefile`: Automates building, testing, and running tasks.

## Getting Started

### Prerequisites

-   **Go**: Version 1.16 or higher.
-   **Make**: Optional, for using the Makefile.
-   **Git**: To clone the repository.

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/yourusername/go-template.git
    cd go-template
    ```

2.  **Install Dependencies:**
    ```bash
    go mod tidy
    ```

3.  **Build the Application:**
    ```bash
    make build
    ```

4.  **Run the Application:**
    ```bash
    make run
    ```
    Or, for development with live reloading:
    ```bash
    make dev
    ```
    The server starts on `http://localhost:8080` by default.

### Example Usage

Try the health check endpoint:

```bash
curl http://localhost:8080/api/v1/health
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "status": "ok",
    "version": "1.0.0"
  },
  "message": "Service is healthy"
}
```

## Configuration

Customize the app via environment variables or programmatically in `main.go`.

### Environment Variables

| Variable    | Description       | Default | Valid Values             |
| :---------- | :---------------- | :------ | :----------------------- |
| `APP_ENV`   | Environment mode  | `debug` | `debug`, `release`, `test` |
| `PORT`      | Server port       | `8080`  | `1-65535`                |
| `LOG_LEVEL` | Logging verbosity | `info`  | `debug`, `info`, `warn`, `error`, `fatal` |

**Example:**

```bash
export APP_ENV=release
export PORT=9090
export LOG_LEVEL=debug
make run
```

### Code Configuration

Modify `cmd/api/main.go` to set options programmatically:

```go
cfg, err := config.Load(
    config.WithEnvironment("release"),
    config.WithPort(9090),
    config.WithLogLevel("debug"),
    config.WithLoggerConfig(config.LoggerConfig{
        Encoding:   "json",
        OutputPaths: []string{"stdout", "app.log"},
    }),
    config.WithMiddlewareConfig(config.MiddlewareConfig{
        Logging: config.LoggingConfig{
            SkipPaths: []string{"/health"},
            LogRequestBody: true,
        },
    }),
)
```

## Logging

The template uses a Zap-based logger available in the `pkg/logger` package. It’s initialized in `main.go` and can be used globally.

### Example Usage

```go
logger.Info("Server started", logger.String("port", "8080"))
logger.Error("Something failed", logger.ErrorField(err))
```

### Customization

Adjust logger settings in `main.go`:

```go
logger.Init("debug",
    logger.WithLevel("debug"),
    logger.WithEncoding("json"),
    logger.WithOutputPaths([]string{"stdout", "app.log"}),
)
```

## Middleware

Two middleware functions are included:

-   **Logging Middleware**: Logs request details (path, method, status, latency). Configurable via `config.MiddlewareConfig.Logging`.
    
    *Example log:*
    ```json
    {"level":"info","msg":"Request processed","path":"/api/v1/health","query":"","status":200,"method":"GET","ip":"127.0.0.1","latency":"1.234ms"}
    ```

-   **Recovery Middleware**: Catches panics, logs them, and returns a 500 error.
    
    *Example customization:*
    ```go
    config.WithMiddlewareConfig(config.MiddlewareConfig{
        Error: config.ErrorConfig{LogStack: true},
    })
    ```

## Handlers

Handlers live in `internal/handler/handler.go`. The template includes:

-   `/api/v1/health`: Health check endpoint.
-   `/api/v1/users/register`: User registration (placeholder).
-   `/api/v1/users/login`: User login (placeholder).

### Adding a New Endpoint

Add a new route in the `RegisterRoutes` function:

```go
v1.GET("/hello", func(c *gin.Context) {
    response.Success(c, http.StatusOK, gin.H{"greeting": "Hello, World!"}, "Success")
})
```

Test it:

```bash
curl http://localhost:8080/api/v1/hello
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "greeting": "Hello, World!"
  },
  "message": "Success"
}
```

## Responses

The `pkg/response` package ensures consistent API responses.

### Success Response

```go
response.Success(c, http.StatusOK, data, "Operation completed")
```

**Output:**

```json
{
  "status": "success",
  "data": {...},
  "message": "Operation completed"
}
```

### Error Response

```go
response.Error(c, http.StatusBadRequest, err, "Invalid input")
```

**Output:**

```json
{
  "status": "error",
  "message": "Invalid input",
  "error": "detailed error message"
}
```

### Customization

You can create a custom formatter and set it as the default:

```go
type CustomFormatter struct {}

func (f *CustomFormatter) FormatSuccess(c *gin.Context, code int, data interface{}, message string) {
    c.JSON(code, gin.H{"result": "ok", "payload": data, "note": message})
}

// In your setup:
response.SetFormatter(&CustomFormatter{})
```

## Testing

Unit tests are located in the `tests` directory.

Run all tests:

```bash
make test
```

Or run them directly with Go:

```bash
go test ./tests/... -v -count=1
```

### Writing Tests

Example test for a new handler in `tests/handler_test.go`:

```go
func TestHelloEndpoint(t *testing.T) {
    // Setup
    router := gin.New()
    h := handler.NewHandler()
    h.RegisterRoutes(router)

    // Create a request
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/api/v1/hello", nil)
    router.ServeHTTP(w, req)

    // Assertions
    assert.Equal(t, http.StatusOK, w.Code)
    assert.Contains(t, w.Body.String(), "Hello, World!")
}
```

## Makefile Commands

| Command      | Description                               |
| :----------- | :---------------------------------------- |
| `make build` | Builds the app into a binary.             |
| `make clean` | Removes build artifacts.                  |
| `make test`  | Runs all tests.                           |
| `make run`   | Builds and runs the app.                  |
| `make dev`   | Runs the app in development mode with live reloading. |
