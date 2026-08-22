import { fileURLToPath, URL } from 'node:url'
import netlify from '@netlify/vite-plugin-tanstack-start' // ← add this
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react-swc'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { configDefaults } from 'vitest/config'

export default defineConfig(({ command }) => ({
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
		exclude: [...configDefaults.exclude, 'e2e/**'],
	},
	plugins: [
		devtools(),
		nitro(),
		viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
		tanstackStart({
			importProtection: {
				// Unit tests import server-only modules directly in the jsdom
				// (client-like) environment; the production build is the
				// authoritative client-graph tripwire.
				enabled: !process.env.VITEST,
				behavior: 'error',
				ignoreImporters: ['**/*.test.ts', '**/*.spec.ts'],
				client: {
					specifiers: ['mongodb'],
					files: [
						'**/services/db/**',
						'**/repository/mongoRepository.server.ts',
						'**/repository/getRepository.server.ts',
						// Server-only env modules (secret field schemas, dotenv,
						// process.env) must never ship in the client bundle.
						'**/env/**',
					],
				},
			},
		}),
		viteReact(),
		...(command === 'build' ? [netlify()] : []),
	],
}))
