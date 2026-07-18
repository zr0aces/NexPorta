import crypto from 'node:crypto';

export class DocumentAuthenticator {
  constructor(apiPassword) {
    this.apiPassword = apiPassword;
    if (!this.apiPassword) {
      this.apiPassword = crypto.randomBytes(16).toString('hex');
      console.warn(`[nexporta-api] WARNING: API_PASSWORD environment variable is not set! Generating a secure random ephemeral password: ${this.apiPassword}`);
    }
  }

  verify(password) {
    if (!password) return false;
    const hashConfig = crypto.createHash('sha256').update(this.apiPassword).digest();
    const hashReq = crypto.createHash('sha256').update(password).digest();
    return crypto.timingSafeEqual(hashConfig, hashReq);
  }
}
