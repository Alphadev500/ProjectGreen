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
	emailNmae: "",
	autoSendEmailTempName: "FA3L2Do30",
	sendEmail: true,

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
			document.querySelector('.el-button.el-button--success').click();
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
	order: () => {
		Green.setTimeout(() => {
			if (Green.playerName().e != null) Green.sendEmailAndCall();
			else Green.callTab();
		}, 4000, false);
	},
};
Green.order();
