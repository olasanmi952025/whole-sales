import type { Session } from '@shopify/shopify-api';
import { getDatabase } from '../database/database-sqljs.js';

// Interface compatible con SessionStorage de Shopify
export interface ISessionStorage {
  storeSession(session: Session): Promise<boolean>;
  loadSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  deleteSessions(ids: string[]): Promise<boolean>;
  findSessionsByShop(shop: string): Promise<Session[]>;
}

export class SQLiteSessionStorage implements ISessionStorage {
  async storeSession(session: Session): Promise<boolean> {
    try {
      const db = await getDatabase();
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO shopify_sessions 
        (id, shop, state, isOnline, scope, accessToken, expires, onlineAccessInfo, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([
        session.id,
        session.shop,
        session.state,
        session.isOnline ? 1 : 0,
        session.scope || '',
        session.accessToken || '',
        session.expires ? session.expires.toISOString() : null,
        (session as any).onlineAccessInfo ? JSON.stringify((session as any).onlineAccessInfo) : null
      ]);
      
      console.log('✅ Session stored:', session.id, 'for shop:', session.shop);
      return true;
    } catch (error) {
      console.error('Error storing session:', error);
      return false;
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const db = await getDatabase();
      
      const stmt = db.prepare('SELECT * FROM shopify_sessions WHERE id = ?');
      stmt.bind([id]);
      
      if (!stmt.step()) {
        return undefined;
      }
      
      const row = stmt.getAsObject();
      
      const session: any = {
        id: row.id,
        shop: row.shop,
        state: row.state,
        isOnline: row.isOnline === 1,
        scope: row.scope || undefined,
        accessToken: row.accessToken || undefined,
        expires: row.expires ? new Date(row.expires as string) : undefined,
      };
      
      if (row.onlineAccessInfo) {
        try {
          session.onlineAccessInfo = JSON.parse(row.onlineAccessInfo as string);
        } catch (e) {
          console.error('Error parsing onlineAccessInfo:', e);
        }
      }
      
      return session as Session;
    } catch (error) {
      console.error('Error loading session:', error);
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      
      const stmt = db.prepare('DELETE FROM shopify_sessions WHERE id = ?');
      stmt.run([id]);
      
      console.log('🗑️ Session deleted:', id);
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    try {
      const db = await getDatabase();
      
      for (const id of ids) {
        const stmt = db.prepare('DELETE FROM shopify_sessions WHERE id = ?');
        stmt.run([id]);
      }
      
      console.log('🗑️ Sessions deleted:', ids.length);
      return true;
    } catch (error) {
      console.error('Error deleting sessions:', error);
      return false;
    }
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    try {
      const db = await getDatabase();
      
      const stmt = db.prepare('SELECT * FROM shopify_sessions WHERE shop = ?');
      stmt.bind([shop]);
      
      const sessions: Session[] = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        
        const session: any = {
          id: row.id,
          shop: row.shop,
          state: row.state,
          isOnline: row.isOnline === 1,
          scope: row.scope || undefined,
          accessToken: row.accessToken || undefined,
          expires: row.expires ? new Date(row.expires as string) : undefined,
        };
        
        if (row.onlineAccessInfo) {
          try {
            session.onlineAccessInfo = JSON.parse(row.onlineAccessInfo as string);
          } catch (e) {
            console.error('Error parsing onlineAccessInfo:', e);
          }
        }
        
        sessions.push(session as Session);
      }
      
      return sessions;
    } catch (error) {
      console.error('Error finding sessions by shop:', error);
      return [];
    }
  }
}

