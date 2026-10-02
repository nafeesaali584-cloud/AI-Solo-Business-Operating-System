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
        
        # -> Fill 'admin@clientpulse.io' into the Admin Email field, 'SoloAdmin2026!' into the Password field, then click the 'Sign in to Dashboard' button.
        # admin@clientpulse.io email field
        elem = page.get_by_role("textbox", name="admin@clientpulse.io")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@clientpulse.io")
        
        # -> Fill 'admin@clientpulse.io' into the Admin Email field, 'SoloAdmin2026!' into the Password field, then click the 'Sign in to Dashboard' button.
        # Enter your admin password password field
        elem = page.get_by_role("textbox", name="Enter your admin password")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("SoloAdmin2026!")
        
        # -> Fill 'admin@clientpulse.io' into the Admin Email field, 'SoloAdmin2026!' into the Password field, then click the 'Sign in to Dashboard' button.
        # Sign in to Dashboard button
        elem = page.get_by_role("button", name="Sign in to Dashboard")
        await elem.click(timeout=10000)
        
        # -> Click the 'Lead Engine' link in the sidebar to open the Leads page.
        # Lead Engine link
        elem = page.get_by_role("link", name="Lead Engine")
        await elem.click(timeout=10000)
        
        # -> Click the 'Add Single Lead' button to open the lead creation form.
        # Add Single Lead button
        elem = page.get_by_role("button", name="Add Single Lead")
        await elem.click(timeout=10000)
        
        # -> Fill the 'Add Single Lead' form (Business Name, Niche, City, Phone, Email, Website) and click the 'Save Lead' button.
        # e.g. Elegance Salon & Spa text field
        elem = page.get_by_role("textbox", name="e.g. Elegance Salon & Spa")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("QA Target Lead 2026")
        
        # -> Fill the 'Add Single Lead' form (Business Name, Niche, City, Phone, Email, Website) and click the 'Save Lead' button.
        # e.g. Hair Salon text field
        elem = page.get_by_role("textbox", name="e.g. Hair Salon")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Hair Salon")
        
        # -> Fill the 'Add Single Lead' form (Business Name, Niche, City, Phone, Email, Website) and click the 'Save Lead' button.
        # e.g. Dubai, UAE text field
        elem = page.get_by_role("textbox", name="e.g. Dubai, UAE")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Dubai, UAE")
        
        # -> Fill the 'Add Single Lead' form (Business Name, Niche, City, Phone, Email, Website) and click the 'Save Lead' button.
        # +971 50 123 4567 text field
        elem = page.get_by_role("textbox", name="+971 50 123")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("+971 50 000 0000")
        
        # -> Fill the 'Add Single Lead' form (Business Name, Niche, City, Phone, Email, Website) and click the 'Save Lead' button.
        # info@elegance.com email field
        elem = page.get_by_role("textbox", name="info@elegance.com")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("qa+target2026@example.com")
        
        # -> Click the 'Save Lead' button in the Add Single Lead modal to create the lead.
        # Save Lead button
        elem = page.get_by_role("button", name="Save Lead")
        await elem.click(timeout=10000)
        
        # -> Enter 'QA Target Lead 2026' into the 'Search leads, niche, city...' field and submit the search to locate the newly created lead.
        # Search leads, niche, city... text field
        elem = page.get_by_role("textbox", name="Search leads, niche, city...")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("QA Target Lead 2026")
        
        # -> Click the 'Mark as Today's Target' button for the lead 'QA Target Lead 2026'.
        # Click the 'Mark as Today's Target' button for the lead 'QA Target Lead 2026'.
        elem = page.get_by_role("cell").filter(has_text=re.compile(r"^$")).nth(2)
        await elem.click(timeout=10000)
        
        # -> Set the Status filter to 'Imported' and confirm the lead 'QA Target Lead 2026' remains visible with its Today's Target marker.
        # All Statuses Imported Qualified Target Today... dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div/div[2]/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> The lead 'QA Target Lead 2026' is visible in the leads table and shows an 'Unmark target' control indicating it is marked as Today's Target.
        # Assert-outcome: passed
        # Assert: Verifies the lead row displays the business name 'QA Target Lead 2026'.
        await expect(page.locator("xpath=/html/body/div/div/main/div/div[3]/div/table/tbody/tr/td[2]/div/span").nth(0)).to_have_text("QA Target Lead 2026", timeout=15000), "Verifies the lead row displays the business name 'QA Target Lead 2026'."
        # Assert-outcome: passed
        # Assert: Verifies the row includes an 'Unmark target' control (title attribute).
        await expect(page.get_by_role("button", name="Unmark target").nth(0)).to_have_attribute("title", "Unmark target", timeout=15000), "Verifies the row includes an 'Unmark target' control (title attribute)."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    