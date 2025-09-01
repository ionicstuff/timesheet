import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  },
  define: {
    // Provide a minimal shim so existing CRA-style code using process.env doesn't crash at runtime.
    // For actual values, prefer Vite's import.meta.env with VITE_* variables.
    'process.env': {}
  }
})

