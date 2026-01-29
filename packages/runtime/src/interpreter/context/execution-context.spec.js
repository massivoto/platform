"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var core_context_1 = require("./core-context");
var scope_chain_1 = require("../evaluator/scope-chain");
/**
 * Test file: execution-context.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Note: ActionLog tests are now in action-log.spec.ts
 */
(0, vitest_1.describe)('ExecutionContext', function () {
    (0, vitest_1.describe)('createEmptyExecutionContext', function () {
        (0, vitest_1.it)('should initialize with user id', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            (0, vitest_1.expect)(context.user.id).toBe('emma-123');
        });
        (0, vitest_1.it)('should initialize meta with updatedAt', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('carlos-456');
            (0, vitest_1.expect)(context.meta.updatedAt).toBeDefined();
        });
    });
    (0, vitest_1.describe)('cloneExecutionContext', function () {
        (0, vitest_1.it)('should clone data independently', function () {
            var original = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            original.data.followers = 1500;
            var cloned = (0, core_context_1.cloneExecutionContext)(original);
            cloned.data.followers = 2000;
            (0, vitest_1.expect)(original.data.followers).toBe(1500);
            (0, vitest_1.expect)(cloned.data.followers).toBe(2000);
        });
    });
});
/**
 * Tests for ScopeChain in ExecutionContext (R-SCOPE-01 to R-SCOPE-04)
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 */
(0, vitest_1.describe)('ExecutionContext ScopeChain', function () {
    (0, vitest_1.describe)('R-SCOPE-01: ExecutionContext has scopeChain property', function () {
        (0, vitest_1.it)('should have scopeChain property', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            (0, vitest_1.expect)(context.scopeChain).toBeDefined();
            (0, vitest_1.expect)(context.scopeChain.current).toBeDefined();
        });
    });
    (0, vitest_1.describe)('R-SCOPE-02: createEmptyExecutionContext initializes scopeChain', function () {
        (0, vitest_1.it)('should initialize scopeChain to { current: {} }', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            (0, vitest_1.expect)(context.scopeChain).toEqual({ current: {} });
            (0, vitest_1.expect)(context.scopeChain.parent).toBeUndefined();
        });
        (0, vitest_1.it)('should have empty current scope', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('carlos-456');
            (0, vitest_1.expect)(Object.keys(context.scopeChain.current)).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('R-SCOPE-03: cloneExecutionContext deep-clones scopeChain', function () {
        (0, vitest_1.it)('should deep clone scopeChain', function () {
            var original = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            original.scopeChain.current.user = 'Emma';
            var cloned = (0, core_context_1.cloneExecutionContext)(original);
            // Different object references
            (0, vitest_1.expect)(cloned.scopeChain).not.toBe(original.scopeChain);
            (0, vitest_1.expect)(cloned.scopeChain.current).not.toBe(original.scopeChain.current);
            // Same values
            (0, vitest_1.expect)(cloned.scopeChain.current.user).toBe('Emma');
        });
        (0, vitest_1.it)('should preserve parent chain in clone', function () {
            var _a;
            var original = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            var parent = (0, scope_chain_1.createEmptyScopeChain)();
            parent.current.globalUser = 'Admin';
            var child = (0, scope_chain_1.pushScope)(parent);
            child.current.user = 'Emma';
            original.scopeChain = child;
            var cloned = (0, core_context_1.cloneExecutionContext)(original);
            // Verify parent chain preserved
            (0, vitest_1.expect)(cloned.scopeChain.current.user).toBe('Emma');
            (0, vitest_1.expect)((_a = cloned.scopeChain.parent) === null || _a === void 0 ? void 0 : _a.current.globalUser).toBe('Admin');
            // Verify independence
            cloned.scopeChain.current.user = 'Carlos';
            (0, vitest_1.expect)(original.scopeChain.current.user).toBe('Emma');
        });
        (0, vitest_1.it)('should allow independent modification after clone', function () {
            var original = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            original.scopeChain.current.tweet = 'Hello!';
            var cloned = (0, core_context_1.cloneExecutionContext)(original);
            cloned.scopeChain.current.tweet = 'Goodbye!';
            cloned.scopeChain.current.newKey = 'New value';
            (0, vitest_1.expect)(original.scopeChain.current.tweet).toBe('Hello!');
            (0, vitest_1.expect)(original.scopeChain.current.newKey).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('R-SCOPE-04: fromPartialContext handles optional scopeChain', function () {
        (0, vitest_1.it)('should use provided scopeChain', function () {
            var customScopeChain = (0, scope_chain_1.createEmptyScopeChain)();
            customScopeChain.current.user = 'Emma';
            customScopeChain.current.followers = 1500;
            var context = (0, core_context_1.fromPartialContext)({
                scopeChain: customScopeChain,
            });
            (0, vitest_1.expect)(context.scopeChain.current.user).toBe('Emma');
            (0, vitest_1.expect)(context.scopeChain.current.followers).toBe(1500);
        });
        (0, vitest_1.it)('should create empty scopeChain when not provided', function () {
            var context = (0, core_context_1.fromPartialContext)({
                data: { someData: 'value' },
            });
            (0, vitest_1.expect)(context.scopeChain).toBeDefined();
            (0, vitest_1.expect)(context.scopeChain.current).toEqual({});
        });
        (0, vitest_1.it)('should handle partial context with nested scopeChain', function () {
            var _a;
            var parent = (0, scope_chain_1.createEmptyScopeChain)();
            parent.current.outer = 'outer-value';
            var child = (0, scope_chain_1.pushScope)(parent);
            child.current.inner = 'inner-value';
            var context = (0, core_context_1.fromPartialContext)({
                scopeChain: child,
                user: { id: 'carlos-456', extra: {} },
            });
            (0, vitest_1.expect)(context.scopeChain.current.inner).toBe('inner-value');
            (0, vitest_1.expect)((_a = context.scopeChain.parent) === null || _a === void 0 ? void 0 : _a.current.outer).toBe('outer-value');
        });
    });
});
/**
 * Tests for new ExecutionContext fields (R-CONFIRM-121 to R-CONFIRM-123)
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * These fields support the @human/confirm handler and program status tracking.
 */
(0, vitest_1.describe)('ExecutionContext Runtime Fields', function () {
    (0, vitest_1.describe)('R-CONFIRM-121: userLogs field', function () {
        (0, vitest_1.it)('should have userLogs field initialized to empty array', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            (0, vitest_1.expect)(context.userLogs).toBeDefined();
            (0, vitest_1.expect)(context.userLogs).toEqual([]);
        });
        (0, vitest_1.it)('should allow appending to userLogs', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            context.userLogs.push('Tweet posted by Emma');
            context.userLogs.push('Carlos liked the tweet');
            (0, vitest_1.expect)(context.userLogs).toHaveLength(2);
            (0, vitest_1.expect)(context.userLogs[0]).toBe('Tweet posted by Emma');
            (0, vitest_1.expect)(context.userLogs[1]).toBe('Carlos liked the tweet');
        });
        (0, vitest_1.it)('should clone userLogs independently', function () {
            var original = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            original.userLogs.push('Original log entry');
            var cloned = (0, core_context_1.cloneExecutionContext)(original);
            cloned.userLogs.push('Cloned log entry');
            (0, vitest_1.expect)(original.userLogs).toHaveLength(1);
            (0, vitest_1.expect)(cloned.userLogs).toHaveLength(2);
        });
        (0, vitest_1.it)('should preserve userLogs in fromPartialContext', function () {
            var context = (0, core_context_1.fromPartialContext)({
                userLogs: ['Previous log', 'Another log'],
            });
            (0, vitest_1.expect)(context.userLogs).toEqual(['Previous log', 'Another log']);
        });
        (0, vitest_1.it)('should initialize userLogs to empty when not provided in partial', function () {
            var context = (0, core_context_1.fromPartialContext)({
                data: { tweet: 'Hello world' },
            });
            (0, vitest_1.expect)(context.userLogs).toEqual([]);
        });
    });
    (0, vitest_1.describe)('R-CONFIRM-122: status field', function () {
        (0, vitest_1.it)('should have status field initialized to running', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            (0, vitest_1.expect)(context.status).toBe('running');
        });
        (0, vitest_1.it)('should allow setting status to waitingHumanValidation', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            context.status = 'waitingHumanValidation';
            (0, vitest_1.expect)(context.status).toBe('waitingHumanValidation');
        });
        (0, vitest_1.it)('should allow setting status to finished', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            context.status = 'finished';
            (0, vitest_1.expect)(context.status).toBe('finished');
        });
        (0, vitest_1.it)('should allow setting status to error', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            context.status = 'error';
            (0, vitest_1.expect)(context.status).toBe('error');
        });
        (0, vitest_1.it)('should clone status independently', function () {
            var original = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            original.status = 'waitingHumanValidation';
            var cloned = (0, core_context_1.cloneExecutionContext)(original);
            cloned.status = 'finished';
            (0, vitest_1.expect)(original.status).toBe('waitingHumanValidation');
            (0, vitest_1.expect)(cloned.status).toBe('finished');
        });
        (0, vitest_1.it)('should preserve status in fromPartialContext', function () {
            var context = (0, core_context_1.fromPartialContext)({
                status: 'waitingHumanValidation',
            });
            (0, vitest_1.expect)(context.status).toBe('waitingHumanValidation');
        });
        (0, vitest_1.it)('should initialize status to running when not provided in partial', function () {
            var context = (0, core_context_1.fromPartialContext)({
                data: { tweet: 'Hello world' },
            });
            (0, vitest_1.expect)(context.status).toBe('running');
        });
    });
    (0, vitest_1.describe)('R-CONFIRM-123: appletLauncher field', function () {
        (0, vitest_1.it)('should have appletLauncher field as undefined by default', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            (0, vitest_1.expect)(context.appletLauncher).toBeUndefined();
        });
        (0, vitest_1.it)('should allow setting appletLauncher', function () {
            var context = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            var mockLauncher = {
                launch: vitest_1.vi.fn().mockResolvedValue({
                    id: 'instance-1',
                    url: 'http://localhost:3000',
                    appletId: 'confirm',
                    terminator: { terminate: vitest_1.vi.fn(), isTerminated: false },
                    waitForResponse: vitest_1.vi.fn(),
                }),
            };
            context.appletLauncher = mockLauncher;
            (0, vitest_1.expect)(context.appletLauncher).toBe(mockLauncher);
        });
        (0, vitest_1.it)('should preserve appletLauncher reference in clone (not deep copied)', function () {
            var original = (0, core_context_1.createEmptyExecutionContext)('emma-123');
            var mockLauncher = {
                launch: vitest_1.vi.fn(),
            };
            original.appletLauncher = mockLauncher;
            var cloned = (0, core_context_1.cloneExecutionContext)(original);
            // AppletLauncher is a stateful service, should be same reference
            (0, vitest_1.expect)(cloned.appletLauncher).toBe(mockLauncher);
        });
        (0, vitest_1.it)('should preserve appletLauncher in fromPartialContext', function () {
            var mockLauncher = {
                launch: vitest_1.vi.fn(),
            };
            var context = (0, core_context_1.fromPartialContext)({
                appletLauncher: mockLauncher,
            });
            (0, vitest_1.expect)(context.appletLauncher).toBe(mockLauncher);
        });
    });
});
