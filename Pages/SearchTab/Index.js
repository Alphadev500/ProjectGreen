function openUserTabs () {
    const hrefs = [];

    document.querySelectorAll('.table-body tr').forEach((e) => {
        const link = e.querySelector('.sticky-body .item-actions a');
        if (!link || !link.href) return;

        hrefs.push(link.href);
    });

    if (Green.startLeadQueue) {
        Green.startLeadQueue(hrefs);
        return;
    }

    hrefs.forEach((href) => window.open(href, "_blank"));
}
function SearchTab () {
    document.querySelector('.show-by .show-by__title').addEventListener('click', openUserTabs);
}
