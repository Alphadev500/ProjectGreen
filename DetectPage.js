function DetectPage (callback) {
    let intervalID = setInterval(() => {
        let app = document.querySelector('#app');
        if (app !== null && typeof app.innerText != 'undefined') {
            if (document.querySelector(".player-title") !== null) {
                Green.page = "Lead";
                clearInterval(intervalID);
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
            console.log(document.querySelector(".player-title"));
            console.log(Green.page);
        }
    }, 500);
}