!function(n){function t(o){if(e[o])return e[o].exports;var r=e[o]={i:o,l:!1,exports:{}};return n[o].call(r.exports,r,r.exports,t),r.l=!0,r.exports}var e={};t.m=n,t.c=e,t.i=function(n){return n},t.d=function(n,e,o){t.o(n,e)||Object.defineProperty(n,e,{configurable:!1,enumerable:!0,get:o})},t.n=function(n){var e=n&&n.__esModule?function(){return n.default}:function(){return n};return t.d(e,"a",e),e},t.o=function(n,t){return Object.prototype.hasOwnProperty.call(n,t)},t.p="/",t(t.s=1088)}({1088:function(n,t,e){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=e(37),r=document.getElementById("rect-target");r.innerHTML="\n  Element min-width = ".concat(e.i(o.d)(r).minWidth," <br/>\n  Element rect = ").concat(JSON.stringify(e.i(o.a)(r))," <br/>\n"),document.getElementById("report").innerHTML="\n Pixel ratio = ".concat(e.i(o.b)()," <br/>\n Window height = ").concat(e.i(o.g)()," <br/>\n")},13:function(n,t,e){n.exports=e(2)(359)},2:function(n,t){n.exports=vendor_lib},24:function(n,t,e){n.exports=e(2)(411)},27:function(n,t,e){n.exports=e(2)(396)},37:function(n,t,e){"use strict";function o(n,t){if(!(n instanceof t))throw new TypeError("Cannot call a class as a function")}function r(n,t){for(var e=0;e<t.length;e++){var o=t[e];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(n,o.key,o)}}function i(n,t,e){return t&&r(n.prototype,t),e&&r(n,e),n}function u(n,t,e){return t in n?Object.defineProperty(n,t,{value:e,enumerable:!0,configurable:!0,writable:!0}):n[t]=e,n}function c(n){return n===document||n instanceof Node&&document.documentElement.contains(n.parentNode)}function f(n){if(n instanceof Range||c(n)){var t=n.getBoundingClientRect();return{top:t.top,right:t.right,bottom:t.bottom,left:t.left,width:t.width,height:t.height}}return Object.assign({},E)}function l(){return"devicePixelRatio"in window?window.devicePixelRatio:1}function a(){return window.innerHeight}function d(){return document.documentElement&&document.documentElement.scrollTop||document.body.scrollTop}function s(){return document.documentElement&&document.documentElement.scrollLeft||document.body.scrollLeft}function m(n){n.preventDefault&&n.preventDefault()}e.d(t,"d",function(){return x}),t.h=c,t.a=f,t.b=l,t.g=a,t.e=d,t.f=s,e.d(t,"l",function(){return _}),e.d(t,"j",function(){return O}),e.d(t,"k",function(){return P}),e.d(t,"c",function(){return j}),t.i=m;var p=e(24),h=(e.n(p),e(80)),v=(e.n(h),e(9)),b=(e.n(v),e(38)),g=(e.n(b),e(27)),w=(e.n(g),e(6)),y=(e.n(w),e(13)),x=(e.n(y),window.getComputedStyle.bind(window)),E={top:0,right:0,bottom:0,left:0,width:0,height:0},_=function(n){return function(t){(arguments.length>1&&void 0!==arguments[1]?arguments[1]:"").split(/\s+/g).filter(function(n){return!!n}).forEach(function(e){return t[n](e)})}},O=_("add"),P=_("remove"),j=function(){function n(){o(this,n),u(this,"_all",new Set)}return i(n,[{key:"add",value:function(n,t,e,o){n.addEventListener(t,e,o);var r=function(){return n.removeEventListener(t,e,o)};return this._all.add(r),r}},{key:"remove",value:function(n){n(),this._all.delete(n)}},{key:"removeAll",value:function(){var n=this;this._all.forEach(function(t){return n.remove(t)})}}]),n}()},38:function(n,t,e){n.exports=e(2)(436)},6:function(n,t,e){n.exports=e(2)(443)},80:function(n,t,e){n.exports=e(2)(398)},9:function(n,t,e){n.exports=e(2)(83)}});