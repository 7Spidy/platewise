// Loaded first so dotenv.config({ override: true }) runs BEFORE
// any other module (e.g. ../api/analyze.js) instantiates an SDK client
// that reads process.env at import time.
//
// override: true is required because the system has ANTHROPIC_API_KEY
// set to an empty string, and dotenv preserves existing env vars by default.
import dotenv from 'dotenv';
dotenv.config({ override: true });
