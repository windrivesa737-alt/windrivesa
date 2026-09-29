import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || '';
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  // Base path for GitHub Pages (/WinDriveSA/) or override via VITE_BASE_PATH
  const base = process.env.VITE_BASE_PATH || (mode === 'production' ? '/WinDriveSA/' : '/');

  return {
    base,
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey),
      'import.meta.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey),
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  };
});
