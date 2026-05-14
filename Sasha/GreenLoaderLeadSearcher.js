// ==UserScript==
// @name         CRM Call Automation
// @namespace    http://tampermonkey.net/
// @version      0.6.2
// @description
// @author       Programming Assistant
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const Green = {
        autoSendEmailTempName: localStorage.getItem("autoEmailTempName") || "new",
        userFTD: false,
        callCanselIntervals: [35],
        onCall: false,
        page: false,
        callConfirmWatcherActive: false,


        getRandomNumber : (from, to) => Math.random() * (to - from) + from,

        setTimeout: (callback, from = 200, to = 500) => {
            setTimeout(callback, Green.getRandomNumber(from, to));
        },

        initHotkeys: () => {
            document.addEventListener('keydown', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    Green.initOnConfirm();
                }

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (Green.page === "Call") {
                        hengUp();
                    } else {
                        localStorage.setItem("hengUp", "true");
                        setTimeout(() => localStorage.removeItem("hengUp"), 50);
                    }
                }
            });
        },

        initOnConfirm: () => {
            if (Green.callConfirmWatcherActive) return;
            Green.callConfirmWatcherActive = true;

            let intervalID = setInterval(() => {
                try {
                    let callImg = document.querySelector('.table-row__image.call-img');
                    if (callImg) {
                        callImg.click();

                        Green.setTimeout(() => {
                            let dangerBtn = document.querySelector('.el-button.el-button--danger');
                            if (dangerBtn) dangerBtn.click();

                            Green.setTimeout(() => {
                                let successBtn = document.querySelector('.el-button.el-button--success.mt-4');
                                if (successBtn) successBtn.click();
                            }, 300, 600);
                        }, 300, 600);

                        clearInterval(intervalID);
                        Green.callConfirmWatcherActive = false;
                    }
                } catch(e) { console.error("Помилка кліку:", e); }
            }, 100);
        },

        getRandomIntervalNumber: () => Green.callCanselIntervals[Math.floor(Math.random() * Green.callCanselIntervals.length)],

        init: () => {
            Green.initHotkeys();
            DetectPage();
        }
    };

    function DetectPage() {
        let intervalID = setInterval(() => {
            let app = document.querySelector('#app');
            if (app !== null) {
                if (document.querySelector(".player-title") !== null) {
                    Green.page = "Lead";
                    clearInterval(intervalID);
                    saveUserId();
                    actOnChange();
                }
                else if (document.querySelector('.page-holder .wrapper .connect span') !== null) {
                    Green.page = "Call";
                    clearInterval(intervalID);
                    callTab();
                }
            }
        }, 100);
    }

    function getUserId() {
        try {
            return document.querySelector('.table-content').querySelectorAll('.table-row')[2].querySelector('.table-row__value').innerText.trim();
        } catch(e) { return null; }
    }

    function saveUserId() {
        let id = getUserId();
        if (id) {
            localStorage.setItem("user", JSON.stringify({ userId: id, status: "onCall" }));
        }
    }

    function actOnChange() {
        window.addEventListener("storage", function (event) {
            if (event.key !== "user" || !event.newValue) return;

            let currentUserID = getUserId();
            let content;
            try { content = JSON.parse(event.newValue); } catch(e) { return; }

            if (content.status === "close" && content.userId === currentUserID) {
                let skipNextLead = false;
                const answeredTime = localStorage.getItem("leadAnsweredCallTime");
                if (answeredTime) {
                    const parts = answeredTime.split(":");
                    if (parts.length === 3) {
                        const mins = parseInt(parts[1], 10);
                        if (!Number.isNaN(mins) && mins > 1) {
                            skipNextLead = true;
                        }
                    }
                }

                localStorage.removeItem("user");
                localStorage.removeItem("userFTD");
                localStorage.removeItem("leadAnsweredCallTime");

                if (!skipNextLead) {
                    setTimeout(() => {
                        let nextBtn = document.querySelector('button.collapse-next');
                        if (nextBtn) nextBtn.click();
                    }, 300);
                }
            }
        });
    }

    function callTab() {
        window.addEventListener("storage", function (event) {
            if (event.key === "hengUp" && event.newValue === "true") {
                hengUp();
            }
        });

        setInterval(callCanselDetect, 500);
        setInterval(answer, 500);
    }

    function answer() {
        try {
            let block = document.querySelector('.block-btn-call');
            if (block) {
                localStorage.removeItem("userFTD");
                let successBtn = block.querySelector('.el-button.el-button--success');
                if (successBtn) {
                    successBtn.click();
                    localStorage.setItem('OnCall', true);
                }
            }
        } catch (e) {}
    }

    function hengUp() {
        let btn = document.querySelector('.el-button.el-button--danger');
        if (btn) btn.click();
    }

    function callCanselDetect() {
        let timerEl = document.querySelector('.timer');
        let timeOnHold = timerEl ? timerEl.innerText : "";
        if (timeOnHold.trim().length > 0) Green.onCall = true;

        if (localStorage.getItem("user") !== null && Green.onCall) {
            if (userAnswered() && timeOnHold.trim().length > 0) {
                localStorage.setItem("leadAnsweredCallTime", timeOnHold);
            }

            const parts = timeOnHold.split(":");
            if (parts.length === 3) {
                const mins = parseInt(parts[1], 10);
                const secs = parseInt(parts[2], 10);
                if (mins >= 2) localStorage.setItem('userFTD', true);
                if (!userAnswered() && secs === Green.getRandomIntervalNumber()) hengUp();
            }

            if (timeOnHold === '' && Green.onCall === true) {
                Green.onCall = false;
                localStorage.removeItem("leadAnsweredCallTime");
                let userStr = localStorage.getItem("user");
                if (userStr) {
                    let userData = JSON.parse(userStr);
                    localStorage.setItem("user", JSON.stringify({ userId: userData.userId, status: "close" }));
                }
            }
        }
    }

    function userAnswered() {
        let el = document.querySelector('.status-call-start');
        return el && el.innerText.includes("picked up");
    }

    Green.init();
})();
