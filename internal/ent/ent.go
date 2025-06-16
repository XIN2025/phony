

package ent

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"sync"

	"entgo.io/ent"
	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
	"github.com/xin2025/go-template/internal/ent/user"
)


type (
	Op            = ent.Op
	Hook          = ent.Hook
	Value         = ent.Value
	Query         = ent.Query
	QueryContext  = ent.QueryContext
	Querier       = ent.Querier
	QuerierFunc   = ent.QuerierFunc
	Interceptor   = ent.Interceptor
	InterceptFunc = ent.InterceptFunc
	Traverser     = ent.Traverser
	TraverseFunc  = ent.TraverseFunc
	Policy        = ent.Policy
	Mutator       = ent.Mutator
	Mutation      = ent.Mutation
	MutateFunc    = ent.MutateFunc
)

type clientCtxKey struct{}


func FromContext(ctx context.Context) *Client {
	c, _ := ctx.Value(clientCtxKey{}).(*Client)
	return c
}


func NewContext(parent context.Context, c *Client) context.Context {
	return context.WithValue(parent, clientCtxKey{}, c)
}

type txCtxKey struct{}


func TxFromContext(ctx context.Context) *Tx {
	tx, _ := ctx.Value(txCtxKey{}).(*Tx)
	return tx
}


func NewTxContext(parent context.Context, tx *Tx) context.Context {
	return context.WithValue(parent, txCtxKey{}, tx)
}



type OrderFunc func(*sql.Selector)

var (
	initCheck   sync.Once
	columnCheck sql.ColumnCheck
)


func checkColumn(table, column string) error {
	initCheck.Do(func() {
		columnCheck = sql.NewColumnCheck(map[string]func(string) bool{
			user.Table: user.ValidColumn,
		})
	})
	return columnCheck(table, column)
}


func Asc(fields ...string) func(*sql.Selector) {
	return func(s *sql.Selector) {
		for _, f := range fields {
			if err := checkColumn(s.TableName(), f); err != nil {
				s.AddError(&ValidationError{Name: f, err: fmt.Errorf("ent: %w", err)})
			}
			s.OrderBy(sql.Asc(s.C(f)))
		}
	}
}


func Desc(fields ...string) func(*sql.Selector) {
	return func(s *sql.Selector) {
		for _, f := range fields {
			if err := checkColumn(s.TableName(), f); err != nil {
				s.AddError(&ValidationError{Name: f, err: fmt.Errorf("ent: %w", err)})
			}
			s.OrderBy(sql.Desc(s.C(f)))
		}
	}
}


type AggregateFunc func(*sql.Selector) string






func As(fn AggregateFunc, end string) AggregateFunc {
	return func(s *sql.Selector) string {
		return sql.As(fn(s), end)
	}
}


func Count() AggregateFunc {
	return func(s *sql.Selector) string {
		return sql.Count("*")
	}
}


func Max(field string) AggregateFunc {
	return func(s *sql.Selector) string {
		if err := checkColumn(s.TableName(), field); err != nil {
			s.AddError(&ValidationError{Name: field, err: fmt.Errorf("ent: %w", err)})
			return ""
		}
		return sql.Max(s.C(field))
	}
}


func Mean(field string) AggregateFunc {
	return func(s *sql.Selector) string {
		if err := checkColumn(s.TableName(), field); err != nil {
			s.AddError(&ValidationError{Name: field, err: fmt.Errorf("ent: %w", err)})
			return ""
		}
		return sql.Avg(s.C(field))
	}
}


func Min(field string) AggregateFunc {
	return func(s *sql.Selector) string {
		if err := checkColumn(s.TableName(), field); err != nil {
			s.AddError(&ValidationError{Name: field, err: fmt.Errorf("ent: %w", err)})
			return ""
		}
		return sql.Min(s.C(field))
	}
}


func Sum(field string) AggregateFunc {
	return func(s *sql.Selector) string {
		if err := checkColumn(s.TableName(), field); err != nil {
			s.AddError(&ValidationError{Name: field, err: fmt.Errorf("ent: %w", err)})
			return ""
		}
		return sql.Sum(s.C(field))
	}
}


type ValidationError struct {
	Name string 
	err  error
}


func (e *ValidationError) Error() string {
	return e.err.Error()
}


func (e *ValidationError) Unwrap() error {
	return e.err
}


func IsValidationError(err error) bool {
	if err == nil {
		return false
	}
	var e *ValidationError
	return errors.As(err, &e)
}


type NotFoundError struct {
	label string
}


func (e *NotFoundError) Error() string {
	return "ent: " + e.label + " not found"
}


func IsNotFound(err error) bool {
	if err == nil {
		return false
	}
	var e *NotFoundError
	return errors.As(err, &e)
}


func MaskNotFound(err error) error {
	if IsNotFound(err) {
		return nil
	}
	return err
}


type NotSingularError struct {
	label string
}


func (e *NotSingularError) Error() string {
	return "ent: " + e.label + " not singular"
}


func IsNotSingular(err error) bool {
	if err == nil {
		return false
	}
	var e *NotSingularError
	return errors.As(err, &e)
}


type NotLoadedError struct {
	edge string
}


func (e *NotLoadedError) Error() string {
	return "ent: " + e.edge + " edge was not loaded"
}


func IsNotLoaded(err error) bool {
	if err == nil {
		return false
	}
	var e *NotLoadedError
	return errors.As(err, &e)
}




type ConstraintError struct {
	msg  string
	wrap error
}


func (e ConstraintError) Error() string {
	return "ent: constraint failed: " + e.msg
}


func (e *ConstraintError) Unwrap() error {
	return e.wrap
}


func IsConstraintError(err error) bool {
	if err == nil {
		return false
	}
	var e *ConstraintError
	return errors.As(err, &e)
}


type selector struct {
	label string
	flds  *[]string
	fns   []AggregateFunc
	scan  func(context.Context, any) error
}


func (s *selector) ScanX(ctx context.Context, v any) {
	if err := s.scan(ctx, v); err != nil {
		panic(err)
	}
}


func (s *selector) Strings(ctx context.Context) ([]string, error) {
	if len(*s.flds) > 1 {
		return nil, errors.New("ent: Strings is not achievable when selecting more than 1 field")
	}
	var v []string
	if err := s.scan(ctx, &v); err != nil {
		return nil, err
	}
	return v, nil
}


func (s *selector) StringsX(ctx context.Context) []string {
	v, err := s.Strings(ctx)
	if err != nil {
		panic(err)
	}
	return v
}


func (s *selector) String(ctx context.Context) (_ string, err error) {
	var v []string
	if v, err = s.Strings(ctx); err != nil {
		return
	}
	switch len(v) {
	case 1:
		return v[0], nil
	case 0:
		err = &NotFoundError{s.label}
	default:
		err = fmt.Errorf("ent: Strings returned %d results when one was expected", len(v))
	}
	return
}


func (s *selector) StringX(ctx context.Context) string {
	v, err := s.String(ctx)
	if err != nil {
		panic(err)
	}
	return v
}


func (s *selector) Ints(ctx context.Context) ([]int, error) {
	if len(*s.flds) > 1 {
		return nil, errors.New("ent: Ints is not achievable when selecting more than 1 field")
	}
	var v []int
	if err := s.scan(ctx, &v); err != nil {
		return nil, err
	}
	return v, nil
}


func (s *selector) IntsX(ctx context.Context) []int {
	v, err := s.Ints(ctx)
	if err != nil {
		panic(err)
	}
	return v
}


func (s *selector) Int(ctx context.Context) (_ int, err error) {
	var v []int
	if v, err = s.Ints(ctx); err != nil {
		return
	}
	switch len(v) {
	case 1:
		return v[0], nil
	case 0:
		err = &NotFoundError{s.label}
	default:
		err = fmt.Errorf("ent: Ints returned %d results when one was expected", len(v))
	}
	return
}


func (s *selector) IntX(ctx context.Context) int {
	v, err := s.Int(ctx)
	if err != nil {
		panic(err)
	}
	return v
}


func (s *selector) Float64s(ctx context.Context) ([]float64, error) {
	if len(*s.flds) > 1 {
		return nil, errors.New("ent: Float64s is not achievable when selecting more than 1 field")
	}
	var v []float64
	if err := s.scan(ctx, &v); err != nil {
		return nil, err
	}
	return v, nil
}


func (s *selector) Float64sX(ctx context.Context) []float64 {
	v, err := s.Float64s(ctx)
	if err != nil {
		panic(err)
	}
	return v
}


func (s *selector) Float64(ctx context.Context) (_ float64, err error) {
	var v []float64
	if v, err = s.Float64s(ctx); err != nil {
		return
	}
	switch len(v) {
	case 1:
		return v[0], nil
	case 0:
		err = &NotFoundError{s.label}
	default:
		err = fmt.Errorf("ent: Float64s returned %d results when one was expected", len(v))
	}
	return
}


func (s *selector) Float64X(ctx context.Context) float64 {
	v, err := s.Float64(ctx)
	if err != nil {
		panic(err)
	}
	return v
}


func (s *selector) Bools(ctx context.Context) ([]bool, error) {
	if len(*s.flds) > 1 {
		return nil, errors.New("ent: Bools is not achievable when selecting more than 1 field")
	}
	var v []bool
	if err := s.scan(ctx, &v); err != nil {
		return nil, err
	}
	return v, nil
}


func (s *selector) BoolsX(ctx context.Context) []bool {
	v, err := s.Bools(ctx)
	if err != nil {
		panic(err)
	}
	return v
}


func (s *selector) Bool(ctx context.Context) (_ bool, err error) {
	var v []bool
	if v, err = s.Bools(ctx); err != nil {
		return
	}
	switch len(v) {
	case 1:
		return v[0], nil
	case 0:
		err = &NotFoundError{s.label}
	default:
		err = fmt.Errorf("ent: Bools returned %d results when one was expected", len(v))
	}
	return
}


func (s *selector) BoolX(ctx context.Context) bool {
	v, err := s.Bool(ctx)
	if err != nil {
		panic(err)
	}
	return v
}


func withHooks[V Value, M any, PM interface {
	*M
	Mutation
}](ctx context.Context, exec func(context.Context) (V, error), mutation PM, hooks []Hook) (value V, err error) {
	if len(hooks) == 0 {
		return exec(ctx)
	}
	var mut Mutator = MutateFunc(func(ctx context.Context, m Mutation) (Value, error) {
		mutationT, ok := any(m).(PM)
		if !ok {
			return nil, fmt.Errorf("unexpected mutation type %T", m)
		}

		*mutation = *mutationT
		return exec(ctx)
	})
	for i := len(hooks) - 1; i >= 0; i-- {
		if hooks[i] == nil {
			return value, fmt.Errorf("ent: uninitialized hook (forgotten import ent/runtime?)")
		}
		mut = hooks[i](mut)
	}
	v, err := mut.Mutate(ctx, mutation)
	if err != nil {
		return value, err
	}
	nv, ok := v.(V)
	if !ok {
		return value, fmt.Errorf("unexpected node type %T returned from %T", v, mutation)
	}
	return nv, nil
}


func setContextOp(ctx context.Context, qc *QueryContext, op string) context.Context {
	if ent.QueryFromContext(ctx) == nil {
		qc.Op = op
		ctx = ent.NewQueryContext(ctx, qc)
	}
	return ctx
}

func querierAll[V Value, Q interface {
	sqlAll(context.Context, ...queryHook) (V, error)
}]() Querier {
	return QuerierFunc(func(ctx context.Context, q Query) (Value, error) {
		query, ok := q.(Q)
		if !ok {
			return nil, fmt.Errorf("unexpected query type %T", q)
		}
		return query.sqlAll(ctx)
	})
}

func querierCount[Q interface {
	sqlCount(context.Context) (int, error)
}]() Querier {
	return QuerierFunc(func(ctx context.Context, q Query) (Value, error) {
		query, ok := q.(Q)
		if !ok {
			return nil, fmt.Errorf("unexpected query type %T", q)
		}
		return query.sqlCount(ctx)
	})
}

func withInterceptors[V Value](ctx context.Context, q Query, qr Querier, inters []Interceptor) (v V, err error) {
	for i := len(inters) - 1; i >= 0; i-- {
		qr = inters[i].Intercept(qr)
	}
	rv, err := qr.Query(ctx, q)
	if err != nil {
		return v, err
	}
	vt, ok := rv.(V)
	if !ok {
		return v, fmt.Errorf("unexpected type %T returned from %T. expected type: %T", vt, q, v)
	}
	return vt, nil
}

func scanWithInterceptors[Q1 ent.Query, Q2 interface {
	sqlScan(context.Context, Q1, any) error
}](ctx context.Context, rootQuery Q1, selectOrGroup Q2, inters []Interceptor, v any) error {
	rv := reflect.ValueOf(v)
	var qr Querier = QuerierFunc(func(ctx context.Context, q Query) (Value, error) {
		query, ok := q.(Q1)
		if !ok {
			return nil, fmt.Errorf("unexpected query type %T", q)
		}
		if err := selectOrGroup.sqlScan(ctx, query, v); err != nil {
			return nil, err
		}
		if k := rv.Kind(); k == reflect.Pointer && rv.Elem().CanInterface() {
			return rv.Elem().Interface(), nil
		}
		return v, nil
	})
	for i := len(inters) - 1; i >= 0; i-- {
		qr = inters[i].Intercept(qr)
	}
	vv, err := qr.Query(ctx, rootQuery)
	if err != nil {
		return err
	}
	switch rv2 := reflect.ValueOf(vv); {
	case rv.IsNil(), rv2.IsNil(), rv.Kind() != reflect.Pointer:
	case rv.Type() == rv2.Type():
		rv.Elem().Set(rv2.Elem())
	case rv.Elem().Type() == rv2.Type():
		rv.Elem().Set(rv2)
	}
	return nil
}


type queryHook func(context.Context, *sqlgraph.QuerySpec)
