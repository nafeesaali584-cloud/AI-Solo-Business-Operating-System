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
        
        # -> Fill 'admin@clientpulse.io' into the Admin Email field and submit the sign-in form using the 'Sign in to Dashboard' button.
        # admin@clientpulse.io email field
        elem = page.get_by_role("textbox", name="admin@clientpulse.io")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@clientpulse.io")
        
        # -> Fill 'admin@clientpulse.io' into the Admin Email field and submit the sign-in form using the 'Sign in to Dashboard' button.
        # Enter your admin password password field
        elem = page.get_by_role("textbox", name="Enter your admin password")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("SoloAdmin2026!")
        
        # -> Fill 'admin@clientpulse.io' into the Admin Email field and submit the sign-in form using the 'Sign in to Dashboard' button.
        # Sign in to Dashboard button
        elem = page.get_by_role("button", name="Sign in to Dashboard")
        await elem.click(timeout=10000)
        
        # -> Click the 'Browse all leads →' link to open the Leads list.
        # Browse all leads → link
        elem = page.get_by_role("link", name="Browse all leads →")
        await elem.click(timeout=10000)
        
        # -> Click the 'Add Single Lead' button to open the lead creation form.
        # Add Single Lead button
        elem = page.get_by_role("button", name="Add Single Lead")
        await elem.click(timeout=10000)
        
        # -> Fill the Add Single Lead form (Business Name, Niche / Industry, City / Country, Email) and click the 'Save Lead' button.
        # e.g. Elegance Salon & Spa text field
        elem = page.get_by_role("textbox", name="e.g. Elegance Salon & Spa")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Salon Example")
        
        # -> Fill the Add Single Lead form (Business Name, Niche / Industry, City / Country, Email) and click the 'Save Lead' button.
        # e.g. Hair Salon text field
        elem = page.get_by_role("textbox", name="e.g. Hair Salon")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Hair Salon")
        
        # -> Fill the Add Single Lead form (Business Name, Niche / Industry, City / Country, Email) and click the 'Save Lead' button.
        # e.g. Dubai, UAE text field
        elem = page.get_by_role("textbox", name="e.g. Dubai, UAE")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Dubai, UAE")
        
        # -> Fill the Add Single Lead form (Business Name, Niche / Industry, City / Country, Email) and click the 'Save Lead' button.
        # info@elegance.com email field
        elem = page.get_by_role("textbox", name="info@elegance.com")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("test.lead+1@example.com")
        
        # -> Fill the Add Single Lead form (Business Name, Niche / Industry, City / Country, Email) and click the 'Save Lead' button.
        # Save Lead button
        elem = page.get_by_role("button", name="Save Lead")
        await elem.click(timeout=10000)
        
        # -> Click the 'Mark as Today's Target' button for the 'Test Salon Example' row in the leads list.
        # Mark as Today's Target (Max 5) button
        elem = page.get_by_role("row", name="Test Salon Example Hair Salon").get_by_role("button").first
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The 'Test Salon Example' row is marked as today's target (control now allows unmarking).
        # Assert-outcome: passed
        # Assert: The lead's target button is titled 'Unmark target', showing it is marked.
        await expect(page.get_by_role("button", name="Unmark target").nth(0)).to_have_attribute("title", "Unmark target", timeout=15000), "The lead's target button is titled 'Unmark target', showing it is marked."
        
        # --> The leads list remains visible with the created lead present.
        # Assert-outcome: passed
        # Assert: The leads table shows the 'Test Salon Example' row, confirming the list is visible.
        await expect(page.locator("xpath=/html/body/div/div/main/div/div[3]/div/table/tbody/tr[1]/td[2]/div/span").nth(0)).to_have_text("Test Salon Example", timeout=15000), "The leads table shows the 'Test Salon Example' row, confirming the list is visible."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    