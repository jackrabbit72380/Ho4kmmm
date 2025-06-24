// Provides auto updating of pak-aware elements when a mod package changes
// To use simply include this js file on the page.
//
// pak-aware elements are elements that have a 'data-pak' attribute. (Currently only supports img tags)
// Example:
//  <img 
//    data-pak="mainmenu" 
//    data-url="assets/maps/small/guardian" 
//    data-fallback="dew://assets/maps/small/placeholder.jpg">
//
// Whenever the 'mainmenu' mod changes, the img 'src' attribute will be updated, therefore it is important
// that you don't manually set it.  When invalidated, It will first search the pak for files matching one of
// the whitelisted extensions, falling back to the base cache when none is found. If there is an error while
// loading the image the 'data-fallback' url will be used instead. The fallback url must use the dew:// scheme
//
// You can also force invalidation by calling PakAwareContext.invalidateAll(kind = null) to invalidate all matching elements in the DOM.
// You can also invalidate a single element using PakAwareContext.invalidateElement(element)
// Optionally provide a fallback if there is an error loading the image. if none is provided, the image src will be set to ''

var pakAwareContext = (() => {
    function invalidateAll(kind) {
        const elements = document.querySelectorAll('[data-pak]');
        for(const el of elements) {
            if(!kind || kind === el.dataset.pak)
                invalidateElement(el);
        }
    }

    function invalidateElement(element) {
        if(element instanceof HTMLImageElement) {
            invalidateImage(element);
        }
    }

    async function invalidateImage(img)  { 
        let { url, pak, fallback = '', fileTypes } = img.dataset;
        fileTypes = fileTypes?.split(',') ?? ['jpg', 'png', 'svg'];
        img.onerror = handleImageError;
        maybeSetImage(img, await dew.getAssetUrl(url, { fileTypes, pak }) || fallback);
    }

    function handleImageError(e) {
        const img = e.srcElement;
        maybeSetImage(img.dataset.fallback);
    }

    function maybeSetImage(img, newSrc) {
        if(img.src !== newSrc)
            img.src = newSrc;
    }

    dew.on('mod_changed', ({data}) => {
        invalidateAll(data.kind);
    });

    document.addEventListener('DOMContentLoaded', () => {
        invalidateAll();
    });

    return {
        invalidateAll,
        invalidateElement
    }
})();
