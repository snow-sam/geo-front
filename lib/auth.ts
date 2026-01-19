import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://api.rotgo.com.br/api/v1/auth',
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [organizationClient()],
});
