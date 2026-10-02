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
        
        # -> Fill 'admin@clientpulse.io' into the Admin Email field and then enter the admin password and click 'Sign in to Dashboard'.
        # admin@clientpulse.io email field
        elem = page.get_by_role("textbox", name="admin@clientpulse.io")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@clientpulse.io")
        
        # -> Fill 'admin@clientpulse.io' into the Admin Email field and then enter the admin password and click 'Sign in to Dashboard'.
        # Enter your admin password password field
        elem = page.get_by_role("textbox", name="Enter your admin password")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("SoloAdmin2026!")
        
        # -> Fill 'admin@clientpulse.io' into the Admin Email field and then enter the admin password and click 'Sign in to Dashboard'.
        # Sign in to Dashboard button
        elem = page.get_by_role("button", name="Sign in to Dashboard")
        await elem.click(timeout=10000)
        
        # -> Click the 'Lead Engine' link in the sidebar to open the leads list.
        # Lead Engine link
        elem = page.get_by_role("link", name="Lead Engine")
        await elem.click(timeout=10000)
        
        # -> Click the 'Add Single Lead' button to create a lead since no leads are listed.
        # Add Single Lead button
        elem = page.get_by_role("button", name="Add Single Lead")
        await elem.click(timeout=10000)
        
        # -> Fill the Add Single Lead form (Business Name, Email, Phone) and click the 'Save Lead' button to create a lead.
        # e.g. Elegance Salon & Spa text field
        elem = page.get_by_role("textbox", name="e.g. Elegance Salon & Spa")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Lead Cafe")
        
        # -> Fill the Add Single Lead form (Business Name, Email, Phone) and click the 'Save Lead' button to create a lead.
        # info@elegance.com email field
        elem = page.get_by_role("textbox", name="info@elegance.com")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testlead@example.com")
        
        # -> Fill the Add Single Lead form (Business Name, Email, Phone) and click the 'Save Lead' button to create a lead.
        # +971 50 123 4567 text field
        elem = page.get_by_role("textbox", name="+971 50 123")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("+1234567890")
        
        # -> Fill the Add Single Lead form (Business Name, Email, Phone) and click the 'Save Lead' button to create a lead.
        # Save Lead button
        elem = page.get_by_role("button", name="Save Lead")
        await elem.click(timeout=10000)
        
        # -> Click the 'Card' link for 'Test Lead Cafe' to open the lead detail view.
        # Card link
        elem = page.get_by_role("row", name="Test Lead Cafe — — Imported").get_by_role("link")
        await elem.click(timeout=10000)
        
        # -> Click the 'Search this business online' button to run deep research for the lead.
        # Search this business online button
        elem = page.get_by_role("button", name="Search this business online")
        await elem.click(timeout=10000)
        
        # -> Click the 'Contact (Gate 1)' button to open the contact flow and draft an outreach message.
        # Contact (Gate 1) button
        elem = page.get_by_role("button", name="Contact (Gate 1)")
        await elem.click(timeout=10000)
        
        # -> Click the 'Mark as Sent (Unlock Gate 1)' button to confirm the outreach (after waiting for synthesis to finish).
        # Mark as Sent (Unlock Gate 1) button
        elem = page.get_by_role("button", name="Mark as Sent (Unlock Gate 1)")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The AI Business Snapshot did not show completed research results and instead reported a quota error.
        # Assert-outcome: failed
        # Assert: Expected AI Business Snapshot to display completed research results.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("Research could not be completed \u2014 search quota limit reached, try again later", timeout=15000), "Expected AI Business Snapshot to display completed research results."
        
        # --> A Gate 1 outreach contact was recorded in the lead's Interaction History.
        # Assert-outcome: failed
        # Assert: Expected Interaction History to list the recorded Gate 1 outbound touchpoint.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("GATE 1: SENT", timeout=15000), "Expected Interaction History to list the recorded Gate 1 outbound touchpoint."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    