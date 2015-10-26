(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Browserify wrapper around roman-numerals node module (MIT licensed, see https://github.com/joshleaves/roman-numerals)
window.RomanNumerals = require('roman-numerals');

},{"roman-numerals":2}],2:[function(require,module,exports){
(function () {
  module.exports = {
    toArabic: require('./lib/toArabic.js'),
    toRoman:require('./lib/toRoman.js')
  };
})();

},{"./lib/toArabic.js":3,"./lib/toRoman.js":4}],3:[function(require,module,exports){
(function () {
  var forEach = Array.prototype.forEach;


  /**
   * Converts a roman number to its arabic equivalent.
   *
   * Will throw TypeError on non-string inputs.
   *
   * @param {String} roman
   * @return {Number}
   */
  function toArabic (roman) {
    if (('string' !== typeof roman) && (!(roman instanceof String))) throw new TypeError('toArabic expects a string');

    // Zero is/was a special case. I'll go with Dionysius Exiguus on this one as
    // seen on http://en.wikipedia.org/wiki/Roman_numerals#Zero
    if (/^nulla$/i.test(roman) || !roman.length) return 0;

    // Ultra magical regexp to validate roman numbers!
    roman = roman.toUpperCase().match(/^(M{0,3})(CM|DC{0,3}|CD|C{0,3})(XC|LX{0,3}|XL|X{0,3})(IX|VI{0,3}|IV|I{0,3})$/);
    if (!roman) throw new Error('toArabic expects a valid roman number');
    var arabic = 0;

    // Crunching the thousands...
    arabic += roman[1].length * 1000;

    // Crunching the hundreds...
    if (roman[2] === 'CM') arabic += 900;
    else if (roman[2] === 'CD') arabic += 400;
    else arabic += roman[2].length * 100 + (roman[2][0] === 'D' ? 400 : 0);


    // Crunching the tenths
    if (roman[3] === 'XC') arabic += 90;
    else if (roman[3] === 'XL') arabic += 40;
    else arabic += roman[3].length * 10 + (roman[3][0] === 'L' ? 40 : 0);

    // Crunching the...you see where I'm going, right?
    if (roman[4] === 'IX') arabic += 9;
    else if (roman[4] === 'IV') arabic += 4;
    else arabic += roman[4].length * 1 + (roman[4][0] === 'V' ? 4 : 0);
    return arabic;
  };


  module.exports = toArabic;

})();

},{}],4:[function(require,module,exports){
(function () {
  /**
   * Generate the roman number for the current power of tenth
   *
   * @param {Number} num
   * @param {String} one
   * @param {String} five
   * @param {String} ten
   * @return {String}
   */
  function upToTen (num, one, five, ten) {
    var value = '';
    switch (num) {
      case 0: return value;
      case 9: return one + ten;
      case 4: return one + five;
    }
    if (num >= 5) value = five, num -= 5;
    while (num-- > 0) value += one;
    return value;
  }


  /**
   * Converts an arabic number from 0 to 3999 to its roman equivalent.
   *
   * Will throw TypeError on non-number inputs (stringed numbers are accepted)
   * or NaN and Error on number under 0 or over 3999.
   *
   * @param {Number/String} arabic
   * @return {String}
   */
  function toRoman (arabic) {
    // Checking input first with type comparisons, convert Number() instances to
    // a literal, etc...
    if (arabic instanceof Number) arabic = parseInt(arabic, 10);
    if ('string' === typeof arabic || arabic instanceof String) {
      arabic = parseInt(arabic, 10);
      if (isNaN(arabic)) throw new TypeError('toArabic expects a number');
    }
    if ('number' !== typeof arabic) throw new TypeError('toArabic expects a number');

    // Rounding up "bad" numbers: NaN, negative numbers, numbers over 3999,...
    if (isNaN(arabic)) throw new TypeError('toArabic expects a real number');
    if (arabic < 0) throw new Error('toArabic cannot express negative numbers');
    if (arabic > 3999) throw new Error('toArabic cannot express numbers over 3999');

    // Zero is/was a special case. I'll go with Dionysius Exiguus on this one as
    // seen on http://en.wikipedia.org/wiki/Roman_numerals#Zero
    if (arabic === 0) return 'nulla';
    var roman = '';

    // Chomping away by the power of tenths
    roman += upToTen(Math.floor(arabic / 1000), 'M', '', ''), arabic %= 1000;
    roman += upToTen(Math.floor(arabic / 100), 'C', 'D', 'M'), arabic %= 100;
    roman += upToTen(Math.floor(arabic / 10), 'X', 'L', 'C'), arabic %= 10;
    roman += upToTen(arabic, 'I', 'V', 'X');
    return roman;
  };


  module.exports = toRoman;

})();

},{}]},{},[1]);
