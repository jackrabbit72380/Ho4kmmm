var pageWidth, pageHeight;
var basePage = {
    width: 1280,
    height: 720,
    scale: 1,
    scaleX: 1,
    scaleY: 1
};

dew.on('show', () => doScaling());

$(function () {
    doScaling();
    $(window).resize(doScaling);
});

function doScaling() {
    var $page = $('.page_content');
    getPageSize();
    scalePages($page, pageWidth, pageHeight);
}

function getPageSize() {
    pageHeight = window.innerHeight;
    pageWidth = window.innerWidth;
}

function scalePages(page, maxWidth, maxHeight) {
    var scaleX = 1, scaleY = 1;
    scaleX = maxWidth / basePage.width;
    scaleY = maxHeight / basePage.height;
    basePage.scaleX = scaleX;
    basePage.scaleY = scaleY;
    basePage.scale = (scaleX > scaleY) ? scaleY : scaleX;
    page.attr('style', '-webkit-transform:scale(' + basePage.scale + ');');
}