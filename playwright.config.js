import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',workers:1,timeout:150000,
  use:{headless:true,launchOptions:{args:['--renderer-process-limit=1','--disable-gpu']}}});
