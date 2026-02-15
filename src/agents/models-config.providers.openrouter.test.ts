import { describe, expect, it, vi } from "vitest";
import * as modelAuth from "./model-auth.js";
import { resolveImplicitProviders } from "./models-config.providers.js";

const authProfileMocks = vi.hoisted(() => ({
  ensureAuthProfileStoreMock: vi.fn(() => ({ profiles: {} })),
  listProfilesForProviderMock: vi.fn(() => []),
}));

const resolveEnvApiKeyMock = vi.hoisted(() => ({
  fn: vi.fn(),
}));

vi.mock("./auth-profiles.js", () => ({
  ensureAuthProfileStore: authProfileMocks.ensureAuthProfileStoreMock,
  listProfilesForProvider: authProfileMocks.listProfilesForProviderMock,
}));

vi.spyOn(modelAuth, "resolveEnvApiKey").mockImplementation((provider: string) => {
  return resolveEnvApiKeyMock.fn(provider);
});

describe("resolveImplicitProviders (openrouter)", () => {
  it("adds openrouter provider when api key available", async () => {
    resolveEnvApiKeyMock.fn.mockImplementation((provider: string) =>
      provider === "openrouter"
        ? { apiKey: "env-openrouter-key", source: "env: OPENROUTER_API_KEY" }
        : null,
    );
    const providers = await resolveImplicitProviders({ agentDir: "/tmp/agent" });
    expect(providers?.openrouter).toBeDefined();
    expect(providers?.openrouter?.baseUrl).toBe("https://openrouter.ai/api/v1");
  });

  it("does not add openrouter when api key missing", async () => {
    resolveEnvApiKeyMock.fn.mockImplementation((provider: string) =>
      provider === "openrouter" ? null : { apiKey: "env-other", source: "env: OTHER" },
    );
    const providers = await resolveImplicitProviders({ agentDir: "/tmp/agent" });
    expect(providers?.openrouter).toBeUndefined();
  });

  it("does not require auth profiles for openrouter", async () => {
    resolveEnvApiKeyMock.fn.mockImplementation((provider: string) =>
      provider === "openrouter"
        ? { apiKey: "env-openrouter-key", source: "env: OPENROUTER_API_KEY" }
        : null,
    );
    await resolveImplicitProviders({ agentDir: "/tmp/agent" });
    expect(authProfileMocks.ensureAuthProfileStoreMock).not.toHaveBeenCalled();
    expect(authProfileMocks.listProfilesForProviderMock).not.toHaveBeenCalled();
  });
});
