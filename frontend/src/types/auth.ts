export interface User {
    id?: string | number;
    email?: string;
    name?: string;
    username?: string;
    // Add other user properties as needed
  }
  
  export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
  }
  