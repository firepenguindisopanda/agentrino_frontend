import { v4 as uuidv4 } from 'uuid';

const SESSION_STORAGE_KEY = 'agentrino_session';

interface SessionData {
  session_id: string;
  created_at: string;
  last_visited_at: string;
}

export function getSession(): SessionData {
  if (typeof window === 'undefined') {
    return {
      session_id: '',
      created_at: '',
      last_visited_at: '',
    };
  }

  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  
  if (stored) {
    const session: SessionData = JSON.parse(stored);
    session.last_visited_at = new Date().toISOString();
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  const newSession: SessionData = {
    session_id: uuidv4(),
    created_at: new Date().toISOString(),
    last_visited_at: new Date().toISOString(),
  };
  
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
  return newSession;
}

export function getSessionId(): string {
  return getSession().session_id;
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
