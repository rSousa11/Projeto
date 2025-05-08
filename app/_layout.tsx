import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Slot, router, usePathname } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

function MainLayout() {
  const { setAuth } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuth(session.user);
        if (!pathname.startsWith('/(tabs)')) {
          router.replace('/(tabs)');
        }
      } else {
        setAuth(null);
        if (!pathname.startsWith('/(auth)')) {
          router.replace('/(auth)/signin/page');
        }
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return <Slot />;
}
