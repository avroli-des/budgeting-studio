import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  AuthError as FirebaseAuthError, // Import AuthError type
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AuthErrorDisplay from '../components/AuthErrorDisplay'; // Import the new component

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  picture: string;
}

// Define a structured error type
// FIX: Renamed from AuthError to DisplayableAuthError to avoid name collision with FirebaseAuthError.
interface DisplayableAuthError {
  title: string;
  message: string;
  domain?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // FIX: Updated state type to use the renamed DisplayableAuthError interface.
  const [authError, setAuthError] = useState<DisplayableAuthError | null>(null); // State for auth errors

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const userProfile: UserProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Користувач',
          email: fbUser.email || '',
          picture: fbUser.photoURL || '',
        };
        setUser(userProfile);
        setFirebaseUser(fbUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null); // Clear previous errors
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle success
    } catch (error: any) {
      console.error("Firebase sign-in error:", error);
      
      const firebaseError = error as FirebaseAuthError;
      // FIX: Updated variable type to use the renamed DisplayableAuthError interface.
      let newError: DisplayableAuthError = {
          title: "Помилка автентифікації",
          message: "Не вдалося увійти. Спробуйте ще раз."
      };

      if (firebaseError.code === 'auth/unauthorized-domain') {
          const domainMatch = firebaseError.message.match(/This domain \((.*?)\) is not authorized/);
          const domain = domainMatch ? domainMatch[1] : undefined;
          newError = {
              title: "Неавторизований домен",
              message: "Поточний домен не авторизовано для використання Firebase Authentication. Це поширена проблема при розробці. Будь ласка, додайте домен до списку дозволених у налаштуваннях вашого Firebase проекту.",
              domain: domain,
          };
      } else if (firebaseError.code === 'auth/popup-closed-by-user') {
          newError = {
              title: "Вхід скасовано",
              message: "Вікно входу було закрито. Будь ласка, спробуйте ще раз, якщо це було випадково."
          };
      } else if (firebaseError.code === 'auth/network-request-failed') {
          newError = {
              title: "Помилка мережі",
              message: "Не вдалося підключитися до сервісів автентифікації. Перевірте ваше інтернет-з'єднання."
          };
      }
      
      setAuthError(newError);
      setIsLoading(false); // Ensure loading state is reset on error
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Firebase sign-out error:", error);
      // Let onAuthStateChanged handle the rest
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, signIn, signOut }}>
      {children}
      {authError && <AuthErrorDisplay error={authError} onClose={() => setAuthError(null)} />}
    </AuthContext.Provider>
  );
};
