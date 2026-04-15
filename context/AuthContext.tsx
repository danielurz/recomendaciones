// AsyncStorage: almacenamiento clave-valor persistente en el dispositivo (equivalente a localStorage en web)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

// Claves usadas para guardar la sesión en AsyncStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Datos del usuario autenticado que se mantienen en memoria y en AsyncStorage
type User = {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  reputation_score: number;
};

// Interfaz del contexto: qué expone AuthProvider a sus componentes hijos
type AuthContextType = {
  user: User | null;       // null si no hay sesión activa
  token: string | null;    // JWT para incluir en los headers de la API
  isLoading: boolean;      // true mientras se carga la sesión desde AsyncStorage al arrancar
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
};

// Crea el contexto con null por defecto; useAuth lanza un error si se usa fuera del Provider
const AuthContext = createContext<AuthContextType | null>(null);

// Proveedor de autenticación: envuelve toda la app y gestiona la sesión del usuario
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // muestra un spinner global hasta que la sesión cargue

  // Al montar el provider, restaura la sesión guardada en AsyncStorage (si existe)
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Lee token y usuario en paralelo para reducir el tiempo de carga inicial
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser)); // deserializa el objeto usuario guardado como JSON string
        }
      } finally {
        setIsLoading(false); // siempre desactiva el loading, incluso si falla la lectura
      }
    };
    loadSession();
  }, []);

  // Persiste la sesión en AsyncStorage y actualiza el estado en memoria
  // Se llama tras un login o registro exitoso con los datos devueltos por la API
  const login = async (newToken: string, newUser: User) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, newToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  // Elimina la sesión de AsyncStorage y limpia el estado en memoria
  // No hace ninguna llamada a la API: los JWT son stateless, no hay sesión en el servidor
  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para consumir el contexto de autenticación en cualquier componente
// Lanza un error descriptivo si se usa fuera del AuthProvider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
