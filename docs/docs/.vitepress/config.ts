import { defineConfig } from 'vitepress';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../packages/ozean/package.json'), 'utf8')
);

const siteTitle = 'OzeanJs';
const siteDescription =
  'A progressive Bun framework for crafting efficient and scalable server-side applications.';
const siteUrl = 'https://ozeanjs.com';
const siteImage = 'https://ozeanjs.com/logo.svg';
const siteKeyWord = pkg.keywords.join(',');

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: siteTitle,
  description: siteDescription,
  head: [
    // Open Graph / Facebook
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:title', content: siteTitle }],
    ['meta', { property: 'og:description', content: siteDescription }],
    ['meta', { property: 'og:image', content: siteImage }],

    ['meta', { itemprop: 'name', content: siteTitle }],
    ['meta', { itemprop: 'description', content: siteDescription }],
    ['meta', { itemprop: 'keywords', content: siteKeyWord }],
    ['meta', { itemprop: 'image', content: siteImage }],

    // Twitter
    ['meta', { property: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { property: 'twitter:url', content: siteUrl }],
    ['meta', { property: 'twitter:title', content: siteTitle }],
    ['meta', { property: 'twitter:description', content: siteDescription }],
    ['meta', { property: 'twitter:image', content: siteImage }],

    ['link', { rel: 'icon', href: '/favicon.svg' }],
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-8BTJB95WVT' }],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-8BTJB95WVT');`,
    ],
  ],
  sitemap: {
    hostname: 'https://ozeanjs.com',
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: { src: '/logo.svg' },
    nav: [
      { text: 'Guide', link: '/intro/what-is-ozeanjs' },
      { text: 'Issues', link: 'https://github.com/ozeanjs/ozean/issues' },
      {
        text: `v${pkg.version}`,
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/ozeanjs/ozean/releases', // ลิงก์ไปยังหน้า Changelog
          },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Intro',
        items: [
          { text: 'What is OzeanJs?', link: '/intro/what-is-ozeanjs' },
          { text: 'Key Features', link: '/intro/key-features' },
          { text: 'Core Concepts', link: '/intro/core-concepts' },
          { text: 'Quickstart', link: '/intro/quickstart' },
        ],
      },
      {
        text: 'Overview',
        items: [
          { text: 'First steps', link: '/overview/first-steps' },
          { text: 'Modules', link: '/overview/modules' },
          { text: 'Controllers', link: '/overview/controllers' },
          { text: 'Providers', link: '/overview/providers' },
          { text: 'Pipes', link: '/overview/pipes' },
          { text: 'Guards', link: '/overview/guards' },
          { text: 'File Uploads', link: '/overview/file-uploads' },
          { text: 'Static File Serving', link: '/overview/static-file-serving' },
          { text: 'Lifecycle Hooks', link: '/overview/lifecycle-hooks' },
          { text: 'Dynamic Modules', link: '/overview/dynamic-modules' },
          { text: 'Exception Handling', link: '/overview/exception-handling' },
        ],
      },
      {
        text: 'CLI',
        items: [
          { text: 'Overview', link: '/cli/cli-overview' },
          { text: 'Create Project', link: '/cli/cli-new' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ozeanjs/ozean' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/ozean' },
      { icon: 'discord', link: 'https://discord.gg/rMBc8Snft4' },
    ],

    search: {
      provider: 'local',
    },
  },
});
