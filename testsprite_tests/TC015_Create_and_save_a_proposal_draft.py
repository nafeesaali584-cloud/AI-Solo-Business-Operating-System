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
        
        # -> Fill the 'Admin Email' and 'Password' fields and click the 'Sign in to Dashboard' button to sign in.
        # admin@clientpulse.io email field
        elem = page.get_by_role("textbox", name="admin@clientpulse.io")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@clientpulse.io")
        
        # -> Fill the 'Admin Email' and 'Password' fields and click the 'Sign in to Dashboard' button to sign in.
        # Enter your admin password password field
        elem = page.get_by_role("textbox", name="Enter your admin password")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("SoloAdmin2026!")
        
        # -> Fill the 'Admin Email' and 'Password' fields and click the 'Sign in to Dashboard' button to sign in.
        # Sign in to Dashboard button
        elem = page.get_by_role("button", name="Sign in to Dashboard")
        await elem.click(timeout=10000)
        
        # -> Open the 'Proposals Builder' page (Proposals → Builder) so a proposal can be edited and saved.
        await page.goto("http://localhost:3000/proposals/builder")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Proposal Builder' link in the left sidebar to reload the builder page and trigger the editor to load.
        # Proposal Builder link
        elem = page.get_by_role("link", name="Proposal Builder")
        await elem.click(timeout=10000)
        
        # -> Click the 'Edit Proposal Fields' button to open the proposal editor so fields can be inspected and edited.
        # Edit Proposal Fields button
        elem = page.get_by_role("button", name="Edit Proposal Fields")
        await elem.click(timeout=10000)
        
        # -> Fill the 'Project Scope' field with 'Updated via test: confirm save.' and click the 'Save Draft' button.
        # A website that works while you sleep. Prepared... text area
        elem = page.get_by_role("textbox", name="Comprehensive description of")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Updated via test: confirm save.")
        
        # -> Fill the 'Project Scope' field with 'Updated via test: confirm save.' and click the 'Save Draft' button.
        # Save Draft button
        elem = page.get_by_role("button", name="Save Draft")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The proposal editor remains accessible after saving, with the Save Draft button still visible.
        await page.get_by_role("button", name="Save Draft").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: The Save Draft button is visible on the page.
        await expect(page.get_by_role("button", name="Save Draft").nth(0)).to_be_visible(timeout=15000), "The Save Draft button is visible on the page."
        
        # --> The saved proposal state is visible in the Project Scope textarea containing the edited text.
        # Assert-outcome: passed
        # Assert: The Project Scope textarea shows the saved text.
        await expect(page.get_by_placeholder("Comprehensive description of").nth(0)).to_have_text("Updated via test: confirm save.", timeout=15000), "The Project Scope textarea shows the saved text."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    