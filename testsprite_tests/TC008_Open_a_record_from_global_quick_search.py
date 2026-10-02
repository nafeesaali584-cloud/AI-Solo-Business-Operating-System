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
        
        # -> Fill the Admin Email field with 'admin@clientpulse.io', fill the Password field with 'SoloAdmin2026!', then click the 'Sign in to Dashboard' button.
        # admin@clientpulse.io email field
        elem = page.get_by_role("textbox", name="admin@clientpulse.io")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@clientpulse.io")
        
        # -> Fill the Admin Email field with 'admin@clientpulse.io', fill the Password field with 'SoloAdmin2026!', then click the 'Sign in to Dashboard' button.
        # Enter your admin password password field
        elem = page.get_by_role("textbox", name="Enter your admin password")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("SoloAdmin2026!")
        
        # -> Fill the Admin Email field with 'admin@clientpulse.io', fill the Password field with 'SoloAdmin2026!', then click the 'Sign in to Dashboard' button.
        # Sign in to Dashboard button
        elem = page.get_by_role("button", name="Sign in to Dashboard")
        await elem.click(timeout=10000)
        
        # -> Open the global quick search by clicking the 'Quick Search...' button in the top bar.
        # Quick Search... Ctrl+K button
        elem = page.get_by_role("button", name="Quick search (Ctrl+K)")
        await elem.click(timeout=10000)
        
        # -> Type a business name (e.g., 'Acme') into the search field labeled 'Search clients, leads, proposals, invoices, messages... (Ctrl+K)'.
        # Search clients, leads, proposals, invoices... text field
        elem = page.get_by_role("textbox", name="Search clients, leads,")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Acme")
        
        # -> Type 'Desert Motors Auto Detailing' into the 'Search clients, leads, proposals, invoices, messages... (Ctrl+K)' input to locate a matching record.
        # Search clients, leads, proposals, invoices... text field
        elem = page.get_by_role("textbox", name="Search clients, leads,")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Desert Motors Auto Detailing")
        
        # -> Click the matching 'Desert Motors Auto Detailing' result in the Quick Search listbox (or click the listbox to open the top match).
        # Click the matching 'Desert Motors Auto Detailing' result in the Quick Search listbox (or click the listbox to open the top match).
        elem = page.get_by_role("listbox")
        await elem.click(timeout=10000)
        
        # -> Click the 'Desert Motors Auto Detailing' client result in the Quick Search modal to open the client record page.
        # CLIENT Desert Motors Auto Detailing Stage: Active... button
        elem = page.get_by_role("option", name="Client record: Desert Motors")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The client record page opened (URL shows a /clients/ path).
        # Assert-outcome: passed
        # Assert: URL contains '/clients/' indicating the client record page was opened.
        await expect(page).to_have_url(re.compile("/clients/"), timeout=15000), "URL contains '/clients/' indicating the client record page was opened."
        
        # --> The opened client record shows the 'Create Proposal' action, indicating record content is visible.
        await page.get_by_role("link", name="Create Proposal").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: The 'Create Proposal' link is visible on the client record page.
        await expect(page.get_by_role("link", name="Create Proposal").nth(0)).to_be_visible(timeout=15000), "The 'Create Proposal' link is visible on the client record page."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    