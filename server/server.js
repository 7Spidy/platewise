import './loadenv.js';
import express from 'express';
import cors from 'cors';
import analyzeHandler from '../api/analyze.js';
import authHandler from '../api/auth.js';
import authLoginHandler from '../api/auth-login.js';
import authLogoutHandler from '../api/auth-logout.js';
import authMeHandler from '../api/auth-me.js';
import authForgotPasswordHandler from '../api/auth-forgot-password.js';
import authResetPasswordHandler from '../api/auth-reset-password.js';
import inviteHandler from '../api/invite.js';
import waitlistHandler from '../api/waitlist.js';
import onboardingHandler from '../api/onboarding.js';
import profileHandler from '../api/profile.js';
import feedbackHandler from '../api/feedback.js';
import scanRemainingHandler from '../api/scan-remaining.js';
import mealsHandler from '../api/meals.js';
import mealsHistoryHandler from '../api/meals-history.js';
import logAgainHandler from '../api/log-again.js';
import savedMealsHandler from '../api/saved-meals.js';
import savedIngredientsHandler from '../api/saved-ingredients.js';
import settingsHandler from '../api/settings.js';
import adminWaitlistHandler from '../api/admin/waitlist.js';
import adminWhitelistHandler from '../api/admin/whitelist.js';
import adminUsersHandler from '../api/admin/users.js';
import adminGrantScansHandler from '../api/admin/grant-scans.js';
import adminUsageTrendHandler from '../api/admin/usage-trend.js';

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

const app = express();
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: '10mb' }));

function wrap(h) {
  return (req, res) => {
    Promise.resolve(h(req, res)).catch((err) => {
      console.error('[handler error]', err);
      if (!res.headersSent) res.status(500).json({ error: err?.message ?? 'Internal server error' });
    });
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Auth
app.all('/api/auth',                    wrap((req, res) => authHandler(req, res)));
app.all('/api/auth-login',              wrap((req, res) => authLoginHandler(req, res)));
app.all('/api/auth-logout',             wrap((req, res) => authLogoutHandler(req, res)));
app.all('/api/auth-me',                 wrap((req, res) => authMeHandler(req, res)));
app.all('/api/auth-forgot-password',    wrap((req, res) => authForgotPasswordHandler(req, res)));
app.all('/api/auth-reset-password',     wrap((req, res) => authResetPasswordHandler(req, res)));
app.all('/api/invite',                  wrap((req, res) => inviteHandler(req, res)));
app.all('/api/waitlist',                wrap((req, res) => waitlistHandler(req, res)));
app.all('/api/onboarding',              wrap((req, res) => onboardingHandler(req, res)));
app.all('/api/profile',                 wrap((req, res) => profileHandler(req, res)));
app.all('/api/feedback',                wrap((req, res) => feedbackHandler(req, res)));
app.all('/api/scan-remaining',          wrap((req, res) => scanRemainingHandler(req, res)));

// Data
app.all('/api/analyze',                 wrap((req, res) => analyzeHandler(req, res)));
app.all('/api/meals',                   wrap((req, res) => mealsHandler(req, res)));
app.all('/api/meals-history',           wrap((req, res) => mealsHistoryHandler(req, res)));
app.all('/api/log-again',               wrap((req, res) => logAgainHandler(req, res)));
app.all('/api/saved-meals',             wrap((req, res) => savedMealsHandler(req, res)));
app.all('/api/saved-ingredients',       wrap((req, res) => savedIngredientsHandler(req, res)));
app.all('/api/settings',                wrap((req, res) => settingsHandler(req, res)));

// Admin
app.all('/api/admin/waitlist',          wrap((req, res) => adminWaitlistHandler(req, res)));
app.all('/api/admin/whitelist',         wrap((req, res) => adminWhitelistHandler(req, res)));
app.all('/api/admin/users',             wrap((req, res) => adminUsersHandler(req, res)));
app.all('/api/admin/grant-scans',       wrap((req, res) => adminGrantScansHandler(req, res)));
app.all('/api/admin/usage-trend',       wrap((req, res) => adminUsageTrendHandler(req, res)));

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Platewise dev API listening on http://localhost:${PORT}`);
});
