package sql

import (
	"context"
	"strconv"
	"time"

	"github.com/xin2025/go-template/internal/ent"
	"github.com/xin2025/go-template/internal/ent/user"
	"github.com/xin2025/go-template/internal/model"
	"github.com/xin2025/go-template/internal/repository"
)

// sqlUserRepository implements the UserRepository interface for SQL databases.
type sqlUserRepository struct {
	client *ent.Client
}

// NewSQLUserRepository creates a new SQL user repository.
func NewSQLUserRepository(client *ent.Client) repository.UserRepository {
	return &sqlUserRepository{client: client}
}

// toModel converts an ent.User to a model.User
func toModel(u *ent.User) *model.User {
	if u == nil {
		return nil
	}
	return &model.User{
		ID:           strconv.Itoa(u.ID),
		Username:     u.Username,
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,
	}
}

func (r *sqlUserRepository) Create(ctx context.Context, userModel *model.User) (*model.User, error) {
	createdUser, err := r.client.User.
		Create().
		SetUsername(userModel.Username).
		SetEmail(userModel.Email).
		SetPasswordHash(userModel.PasswordHash).
		SetCreatedAt(time.Now()).
		SetUpdatedAt(time.Now()).
		Save(ctx)
	if err != nil {
		return nil, err
	}
	return toModel(createdUser), nil
}

func (r *sqlUserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	foundUser, err := r.client.User.
		Query().
		Where(user.EmailEQ(email)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil // Return nil, nil for not found
		}
		return nil, err
	}
	return toModel(foundUser), nil
}
