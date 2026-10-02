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
        
        # -> Submit the login form by clicking the 'Sign in to Dashboard' button after filling the Admin Email and Password fields.
        # admin@clientpulse.io email field
        elem = page.get_by_role("textbox", name="admin@clientpulse.io")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@clientpulse.io")
        
        # -> Submit the login form by clicking the 'Sign in to Dashboard' button after filling the Admin Email and Password fields.
        # Enter your admin password password field
        elem = page.get_by_role("textbox", name="Enter your admin password")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("SoloAdmin2026!")
        
        # -> Submit the login form by clicking the 'Sign in to Dashboard' button after filling the Admin Email and Password fields.
        # Sign in to Dashboard button
        elem = page.get_by_role("button", name="Sign in to Dashboard")
        await elem.click(timeout=10000)
        
        # -> Click the 'Proposal Builder' link in the left sidebar to open the Proposal Builder page.
        # Proposal Builder link
        elem = page.get_by_role("link", name="Proposal Builder")
        await elem.click(timeout=10000)
        
        # -> Open the 'Proposal Builder' page by clicking the 'Proposal Builder' link in the left sidebar.
        # Proposal Builder link
        elem = page.get_by_role("link", name="Proposal Builder")
        await elem.click(timeout=10000)
        
        # -> Open the 'AI Copilot' drawer by clicking the 'AI Copilot' button to reveal AI drafting controls.
        # AI Copilot button
        elem = page.get_by_role("button", name="Toggle AI Copilot drawer")
        await elem.click(timeout=10000)
        
        # -> Ask the ClientPulse Copilot to generate a full proposal draft for Miss Al Reem Beauty Centre by entering a prompt into the Copilot input and submitting it.
        # Ask Copilot or say 'search this business... text field
        elem = page.get_by_role("textbox", name="Ask Copilot or say 'search")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Please generate a complete proposal draft for Miss Al Reem Beauty Centre using the current proposal context visible on screen. Include: a concise intro, 'What we found', 'Scope of work', 'Timeline', 'Investment' (with line items and total), and 'Terms'. Insert or update the proposal preview if possible and label the draft as 'AI Draft - Miss Al Reem Beauty Centre'.")
        
        # -> Click the 'Copy response' button in the Copilot drawer to insert the AI draft into the proposal editor/preview.
        # Copy response button
        elem = page.get_by_role("button", name="Copy response").nth(1)
        await elem.click(timeout=10000)
        
        # -> Scroll the proposal preview down to reveal the 'Save Draft' or 'Save' control (or any persistence controls) so it can be located and clicked.
        await page.mouse.wheel(0, 300)
        
        # -> Click the 'Save Draft' button to persist the drafted proposal.
        # Save Draft button
        elem = page.get_by_role("button", name="Save Draft")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Drafted proposal sections are visible in the proposal preview (example: the 'Terms' heading).
        # Assert-outcome: passed
        # Assert: The 'Terms' heading is visible in the proposal preview.
        await expect(page.locator("xpath=/html/body/div/div/main/div/div[4]/div/div/div[7]/div/h3").nth(0)).to_have_text("Terms", timeout=15000), "The 'Terms' heading is visible in the proposal preview."
        
        # --> The proposal draft was saved and the UI shows a success confirmation.
        # Assert-outcome: passed
        # Assert: A visible confirmation message indicates the draft was saved.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("Proposal draft saved successfully.", timeout=15000), "A visible confirmation message indicates the draft was saved."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    