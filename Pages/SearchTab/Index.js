function openUserTabs () {
    document.querySelectorAll('.table-body tr').forEach((e) => {
        let href = e.querySelector('.sticky-body .item-actions a').getAttribute('href');
        Green.setTimeout(() => {
            window.open(href, "_blank");
        }, 200, 300);
    });
}
function SearchTab () {
    document.querySelector('.show-by .show-by__title').addEventListener('click', openUserTabs());
}