chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == "install" && !localStorage.landing && !localStorage['first_date_installation_ntpromo']) {
        localStorage['first_date_installation_ntpromo'] = new Date().getTime();

        chrome.management.getSelf(function(info) {
            var ext_name = encodeURIComponent(info.name);
            chrome.tabs.create({
                url: 'https://sites.google.com/view/promo-extensions-welcome/?id=promo_ext_w&ext=' + ext_name
            });
        });
    }
});