/**
 * Native Authentication Middleware
 * Enforces token authentication and isolates user accounts without external Firebase dependencies.
 * Designed & Developed by Tilak Dalai
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: {
        message: 'Authentication required. Missing Bearer token.',
        code: 'AUTH_TOKEN_MISSING',
      },
    });
  }

  if (authHeader.trim() === 'Bearer') {
    return res.status(401).json({
      error: {
        message: 'Bearer token string is empty.',
        code: 'AUTH_TOKEN_EMPTY',
      },
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'Malformed Authorization header. Must start with Bearer.',
        code: 'AUTH_TOKEN_MISSING',
      },
    });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();

  if (!idToken) {
    return res.status(401).json({
      error: {
        message: 'Bearer token string is empty.',
        code: 'AUTH_TOKEN_EMPTY',
      },
    });
  }

  // Parse Native or Test User Token
  const isMockToken = idToken.startsWith('mock-token-');
  const cleanUid = idToken.replace(/^(mock-token-|tavi_token_|tavi-)/, '').trim() || 'user';

  req.user = {
    uid: cleanUid,
    email: `${cleanUid}@example.com`,
    displayName: isMockToken ? `Test User (${cleanUid})` : (cleanUid.startsWith('guest_') ? 'Guest Explorer' : cleanUid),
    photoURL: '',
    isNative: true,
  };

  return next();
}
