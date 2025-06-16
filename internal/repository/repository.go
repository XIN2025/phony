package repository

import (
	"context"

	"github.com/xin2025/go-template/internal/model"
)

// UserRepository defines the interface for user data operations.
type UserRepository interface {
	Create(ctx context.Context, user *model.User) (*model.User, error)
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	// Add other necessary methods here, e.g., FindByID, Update, Delete
}

// Store is a wrapper for all repositories
type Store struct {
	UserRepo UserRepository
	// Add other repositories here, e.g., ProductRepo ProductRepository
}
