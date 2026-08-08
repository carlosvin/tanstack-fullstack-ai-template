# Changelog

## [0.2.0](https://github.com/carlosvin/tanstack-fullstack-ai-template/compare/v0.1.0...v0.2.0) (2026-08-08)


### Features

* add documentation for using TanStack CLI to access up-to-date library resources ([6a03ef6](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/6a03ef6e3088467701bffde6477f5437b5b2a200))
* add installation instructions for the TanStack fullstack pattern skill ([b8ed169](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/b8ed169da195397e6f4d4294138f0c6373c28cbf))
* add observability-and-env skill with pino logger, Zod env schemas, and centralized Sentry bootstrap ([454f02d](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/454f02dfc1d8618dbfd63f2feb59929d74b03666))
* add support for publication metadata in skills ([303678c](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/303678c807e324d7d1c4288341491d6ad5f67ee7))
* **ai:** expose app name, version, and ENV as getAppRuntimeInfo tool ([#21](https://github.com/carlosvin/tanstack-fullstack-ai-template/issues/21)) ([d27750b](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/d27750b0f92ed1da65e68c4056ba889926c6cea5))
* align template app with TanStack fullstack skill (phases 0-4) ([14d5ef1](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/14d5ef1aca10fabb6459819867877dfbcfb2a018))
* auto-generate test user when auth header is absent ([f360568](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/f360568d5db6c6debed4cb6bc32926a19ec18b8b))
* auto-generate test user when auth header is absent ([#28](https://github.com/carlosvin/tanstack-fullstack-ai-template/issues/28)) ([9a1fa0a](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/9a1fa0adc4a97b54590145bb023e2cdc183964f9))
* enhance TanStack Promptable Fullstack skills documentation ([8fc79f9](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/8fc79f9d6736841450032e4027725198cdfed10b))
* **skills:** add reference-tech-stack for opinionated package defaults ([c9782de](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/c9782deca2928ba84bcf6b2a2543eb8c57862360))
* typed startup env context and browser shell session ([9e0f9a8](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/9e0f9a8b685f7b1d56c25b08d7623d9e529d2957))
* upgrade Mantine to 9.5.1 and adopt better component patterns ([5eb8717](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/5eb8717989bdddcee24f25380914be75144218c0))
* upgrade Mantine to 9.5.1 and adopt better component patterns ([#30](https://github.com/carlosvin/tanstack-fullstack-ai-template/issues/30)) ([2c47d14](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/2c47d14c49ef481da605fc46d52a0731a79a95fb))


### Bug Fixes

* address PR review for public env, auth header, and Sentry bootstrap ([ef85db6](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/ef85db6ebb217909ce40e654cd8d78a80f6729b7))
* **ci:** pin pnpm v10 and use netlify CLI for full SSR preview deploy ([fae6786](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/fae6786d7eb49c6117008094a97e8c94675919a0))
* close env architecture gaps in example app ([1413a03](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/1413a03bfe48d583015a067f29c6a1919f23d792))
* debounce task search input to prevent dropped keystrokes ([#23](https://github.com/carlosvin/tanstack-fullstack-ai-template/issues/23)) ([738b1a8](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/738b1a8ddc28bf654cb05c1f0a46c750441fecad))
* harden demo auth cookie handling per review ([d316d2a](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/d316d2a2a85faf2308af95add9bffa71af733921))
* lazy-parse env for Netlify AI Gateway runtime injection ([bde745b](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/bde745b386b9110334aee76f896c9942f9a93e63))
* **netlify:** publish dist instead of .output/public ([6aef6b7](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/6aef6b78fbe7226ba2e7ff74fbc476e4f119e191))
* **netlify:** publish dist instead of .output/public ([#16](https://github.com/carlosvin/tanstack-fullstack-ai-template/issues/16)) ([b5fe1ca](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/b5fe1cac4c1ced6b78b90c241d05cb5d80238137))
* redirect to tasks list before delete to avoid 404 ([762ddbe](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/762ddbe5e099a69f4b7cbf5f83c7af947cfe5f3e))
* redirect to tasks list before delete to avoid 404 ([#29](https://github.com/carlosvin/tanstack-fullstack-ai-template/issues/29)) ([9b9b3ab](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/9b9b3abbf6690cff41c2008d29afc8f7e96b520f))
* remove local pnpm store path from workspace config ([7ee7380](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/7ee7380796ad310c3b487cd0814dac38f6487efb))
* remove unnecessary client observability useEffect from root ([c098f46](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/c098f46c633815ca66d9e17ab5f57241252f1cd2))
* restore AI button when env is loaded from .env files ([4c5f239](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/4c5f239bc054ebe93e1eeb17fe372e7765986da8))
* **skills:** keep architecture skill UI- and observability-vendor agnostic ([#27](https://github.com/carlosvin/tanstack-fullstack-ai-template/issues/27)) ([0e83b58](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/0e83b5886dd77b46f0a7b5a6536e91238c78f244))
* **skills:** keep skills vendor-agnostic and document swappable stack ([1788693](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/1788693809f227bae98386c4e93572e07dcc2a16))
* **start:** align request context with skill (Register, no casts) ([6fb017c](https://github.com/carlosvin/tanstack-fullstack-ai-template/commit/6fb017caf19b85d7f7e4bf7457fac3de75be9172))
