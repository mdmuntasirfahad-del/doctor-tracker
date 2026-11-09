import { createAuthClient } from "better-auth/react";

// Keep auth same-origin so it works even if Next dev selects a different port.
// Server-side session checks use the shared configuration in packages/auth.
export const authClient = createAuthClient();
