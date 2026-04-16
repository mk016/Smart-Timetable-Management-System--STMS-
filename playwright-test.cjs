const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log("Navigating to login...");
  await page.goto('http://localhost:3000/login');
  
  console.log("Clearing and filling email...");
  await page.fill('input[type="text"]', 'admin@stms.local'); // actually it doesn't have type="email" in the code, let's just use exact selectors
  
  console.log("Filling password...");
  await page.fill('input[type="password"]', 'admin123');
  
  console.log("Clicking submit...");
  await page.click('button[type="submit"]');
  
  console.log("Waiting for navigation...");
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  console.log("Current URL:", currentUrl);
  
  const content = await page.content();
  if (content.includes("Invalid email or password")) {
    console.log("Error: Found 'Invalid email or password'");
  } else {
    console.log("Login successful!");
  }
  
  await browser.close();
})();
