// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('../packages/ozean/package.json', 'utf8'));

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'OzeanJs',
			logo: {
				src: './src/assets/logo.svg',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/ozeanjs/ozean' },
				{ icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/ozean' },
				{ icon: 'discord', label: 'npm', href: 'https://discord.gg/rMBc8Snft4' }
			],
			sidebar: [
				{
					label: `Version`,
					link: '/',
					badge: {
						text: `v${pkg.version}`,
						variant: 'danger',
					},
				},
				{
					label: 'Intro',
					items: [
						{ label: 'What is OzeanJs?', slug: 'docs/intro/what-is-ozeanjs' },
						{ label: 'Key Features', slug: 'docs/intro/key-features' },
						{ label: 'Core Concepts', slug: 'docs/intro/core-concepts' },
						{ label: 'Quickstart', slug: 'docs/intro/quickstart' },
					],
				},
				{
					label: 'Overview',
					items: [
						{ label: 'First steps', slug: 'docs/overview/first-steps' },
						{ label: 'Modules', slug: 'docs/overview/modules' },
						{ label: 'Controllers', slug: 'docs/overview/controllers' },
						{ label: 'Providers', slug: 'docs/overview/providers' },
						{ label: 'Pipes', slug: 'docs/overview/pipes' },
						{ label: 'Guards', slug: 'docs/overview/guards' },
						{ label: 'File Uploads', slug: 'docs/overview/file-uploads' },
						{ label: 'Static File Serving', slug: 'docs/overview/static-file-serving' },
						{ label: 'Lifecycle Hooks', slug: 'docs/overview/lifecycle-hooks' },
						{ label: 'Exception Handling', slug: 'docs/overview/exception-handling' },
					],
				},
				{
					label: 'CLI',
					items: [
						{ label: 'Overview', slug: 'docs/cli/cli-overview' },
						{ label: 'Create Project', slug: 'docs/cli/cli-new' },
					],
				},
			],
		}),
	],
});
