import puppeteer from "puppeteer";

const ORDER_ID = "f2ca8e9c-8acd-4089-a629-d9d2d957d392";
const VOUCHER = "GIFT-10-VIDEO-001";
const BASE = "http://localhost:3000";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1280, height: 800 },
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
  slowMo: 80,
});

const page = await browser.newPage();

console.log("1. Shop homepage");
await page.goto(BASE, { waitUntil: "networkidle2" });
await wait(3500);

console.log("2. Checkout page");
await page.goto(`${BASE}/checkout/1`, { waitUntil: "networkidle2" });
await wait(3500);

console.log("3. Paid order with voucher code");
await page.goto(`${BASE}/order/${ORDER_ID}`, { waitUntil: "networkidle2" });
await wait(2500);
const copyBtn = await page.$("button");
if (copyBtn) {
  await copyBtn.click();
  await wait(2000);
}

console.log("4. Redeem voucher");
await page.goto(`${BASE}/redeem`, { waitUntil: "networkidle2" });
await wait(1500);
await page.type("input", VOUCHER);
await wait(1000);
const redeemBtn = await page.$("button");
if (redeemBtn) {
  await redeemBtn.click();
  await wait(3000);
}

console.log("5. Admin inventory");
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
await wait(1500);
await page.type('input[type="password"]', "admin123");
await page.click("button");
await wait(3500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await wait(3000);

await browser.close();
console.log("Demo complete");
