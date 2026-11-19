import { useCallback, useEffect, useState } from 'react';
import type { User } from '../types';
import { apiGateway } from '../lib/apiClient';
import { readSession } from '../lib/storage';

const DEFAULT_USER: User = {
  id: 'USR-CLIENT-01',
  email: 'cliente.turista@etec.um.edu.ar',
  name: 'Cliente BusYahu',
  role: 'client',
};

const ADMIN_EMAIL = 'admin.ferroviario@etec.um.edu.ar';
const CLIENT_EMAIL = 'cliente.turista@etec.um.edu.ar';

export function useSessionUser() {
  const [currentUser, setCurrentUser] = useState<User>(() => readSession().user ?? DEFAULT_USER);

  useEffect(
    () => apiGateway.onSessionChanged((session) => setCurrentUser(session.user ?? DEFAULT_USER)),
    [],
  );

  const switchRole = useCallback((role: 'client' | 'admin') => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
      email: role === 'admin' ? ADMIN_EMAIL : CLIENT_EMAIL,
    }));
  }, []);

  return { currentUser, switchRole };
}
