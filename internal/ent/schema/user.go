package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)


type User struct {
	ent.Schema
}


func (User) Fields() []ent.Field {
	return []ent.Field{
		field.Int("id").Positive(),
		field.String("username").Unique(),
		field.String("email").Unique(),
		field.String("password_hash"),
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}
