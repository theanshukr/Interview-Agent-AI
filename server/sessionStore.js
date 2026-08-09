// Server-side Session Store (In-Memory Map)
// Redis-compatible interface for production scalability

class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  get(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  set(sessionId, sessionData) {
    this.sessions.set(sessionId, {
      ...sessionData,
      updatedAt: new Date().toISOString(),
    });
    return this.get(sessionId);
  }

  delete(sessionId) {
    return this.sessions.delete(sessionId);
  }

  has(sessionId) {
    return this.sessions.has(sessionId);
  }

  clear() {
    this.sessions.clear();
  }

  list() {
    return Array.from(this.sessions.values());
  }
}

export const sessionStore = new SessionStore();
