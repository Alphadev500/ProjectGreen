// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2026-01-30
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at document-end
// ==/UserScript==

const Green = {
	emailNmae: "",
	autoSendEmailTempName: "FA3L2Do30",
	sendEmail: true,
	page: false,
	getRandomNumber : (from, to) => {
		return Math.random() * (from - to) + to;
	},
	setTimeout:  (callback, from=2000, to=2900) => {
		if (to == false) {
			setTimeout(callback, from);
		} else {
			setTimeout(callback, Green.getRandomNumber(from, to));
		}
	},
	playerName: (callback=null) => {
		let nameElement = document.querySelector(".player-title");
        Green.setTimeout(() => {
            if (callback) document.querySelector('.el-button.el-button--success').addEventListener("click", callback);
        });
		return {
			e: nameElement,
		}
	},
	getEmailTempFrom: () => {
		return document.querySelectorAll('.form-holder.half')[2].querySelectorAll('.el-select')[1];
	},
	getEmailTempFromId: () => {
		return Green.getEmailTempFrom().querySelector('input').getAttribute('aria-controls');
	},
	selectEmailTemp : (ID) => {
		document.querySelector('#' + ID).querySelectorAll('li').forEach(li => {
			if (li.querySelector('div').innerText.trim().includes(Green.autoSendEmailTempName)) {
				li.querySelector('div').click();
			}
		});
	},
	clicks: {
		phoneIcon: () => {
			document.querySelector('.table-row__image.call-img').click();
		},
		callConfirm: () => {
			document.querySelector('.el-button.el-button--success').click();
		},
		emailIcon: () => {
			document.querySelector('.flaticon-multimedia-2.table-row__image.email-img').click();
		},
		emailTemp: () => {
			Green.getEmailTempFrom().querySelector('.el-select__wrapper').click();
		},
		refusedCall: () => {
			document.querySelector('.el-button.el-button--danger').click();
		},
		sendEmail: () => {
			document.querySelector('.form__btn.form__btn-success').click();
		},
		hengUp: () => {
			document.querySelector('.el-button.el-button--danger').click();
		},
		answer: () => {
			document.querySelector('.block-btn-call').querySelector('.el-button.el-button--success').click();
		}
	},
	sendEmailAndCall () {
		Green.clicks.phoneIcon();

		Green.playerName(() => {
			Green.setTimeout(() => {
				try {
                    Green.clicks.refusedCall()
				} catch (e) {
					console.log('ref null');
				}
				// Green.setTimeout(() => {
                //     Green.clicks.callConfirm()
                // }, 800, 1000);

				if (Green.sendEmail) {
					Green.clicks.emailIcon();

					Green.setTimeout(() => {
						Green.clicks.emailTemp();
						Green.setTimeout(() => {
							Green.selectEmailTemp(Green.getEmailTempFromId());
							Green.setTimeout(() => Green.clicks.sendEmail());
						});
					});
				}
			}, 1000, 1500);
		});
	},
	userAnswered : () => {
		let innerText = document.querySelector('.status-call-start').innerText;

		if (innerText == "The customer picked up the phone.") return true;

		return false;
	},
	callTab: () => {
		setInterval(() => {
			let timeOnHold = document.querySelector('.timer').innerText;
			if (!Green.userAnswered()) {
				if (timeOnHold == "00:00:36" || timeOnHold == "00:00:37" || timeOnHold == "00:00:38") {
					Green.clicks.hengUp();
				}
			}
		}, 1000);
		setInterval(() => {
			let buttons = document.querySelector('.el-button.el-button--success span').innerHTML;
			if (buttons.innerHTML !== "Enable sound playback") {
				Green.clicks.answer();
			}
		}, 1000);
	},
	Calls: {

	    STATUS: {
	        WAITING: 1,
	        ON_CALL: 2,
	        DONE: 3
	    },

	    DB_KEY: "calls_db",

	    // 🔥 In-memory tab references (CANNOT be in localStorage)
	    openWindows: {},

	    // ========================
	    // DB Helpers
	    // ========================

	    getDB: () => {
	        return JSON.parse(localStorage.getItem(Calls.DB_KEY)) || {};
	    },

	    saveDB: (db) => {
	        localStorage.setItem(Calls.DB_KEY, JSON.stringify(db));
	    },

	    createUserIfNotExists: (userId) => {
	        const db = Calls.getDB();

	        if (!db[userId]) {
	            db[userId] = {
	                status: Calls.STATUS.WAITING,
	                tabs: {},
	                createdAt: Date.now()
	            };
	            Calls.saveDB(db);
	        }
	    },

	    setUserStatus: (userId, status) => {
	        const db = Calls.getDB();
	        if (!db[userId]) return;

	        db[userId].status = status;

	        if (status === Calls.STATUS.DONE) {
	            db[userId].doneAt = Date.now();
	        }

	        Calls.saveDB(db);
	    },

	    // ========================
	    // 🔥 NEW: Grab Links & Open Tabs
	    // ========================

	    collectLinksAndOpen: (selector) => {

	        const links = document.querySelectorAll(selector);
	        const db = Calls.getDB();

	        links.forEach((link, index) => {

	            const url = link.href;
	            const userId = link.dataset.userId; // require data-user-id on link

	            if (!userId || !url) return;

	            Calls.createUserIfNotExists(userId);

	            // Open tab
	            const win = window.open(url, "_blank");

	            const tabId = "tab_" + userId + "_" + Date.now();

	            // Save window reference in memory
	            Calls.openWindows[tabId] = win;

	            // Save metadata in DB
	            db[userId].tabs[tabId] = {
	                url: url,
	                status: Calls.STATUS.WAITING,
	                openedAt: Date.now()
	            };
	        });

	        Calls.saveDB(db);
	    },

	    // ========================
	    // Close Tabs By User
	    // ========================

	    closeUserTabs: (userId) => {

	        const db = Calls.getDB();
	        if (!db[userId]) return;

	        Object.keys(db[userId].tabs).forEach(tabId => {

	            const win = Calls.openWindows[tabId];

	            if (win && !win.closed) {
	                win.close();
	            }

	            delete Calls.openWindows[tabId];
	        });
	    },

	    // ========================
	    // Watch DB for DONE
	    // ========================

	    watchForDone: () => {

	        window.addEventListener("storage", (event) => {

	            if (event.key !== Calls.DB_KEY) return;

	            const db = Calls.getDB();

	            Object.keys(db).forEach(userId => {

	                if (db[userId].status === Calls.STATUS.DONE) {
	                    Calls.closeUserTabs(userId);
	                }

	            });

	        });

	    },

	    // ========================
	    // Cleanup DONE after 1 min
	    // ========================

	    cleanupDone: () => {

	        const db = Calls.getDB();
	        const now = Date.now();

	        Object.keys(db).forEach(userId => {

	            const user = db[userId];

	            if (
	                user.status === Calls.STATUS.DONE &&
	                user.doneAt &&
	                now - user.doneAt > 60000
	            ) {
	                delete db[userId];
	            }

	        });

	        Calls.saveDB(db);
	    },

	    init: () => {
	        Calls.watchForDone();
	        setInterval(() => Calls.cleanupDone(), 10000);
	    }
	},
	order: () => {
		//setInterval();
		Green.setTimeout(() => {
			if (Green.playerName().e != null) Green.sendEmailAndCall();
			else Green.callTab();
		}, 4000, false);
	},
};
Green.order();
