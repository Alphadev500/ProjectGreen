function DetectPage (callback) {
    let intervalID = setInterval(() => {
        let app = document.querySelector('#app');
        if (app !== null && typeof app.innerText != 'undefined') {
            if (document.querySelector(".player-title") !== null) {
                Green.page = "Lead";
                clearInterval(intervalID);
                document.querySelector('.table-row__image.call-img').click(() => {
                    console.log('click on the call icon');
                });
                Green.sendEmailAndCall();
            } else if (document.querySelector('.page-holder .wrapper .connect span') !== null) {
                localStorage.removeItem("userFTD");
                Green.page = "Call";
                clearInterval(intervalID);
                callTab();
            } else if (document.querySelector('.main-container') !== null) {
                Green.page = "Search";
                clearInterval(intervalID);
                SearchTab();
            }
        }
    }, 500);
}