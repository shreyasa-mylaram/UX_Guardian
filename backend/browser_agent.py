from playwright.async_api import async_playwright
import os
import uuid
from audit_engine import run_axe_core
import uuid

async def run_browser_scan(url: str, output_dir: str = "artifacts"):
    """
    Scans a URL using Playwright, capturing screenshot, DOM, and CSS.
    """
    os.makedirs(output_dir, exist_ok=True)
    scan_id = str(uuid.uuid4())
    
    screenshot_path = os.path.join(output_dir, f"{scan_id}_screenshot.png")
    dom_path = os.path.join(output_dir, f"{scan_id}_dom.html")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            device_scale_factor=1,
        )
        page = await context.new_page()
        
        try:
            await page.goto(url, wait_until="networkidle", timeout=60000)
        except Exception as e:
            print(f"Error navigating to {url}: {e}")
            await browser.close()
            return {"error": str(e)}

        # Wait a bit for dynamic content
        await page.wait_for_timeout(2000)
        
        # Capture screenshot
        await page.screenshot(path=screenshot_path, full_page=True)
        
        # Extract DOM
        dom_content = await page.content()
        with open(dom_path, "w", encoding="utf-8") as f:
            f.write(dom_content)
            
        # Extract generic text/structural info for basic UX evaluation if needed
        # Or let AI analyze the raw HTML + Screenshot
        
        # Run axe-core
        axe_results = await run_axe_core(page)
        
        # Extract basic performance metrics
        performance_timing = await page.evaluate("""() => {
            const timing = window.performance.timing;
            return {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                ttfb: timing.responseStart - timing.navigationStart
            };
        }""")
        
        await browser.close()
        
    return {
        "scan_id": scan_id,
        "screenshot_path": screenshot_path,
        "dom_path": dom_path,
        "url": url,
        "axe_results": axe_results,
        "performance": performance_timing
    }
