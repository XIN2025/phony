

package ent

import (
	"time"

	"github.com/xin2025/go-template/internal/ent/schema"
	"github.com/xin2025/go-template/internal/ent/user"
)




func init() {
	userFields := schema.User{}.Fields()
	_ = userFields

	userDescCreatedAt := userFields[4].Descriptor()

	user.DefaultCreatedAt = userDescCreatedAt.Default.(func() time.Time)

	userDescUpdatedAt := userFields[5].Descriptor()

	user.DefaultUpdatedAt = userDescUpdatedAt.Default.(func() time.Time)

	user.UpdateDefaultUpdatedAt = userDescUpdatedAt.UpdateDefault.(func() time.Time)

	userDescID := userFields[0].Descriptor()

	user.IDValidator = userDescID.Validators[0].(func(int) error)
}
