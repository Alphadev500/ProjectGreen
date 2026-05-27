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
            }, true);
        },

        // ==========================================
        // Logic of the leads' profile page
        // ==========================================
        initLeadLogic() {
            window.addEventListener("storage", (e) => {
                // Tag listens only one command - "Move to another lead"
                if (e.key === "cmd_trigger_next") {
                    setTimeout(() => {
                        const nextBtn = document.querySelector('button.collapse-next');
                        if (nextBtn) {
                            nextBtn.click();
                        }
                    }, 300);
                }
            });
        },

        startCallSequence() {
            let callImg = document.querySelector('.call-img.mr-2.pointer');
            if (callImg) {
                callImg.click();
                setTimeout(() => {
                    let dangerBtn = document.querySelector('.el-button.el-button--danger');
                    if (dangerBtn) dangerBtn.click();
                    setTimeout(() => {
                        let successBtn = document.querySelector('.el-button.el-button--success.mt-4');
                        if (successBtn) successBtn.click();
                    }, 500);
                }, 500);
            }
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

    // Запуск
    CRM.init();
})();
