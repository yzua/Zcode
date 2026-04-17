/**
 * GlmAdapter - GLM (Z.AI) implementation of the generic provider adapter contract.
 *
 * Wraps `@anthropic-ai/claude-agent-sdk` query sessions behind the generic
 * provider adapter contract and emits canonical runtime events, using Z.AI's
 * Anthropic-compatible API endpoint with custom env overrides.
 *
 * @module GlmAdapter
 */
import { Context } from "effect";

import type { ProviderAdapterError } from "../Errors.ts";
import type { ProviderAdapterShape } from "./ProviderAdapter.ts";

/**
 * GlmAdapterShape - Service API for the GLM provider adapter.
 */
export interface GlmAdapterShape
	extends ProviderAdapterShape<ProviderAdapterError> {
	readonly provider: "glmClaudeAgent";
}

/**
 * GlmAdapter - Service tag for GLM provider adapter operations.
 */
export class GlmAdapter extends Context.Service<GlmAdapter, GlmAdapterShape>()(
	"t3/provider/Services/GlmAdapter",
) {}
