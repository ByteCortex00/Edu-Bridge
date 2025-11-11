// vite.config.js (or .ts)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Your existing React plugin
import tailwindcss from '@tailwindcss/vite'; // Import the new plugin

// Make sure this file is in your project root

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Add the Tailwind plugin here
  ],
  // ... other configuration ...
});