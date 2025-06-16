package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xin2025/go-template/internal/auth"
	"github.com/xin2025/go-template/internal/middleware"
	"github.com/xin2025/go-template/internal/model"
	"github.com/xin2025/go-template/internal/service"
	"github.com/xin2025/go-template/pkg/response"
)

type Handler struct {
	service *service.Service
}

func NewHandler(s *service.Service) *Handler {
	return &Handler{service: s}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", h.HealthCheck)

		users := v1.Group("/users")
		{
			users.POST("/register", h.RegisterUser)
			users.POST("/login", h.LoginUser)
		}

		// Protected routes
		protected := v1.Group("/protected")
		protected.Use(middleware.AuthMiddleware(h.service.Config))
		protected.GET("/", func(c *gin.Context) {
			userID, _ := c.Get("user_id")
			c.JSON(http.StatusOK, gin.H{"message": "Hello, user " + userID.(string)})
		})
	}
}

func (h *Handler) HealthCheck(c *gin.Context) {
	response.Success(c, http.StatusOK, gin.H{
		"status":  "ok",
		"version": "1.0.0",
	}, "Service is healthy")
}

func (h *Handler) RegisterUser(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required,min=3,max=50"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, "Invalid request payload")
		return
	}

	// Hash the password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, "Failed to hash password")
		return
	}

	// Create the user model
	userModel := &model.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashedPassword,
	}

	// Create the user via the repository
	createdUser, err := h.service.Store.UserRepo.Create(c.Request.Context(), userModel)
	if err != nil {
		// Check for duplicate user error
		if err.Error() == "user with this email already exists" {
			response.Error(c, http.StatusInternalServerError, err, "User with this email already exists")
			return
		}
		response.Error(c, http.StatusInternalServerError, err, "Failed to create user")
		return
	}

	response.Success(c, http.StatusCreated, createdUser, "User registered successfully")
}

func (h *Handler) LoginUser(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, "Invalid request payload")
		return
	}

	// Find user by email
	user, err := h.service.Store.UserRepo.FindByEmail(c.Request.Context(), req.Email)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, "Failed to query user")
		return
	}
	if user == nil {
		response.Error(c, http.StatusUnauthorized, nil, "Invalid email or password")
		return
	}

	// Verify password
	if !auth.CheckPasswordHash(req.Password, user.PasswordHash) {
		response.Error(c, http.StatusUnauthorized, nil, "Invalid email or password")
		return
	}

	// Generate JWT token
	token, err := auth.GenerateJWT(user.ID, h.service.Config.JWT.Secret)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, "Failed to generate token")
		return
	}

	response.Success(c, http.StatusOK, gin.H{
		"token": token,
	}, "Login successful")
}
