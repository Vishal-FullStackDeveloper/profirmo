'use client';

// Compatibility shim — the real auth state lives in the AuthProvider context.
// Every existing `import { useAuth } from '@/hooks/useAuth'` keeps working
// against the new provider via this re-export.

import { useAuth } from '@/components/AuthProvider';

export { useAuth };
export default useAuth;
