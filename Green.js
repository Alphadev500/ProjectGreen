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
	playerName: (callback) => {
		let nameElement = document.querySelector(".player-title");
		nameElement.addEventListener("click", callback);

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
		}
		emailTemp: () => {
			Green.getEmailTempFrom().querySelector('.el-select__wrapper').click();
		},
		refusedCall: () => {
			document.querySelector('.el-button.el-button--danger.is-plain.mt-4').click();
		},
		sendEmail: () => {
			document.querySelector('.form__btn.form__btn-success').click();
		}
	},
	order: () => {
		Green.setTimeout(() => {
			Green.clicks.phoneIcon();

			Green.setTimeout(() => {
				Green.click.refusedCall();
				Green.setTimeout(() => Green.clicks.callConfirm());
				
				if (Green.sendEmail) {
					Green.clicks.emailIcon();

					Green.setTimeout(() => {
						Green.clicks.emailTemp();
						Green.setTimeout(() => {
							Green.clicks.selectEmailTemp(Green.clicks.getEmailTempFromId());
							Green.setTimeout(() => Green.sendEmail());
						});
					});
				}
			});
		}, 5000, false);
	}
};

Green.order();

 




(() => {
	setInterval(() => {

		let buttons = document.querySelector('.el-button.el-button--success span').innerHTML;
			console.log(buttons);
			console.log(buttons.innerHTML);
			if (buttons.innerHTML !== "Enable sound playback") {
				document.querySelector('.el-button.el-button--success').click();
			}
	}, 1000);
})();

