import asyncio
from playwright.async_api import async_playwright
import os

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        page = await browser.new_page(viewport={"width": 1200, "height": 800})
        # Load local HTML file
        file_url = f"file://{os.path.abspath('architecture_flow.html')}"
        await page.goto(file_url)
        # Wait for tailwind CSS to load (it's loaded via CDN)
        await page.wait_for_timeout(2000) 
        await page.screenshot(path="UX_Guardian_Architecture_Flow.png", full_page=True)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture())
