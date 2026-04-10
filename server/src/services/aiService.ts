import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';
import { ParsedJob } from '../types';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: 15_000, // 15 s — throws APIConnectionTimeoutError if API hangs
      maxRetries: 1,   // retry once on transient failure, then fail fast
    });
  }
  return openaiClient;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const safeParseJSON = (raw: string | null, context: string): Record<string, unknown> => {
  if (!raw) {
    throw new Error(`[aiService] ${context}: OpenAI returned an empty response.`);
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`[aiService] ${context}: Failed to parse JSON response — ${raw}`);
  }
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
};

// ── Function 1 ────────────────────────────────────────────────────────────────

/**
 * Parses a raw job description string into a structured ParsedJob object
 * using GPT-4o-mini with JSON mode.
 */
export const parseJobDescription = async (jd: string): Promise<ParsedJob> => {
  const response = await getOpenAIClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are an expert at parsing job descriptions. ' +
          'Extract and return only a JSON object with these fields: ' +
          'company, role, requiredSkills (array), niceToHaveSkills (array), ' +
          'seniority, location. ' +
          'If a field is not found, use an empty string or empty array.',
      },
      {
        role: 'user',
        content: jd,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? null;
  const parsed = safeParseJSON(raw, 'parseJobDescription');

  return {
    company:           typeof parsed.company === 'string'  ? parsed.company  : '',
    role:              typeof parsed.role === 'string'     ? parsed.role     : '',
    seniority:         typeof parsed.seniority === 'string'? parsed.seniority: '',
    location:          typeof parsed.location === 'string' ? parsed.location : '',
    requiredSkills:    toStringArray(parsed.requiredSkills),
    niceToHaveSkills:  toStringArray(parsed.niceToHaveSkills),
  };
};

// ── Function 2 ────────────────────────────────────────────────────────────────

/**
 * Generates 4 tailored resume bullet points for a given parsed job,
 * each starting with an action verb and including metrics.
 */
export const generateResumeSuggestions = async (job: ParsedJob): Promise<string[]> => {
  const response = await getOpenAIClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are an expert resume writer. ' +
          "Return only a JSON object with a single key 'suggestions' " +
          'containing an array of exactly 5 resume bullet points ' +
          'tailored specifically to this job role and required skills. ' +
          'Each bullet must start with a strong action verb and include metrics.',
      },
      {
        role: 'user',
        content: JSON.stringify(job),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? null;
  const parsed = safeParseJSON(raw, 'generateResumeSuggestions');

  const suggestions = toStringArray(parsed.suggestions);

  if (suggestions.length < 3 || suggestions.length > 5) {
    throw new Error(
      `[aiService] generateResumeSuggestions: Expected 3–5 suggestions, got ${suggestions.length}.`
    );
  }

  return suggestions;
};
