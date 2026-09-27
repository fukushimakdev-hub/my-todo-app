import 'dotenv/config';
import { supabase } from '@prisma/orm-extension-supabase/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const db = await supabase<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
  jwksUrl: process.env['SUPABASE_JWKS_URL']!,
});
