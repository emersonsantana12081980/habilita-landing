import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/cloud",
  use: { baseURL: "http://127.0.0.1:4174", channel: "chrome", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174", reuseExistingServer: false,
    env: { VITE_SUPABASE_ENABLED: "true", VITE_SUPABASE_URL: "https://test.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" },
  },
});
