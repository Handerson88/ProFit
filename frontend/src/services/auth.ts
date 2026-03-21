import { GoTrueClient } from '@supabase/supabase-js';

// The URL provided by the user for Neon Auth
const AUTH_URL = 'https://ep-empty-shadow-ab4zlr84.neonauth.eu-west-2.aws.neon.tech/neondb/auth';

export const neonAuth = new GoTrueClient({
  url: AUTH_URL,
  headers: {
    // A dummy apikey might be required by the GoTrue client types, 
    // even if Neon Auth doesn't enforce it.
    apikey: 'neon-auth-dummy-key',
  },
});
