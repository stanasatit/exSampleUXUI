import { useCallback, useState } from 'react';

type LoginPayload = {
  password: string;
  username: string;
};

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = useCallback(({ password, username }: LoginPayload) => {
    const hasCredentials = username.trim().length > 0 && password.length > 0;

    if (!hasCredentials) {
      return false;
    }

    setIsLoggedIn(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
  }, []);

  return {
    isLoggedIn,
    login,
    logout,
  };
}
