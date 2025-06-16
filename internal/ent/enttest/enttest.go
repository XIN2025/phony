

package enttest

import (
	"context"

	"github.com/xin2025/go-template/internal/ent"

	_ "github.com/xin2025/go-template/internal/ent/runtime"

	"entgo.io/ent/dialect/sql/schema"
	"github.com/xin2025/go-template/internal/ent/migrate"
)

type (


	TestingT interface {
		FailNow()
		Error(...any)
	}


	Option func(*options)

	options struct {
		opts        []ent.Option
		migrateOpts []schema.MigrateOption
	}
)


func WithOptions(opts ...ent.Option) Option {
	return func(o *options) {
		o.opts = append(o.opts, opts...)
	}
}


func WithMigrateOptions(opts ...schema.MigrateOption) Option {
	return func(o *options) {
		o.migrateOpts = append(o.migrateOpts, opts...)
	}
}

func newOptions(opts []Option) *options {
	o := &options{}
	for _, opt := range opts {
		opt(o)
	}
	return o
}


func Open(t TestingT, driverName, dataSourceName string, opts ...Option) *ent.Client {
	o := newOptions(opts)
	c, err := ent.Open(driverName, dataSourceName, o.opts...)
	if err != nil {
		t.Error(err)
		t.FailNow()
	}
	migrateSchema(t, c, o)
	return c
}


func NewClient(t TestingT, opts ...Option) *ent.Client {
	o := newOptions(opts)
	c := ent.NewClient(o.opts...)
	migrateSchema(t, c, o)
	return c
}
func migrateSchema(t TestingT, c *ent.Client, o *options) {
	tables, err := schema.CopyTables(migrate.Tables)
	if err != nil {
		t.Error(err)
		t.FailNow()
	}
	if err := migrate.Create(context.Background(), c.Schema, tables, o.migrateOpts...); err != nil {
		t.Error(err)
		t.FailNow()
	}
}
