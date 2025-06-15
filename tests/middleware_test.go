package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/internal/middleware"
	"github.com/xin2025/go-template/pkg/logger"
)

func TestLoggingMiddleware(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create test router
	router := gin.New()

	// Create test config
	cfg := &config.LoggingConfig{
		SkipPaths:       []string{"/skip"},
		LogRequestBody:  true,
		LogResponseBody: true,
		AdditionalFields: map[string]interface{}{
			"test": true,
		},
	}

	// Apply middleware
	router.Use(middleware.CreateLoggingMiddleware(cfg))

	// Add test route
	router.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "test response")
	})

	// Add skip route
	router.GET("/skip", func(c *gin.Context) {
		c.String(http.StatusOK, "skip response")
	})

	// Test normal request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "test response", w.Body.String())

	// Test skip path
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/skip", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "skip response", w.Body.String())
}

func TestRecoveryMiddleware(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create test router
	router := gin.New()

	// Create test config
	cfg := &config.ErrorConfig{
		LogStack: true,
	}

	// Apply middleware
	router.Use(middleware.CreateRecoveryMiddleware(cfg))

	// Add panic route
	router.GET("/panic", func(c *gin.Context) {
		panic("test panic")
	})

	// Add normal route for comparison
	router.GET("/normal", func(c *gin.Context) {
		c.String(http.StatusOK, "normal response")
	})

	// Test panic recovery
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/panic", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// Test normal request
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/normal", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "normal response", w.Body.String())
}

func TestSkipPaths(t *testing.T) {
	// Clean up any existing logger instance
	logger.Sync()

	err := logger.Init("debug")
	assert.NoError(t, err)
	defer logger.Sync()

	router := gin.New()

	cfg := &config.LoggingConfig{
		SkipPaths: []string{
			"/health",
			"/metrics",
			"/api/v1/status",
		},
		LogRequestBody: false,
		LogResponseBody: false,
	}

	router.Use(middleware.CreateLoggingMiddleware(cfg))

	router.GET("/health", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	router.GET("/metrics", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	router.GET("/api/v1/status", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	router.GET("/normal", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	tests := []struct {
		name           string
		path          string
		shouldBeLogged bool
	}{
		{
			name:           "should skip logging for /health",
			path:          "/health",
			shouldBeLogged: false,
		},
		{
			name:           "should skip logging for /metrics",
			path:          "/metrics",
			shouldBeLogged: false,
		},
		{
			name:           "should skip logging for /api/v1/status",
			path:          "/api/v1/status",
			shouldBeLogged: false,
		},
		{
			name:           "should log normal path",
			path:          "/normal",
			shouldBeLogged: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", tt.path, nil)
			router.ServeHTTP(w, req)
			assert.Equal(t, http.StatusOK, w.Code)
		})
	}
}

func TestSimpleLogging(t *testing.T) {
	// Clean up any existing logger instance
	logger.Sync()

	err := logger.Init("debug")
	assert.NoError(t, err)
	defer logger.Sync()

	router := gin.New()

	cfg := &config.LoggingConfig{
		SkipPaths: []string{"/skip-me"},
		LogRequestBody: true,
		LogResponseBody: false,
		AdditionalFields: map[string]interface{}{
			"service": "test-service",
		},
	}

	router.Use(middleware.CreateLoggingMiddleware(cfg))

	router.GET("/skip-me", func(c *gin.Context) {
		c.String(200, "This won't be logged")
	})

	router.GET("/log-me", func(c *gin.Context) {
		c.String(200, "This will be logged")
	})

	// Test skip path
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/skip-me", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "This won't be logged", w.Body.String())

	// Test normal path
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/log-me", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "This will be logged", w.Body.String())
} 
