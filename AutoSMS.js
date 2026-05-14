// ==UserScript==
// @name         GreenAutoSMS Main - Auto API Filters
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Send SMS via API, dynamically grab Managers/Categories, and search via URL parameters.
// @author       Programming Assistant
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // --- CONFIGURATION ---
    const TEMPLATE_NAME = "AutoSmsP";
    const delay = (min, max) => new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

    // ========================================================================
    // 1. IFRAME WORKER BOT (Executes clicks for SMS)
    // ========================================================================
    if (window.self !== window.top) {
        window.addEventListener("message", async (e) => {
            if (e.data && e.data.action === "RUN_SMS") {
                try {
                    await processSms(e.data.template);
                    window.parent.postMessage({ action: "SMS_DONE", status: "success", leadId: e.data.leadId }, "*");
                } catch (error) {
                    window.parent.postMessage({ action: "SMS_DONE", status: "error", error: error.message, leadId: e.data.leadId }, "*");
                }
            }
        });

        async function processSms(templateName) {
            await delay(3000, 4500); // Wait for the lead card to load

            // 1. Click the SMS icon
            const smsIcon = document.querySelector('.flaticon2-sms.sms-img') || document.querySelector('[title="Send SMS"]');
            if (!smsIcon) throw new Error("SMS icon not found");
            smsIcon.click();

            await delay(1000, 1500);

            // 2. Open the template dropdown
            const selectWrapper = document.querySelector('.el-select__wrapper');
            if (!selectWrapper) throw new Error("Template dropdown not found");
            selectWrapper.click();

            await delay(1000, 1500);

            // 3. Select the AutoSmsP template
            const options = document.querySelectorAll('.el-select-dropdown__item, .el-select-dropdown__item span');
            const targetOption = Array.from(options).find(opt => opt.innerText.trim() === templateName);
            if (!targetOption) throw new Error(`Template '${templateName}' not found`);
            targetOption.click();

            await delay(1000, 1500);

            // 4. Click the Send SMS button
            const buttons = document.querySelectorAll('button.form__btn.form__btn-success');
            const sendBtn = Array.from(buttons).find(btn => btn.innerText.trim() === 'Send SMS');
            if (!sendBtn) throw new Error("Send SMS button not found");
            sendBtn.click();

            await delay(1500, 2000); // Wait for the request to be sent
            return true;
        }
        return; // Stop execution of the main code inside the iframe
    }

    // ========================================================================
    // 2. PARENT CONTROLLER (Control Panel and API)
    // ========================================================================

    // CRM configuration definition
    function resolveCrmConfig() {
        const hostname = window.location.hostname;
        if (hostname === "app.techconpro.net") {
            return {
                leadUrlBase: "https://app.techconpro.net/callcenter/#/lead/",
                apiBaseUrl: "https://backoffice.techconpro.net/api/lead/list"
            };
        }
        return {
            leadUrlBase: "https://app.licacrm.co/callcenter/#/lead/",
            apiBaseUrl: "https://licacrm.co/api/lead/list"
        };
    }

    const crmConfig = resolveCrmConfig();
    let isRunning = false;
    let stopRequested = false;

    // Create Widget on the screen
    function createWidget() {
        if (document.getElementById('green-auto-sms-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'green-auto-sms-widget';

        widget.innerHTML = `
            <div style="background: #1e1e2d; color: #fff; padding: 15px; border-radius: 8px; width: 280px; font-family: Arial, sans-serif; box-shadow: 0 6px 12px rgba(0,0,0,0.5); border: 1px solid #333; z-index: 999999; position: fixed; top: 80px; right: 20px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #67c23a; text-align: center;">✉️ GreenAutoSMS API</h3>

                <div style="margin-bottom: 10px;">
                    <label style="font-size: 12px; color: #aaa;">Assign (Manager):</label>
                    <select id="sms-filter-manager" style="width: 100%; padding: 6px; margin-top: 4px; background: #2b2b36; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; cursor: pointer;">
                        <option value="">-- Loading Managers... --</option>
                    </select>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="font-size: 12px; color: #aaa;">Category:</label>
                    <select id="sms-filter-category" style="width: 100%; padding: 6px; margin-top: 4px; background: #2b2b36; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; cursor: pointer;">
                        <option value="">-- Loading Categories... --</option>
                    </select>
                </div>

                <div style="background: #2b2b36; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <div id="sms-stats" style="font-size: 13px; font-weight: bold; color: #e6a23c;">Status: Initializing API...</div>
                    <div id="sms-counter" style="font-size: 12px; color: #888; margin-top: 5px;">Processed: 0</div>
                </div>

                <button id="sms-start-btn" style="width: 100%; padding: 10px; background: #67c23a; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; transition: 0.2s;" disabled>▶ Loading...</button>
                <button id="sms-stop-btn" style="width: 100%; padding: 10px; background: #f56c6c; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; display: none; transition: 0.2s;">⏹ Stop</button>
            </div>
        `;
        document.body.appendChild(widget);

        document.getElementById('sms-start-btn').addEventListener('click', startApiProcess);
        document.getElementById('sms-stop-btn').addEventListener('click', () => {
            stopRequested = true;
            updateStatus("Stopping after current lead...");
        });

        // Initialize and fetch filters from API right away
        fetchFiltersAndPopulate();
    }

    function updateStatus(text, processedCount = null) {
        const statsEl = document.getElementById('sms-stats');
        const countEl = document.getElementById('sms-counter');
        if (statsEl) statsEl.innerText = `Status: ${text}`;
        if (processedCount !== null && countEl) countEl.innerText = `Processed: ${processedCount}`;
    }

    function toggleButtons(running) {
        document.getElementById('sms-start-btn').style.display = running ? 'none' : 'block';
        document.getElementById('sms-stop-btn').style.display = running ? 'block' : 'none';
    }

    function getAuthToken() {
        let token =
            localStorage.getItem('crm_token');

        if (token) return token.replace(/['"]+/g, '');
        return '';
    }

    // ========================================================================
    // NEW: Auto-Fetch Managers and Categories from API
    // ========================================================================
    async function fetchFiltersAndPopulate() {
        const token = getAuthToken();
        if (!token) return;

        //try {
            // Make a dummy request to get the metadata (managers, categories)
            const response = await fetch(crmConfig.apiBaseUrl + '?page=1', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            const managerSelect = document.getElementById('sms-filter-manager');
            const categorySelect = document.getElementById('sms-filter-category');

            // 1. Populate Managers (supports data.data.managers object shape)
            const managers = data?.managers || data.managers;
            console.log(data);
            if (managers && managerSelect) {
                managerSelect.innerHTML = '<option value="">-- All Managers --</option>';

                console.log(managers);
                Object.entries(managers).forEach(([key, val]) => {
                    const managerValue = val?.value;
                    const managerName = val?.full_name;
                    managerSelect.add(new Option(managerName, String(managerValue)));
                });
            }

            // 2. Populate Categories
            const categories = data.categories || data.data?.categories || data.statuses || data.data?.statuses;
            if (categories && categorySelect) {
                categorySelect.innerHTML = '<option value="">-- All Categories --</option>';

                if (Array.isArray(categories)) {
                    categories.forEach(c => categorySelect.add(new Option(c.name || c.title || c.id || c, c.id || c)));
                } else if (typeof categories === 'object') {
                    Object.entries(categories).forEach(([id, val]) => categorySelect.add(new Option(val.name || val, id)));
                }
            }

            // Enable start button
            const startBtn = document.getElementById('sms-start-btn');
            startBtn.innerText = "▶ Start (API)";
            startBtn.disabled = false;
            updateStatus("Filters loaded. Ready to start.");

        // } catch (error) {
        //     console.error("Failed to load filters:", error);
        //     updateStatus("Error loading filters.");
        // }
    }

    // ========================================================================
    // UPDATED: Fetch Leads via URL Attributes (Query Parameters)
    // ========================================================================
    async function fetchLeadsFromApi(page, manager, category) {
        const token = getAuthToken();
        if (!token) {
            alert("Authorization token not found.");
            return [];
        }

        // Add Manager and Category to the URL as query parameters
        let url = new URL(crmConfig.apiBaseUrl);
        if (manager) url.searchParams.append('assigned_to', manager);
        if (category) url.searchParams.append('category', category);

        // Keep only pagination in the body payload
        const payload = { page: page, limit: 100 };

        try {
            const response = await fetch(url.toString(), { // Convert URL object to string
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            const leads = data.data?.items || data.data || data.items || [];
            return leads.map(lead => lead.id);

        } catch (error) {
            console.error("API request error:", error);
            return [];
        }
    }

    // Main processing loop
    async function startApiProcess() {
        if (isRunning) return;
        isRunning = true;
        stopRequested = false;
        toggleButtons(true);

        const managerFilter = document.getElementById('sms-filter-manager').value;
        const categoryFilter = document.getElementById('sms-filter-category').value;

        let currentPage = 1;
        let totalProcessed = 0;
        let hasMoreLeads = true;

        while (hasMoreLeads && !stopRequested) {
            updateStatus(`Loading API (Page ${currentPage})...`);

            // Fetch array of lead IDs with URL filters
            const leadIds = await fetchLeadsFromApi(currentPage, managerFilter, categoryFilter);

            if (!leadIds || leadIds.length === 0) {
                updateStatus("No more leads found.");
                hasMoreLeads = false;
                break;
            }

            updateStatus(`Found ${leadIds.length} leads. Starting...`);

            // Process leads one by one in iframe
            for (let i = 0; i < leadIds.length; i++) {
                if (stopRequested) break;

                const leadId = leadIds[i];
                const leadUrl = `${crmConfig.leadUrlBase}${leadId}`;

                updateStatus(`Sending SMS (${i + 1}/${leadIds.length}) on page ${currentPage}...`, totalProcessed);

                try {
                    const success = await processLeadInIframe(leadUrl, leadId);
                    if (success) totalProcessed++;
                } catch (err) {
                    console.error("Error processing lead:", leadId, err);
                }
            }

            currentPage++; // Move to next API page
        }

        updateStatus(stopRequested ? "Stopped by user." : "Processing finished.", totalProcessed);
        isRunning = false;
        toggleButtons(false);
    }

    // Load lead in Iframe and control sending
    function processLeadInIframe(url, leadId) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.position = 'fixed';
            iframe.style.bottom = '-2000px';
            iframe.style.width = '1000px';
            iframe.style.height = '800px';
            document.body.appendChild(iframe);

            const timeoutId = setTimeout(() => {
                cleanup();
                resolve(false);
            }, 25000);

            const messageListener = (e) => {
                if (e.data && e.data.action === "SMS_DONE" && e.data.leadId === leadId) {
                    cleanup();
                    resolve(e.data.status === "success");
                }
            };

            window.addEventListener("message", messageListener);

            iframe.onload = async () => {
                await delay(2000, 3000);
                iframe.contentWindow.postMessage({ action: "RUN_SMS", template: TEMPLATE_NAME, leadId: leadId }, "*");
            };

            function cleanup() {
                clearTimeout(timeoutId);
                window.removeEventListener("message", messageListener);
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
            }
        });
    }

    // Widget initialization
    if (document.readyState === "complete" || document.readyState === "interactive") {
        createWidget();
    } else {
        window.addEventListener('DOMContentLoaded', createWidget);
    }

})();
