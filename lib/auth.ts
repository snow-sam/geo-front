import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://backend-geo-crud--samuelf21.replit.app/api/v1/auth',
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [organizationClient()],
});
