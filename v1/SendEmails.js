function getEmailTempFrom () {
    return document.querySelectorAll('.form-holder.half')[2].querySelectorAll('.el-select')[1];
}

function getEmailTempFromId () {
    return getEmailTempFrom().querySelector('input').getAttribute('aria-controls');
}

function selectEmailTemp (ID) {
    document.querySelector('#' + ID).querySelectorAll('li').forEach(li => {
        if (li.querySelector('div').innerText.trim().includes(Green.autoSendEmailTempName)) {
            li.querySelector('div').click();
        }
    });
}

function sendEmail () {
    if (Green.sendEmail) {
        document.querySelector('.flaticon-multimedia-2.table-row__image.email-img').click();

        Green.setTimeout(() => {
            getEmailTempFrom().querySelector('.el-select__wrapper').click();

            Green.setTimeout(() => {
                selectEmailTemp(getEmailTempFromId());
                getEmailTempFrom();
                Green.setTimeout(() => {
                    document.querySelector('.form__btn.form__btn-success').click();
                });
            });
        });
    }
}