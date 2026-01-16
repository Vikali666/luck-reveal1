import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
                            base: './',
                            server: {
                              host: true,      // Esto permite que el localhost sea visible en tu red Wi-Fi
                              port: 5170,      // Puedes cambiar este número si quieres otro puerto
                              open: true       // Esto abre el navegador automáticamente al iniciar
                            }
})
