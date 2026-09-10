import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // The demo ships as one self-contained HTML file, so the character art is
    // inlined as a data URI rather than emitted as a separate asset.
    assetsInlineLimit: 1024 * 1024,
  },
});
