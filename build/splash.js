!function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="build/",r(r.s=10)}([function(e,t){e.exports=require("react")},function(e,t){e.exports=require("react-dom")},,,,,,,,,function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}},o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)Object.hasOwnProperty.call(e,r)&&(t[r]=e[r]);return t.default=e,t};Object.defineProperty(t,"__esModule",{value:!0});const u=n(r(11)),l=o(r(0)),a=n(r(1));r(12);const i=document.getElementById("splash");a.default.render(l.default.createElement(class extends l.Component{constructor(e){super(e)}render(){return l.default.createElement("div",{className:"splash"},l.default.createElement("img",{alt:"logo",src:r(13),onLoad:e=>u.default(["fadeIn","tada"])(e.target)}),l.default.createElement("p",null,"Loading..."))}},null),i)},function(e,t){e.exports=require("actuatejs")},function(e,t,r){},function(e,t){e.exports="../images/icon.png"}]);