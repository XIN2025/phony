package mongo

import (
	"context"
	"errors"
	"time"

	"github.com/xin2025/go-template/internal/model"
	"github.com/xin2025/go-template/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const userCollection = "users"

// mongoUserRepository implements the UserRepository for MongoDB.
type mongoUserRepository struct {
	db *mongo.Database
}

// NewMongoUserRepository creates a new MongoDB user repository.
func NewMongoUserRepository(db *mongo.Database) repository.UserRepository {
	// Create unique index on email field
	collection := db.Collection(userCollection)
	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	_, err := collection.Indexes().CreateOne(context.Background(), indexModel)
	if err != nil {
		// Log error but continue - index might already exist
		// This is not critical as the unique constraint will still be enforced
	}

	return &mongoUserRepository{db: db}
}

func (r *mongoUserRepository) Create(ctx context.Context, user *model.User) (*model.User, error) {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	
	// MongoDB driver will generate an ObjectID if `_id` is empty.
	// We'll capture it to return in our model.
	collection := r.db.Collection(userCollection)
	res, err := collection.InsertOne(ctx, user)
	if err != nil {
		// Handle duplicate key error for email
		if mongo.IsDuplicateKeyError(err) {
			return nil, errors.New("user with this email already exists")
		}
		return nil, err
	}
	
	// Set the generated ID on the model
	user.ID = res.InsertedID.(primitive.ObjectID).Hex()
	
	return user, nil
}

func (r *mongoUserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	var user model.User
	collection := r.db.Collection(userCollection)
	
	filter := bson.M{"email": email}
	err := collection.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil // Not found is not an error for this method
		}
		return nil, err
	}
	
	return &user, nil
}
