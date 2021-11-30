$(document).click(function (event) {
    var container = $(".description_wrap");
    if (!container.is(event.target) && !container.has(event.target).length) {
        $("div").removeClass("opened");
    }
});