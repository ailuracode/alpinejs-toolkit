/**
 * Core-primitive controller tests — covers {@link ToolkitError},
 * {@link EventEmitter}, {@link CleanupStack}, and
 * {@link InstanceRegistry} in isolation. These classes are the foundation
 * that every feature package's controller is built on, so their contracts
 * must be locked down by tests.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { CleanupStack, EventEmitter, InstanceRegistry, ToolkitError } from '../src/index';

describe('ToolkitError', () => {
    it('exposes a stable code and inherits from Error', () => {
        const error = new ToolkitError(
            'plugin "x" is already registered',
            'PLUGIN_DUPLICATE',
        );

        assert.ok(error instanceof Error);
        assert.ok(error instanceof ToolkitError);
        assert.equal(error.name, 'PLUGIN_DUPLICATE');
        assert.equal(error.code, 'PLUGIN_DUPLICATE');
        assert.equal(error.message, 'plugin "x" is already registered');
    });

    it('preserves the original error as cause when provided', () => {
        const original = new Error('boom');
        const wrapped = new ToolkitError(
            'loader failed',
            'PLUGIN_LOADER_INVALID',
            original,
        );

        assert.equal(wrapped.cause, original);
    });

    it('keeps `instanceof ToolkitError` working after throw', () => {
        try {
            throw new ToolkitError(
                'gone',
                'CONTROLLER_DESTROYED',
            );
        } catch (caught) {
            assert.ok(caught instanceof ToolkitError);
            assert.equal((caught as ToolkitError).code, 'CONTROLLER_DESTROYED');
        }
    });
});

describe('EventEmitter', () => {
    it('dispatches events to on() listeners with full type narrowing', () => {
        const events = new EventEmitter<{ change: number; close: string }>();
        let received = 0;

        events.on('change', (value) => {
            received = value;
        });

        events.emit('change', 42);
        assert.equal(received, 42);
    });

    it('off() removes a previously registered listener', () => {
        const events = new EventEmitter<{ ping: undefined }>();
        let calls = 0;
        const listener = (): void => {
            calls += 1;
        };

        events.on('ping', listener);
        events.emit('ping', undefined);
        events.off('ping', listener);
        events.emit('ping', undefined);

        assert.equal(calls, 1);
    });

    it('once() fires exactly one time per registration', () => {
        const events = new EventEmitter<{ ping: undefined }>();
        let calls = 0;

        events.once('ping', () => {
            calls += 1;
        });
        events.emit('ping', undefined);
        events.emit('ping', undefined);

        assert.equal(calls, 1);
    });

    it('removeAllListeners() empties every registration', () => {
        const events = new EventEmitter<{ a: undefined; b: undefined }>();
        let a = 0;
        let b = 0;

        events.on('a', () => {
            a += 1;
        });
        events.on('b', () => {
            b += 1;
        });

        events.removeAllListeners();
        events.emit('a', undefined);
        events.emit('b', undefined);

        assert.equal(a, 0);
        assert.equal(b, 0);
        assert.equal(events.listenerCount(), 0);
    });

    it('listenerCount() reports the active subscriptions', () => {
        const events = new EventEmitter<{ tick: undefined }>();
        assert.equal(events.listenerCount('tick'), 0);

        const unsubscribe = events.on('tick', () => undefined);
        assert.equal(events.listenerCount('tick'), 1);
        assert.equal(events.listenerCount(), 1);

        unsubscribe();
        assert.equal(events.listenerCount('tick'), 0);
    });

    it('snapshot iteration keeps `off()` calls inside listeners deterministic', () => {
        const events = new EventEmitter<{ ping: undefined }>();
        let calls = 0;
        const self = events.on('ping', () => {
            calls += 1;
            self();
        });

        events.emit('ping', undefined);
        events.emit('ping', undefined);

        assert.equal(calls, 1);
    });
});

describe('CleanupStack', () => {
    it('runs cleanups in LIFO order on dispose()', () => {
        const stack = new CleanupStack();
        const order: number[] = [];

        stack.push(() => {
            order.push(1);
        });
        stack.push(() => {
            order.push(2);
        });
        stack.push(() => {
            order.push(3);
        });

        stack.dispose();
        assert.deepEqual(order, [3, 2, 1]);
        assert.equal(stack.disposed, true);
        assert.equal(stack.size, 0);
    });

    it('dispose() is idempotent', () => {
        const stack = new CleanupStack();
        let calls = 0;

        stack.push(() => {
            calls += 1;
        });
        stack.dispose();
        stack.dispose();

        assert.equal(calls, 1);
    });

    it('runs cleanups eagerly when pushed after dispose()', () => {
        const stack = new CleanupStack();
        let calls = 0;

        stack.dispose();
        stack.push(() => {
            calls += 1;
        });

        assert.equal(calls, 1);
        assert.equal(stack.disposed, true);
    });

    it('wraps the first cleanup error in a ToolkitError and continues running the rest', () => {
        const stack = new CleanupStack();
        const order: string[] = [];

        stack.push(() => {
            order.push('first');
        });
        stack.push(() => {
            order.push('throws');
            throw new Error('boom');
        });
        stack.push(() => {
            order.push('third');
        });

        assert.throws(
            () => stack.dispose(),
            (error: unknown) => {
                assert.ok(error instanceof ToolkitError);
                assert.equal((error as ToolkitError).code, 'TOOLKIT_INVALID_STATE');
                assert.ok((error as ToolkitError).cause instanceof Error);
                return true;
            },
        );

        assert.deepEqual(order, ['third', 'throws', 'first']);
    });
});

describe('InstanceRegistry', () => {
    interface Instance {
        readonly id: string;
    }

    it('stores and retrieves instances by id', () => {
        const registry = new InstanceRegistry<Instance>();
        const a = { id: 'a' };
        const b = { id: 'b' };

        registry.register('a', a);
        registry.register('b', b);

        assert.equal(registry.get('a'), a);
        assert.equal(registry.has('b'), true);
        assert.equal(registry.size, 2);
    });

    it('throws ToolkitError on duplicate registration', () => {
        const registry = new InstanceRegistry<Instance>();

        registry.register('a', { id: 'a' });
        assert.throws(
            () => registry.register('a', { id: 'a' }),
            (error: unknown) => {
                assert.ok(error instanceof ToolkitError);
                assert.equal((error as ToolkitError).code, 'TOOLKIT_INVALID_STATE');
                return true;
            },
        );
    });

    it('unregister() returns whether the id was known', () => {
        const registry = new InstanceRegistry<Instance>();
        registry.register('a', { id: 'a' });

        assert.equal(registry.unregister('a'), true);
        assert.equal(registry.unregister('a'), false);
    });

    it('entries() returns id+instance pairs in registration order', () => {
        const registry = new InstanceRegistry<Instance>();
        const a = { id: 'a' };
        const b = { id: 'b' };

        registry.register('a', a);
        registry.register('b', b);

        assert.deepEqual(registry.entries(), [
            { id: 'a', instance: a },
            { id: 'b', instance: b },
        ]);
    });

    it('clear() removes every instance', () => {
        const registry = new InstanceRegistry<Instance>();
        registry.register('a', { id: 'a' });
        registry.register('b', { id: 'b' });

        registry.clear();

        assert.equal(registry.size, 0);
        assert.equal(registry.get('a'), undefined);
    });
});
