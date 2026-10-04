import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"./tests/landing", fullyParallel:true, workers:2,
  use:{baseURL:"http://127.0.0.1:4175",channel:"chrome",trace:"retain-on-failure"},
  projects:[
    {name:"desktop",use:{viewport:{width:1440,height:1000}}},
    {name:"tablet",use:{viewport:{width:768,height:1024}}},
    {name:"mobile",use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
    {name:"small-mobile",use:{viewport:{width:360,height:800},isMobile:true,hasTouch:true}},
  ],
  webServer:{command:"npm run dev -- --host 127.0.0.1 --port 4175 --strictPort",url:"http://127.0.0.1:4175",reuseExistingServer:false,
    env:{VITE_SUPABASE_ENABLED:"true",VITE_SUPABASE_URL:"https://test.supabase.co",VITE_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_test"}}
});
