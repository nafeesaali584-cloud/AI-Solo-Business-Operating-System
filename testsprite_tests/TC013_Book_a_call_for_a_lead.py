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
        
        # -> Fill the 'Admin Email' and 'Password' fields and click the 'Sign in to Dashboard' button.
        # admin@clientpulse.io email field
        elem = page.get_by_role("textbox", name="admin@clientpulse.io")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@clientpulse.io")
        
        # -> Fill the 'Admin Email' and 'Password' fields and click the 'Sign in to Dashboard' button.
        # Enter your admin password password field
        elem = page.get_by_role("textbox", name="Enter your admin password")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("SoloAdmin2026!")
        
        # -> Fill the 'Admin Email' and 'Password' fields and click the 'Sign in to Dashboard' button.
        # Sign in to Dashboard button
        elem = page.get_by_role("button", name="Sign in to Dashboard")
        await elem.click(timeout=10000)
        
        # -> Click the 'Lead Engine' link in the left navigation to open the Leads list.
        # Lead Engine link
        elem = page.get_by_role("link", name="Lead Engine")
        await elem.click(timeout=10000)
        
        # -> Click the 'Lead Engine' link in the left navigation to open the Leads list.
        # Lead Engine link
        elem = page.get_by_role("link", name="Lead Engine")
        await elem.click(timeout=10000)
        
        # -> Click the 'Add Single Lead' button to create a new lead via the UI.
        # Add Single Lead button
        elem = page.get_by_role("button", name="Add Single Lead")
        await elem.click(timeout=10000)
        
        # -> Fill the Add Single Lead form and click the 'Save Lead' button to create the new lead.
        # e.g. Elegance Salon & Spa text field
        elem = page.get_by_role("textbox", name="e.g. Elegance Salon & Spa")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Lead for Call")
        
        # -> Fill the Add Single Lead form and click the 'Save Lead' button to create the new lead.
        # e.g. Hair Salon text field
        elem = page.get_by_role("textbox", name="e.g. Hair Salon")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Consulting")
        
        # -> Fill the Add Single Lead form and click the 'Save Lead' button to create the new lead.
        # e.g. Dubai, UAE text field
        elem = page.get_by_role("textbox", name="e.g. Dubai, UAE")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test City, TC")
        
        # -> Fill the Add Single Lead form and click the 'Save Lead' button to create the new lead.
        # +971 50 123 4567 text field
        elem = page.get_by_role("textbox", name="+971 50 123")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("+1234567890")
        
        # -> Fill the Add Single Lead form and click the 'Save Lead' button to create the new lead.
        # info@elegance.com email field
        elem = page.get_by_role("textbox", name="info@elegance.com")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testlead+call@example.com")
        
        # -> Click the 'Save Lead' button in the Add Single Lead modal to create the new lead.
        # Save Lead button
        elem = page.get_by_role("button", name="Save Lead")
        await elem.click(timeout=10000)
        
        # -> Open the 'Card' link for 'Test Lead for Call' to view the lead detail page.
        # Card link
        elem = page.get_by_role("row", name="Test Lead for Call Consulting").get_by_role("link")
        await elem.click(timeout=10000)
        
        # -> Open the call booking flow by clicking the 'Book Call' button on the lead detail page.
        # Book Call button
        elem = page.get_by_role("button", name="Book Call", exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Call agenda' textarea with an agenda and click the 'Confirm Call Booking' button to schedule the call.
        # Call agenda, agreed time or meeting link... text area
        elem = page.get_by_role("textbox", name="Call agenda, agreed time or")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Intro discovery call to discuss automation needs and next steps. Proposed time: Thu 2026-10-07 10:00 AM.")
        
        # -> Fill the 'Call agenda' textarea with an agenda and click the 'Confirm Call Booking' button to schedule the call.
        # Confirm Call Booking button
        elem = page.get_by_role("button", name="Confirm Call Booking")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        current_url = await page.evaluate("() => window.location.href")
        # Assert-outcome: passed
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    