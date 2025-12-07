import type { Session, SessionStorage } from '@shopify/shopify-api';

// SessionStorage en memoria para OAuth
// En producción con múltiples instancias, usar Redis
export class MemorySessionStorage implements SessionStorage {
  private sessions: Map<string, Session> = new Map();

  async storeSession(session: Session): Promise<boolean> {
    this.sessions.set(session.id, session);
    console.log('✅ Session stored in memory:', session.id, 'for shop:', session.shop);
    return true;
  }

  async loadSession(id: string): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (session) {
      console.log('✅ Session loaded from memory:', id);
    } else {
      console.log('⚠️  Session not found in memory:', id);
    }
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      console.log('🗑️  Session deleted from memory:', id);
    }
    return deleted;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      this.sessions.delete(id);
    }
    console.log('🗑️  Sessions deleted from memory:', ids.length);
    return true;
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const sessions: Session[] = [];
    for (const session of this.sessions.values()) {
      if (session.shop === shop) {
        sessions.push(session);
      }
    }
    console.log('🔍 Found', sessions.length, 'sessions for shop:', shop);
    return sessions;
  }
}

