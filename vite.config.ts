import { fileURLToPath, URL } from 'node:url'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react-swc'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
		dedupe: ['react', 'react-dom'],
	},
	build: {
		rollupOptions: {
			external: ['fsevents'],
		},
	},
	ssr: {
		external: ['fsevents'],
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-utils/setupTests.ts'],
	},
	plugins: [devtools(), nitro(), viteTsConfigPaths({ projects: ['./tsconfig.json'] }), tanstackStart(), viteReact()],
})
