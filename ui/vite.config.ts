import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                rewrite: (path) => path.replace(/^\/tts/, ''),
            },
        },
    },
    plugins: [react()],
});
