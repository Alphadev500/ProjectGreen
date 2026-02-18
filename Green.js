// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2026-01-30
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

const Green = {
	autoSendEmailTempName: "FA3L2Do30",
	sendEmail: true,
	userFTD: false,
	callCanselIntervals: [36, 37, 38],
	onCall: false,
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

        	if (callback) {
        		document.querySelector('.el-button.el-button--success').addEventListener("click", callback);
      		}
      	});
      	return {
			e: nameElement,
		}
	},
	getSearchTabName : () => {
		return document.querySelector('.main-container');
	},
	getCallTabName : () => {
		return document.querySelector('.page-holder .wrapper .connect span');
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
		emailIcon: () => {
			document.querySelector('.flaticon-multimedia-2.table-row__image.email-img').click();
		},
		emailTemp: () => {
			Green.getEmailTempFrom().querySelector('.el-select__wrapper').click();
		},
		refusedCall: () => {
            try {
                document.querySelector('.el-button.el-button--danger').click();
			} catch (e) {
                console.log('ref null');
			}
		},
		sendEmail: () => {
			document.querySelector('.form__btn.form__btn-success').click();
		},
		hengUp: () => {
			document.querySelector('.el-button.el-button--danger').click();
		},
		answer: () => {
			try {
                if (document.querySelector('.block-btn-call') !== null) {
                   Green.userFTD = false;
                }
				document.querySelector('.block-btn-call').querySelector('.el-button.el-button--success').click();
			} catch (e) {
				console.log('nathing to do');
			}
		}
	},
	saveAndCloseLeedsPage: {
		getUserId: () => {
			return document.querySelector('.table-content').querySelectorAll('.table-row')[2].querySelector('.table-row__value').innerText;
		},
		saveUserId: () => {
			localStorage.setItem("user", JSON.stringify({
				userId: Green.saveAndCloseLeedsPage.getUserId(),
				status: "onCall"
			}));
		},
		removeUserId: () => {
			localStorage.removeItem("user");
		},
		actOnChange: () => {
			window.addEventListener("storage", function (event) {
			    if (event.key !== "user") return;

			    let currentUserID = Green.saveAndCloseLeedsPage.getUserId();
			    const content = JSON.parse(event.newValue);

			    if (content.status == "close" && content.userId == currentUserID) {
			    	Green.saveAndCloseLeedsPage.removeUserId();
			    	window.close();
			    }
			});
		},
		init: () => {
			Green.saveAndCloseLeedsPage.actOnChange();
			Green.saveAndCloseLeedsPage.saveUserId();
		}
	},
	sendEmailAndCall () {
		Green.clicks.phoneIcon();

        Green.setTimeout(Green.clicks.refusedCall, 1000, 1500);

		Green.playerName(() => {
			Green.saveAndCloseLeedsPage.init();

			Green.setTimeout(() => {

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
	getCallTabTimer: () => {
		return document.querySelector('.timer').innerText;
	},
	getProperTime: (timeString) => {
		const parts = timeString.split(":");

		const hours = parseInt(parts[0], 10);
		const minutes = parseInt(parts[1], 10);
		const seconds = parseInt(parts[2], 10);

		return {hours, minutes, seconds}
	},
	getRandomIntervalNumber: () => {
    	return Green.callCanselIntervals[Math.floor(Math.random() * Green.callCanselIntervals.length)];
	},
	setCallAsEnded: () => {
		for (let i = 0; i < localStorage.length; i++) {
		    const key = localStorage.key(i);
			if (key !== "user") continue;

		    let currentContent = localStorage.getItem(key);
		    currentContent = JSON.parse(currentContent);

		    localStorage.setItem("user", JSON.stringify({
		    	userId: currentContent.userId,
		    	status: "close"
		    }));
		}
	},
	callCansleDetect: () => {
		let timeOnHold = Green.getCallTabTimer();
		let properTime = Green.getProperTime(timeOnHold);
		if (timeOnHold.trim().length != 0) {
			Green.onCall = true;
		}

		if (localStorage.getItem("user") != null && Green.onCall) {
                if (properTime.minutes >= 2) {
					Green.userFTD = true;
				}

                console.log(properTime.minutes >= 2);

                console.log(Green.userFTD);

				if (timeOnHold == '' && Green.userFTD == false) {
					Green.onCall = false;
					Green.setCallAsEnded();
				}

				if (!Green.userAnswered()) {
					if (properTime.seconds === Green.getRandomIntervalNumber()) {
						Green.clicks.hengUp();
					}
				}
			}
	},
	callTab: () => {
		setInterval(() => {
			Green.callCansleDetect();
		}, 1000);
		setInterval(() => {
			let buttons = document.querySelector('.el-button.el-button--success span').innerHTML;
			if (buttons.innerHTML !== "Enable sound playback") {
				Green.clicks.answer();
			}
		}, 1000);
	},

	searchTab : {
		loadUsers : () => {
			document.querySelectorAll('.table-body tr').forEach((e) => {
				let href = e.querySelector('.sticky-body .item-actions a').getAttribute('href');
				Green.setTimeout(() => {
					window.open(href, "_blank");
				}, 200, 300);
			});
		},
		init : () => {
			document.querySelector('.show-by .show-by__title')
				.addEventListener('click', Green.searchTab.loadUsers);
		}
	},
	detectPage: (callback) => {
		let intervalID = setInterval(() => {
	 		let app = document.querySelector('#app');
	 		if (app !== null && typeof app.innerText != 'undefined') {
	 			Green.page = false;

	 			if (Green.playerName().e !== null) {
	 				Green.page = "Leed";
	 				clearInterval(intervalID);
	 				Green.sendEmailAndCall();
	 			} else if (Green.getCallTabName() !== null) {
	 				Green.page = "Call";
	 				clearInterval(intervalID);
	 				Green.callTab();
	 			} else if (Green.getSearchTabName() !== null) {
	 				Green.page = "Search";
	 				clearInterval(intervalID);
	 				Green.searchTab.init();
	 			}
	 		}
       }, 500);
	},
	init: () => {
		Green.detectPage();
	},
};
Green.init();
