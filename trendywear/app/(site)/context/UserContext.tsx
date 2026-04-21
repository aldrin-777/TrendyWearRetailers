"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user?.id) {
        checkAdminStatus(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const supabase = createClient();
    const { data: dbUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    setIsAdmin(dbUser?.is_admin ?? false);
  };

  return (
    <UserContext.Provider value={{ user, session, isAdmin, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider");
  return context;
}