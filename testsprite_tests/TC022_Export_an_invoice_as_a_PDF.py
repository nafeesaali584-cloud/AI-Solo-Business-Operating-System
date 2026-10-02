import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000/")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the email and password fields and click the 'Sign in to Dashboard' button.
        # admin@clientpulse.io email field
        elem = page.get_by_role("textbox", name="admin@clientpulse.io")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@clientpulse.io")
        
        # -> Fill the email and password fields and click the 'Sign in to Dashboard' button.
        # Enter your admin password password field
        elem = page.get_by_role("textbox", name="Enter your admin password")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("SoloAdmin2026!")
        
        # -> Fill the email and password fields and click the 'Sign in to Dashboard' button.
        # Sign in to Dashboard button
        elem = page.get_by_role("button", name="Sign in to Dashboard")
        await elem.click(timeout=10000)
        
        # -> Navigate to the Invoice Builder page (Invoices → Builder) by opening /invoices/builder
        await page.goto("http://localhost:3000/invoices/builder")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Export PDF' button, wait for export feedback, then verify the invoice number 'INV-TEST-8030' remains visible and look for a download/confirmation message.
        # Download: Export PDF button
        elem = page.get_by_role("button", name="Export PDF")
        async with page.expect_download(timeout=30000) as dl_info:
            await elem.click(timeout=10000)
        download = await dl_info.value
        assert download.suggested_filename  # verify file was downloaded
        await download.save_as(f"./downloads/{download.suggested_filename}")
        
        # --> Assertions to verify final state
        
        # --> The UI shows a download-ready confirmation that the invoice PDF was exported.
        # Assert-outcome: passed
        # Assert: Shows the export success message indicating a download-ready PDF.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("Invoice PDF exported successfully:", timeout=15000), "Shows the export success message indicating a download-ready PDF."
        
        # --> The invoice remains visible after export (invoice line-item table header is present).
        await page.get_by_role("row", name="Item Qty Rate Amount").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: Invoice line-item table header is visible on the page.
        await expect(page.get_by_role("row", name="Item Qty Rate Amount").nth(0)).to_be_visible(timeout=15000), "Invoice line-item table header is visible on the page."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    