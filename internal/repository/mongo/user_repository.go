package mongo

import (
	"context"
	"errors"
	"time"

	"github.com/xin2025/go-template/internal/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const userCollection = "users"


type mongoUserRepository struct {
	db *mongo.Database
}



func NewMongoUserRepository(db *mongo.Database) domain.UserRepository {


	_, _ = db.Collection(userCollection).Indexes().CreateOne(
		context.Background(),
		mongo.IndexModel{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	)
	return &mongoUserRepository{db: db}
}

func (r *mongoUserRepository) Create(ctx context.Context, user *domain.User) (*domain.User, error) {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	res, err := r.db.Collection(userCollection).InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, errors.New("user with this email already exists")
		}
		return nil, err
	}

	user.ID = res.InsertedID.(primitive.ObjectID).Hex()
	return user, nil
}

func (r *mongoUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User

	err := r.db.Collection(userCollection).FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil 
		}
		return nil, err
	}

	return &user, nil
}
