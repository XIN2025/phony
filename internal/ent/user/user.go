

package user

import (
	"time"

	"entgo.io/ent/dialect/sql"
)

const (

	Label = "user"

	FieldID = "id"

	FieldUsername = "username"

	FieldEmail = "email"

	FieldPasswordHash = "password_hash"

	FieldCreatedAt = "created_at"

	FieldUpdatedAt = "updated_at"

	Table = "users"
)


var Columns = []string{
	FieldID,
	FieldUsername,
	FieldEmail,
	FieldPasswordHash,
	FieldCreatedAt,
	FieldUpdatedAt,
}


func ValidColumn(column string) bool {
	for i := range Columns {
		if column == Columns[i] {
			return true
		}
	}
	return false
}

var (

	DefaultCreatedAt func() time.Time

	DefaultUpdatedAt func() time.Time

	UpdateDefaultUpdatedAt func() time.Time

	IDValidator func(int) error
)


type OrderOption func(*sql.Selector)


func ByID(opts ...sql.OrderTermOption) OrderOption {
	return sql.OrderByField(FieldID, opts...).ToFunc()
}


func ByUsername(opts ...sql.OrderTermOption) OrderOption {
	return sql.OrderByField(FieldUsername, opts...).ToFunc()
}


func ByEmail(opts ...sql.OrderTermOption) OrderOption {
	return sql.OrderByField(FieldEmail, opts...).ToFunc()
}


func ByPasswordHash(opts ...sql.OrderTermOption) OrderOption {
	return sql.OrderByField(FieldPasswordHash, opts...).ToFunc()
}


func ByCreatedAt(opts ...sql.OrderTermOption) OrderOption {
	return sql.OrderByField(FieldCreatedAt, opts...).ToFunc()
}


func ByUpdatedAt(opts ...sql.OrderTermOption) OrderOption {
	return sql.OrderByField(FieldUpdatedAt, opts...).ToFunc()
}
