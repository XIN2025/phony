

package user

import (
	"time"

	"entgo.io/ent/dialect/sql"
	"github.com/xin2025/go-template/internal/ent/predicate"
)


func ID(id int) predicate.User {
	return predicate.User(sql.FieldEQ(FieldID, id))
}


func IDEQ(id int) predicate.User {
	return predicate.User(sql.FieldEQ(FieldID, id))
}


func IDNEQ(id int) predicate.User {
	return predicate.User(sql.FieldNEQ(FieldID, id))
}


func IDIn(ids ...int) predicate.User {
	return predicate.User(sql.FieldIn(FieldID, ids...))
}


func IDNotIn(ids ...int) predicate.User {
	return predicate.User(sql.FieldNotIn(FieldID, ids...))
}


func IDGT(id int) predicate.User {
	return predicate.User(sql.FieldGT(FieldID, id))
}


func IDGTE(id int) predicate.User {
	return predicate.User(sql.FieldGTE(FieldID, id))
}


func IDLT(id int) predicate.User {
	return predicate.User(sql.FieldLT(FieldID, id))
}


func IDLTE(id int) predicate.User {
	return predicate.User(sql.FieldLTE(FieldID, id))
}


func Username(v string) predicate.User {
	return predicate.User(sql.FieldEQ(FieldUsername, v))
}


func Email(v string) predicate.User {
	return predicate.User(sql.FieldEQ(FieldEmail, v))
}


func PasswordHash(v string) predicate.User {
	return predicate.User(sql.FieldEQ(FieldPasswordHash, v))
}


func CreatedAt(v time.Time) predicate.User {
	return predicate.User(sql.FieldEQ(FieldCreatedAt, v))
}


func UpdatedAt(v time.Time) predicate.User {
	return predicate.User(sql.FieldEQ(FieldUpdatedAt, v))
}


func UsernameEQ(v string) predicate.User {
	return predicate.User(sql.FieldEQ(FieldUsername, v))
}


func UsernameNEQ(v string) predicate.User {
	return predicate.User(sql.FieldNEQ(FieldUsername, v))
}


func UsernameIn(vs ...string) predicate.User {
	return predicate.User(sql.FieldIn(FieldUsername, vs...))
}


func UsernameNotIn(vs ...string) predicate.User {
	return predicate.User(sql.FieldNotIn(FieldUsername, vs...))
}


func UsernameGT(v string) predicate.User {
	return predicate.User(sql.FieldGT(FieldUsername, v))
}


func UsernameGTE(v string) predicate.User {
	return predicate.User(sql.FieldGTE(FieldUsername, v))
}


func UsernameLT(v string) predicate.User {
	return predicate.User(sql.FieldLT(FieldUsername, v))
}


func UsernameLTE(v string) predicate.User {
	return predicate.User(sql.FieldLTE(FieldUsername, v))
}


func UsernameContains(v string) predicate.User {
	return predicate.User(sql.FieldContains(FieldUsername, v))
}


func UsernameHasPrefix(v string) predicate.User {
	return predicate.User(sql.FieldHasPrefix(FieldUsername, v))
}


func UsernameHasSuffix(v string) predicate.User {
	return predicate.User(sql.FieldHasSuffix(FieldUsername, v))
}


func UsernameEqualFold(v string) predicate.User {
	return predicate.User(sql.FieldEqualFold(FieldUsername, v))
}


func UsernameContainsFold(v string) predicate.User {
	return predicate.User(sql.FieldContainsFold(FieldUsername, v))
}


func EmailEQ(v string) predicate.User {
	return predicate.User(sql.FieldEQ(FieldEmail, v))
}


func EmailNEQ(v string) predicate.User {
	return predicate.User(sql.FieldNEQ(FieldEmail, v))
}


func EmailIn(vs ...string) predicate.User {
	return predicate.User(sql.FieldIn(FieldEmail, vs...))
}


func EmailNotIn(vs ...string) predicate.User {
	return predicate.User(sql.FieldNotIn(FieldEmail, vs...))
}


func EmailGT(v string) predicate.User {
	return predicate.User(sql.FieldGT(FieldEmail, v))
}


func EmailGTE(v string) predicate.User {
	return predicate.User(sql.FieldGTE(FieldEmail, v))
}


func EmailLT(v string) predicate.User {
	return predicate.User(sql.FieldLT(FieldEmail, v))
}


func EmailLTE(v string) predicate.User {
	return predicate.User(sql.FieldLTE(FieldEmail, v))
}


func EmailContains(v string) predicate.User {
	return predicate.User(sql.FieldContains(FieldEmail, v))
}


func EmailHasPrefix(v string) predicate.User {
	return predicate.User(sql.FieldHasPrefix(FieldEmail, v))
}


func EmailHasSuffix(v string) predicate.User {
	return predicate.User(sql.FieldHasSuffix(FieldEmail, v))
}


func EmailEqualFold(v string) predicate.User {
	return predicate.User(sql.FieldEqualFold(FieldEmail, v))
}


func EmailContainsFold(v string) predicate.User {
	return predicate.User(sql.FieldContainsFold(FieldEmail, v))
}


func PasswordHashEQ(v string) predicate.User {
	return predicate.User(sql.FieldEQ(FieldPasswordHash, v))
}


func PasswordHashNEQ(v string) predicate.User {
	return predicate.User(sql.FieldNEQ(FieldPasswordHash, v))
}


func PasswordHashIn(vs ...string) predicate.User {
	return predicate.User(sql.FieldIn(FieldPasswordHash, vs...))
}


func PasswordHashNotIn(vs ...string) predicate.User {
	return predicate.User(sql.FieldNotIn(FieldPasswordHash, vs...))
}


func PasswordHashGT(v string) predicate.User {
	return predicate.User(sql.FieldGT(FieldPasswordHash, v))
}


func PasswordHashGTE(v string) predicate.User {
	return predicate.User(sql.FieldGTE(FieldPasswordHash, v))
}


func PasswordHashLT(v string) predicate.User {
	return predicate.User(sql.FieldLT(FieldPasswordHash, v))
}


func PasswordHashLTE(v string) predicate.User {
	return predicate.User(sql.FieldLTE(FieldPasswordHash, v))
}


func PasswordHashContains(v string) predicate.User {
	return predicate.User(sql.FieldContains(FieldPasswordHash, v))
}


func PasswordHashHasPrefix(v string) predicate.User {
	return predicate.User(sql.FieldHasPrefix(FieldPasswordHash, v))
}


func PasswordHashHasSuffix(v string) predicate.User {
	return predicate.User(sql.FieldHasSuffix(FieldPasswordHash, v))
}


func PasswordHashEqualFold(v string) predicate.User {
	return predicate.User(sql.FieldEqualFold(FieldPasswordHash, v))
}


func PasswordHashContainsFold(v string) predicate.User {
	return predicate.User(sql.FieldContainsFold(FieldPasswordHash, v))
}


func CreatedAtEQ(v time.Time) predicate.User {
	return predicate.User(sql.FieldEQ(FieldCreatedAt, v))
}


func CreatedAtNEQ(v time.Time) predicate.User {
	return predicate.User(sql.FieldNEQ(FieldCreatedAt, v))
}


func CreatedAtIn(vs ...time.Time) predicate.User {
	return predicate.User(sql.FieldIn(FieldCreatedAt, vs...))
}


func CreatedAtNotIn(vs ...time.Time) predicate.User {
	return predicate.User(sql.FieldNotIn(FieldCreatedAt, vs...))
}


func CreatedAtGT(v time.Time) predicate.User {
	return predicate.User(sql.FieldGT(FieldCreatedAt, v))
}


func CreatedAtGTE(v time.Time) predicate.User {
	return predicate.User(sql.FieldGTE(FieldCreatedAt, v))
}


func CreatedAtLT(v time.Time) predicate.User {
	return predicate.User(sql.FieldLT(FieldCreatedAt, v))
}


func CreatedAtLTE(v time.Time) predicate.User {
	return predicate.User(sql.FieldLTE(FieldCreatedAt, v))
}


func UpdatedAtEQ(v time.Time) predicate.User {
	return predicate.User(sql.FieldEQ(FieldUpdatedAt, v))
}


func UpdatedAtNEQ(v time.Time) predicate.User {
	return predicate.User(sql.FieldNEQ(FieldUpdatedAt, v))
}


func UpdatedAtIn(vs ...time.Time) predicate.User {
	return predicate.User(sql.FieldIn(FieldUpdatedAt, vs...))
}


func UpdatedAtNotIn(vs ...time.Time) predicate.User {
	return predicate.User(sql.FieldNotIn(FieldUpdatedAt, vs...))
}


func UpdatedAtGT(v time.Time) predicate.User {
	return predicate.User(sql.FieldGT(FieldUpdatedAt, v))
}


func UpdatedAtGTE(v time.Time) predicate.User {
	return predicate.User(sql.FieldGTE(FieldUpdatedAt, v))
}


func UpdatedAtLT(v time.Time) predicate.User {
	return predicate.User(sql.FieldLT(FieldUpdatedAt, v))
}


func UpdatedAtLTE(v time.Time) predicate.User {
	return predicate.User(sql.FieldLTE(FieldUpdatedAt, v))
}


func And(predicates ...predicate.User) predicate.User {
	return predicate.User(sql.AndPredicates(predicates...))
}


func Or(predicates ...predicate.User) predicate.User {
	return predicate.User(sql.OrPredicates(predicates...))
}


func Not(p predicate.User) predicate.User {
	return predicate.User(sql.NotPredicates(p))
}
