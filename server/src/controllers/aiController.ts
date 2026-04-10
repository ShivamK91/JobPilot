import { Response } from 'express';
import { AuthRequest } from '../types';
import { parseJobDescription, generateResumeSuggestions } from '../services/aiService';

// POST /api/ai/parse
export const parseJD = async (req: AuthRequest, res: Response): Promise<void> => {
  const { jd } = req.body as { jd?: string };

  if (!jd || jd.trim().length === 0) {
    res.status(400).json({ message: 'Job description text is required.' });
    return;
  }

  try {
    const parsedJob = await parseJobDescription(jd);
    const resumeSuggestions = await generateResumeSuggestions(parsedJob);

    res.status(200).json({ parsedJob, resumeSuggestions });
  } catch (error) {
    console.error('[parseJD]', error);
    const message = error instanceof Error ? error.message : 'AI service error.';
    res.status(500).json({ message });
  }
};
