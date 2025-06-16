

package ent

import (
	"context"
	"sync"

	"entgo.io/ent/dialect"
)


type Tx struct {
	config

	User *UserClient


	client     *Client
	clientOnce sync.Once


	ctx context.Context
}

type (

	Committer interface {
		Commit(context.Context, *Tx) error
	}




	CommitFunc func(context.Context, *Tx) error















	CommitHook func(Committer) Committer
)


func (f CommitFunc) Commit(ctx context.Context, tx *Tx) error {
	return f(ctx, tx)
}


func (tx *Tx) Commit() error {
	txDriver := tx.config.driver.(*txDriver)
	var fn Committer = CommitFunc(func(context.Context, *Tx) error {
		return txDriver.tx.Commit()
	})
	txDriver.mu.Lock()
	hooks := append([]CommitHook(nil), txDriver.onCommit...)
	txDriver.mu.Unlock()
	for i := len(hooks) - 1; i >= 0; i-- {
		fn = hooks[i](fn)
	}
	return fn.Commit(tx.ctx, tx)
}


func (tx *Tx) OnCommit(f CommitHook) {
	txDriver := tx.config.driver.(*txDriver)
	txDriver.mu.Lock()
	txDriver.onCommit = append(txDriver.onCommit, f)
	txDriver.mu.Unlock()
}

type (

	Rollbacker interface {
		Rollback(context.Context, *Tx) error
	}




	RollbackFunc func(context.Context, *Tx) error















	RollbackHook func(Rollbacker) Rollbacker
)


func (f RollbackFunc) Rollback(ctx context.Context, tx *Tx) error {
	return f(ctx, tx)
}


func (tx *Tx) Rollback() error {
	txDriver := tx.config.driver.(*txDriver)
	var fn Rollbacker = RollbackFunc(func(context.Context, *Tx) error {
		return txDriver.tx.Rollback()
	})
	txDriver.mu.Lock()
	hooks := append([]RollbackHook(nil), txDriver.onRollback...)
	txDriver.mu.Unlock()
	for i := len(hooks) - 1; i >= 0; i-- {
		fn = hooks[i](fn)
	}
	return fn.Rollback(tx.ctx, tx)
}


func (tx *Tx) OnRollback(f RollbackHook) {
	txDriver := tx.config.driver.(*txDriver)
	txDriver.mu.Lock()
	txDriver.onRollback = append(txDriver.onRollback, f)
	txDriver.mu.Unlock()
}


func (tx *Tx) Client() *Client {
	tx.clientOnce.Do(func() {
		tx.client = &Client{config: tx.config}
		tx.client.init()
	})
	return tx.client
}

func (tx *Tx) init() {
	tx.User = NewUserClient(tx.config)
}












type txDriver struct {

	drv dialect.Driver

	tx dialect.Tx

	mu         sync.Mutex
	onCommit   []CommitHook
	onRollback []RollbackHook
}


func newTx(ctx context.Context, drv dialect.Driver) (*txDriver, error) {
	tx, err := drv.Tx(ctx)
	if err != nil {
		return nil, err
	}
	return &txDriver{tx: tx, drv: drv}, nil
}



func (tx *txDriver) Tx(context.Context) (dialect.Tx, error) { return tx, nil }


func (tx *txDriver) Dialect() string { return tx.drv.Dialect() }


func (*txDriver) Close() error { return nil }



func (*txDriver) Commit() error { return nil }



func (*txDriver) Rollback() error { return nil }


func (tx *txDriver) Exec(ctx context.Context, query string, args, v any) error {
	return tx.tx.Exec(ctx, query, args, v)
}


func (tx *txDriver) Query(ctx context.Context, query string, args, v any) error {
	return tx.tx.Query(ctx, query, args, v)
}

var _ dialect.Driver = (*txDriver)(nil)
