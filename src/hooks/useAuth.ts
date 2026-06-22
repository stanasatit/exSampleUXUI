import { useCallback, useState } from 'react';

type LoginPayload = {
  password: string;
  userId?: number;
  username: string;
};

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState<number | undefined>(undefined);

  const login = useCallback(({ password, userId: uid, username: uname }: LoginPayload) => {
    const hasCredentials = uname.trim().length > 0 && password.length > 0;

    if (!hasCredentials) {
      return false;
    }

    setIsLoggedIn(true);
    setUsername(uname);
    setUserId(uid);
    return true;
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUsername('');
    setUserId(undefined);
  }, []);

  return {
    isLoggedIn,
    login,
    logout,
    userId,
    username,
  };
}
