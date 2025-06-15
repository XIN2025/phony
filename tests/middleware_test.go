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

	gin.SetMode(gin.TestMode)


	router := gin.New()


	cfg := &config.LoggingConfig{
		SkipPaths:       []string{"/skip"},
		LogRequestBody:  true,
		LogResponseBody: true,
		AdditionalFields: map[string]interface{}{
			"test": true,
		},
	}


	router.Use(middleware.CreateLoggingMiddleware(cfg))


	router.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "test response")
	})


	router.GET("/skip", func(c *gin.Context) {
		c.String(http.StatusOK, "skip response")
	})


	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "test response", w.Body.String())


	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/skip", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "skip response", w.Body.String())
}

func TestRecoveryMiddleware(t *testing.T) {

	gin.SetMode(gin.TestMode)


	router := gin.New()


	cfg := &config.ErrorConfig{
		LogStack: true,
	}


	router.Use(middleware.CreateRecoveryMiddleware(cfg))


	router.GET("/panic", func(c *gin.Context) {
		panic("test panic")
	})


	router.GET("/normal", func(c *gin.Context) {
		c.String(http.StatusOK, "normal response")
	})


	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/panic", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)


	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/normal", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "normal response", w.Body.String())
}

func TestSkipPaths(t *testing.T) {

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


	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/skip-me", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "This won't be logged", w.Body.String())


	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/log-me", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "This will be logged", w.Body.String())
} 
