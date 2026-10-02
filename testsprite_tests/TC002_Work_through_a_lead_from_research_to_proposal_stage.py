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
        
        # -> Click the 'Lead Engine' link in the sidebar to open the leads list.
        # Lead Engine link
        elem = page.get_by_role("link", name="Lead Engine")
        await elem.click(timeout=10000)
        
        # -> Click the 'Add Single Lead' button to open the create-lead form so the lead can be added.
        # Add Single Lead button
        elem = page.get_by_role("button", name="Add Single Lead")
        await elem.click(timeout=10000)
        
        # -> Fill the 'Business Name', 'Phone / WhatsApp', and 'Email' fields and click the 'Save Lead' button to create a new lead.
        # e.g. Elegance Salon & Spa text field
        elem = page.get_by_role("textbox", name="e.g. Elegance Salon & Spa")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Salon Co")
        
        # -> Fill the 'Business Name', 'Phone / WhatsApp', and 'Email' fields and click the 'Save Lead' button to create a new lead.
        # +971 50 123 4567 text field
        elem = page.get_by_role("textbox", name="+971 50 123")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("+971 50 123 4567")
        
        # -> Fill the 'Business Name', 'Phone / WhatsApp', and 'Email' fields and click the 'Save Lead' button to create a new lead.
        # info@elegance.com email field
        elem = page.get_by_role("textbox", name="info@elegance.com")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("lead+test1@example.com")
        
        # -> Fill the 'Business Name', 'Phone / WhatsApp', and 'Email' fields and click the 'Save Lead' button to create a new lead.
        # Save Lead button
        elem = page.get_by_role("button", name="Save Lead")
        await elem.click(timeout=10000)
        
        # -> Click the 'Card' button for the 'Test Salon Co' lead to open its detail/card view.
        # Card link
        elem = page.get_by_role("row", name="Test Salon Co — — Imported").get_by_role("link")
        await elem.click(timeout=10000)
        
        # -> Click the 'Search this business online' button to run deep research for the lead and wait for the results or progress indicator to appear.
        # Search this business online button
        elem = page.get_by_role("button", name="Search this business online")
        await elem.click(timeout=10000)
        
        # -> Click the 'Contact (Gate 1)' button to open the outreach review/draft modal for Gate 1.
        # Contact (Gate 1) button
        elem = page.get_by_role("button", name="Contact (Gate 1)")
        await elem.click(timeout=10000)
        
        # -> Click the 'Log Customer Reply' button to open the reply logging UI.
        # Log Customer Reply button
        elem = page.get_by_title("Log customer reply via")
        await elem.click(timeout=10000)
        
        # -> Fill the 'Paste Customer's Incoming Message' textarea with a sample reply and click the 'Save & Advance Stage' button to record the reply and advance the follow-up stage.
        # e.g. 'Can you send pricing details?' or 'We are... text area
        elem = page.get_by_role("textbox", name="e.g. 'Can you send pricing")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Thanks \u2014 please send pricing details and availability for a quick call.")
        
        # -> Fill the 'Paste Customer's Incoming Message' textarea with a sample reply and click the 'Save & Advance Stage' button to record the reply and advance the follow-up stage.
        # Save & Advance Stage button
        elem = page.get_by_role("button", name="Save & Advance Stage")
        await elem.click(timeout=10000)
        
        # -> Fill the 'Paste Customer's Incoming Message' textarea with a sample reply and click the 'Save & Advance Stage' button to record the reply and advance the follow-up stage.
        # Book Call button
        elem = page.locator("xpath=/html/body/div/div/main/div/div[1]/div/div[2]/button[3]").nth(0)
        await elem.click(timeout=10000)
        
        # -> Click the 'Mark as Sent (Unlock Gate 1)' button in the Outreach Message Review modal to unlock Gate 1 and record the contact action.
        # Mark as Sent (Unlock Gate 1) button
        elem = page.get_by_role("button", name="Mark as Sent (Unlock Gate 1)")
        await elem.click(timeout=10000)
        
        # -> Click the 'Book Call' button to open the booking UI and prepare to record a call booking for the lead.
        # Book Call button
        elem = page.get_by_role("button", name="Book Call", exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Call agenda, agreed time or meeting link...' textarea and click the 'Confirm Call Booking' button to record the booking.
        # Call agenda, agreed time or meeting link... text area
        elem = page.get_by_role("textbox", name="Call agenda, agreed time or")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Intro discovery call: tentative Oct 3, 10:00 AM UTC. Agenda: 10-min walkthrough of proposed automation and next steps. Meeting link / contact: TBD.")
        
        # -> Fill the 'Call agenda, agreed time or meeting link...' textarea and click the 'Confirm Call Booking' button to record the booking.
        # Confirm Call Booking button
        elem = page.get_by_role("button", name="Confirm Call Booking")
        await elem.click(timeout=10000)
        
        # -> Click the 'Move to Proposal' button on the lead card to move the lead into the Proposal stage.
        # Move to Proposal button
        elem = page.get_by_role("button", name="Move to Proposal")
        await elem.click(timeout=10000)
        
        # -> Click the 'Proceed to Proposal' button in the 'Advance Unresponsive Lead?' confirmation modal to move the lead to the Proposal stage.
        # Proceed to Proposal button
        elem = page.get_by_role("button", name="Proceed to Proposal")
        await elem.click(timeout=10000)
        
        # -> Click the 'Lead Engine' link in the left sidebar to open the leads list so the Test Salon Co lead can be reopened and Interaction History inspected.
        # Lead Engine link
        elem = page.get_by_role("link", name="Lead Engine")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The lead 'Test Salon Co' is listed in the leads table in the Proposal stage.
        # Assert-outcome: passed
        # Assert: Lead row status equals 'Proposal'.
        await expect(page.locator("xpath=/html/body/div/div/main/div/div[3]/div/table/tbody/tr[10]/td[5]").nth(0)).to_have_text("Proposal", timeout=15000), "Lead row status equals 'Proposal'."
        
        # --> The lead shows outreach activity recorded (interaction logged and call booked).
        await page.get_by_text("10/1/").nth(1).nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: A last-contact entry is visible on the lead row indicating activity was recorded.
        await expect(page.get_by_text("10/1/").nth(1).nth(0)).to_be_visible(timeout=15000), "A last-contact entry is visible on the lead row indicating activity was recorded."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    