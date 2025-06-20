// js/utils.js
console.log("utils.js loaded");

/**
 * ???? ?????? ????? ???? ???? ??? ????? ????? ?? ?????? ????? ?????.
 * ????? ???? ?? ??? ????? ??? ??????? (resize).
 * @param {Function} func - ?????? ???? ???? ???????.
 * @param {number} wait - ??? ???????? ??????? ?????.
 * @param {boolean} immediate - ??? ???? true? ??? ????? ?????? ????? ?? ????????.
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};