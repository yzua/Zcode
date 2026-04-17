import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, it, vi } from "@effect/vitest";
import { assertFailure } from "@effect/vitest/utils";
import type { ProviderKind } from "@t3tools/contracts";
import { Effect, Layer, Stream } from "effect";
import { ProviderUnsupportedError } from "../Errors.ts";
import type { ClaudeAdapterShape } from "../Services/ClaudeAdapter.ts";
import { ClaudeAdapter } from "../Services/ClaudeAdapter.ts";
import type { CodexAdapterShape } from "../Services/CodexAdapter.ts";
import { CodexAdapter } from "../Services/CodexAdapter.ts";
import type { GlmAdapterShape } from "../Services/GlmAdapter.ts";
import { GlmAdapter } from "../Services/GlmAdapter.ts";
import { ProviderAdapterRegistry } from "../Services/ProviderAdapterRegistry.ts";
import { ProviderAdapterRegistryLive } from "./ProviderAdapterRegistry.ts";

const fakeCodexAdapter: CodexAdapterShape = {
	provider: "codex",
	capabilities: { sessionModelSwitch: "in-session" },
	startSession: vi.fn(),
	sendTurn: vi.fn(),
	interruptTurn: vi.fn(),
	respondToRequest: vi.fn(),
	respondToUserInput: vi.fn(),
	stopSession: vi.fn(),
	listSessions: vi.fn(),
	hasSession: vi.fn(),
	readThread: vi.fn(),
	rollbackThread: vi.fn(),
	stopAll: vi.fn(),
	streamEvents: Stream.empty,
};

const fakeClaudeAdapter: ClaudeAdapterShape = {
	provider: "claudeAgent",
	capabilities: { sessionModelSwitch: "in-session" },
	startSession: vi.fn(),
	sendTurn: vi.fn(),
	interruptTurn: vi.fn(),
	respondToRequest: vi.fn(),
	respondToUserInput: vi.fn(),
	stopSession: vi.fn(),
	listSessions: vi.fn(),
	hasSession: vi.fn(),
	readThread: vi.fn(),
	rollbackThread: vi.fn(),
	stopAll: vi.fn(),
	streamEvents: Stream.empty,
};

const fakeGlmAdapter: GlmAdapterShape = {
	provider: "glmClaudeAgent",
	capabilities: { sessionModelSwitch: "in-session" },
	startSession: vi.fn(),
	sendTurn: vi.fn(),
	interruptTurn: vi.fn(),
	respondToRequest: vi.fn(),
	respondToUserInput: vi.fn(),
	stopSession: vi.fn(),
	listSessions: vi.fn(),
	hasSession: vi.fn(),
	readThread: vi.fn(),
	rollbackThread: vi.fn(),
	stopAll: vi.fn(),
	streamEvents: Stream.empty,
};

const layer = it.layer(
	Layer.mergeAll(
		Layer.provide(
			ProviderAdapterRegistryLive,
			Layer.mergeAll(
				Layer.succeed(CodexAdapter, fakeCodexAdapter),
				Layer.succeed(ClaudeAdapter, fakeClaudeAdapter),
				Layer.succeed(GlmAdapter, fakeGlmAdapter),
			),
		),
		NodeServices.layer,
	),
);

layer("ProviderAdapterRegistryLive", (it) => {
	it.effect("resolves a registered provider adapter", () =>
		Effect.gen(function* () {
			const registry = yield* ProviderAdapterRegistry;
			const codex = yield* registry.getByProvider("codex");
			const claude = yield* registry.getByProvider("claudeAgent");
			const glm = yield* registry.getByProvider("glmClaudeAgent");
			assert.equal(codex, fakeCodexAdapter);
			assert.equal(claude, fakeClaudeAdapter);
			assert.equal(glm, fakeGlmAdapter);

			const providers = yield* registry.listProviders();
			assert.deepEqual(providers, ["codex", "claudeAgent", "glmClaudeAgent"]);
		}),
	);

	it.effect("fails with ProviderUnsupportedError for unknown providers", () =>
		Effect.gen(function* () {
			const registry = yield* ProviderAdapterRegistry;
			const adapter = yield* registry
				.getByProvider("unknown" as ProviderKind)
				.pipe(Effect.result);
			assertFailure(
				adapter,
				new ProviderUnsupportedError({ provider: "unknown" }),
			);
		}),
	);
});
