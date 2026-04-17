/**
 * GlmProviderLive - Live provider status layer for GLM (Z.AI).
 *
 * Unlike Codex/Claude, GLM does not have a local CLI to probe.
 * Status is derived from settings: enabled flag and API key presence.
 *
 * @module GlmProviderLive
 */
import type {
	GlmSettings,
	ModelCapabilities,
	ServerProvider,
	ServerProviderModel,
} from "@t3tools/contracts";
import type { ServerSettings } from "@t3tools/contracts/settings";
import { Effect, Layer, Stream } from "effect";
import { ServerSettingsService } from "../../serverSettings.ts";
import { makeManagedServerProvider } from "../makeManagedServerProvider.ts";
import {
	buildServerProvider,
	providerModelsFromSettings,
} from "../providerSnapshot.ts";
import { GlmProvider } from "../Services/GlmProvider.ts";

// ── Constants ──────────────────────────────────────────────────────────

const PROVIDER = "glmClaudeAgent" as const;

const DEFAULT_GLM_MODEL_CAPABILITIES: ModelCapabilities = {
	reasoningEffortLevels: [],
	supportsFastMode: true,
	supportsThinkingToggle: true,
	contextWindowOptions: [],
	promptInjectedEffortLevels: [],
};

const BUILT_IN_MODELS: ReadonlyArray<ServerProviderModel> = [
	{
		slug: "glm-5.1",
		name: "GLM 5.1",
		isCustom: false,
		capabilities: DEFAULT_GLM_MODEL_CAPABILITIES,
	},
	{
		slug: "glm-5-turbo",
		name: "GLM 5 Turbo",
		isCustom: false,
		capabilities: DEFAULT_GLM_MODEL_CAPABILITIES,
	},
];

// ── Status check ──────────────────────────────────────────────────────

const checkGlmProviderStatus = Effect.fn("checkGlmProviderStatus")(
	function* () {
		const settingsService = yield* ServerSettingsService;
		const settings = yield* settingsService.getSettings;
		const glmSettings: GlmSettings = settings.providers.glmClaudeAgent;
		const checkedAt = new Date().toISOString();

		const models = providerModelsFromSettings(
			BUILT_IN_MODELS,
			PROVIDER,
			glmSettings.customModels,
			DEFAULT_GLM_MODEL_CAPABILITIES,
		);

		const hasApiKey = glmSettings.apiKey.trim().length > 0;

		if (!glmSettings.enabled) {
			return buildServerProvider({
				provider: PROVIDER,
				enabled: false,
				checkedAt,
				models,
				probe: {
					installed: true,
					version: null,
					status: "warning",
					auth: { status: "unknown" },
					message: "GLM is disabled in T3 Code settings.",
				},
			});
		}

		if (!hasApiKey) {
			return buildServerProvider({
				provider: PROVIDER,
				enabled: true,
				checkedAt,
				models,
				probe: {
					installed: true,
					version: null,
					status: "warning",
					auth: { status: "unauthenticated" },
					message:
						"API key not configured. Set your Z.AI API key in GLM settings.",
				},
			});
		}

		return buildServerProvider({
			provider: PROVIDER,
			enabled: true,
			checkedAt,
			models,
			probe: {
				installed: true,
				version: null,
				status: "ready",
				auth: {
					status: "authenticated",
					type: "apikey",
					label: "Z.AI API Key",
				},
			},
		});
	},
);

// ── Settings accessors ────────────────────────────────────────────────

const haveGlmSettingsChanged = (
	previous: GlmSettings,
	next: GlmSettings,
): boolean => JSON.stringify(previous) !== JSON.stringify(next);

const makePendingGlmProvider = (glmSettings: GlmSettings): ServerProvider => {
	const models = providerModelsFromSettings(
		BUILT_IN_MODELS,
		PROVIDER,
		glmSettings.customModels,
		DEFAULT_GLM_MODEL_CAPABILITIES,
	);

	return buildServerProvider({
		provider: PROVIDER,
		enabled: glmSettings.enabled,
		checkedAt: new Date().toISOString(),
		models,
		probe: {
			installed: true,
			version: null,
			status: "warning",
			auth: { status: "unknown" },
			...(glmSettings.enabled ? { message: "Checking status..." } : {}),
		},
	});
};

// ── Live layer ────────────────────────────────────────────────────────

const makeGlmProvider = Effect.fn("makeGlmProvider")(function* () {
	const settingsService = yield* ServerSettingsService;

	const getGlmSettings = settingsService.getSettings.pipe(
		Effect.map((settings) => settings.providers.glmClaudeAgent),
		Effect.orDie,
	);

	const streamGlmSettings = settingsService.streamChanges.pipe(
		Stream.map((settings: ServerSettings) => settings.providers.glmClaudeAgent),
	);

	return yield* makeManagedServerProvider<GlmSettings>({
		getSettings: getGlmSettings,
		streamSettings: streamGlmSettings,
		haveSettingsChanged: haveGlmSettingsChanged,
		initialSnapshot: makePendingGlmProvider,
		checkProvider: checkGlmProviderStatus().pipe(
			Effect.provideService(ServerSettingsService, settingsService),
		),
	});
});

export const GlmProviderLive = Layer.effect(GlmProvider, makeGlmProvider());
