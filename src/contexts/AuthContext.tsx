import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      console.log("[AuthContext] Initiating signup process:", { email, fullName, redirectUrl });
      
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      console.log("[AuthContext] Supabase signup response:", response);
      const { error, data } = response;

      if (error) {
        console.error("[AuthContext] Signup failed with Supabase error:", error);
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message,
        });
        return { error };
      }

      console.log("[AuthContext] Signup successfully completed:", data);
      toast({
        title: "Success!",
        description: "Please check your email to confirm your account.",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error("[AuthContext] Signup caught unexpected exception:", error);
      if (error instanceof TypeError || error.message?.includes("fetch")) {
        console.error("[AuthContext] Network or CORS failure suspected. Ensure Supabase URL is correct and reachable.", {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "https://vuknaijjzkkputjbtnce.supabase.co",
          error
        });
      }
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message || "Network error or connection refused.",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("[AuthContext] Initiating signin process for email:", email);
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("[AuthContext] Supabase signin response:", response);
      const { error, data } = response;

      if (error) {
        console.error("[AuthContext] Signin failed with Supabase error:", error);
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
        return { error };
      }

      console.log("[AuthContext] Signin successfully completed:", data);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { error: null };
    } catch (error: any) {
      console.error("[AuthContext] Signin caught unexpected exception:", error);
      if (error instanceof TypeError || error.message?.includes("fetch")) {
        console.error("[AuthContext] Network or CORS failure suspected. Ensure Supabase URL is correct and reachable.", {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "https://vuknaijjzkkputjbtnce.supabase.co",
          error
        });
      }
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Network error or connection refused.",
      });
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};