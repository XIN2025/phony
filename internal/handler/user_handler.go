package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xin2025/go-template/internal/auth"
	"github.com/xin2025/go-template/internal/config"
	"github.com/xin2025/go-template/internal/domain"
	"github.com/xin2025/go-template/pkg/response"
)



type UserHandler struct {
	store  *domain.Store
	config *config.Config
}

func NewUserHandler(store *domain.Store, config *config.Config) *UserHandler {
	return &UserHandler{
		store:  store,
		config: config,
	}
}


func (h *UserHandler) RegisterRoutes(router *gin.Engine) {
	v1 := router.Group("/api/v1")
	{
		users := v1.Group("/users")
		{
			users.POST("/register", h.Register)
			users.POST("/login", h.Login)
		}
	}
}


func (h *UserHandler) Register(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required,min=3,max=50"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, "Invalid request payload")
		return
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, "Failed to hash password")
		return
	}

	user := &domain.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashedPassword,
	}

	createdUser, err := h.store.UserRepo.Create(c.Request.Context(), user)
	if err != nil {

		if err.Error() == "user with this email already exists" {
			response.Error(c, http.StatusConflict, err, err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, err, "Failed to create user")
		return
	}

	response.Success(c, http.StatusCreated, createdUser, "User registered successfully")
}


func (h *UserHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, "Invalid request payload")
		return
	}

	user, err := h.store.UserRepo.FindByEmail(c.Request.Context(), req.Email)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, "Database error")
		return
	}
	if user == nil {
		response.Error(c, http.StatusUnauthorized, nil, "Invalid email or password")
		return
	}

	if !auth.CheckPasswordHash(req.Password, user.PasswordHash) {
		response.Error(c, http.StatusUnauthorized, nil, "Invalid email or password")
		return
	}

	token, err := auth.GenerateJWT(user.ID, h.config.JWT.Secret)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, "Failed to generate token")
		return
	}

	response.Success(c, http.StatusOK, gin.H{"token": token}, "Login successful")
}
