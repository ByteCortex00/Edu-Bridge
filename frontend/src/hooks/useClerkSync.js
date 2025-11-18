import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useAuthAPI } from '../api/auth';
import { useAuthStore } from '../store/authStore';

/**
 * Hook to sync Clerk user with backend database
 * Should be called in a layout or root component to ensure sync on every load
 */
export function useClerkSync() {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const authAPI = useAuthAPI();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  // Use a ref to track if we've already synced this specific user session
  const syncedUserRef = useRef(null);

  useEffect(() => {
    const syncUser = async () => {
      if (userLoaded && authLoaded && isSignedIn && clerkUser) {
        // Prevent re-syncing if we just did it for this user ID
        if (syncedUserRef.current === clerkUser.id) {
          return;
        }

        try {
          const token = await getToken();
          const response = await authAPI.syncClerkUser(clerkUser);

          if (response.success) {
            console.log('✅ User synced with backend:', response.data);
            setAuth(response.data, token);
            
            // Mark this user as synced so we don't loop
            syncedUserRef.current = clerkUser.id;
          }
        } catch (error) {
          console.error('❌ Failed to sync user:', error);
        }
      }
    };

    syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUser, isSignedIn, userLoaded, authLoaded]); 
  // 👆 REMOVED authAPI, setAuth, getToken from dependencies to stop the loop
}

export default useClerkSync;