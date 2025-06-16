

package migrate

import (
	"context"
	"fmt"
	"io"

	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/sql/schema"
)

var (




	WithGlobalUniqueID = schema.WithGlobalUniqueID



	WithDropColumn = schema.WithDropColumn






	WithDropIndex = schema.WithDropIndex

	WithForeignKeys = schema.WithForeignKeys
)


type Schema struct {
	drv dialect.Driver
}


func NewSchema(drv dialect.Driver) *Schema { return &Schema{drv: drv} }


func (s *Schema) Create(ctx context.Context, opts ...schema.MigrateOption) error {
	return Create(ctx, s, Tables, opts...)
}


func Create(ctx context.Context, s *Schema, tables []*schema.Table, opts ...schema.MigrateOption) error {
	migrate, err := schema.NewMigrate(s.drv, opts...)
	if err != nil {
		return fmt.Errorf("ent/migrate: %w", err)
	}
	return migrate.Create(ctx, tables...)
}






func (s *Schema) WriteTo(ctx context.Context, w io.Writer, opts ...schema.MigrateOption) error {
	return Create(ctx, &Schema{drv: &schema.WriteDriver{Writer: w, Driver: s.drv}}, Tables, opts...)
}
