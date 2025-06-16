package sql

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/xin2025/go-template/internal/domain"
	"github.com/xin2025/go-template/internal/ent"
	"github.com/xin2025/go-template/internal/ent/user"
)


type sqlUserRepository struct {
	client *ent.Client
}


func NewSQLUserRepository(client *ent.Client) domain.UserRepository {
	return &sqlUserRepository{client: client}
}


func toDomain(u *ent.User) *domain.User {
	if u == nil {
		return nil
	}
	return &domain.User{
		ID:           strconv.Itoa(u.ID),
		Username:     u.Username,
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,
	}
}

func (r *sqlUserRepository) Create(ctx context.Context, userModel *domain.User) (*domain.User, error) {
	createdUser, err := r.client.User.
		Create().
		SetUsername(userModel.Username).
		SetEmail(userModel.Email).
		SetPasswordHash(userModel.PasswordHash).
		SetCreatedAt(time.Now()).
		SetUpdatedAt(time.Now()).
		Save(ctx)
	if err != nil {

		if ent.IsConstraintError(err) {
			return nil, errors.New("user with this email already exists")
		}
		return nil, err
	}
	return toDomain(createdUser), nil
}

func (r *sqlUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	foundUser, err := r.client.User.
		Query().
		Where(user.EmailEQ(email)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil 
		}
		return nil, err
	}
	return toDomain(foundUser), nil
}
