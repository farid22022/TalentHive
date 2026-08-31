import crypto from 'node:crypto';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';

/**
 * AIProvider interface: providers implement `chat({ messages, json, temperature, maxTokens })`
 * and return { content, usage:{inputTokens,outputTokens}, model, provider }.
 * MockProvider returns deterministic structured output (no API key required).
 */
class MockAIProvider {
  constructor() {
    this.name = 'mock';
    this.model = 'mock-deterministic';
  }

  async chat({ messages = [], json = false }) {
    const prompt = messages.map((m) => m.content).join('\n');
    const seed = crypto.createHash('sha256').update(prompt).digest('hex');
    // The mock is a pure transport: it does not understand features. The AIService
    // detects the mock provider and runs its own deterministic heuristic instead,
    // so this placeholder content is only ever a fallback marker.
    const content = json
      ? JSON.stringify({ mock: true, seed: seed.slice(0, 12) })
      : `[[mock-ai:${seed.slice(0, 8)}]] deterministic response`;
    return {
      content,
      usage: { inputTokens: prompt.length >> 2, outputTokens: content.length >> 2 },
      model: this.model,
      provider: this.name,
    };
  }
}

const DEFAULT_BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};

/** OpenAI-compatible chat provider (OpenAI / OpenRouter / self-hosted local gateway). */
class OpenAICompatProvider {
  constructor(name) {
    this.name = name;
    this.apiKey = config.ai.apiKey;
    this.model = config.ai.model;
    this.baseUrl = (config.ai.baseUrl || DEFAULT_BASE_URLS[name] || '').replace(/\/+$/, '');
    if (name === 'local' && !this.baseUrl) {
      throw new Error('AI_BASE_URL is required for AI_PROVIDER=local');
    }
    if (name !== 'local' && !this.apiKey) {
      throw new Error(`AI_API_KEY is required for AI_PROVIDER=${name}`);
    }
  }

  async chat({ messages = [], json = false, temperature = 0.2, maxTokens = 1200 }) {
    const body = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    };
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || `AI provider responded ${res.status}`);
    }
    const content = data?.choices?.[0]?.message?.content ?? '';
    const usage = data?.usage || {};
    return {
      content,
      usage: {
        inputTokens: usage.prompt_tokens ?? 0,
        outputTokens: usage.completion_tokens ?? 0,
      },
      model: data?.model || this.model,
      provider: this.name,
    };
  }
}

let provider;
export function getAIProvider() {
  if (provider) return provider;
  switch (config.ai.provider) {
    case 'openai':
    case 'openrouter':
    case 'local':
      provider = new OpenAICompatProvider(config.ai.provider);
      break;
    case 'mock':
    default:
      provider = new MockAIProvider();
      if (config.ai.provider !== 'mock') {
        logger.warn(`Unknown AI_PROVIDER "${config.ai.provider}", falling back to mock.`);
      }
  }
  return provider;
}

/** Test/reset hook — clears the memoized provider (used when config changes). */
export function _resetAIProvider() {
  provider = undefined;
}
