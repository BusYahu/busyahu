import type { User } from '../types';
import { apiGateway } from './api.js';
import { clearSession, readSession } from './storage.js';

  export function createSessionUser() {
    let currentUser = $state<User | null>(readSession().user as User | null);

    $effect(() =>
      apiGateway.onSessionChanged((session: { user?: User | null }) => {
        currentUser = session.user ?? null;
      }),
    );

    return {
      get currentUser() {
        return currentUser;
      },
      setUser(user: User | null) {
        currentUser = user;
      },
      logout() {
        clearSession();
        currentUser = null;
      },
    };
  }
