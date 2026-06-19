// ==UserScript==
// @name         CRM Automation - BULLETPROOF TIMER V7.0
// @namespace    http://tampermonkey.net/
// @version      7.0
// @description  Blablablagetthecode.
// @author       Programming Assistant
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const CRM = {
        pageType: null,
        currentCallSeconds: 0, // Save amount of the sec.
        wasOnCall: false,
        callConfirmWatcherActive: false,
        confirmCallYesClicked: false,

        init() {
            this.detectPage();
            this.initHotkeys();
        },

        // 1. Realizw wht is the page
        detectPage() {
            const interval = setInterval(() => {
                if (document.querySelector(".player-title")) {
                    this.pageType = "LEAD";
                    this.initLeadLogic();
                    clearInterval(interval);
                } else if (document.querySelector('.page-holder .wrapper .connect span') || document.querySelector('.block-btn-call') || document.querySelector('.timer')) {
                    this.pageType = "CALL";
                    this.initCallLogic();
                    clearInterval(interval);
                }
            }, 500);
        },

        // 2. HOT KEY
        initHotkeys() {
            document.addEventListener('keydown', (e) => {
                // If you write the comment - don't react
                if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.pageType === "LEAD") this.startCallSequence();
                }

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    if (this.pageType === "LEAD") {
                        // Send the sygnal to hangup in the call tab
                        localStorage.setItem("cmd_request_hangup", Date.now().toString());
                    } else if (this.pageType === "CALL") {
                        this.clickHangUp();
                    }
                }

                if (e.key === 'ArrowLeft') {
                    setTimeout(() => {
                        const nextBtn = document.querySelector('button.collapse-next');
                        if (nextBtn) {
                            nextBtn.click();
                        }
                    }, 300);
                }
            }, true);
        },

        // ==========================================
        // Logic of the leads' profile page
        // ==========================================
        initLeadLogic() {
            window.addEventListener("storage", (e) => {
                // Tag listens only one command - "Move to another lead"
                if (e.key === "cmd_trigger_next") {

                }
            });
        },

        startCallSequence() {
            this.confirmCallYesClicked = false;
            console.log('GreenLoader: startCallSequence called, looking for call icon');

            this.waitForElement('.call-img.mr-2.pointer', (callImg) => {
                console.log('GreenLoader: call icon found, clicking');
                callImg.click();
                console.log('GreenLoader: call icon clicked, watching for Confirm call dialog');
                this.autoConfirmCallDialog();
            });
        },

        waitForElement(selector, callback, timeout=5000) {
            const element = document.querySelector(selector);
            if (element) {
                callback(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (!element) return;

                observer.disconnect();
                clearTimeout(timeoutId);
                callback(element);
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            const timeoutId = setTimeout(() => {
                observer.disconnect();
                console.log(`GreenLoader: timed out waiting for ${selector}`);
            }, timeout);
        },

        autoConfirmCallDialog() {
            if (this.callConfirmWatcherActive) {
                console.log('GreenLoader: Confirm call watcher is already active');
                return;
            }

            console.log('GreenLoader: starting Confirm call watcher');
            this.callConfirmWatcherActive = true;

            const getConfirmDialog = () => {
                const dialogs = Array.from(document.querySelectorAll('.el-dialog'));
                console.log(`GreenLoader: looking for Confirm call dialog, found ${dialogs.length} dialog(s)`);

                return dialogs.find((dialog) => {
                    const title = dialog.querySelector('.el-dialog__title');
                    const titleText = title ? title.textContent.trim().toLowerCase() : '';
                    const hasCallConfirmContent = !!dialog.querySelector('.call-confirm');

                    console.log('GreenLoader: checking dialog', {
                        title: titleText || 'no title',
                        hasCallConfirmContent
                    });

                    if (!title) return hasCallConfirmContent;

                    return titleText === 'confirm call';
                });
            };

            const hasCaruselInDom = () => {
                const pageHtml = document.documentElement.outerHTML.toLowerCase();
                const hasWord = pageHtml.includes('carusel') || pageHtml.includes('carousel');
                console.log(`GreenLoader: carusel/carousel word found: ${hasWord}`);
                return hasWord;
            };

            const clickConfirmYesIfNeeded = () => {
                const confirmDialog = getConfirmDialog();
                if (!confirmDialog) {
                    console.log('GreenLoader: waiting for Confirm call dialog');
                    return false;
                }

                if (hasCaruselInDom()) {
                    console.log('GreenLoader: carusel/carousel found, not clicking Confirm call Yes');
                    return true;
                }

                console.log('GreenLoader: Confirm call dialog found, looking for Yes button');

                const yesButton = Array.from(confirmDialog.querySelectorAll('.el-button.el-button--success.mt-4')).find((button) => {
                    const buttonText = button.textContent.trim().toLowerCase();
                    const isDisabled = button.getAttribute('aria-disabled') === 'true' || button.disabled;

                    console.log('GreenLoader: checking success button', {
                        text: buttonText || 'no text',
                        isDisabled
                    });

                    return buttonText === 'yes' && !isDisabled;
                });

                if (!yesButton) {
                    console.log('GreenLoader: waiting for Confirm call Yes button');
                    return false;
                }

                yesButton.click();
                this.confirmCallYesClicked = true;
                console.log('GreenLoader: clicked Confirm call Yes');
                return true;
            };

            if (clickConfirmYesIfNeeded()) {
                this.callConfirmWatcherActive = false;
                return;
            }

            const observer = new MutationObserver(() => {
                if (!clickConfirmYesIfNeeded()) return;

                observer.disconnect();
                this.callConfirmWatcherActive = false;
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                this.callConfirmWatcherActive = false;
                console.log('GreenLoader: Confirm call watcher timed out');
            }, 5000);
        },

        // ==========================================
        // Logic of the call tab
        // ==========================================
        initCallLogic() {
            window.addEventListener("storage", (e) => {
                if (e.key === "cmd_request_hangup") {
                    this.clickHangUp();
                }
            });

            setInterval(() => this.monitorCall(), 1000);
            setInterval(() => this.autoAnswer(), 1000);
        },

        autoAnswer() {
            const block = document.querySelector('.block-btn-call');
            if (block) {
                const successBtn = block.querySelector('.el-button.el-button--success');
                if (successBtn) successBtn.click();
            }
        },

        clickHangUp() {
            const btn = document.querySelector('.el-button.el-button--danger');
            if (btn) btn.click();
        },

        monitorCall() {
            const timerEl = document.querySelector('.timer');

            // if there's a timer on the screen
            if (timerEl && timerEl.innerText.includes(":")) {
                this.wasOnCall = true;
                const parts = timerEl.innerText.split(":");

                if (parts.length === 3) {
                    // change the time in real sec
                    this.currentCallSeconds = parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);

                    // Hangup the phone on the 35th sec if the lead didn't pick up
                    if (!this.isPickedUp() && this.currentCallSeconds === 35) {
                        this.clickHangUp();
                    }

                    // Install FTD after 120 sec
                    if (this.currentCallSeconds >= 120) {
                        localStorage.setItem('userFTD', 'true');
                    }
                }
            }
            // If the timer disappear (doesn't matter who hangs up)
            else if (this.wasOnCall) {
                this.wasOnCall = false;

                // Main check: is the call was short?
                if (this.currentCallSeconds > 0 && this.currentCallSeconds < 60) {
                    // Only if the call was < 60 sec, send command to move to another lead
                    localStorage.setItem("cmd_trigger_next", Date.now().toString());
                } else if (this.currentCallSeconds >= 60) {
                    // If teh call was more than 60 sec - DO NOTHING we stay at the same page to leave a comment
                    console.log("Blocking transition: dialogue lasted more than 1 min.");
                }

                // Reset the counter for the next call
                this.currentCallSeconds = 0;
            }
        },

        isPickedUp() {
            const status = document.querySelector('.status-call-start');
            return status && status.innerText.includes("picked up");
        }
    };

    function showNotAuthorizedMessage(message = "Not authorized") {
        const existing = document.getElementById("green-loader-auth-status");
        if (existing) existing.remove();

        const notice = document.createElement("div");
        notice.id = "green-loader-auth-status";
        notice.style.position = "fixed";
        notice.style.top = "20px";
        notice.style.left = "50%";
        notice.style.transform = "translateX(-50%)";
        notice.style.padding = "10px 14px";
        notice.style.background = "#c0392b";
        notice.style.color = "#fff";
        notice.style.borderRadius = "6px";
        notice.style.zIndex = "999999";
        notice.style.fontFamily = "Arial, sans-serif";
        notice.style.fontSize = "14px";
        notice.textContent = message;
        document.body.appendChild(notice);
    }

    function extractAgentName() {
        const header = document.querySelector(".header__ip");
        if (!header) return null;

        const lines = header.querySelectorAll("p");
        for (const line of lines) {
            const text = (line.textContent || "").trim();
            if (!text.toLowerCase().includes("agent name")) continue;

            const parts = text.split("⏤");
            if (parts.length > 1) {
                const name = parts.slice(1).join("⏤").trim();
                if (name) return name;
            }

            const fallback = text.replace(/agent name\s*[:\-–—⏤]?\s*/i, "").trim();
            if (fallback) return fallback;
        }

        return null;
    }

    function waitForAgentName(maxAttempts = 20, delayMs = 500) {
        return new Promise((resolve) => {
            let attempts = 0;

            const tick = () => {
                const name = extractAgentName();
                if (name) return resolve(name);

                attempts += 1;
                if (attempts >= maxAttempts) return resolve(null);
                setTimeout(tick, delayMs);
            };

            tick();
        });
    }

    async function authorizeGreenLoader() {
        const agentName = await waitForAgentName();
        if (!agentName) {
            showNotAuthorizedMessage("Not authorized: Agent name not found");
            return false;
        }

        try {
            const response = await fetch("https://alphadev.space/Green/GreenAutoEmailV2/AutoEmailM/API/autoStatusCalls.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: new URLSearchParams({
                    username: agentName
                }).toString()
            });

            const data = await response.json();
            if (Number(data?.status) === 1) return true;

            showNotAuthorizedMessage("Not authorized");
            return false;
        } catch (error) {
            console.error("GreenLoader authorization request failed:", error);
            showNotAuthorizedMessage("Not authorized");
            return false;
        }
    }

    async function initGreenLoader() {
        const isAuthorized = await authorizeGreenLoader();
        if (!isAuthorized) return;
        CRM.init();
    }

    // Запуск
    initGreenLoader();
})();
