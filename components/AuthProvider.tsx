"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  role: "diner" | "restaurant" | "admin";
  full_name: string;
  phone: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(u: User | null) {
      setUser(u);
      if (u) {
        const { data } = await supabase
          .from("profiles")
          .select("id, role, full_name, phone")
          .eq("id", u.id)
          .single();
        setProfile((data as Profile) ?? null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => load(session?.user ?? null), 0);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
