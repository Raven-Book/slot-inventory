/* Recipes, Ver.0.2.1, By BlackStar */
/// Build Date: 2024-12-24T06:19:40.519Z
(()=>{function e(e,t){var n="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(!n){if(Array.isArray(e)||(n=r(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var i=0,o=function(){};return{s:o,n:function(){return i>=e.length?{done:!0}:{done:!1,value:e[i++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var a,s=!0,u=!1;return{s:function(){n=n.call(e)},n:function(){var e=n.next();return s=e.done,e},e:function(e){u=!0,a=e},f:function(){try{s||null==n.return||n.return()}finally{if(u)throw a}}}}function t(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var r=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=r){var n,i,o,a,s=[],u=!0,c=!1;try{if(o=(r=r.call(e)).next,0===t){if(Object(r)!==r)return;u=!1}else for(;!(u=(n=o.call(r)).done)&&(s.push(n.value),s.length!==t);u=!0);}catch(e){c=!0,i=e}finally{try{if(!u&&null!=r.return&&(a=r.return(),Object(a)!==a))return}finally{if(c)throw i}}return s}}(e,t)||r(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function r(e,t){if(e){if("string"==typeof e)return n(e,t);var r={}.toString.call(e).slice(8,-1);return"Object"===r&&e.constructor&&(r=e.constructor.name),"Map"===r||"Set"===r?Array.from(e):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?n(e,t):void 0}}function n(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=Array(t);r<t;r++)n[r]=e[r];return n}function i(e){return i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},i(e)}function o(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,a(n.key),n)}}function a(e){var t=function(e,t){if("object"!=i(e)||!e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var n=r.call(e,t||"default");if("object"!=i(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(e,"string");return"symbol"==i(t)?t:t+""}!function(){"use strict";var r=Object.freeze({INCLUDES:"includes",EQUALS:"equals"});State.variables.recipe_save_data=State.variables.recipe_save_data||new Map;var n=function(){return State.variables.recipe_save_data},a={servings:1,successRate:100,priority:100,condition:r.INCLUDES,_unlock:!1},s={unlock:!1};setup.Conditions=r,window.Conditions=window.Conditions||r;var u=function(){return u=function e(t){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:clone(a),u=arguments.length>3&&void 0!==arguments[3]?arguments[3]:[];if(function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.id=t,"object"!==i(r)||"object"!==i(o))throw new Error("Invalid recipe definition");if(this.methods=r,Object.assign(this,Object.assign({},a,o)),!n().has(t)){var c=clone(s);c.unlock=o._unlock,n().set(t,c)}this._tags=u instanceof Array?u:"string"==typeof u?[u]:[]},(c=[{key:"unlock",get:function(){return n().get(this.id).unlock},set:function(e){n().get(this.id).unlock=e}},{key:"name",get:function(){return this.displayName||this.id},set:function(e){this.displayName=e}},{key:"tags",get:function(){return this._tags}},{key:"hasTag",value:function(e){return this._tags.includes(e)}},{key:"hasAllTags",value:function(e){return this._tags.includesAll(e)}},{key:"hasAnyTags",value:function(e){return this._tags.includesAny(e)}},{key:"validate",value:function(e){switch(this.condition){case r.EQUALS:return this.equals(e);case r.INCLUDES:return this.includes(e);default:throw new TypeError("Invalid condition type: ".concat(this.condition))}}},{key:"calculate",value:function(e,r){if(this.methods.length<=r)throw new Error("Unable to access recipe at index ".concat(r,", total number of available crafting methods is ").concat(this.ingredients.length));return Object.entries(this.methods[r]).reduce((function(r,n){var i=t(n,2),o=i[0],a=i[1],s=e[o];return Math.min(r,Math.floor(s/a))}),1/0)}},{key:"multiply",value:function(r,n){if(void 0!==n&&this.methods.length<=n)throw new Error("Unable to access recipe at index ".concat(n,", total number of available crafting methods is ").concat(this.ingredients.length));if("number"!=typeof r||r<=0)throw new Error("Invalid number of servings");var i,o=[],a=e(void 0!==n?[this.methods[n]]:this.methods);try{for(a.s();!(i=a.n()).done;){for(var s=i.value,u={},c=0,l=Object.entries(s);c<l.length;c++){var f=t(l[c],2),h=f[0],v=f[1];u[h]=v*r}o.push(u)}}catch(e){a.e(e)}finally{a.f()}return o}},{key:"includes",value:function(r){var n,i=e(this.methods);try{for(i.s();!(n=i.n()).done;){var o=n.value;if(Object.keys(r).length<Object.keys(o).length)return}}catch(e){i.e(e)}finally{i.f()}var a,s=e(this.methods.entries());try{for(s.s();!(a=s.n()).done;){var u=t(a.value,2),c=u[0],l=u[1],f=!0;for(var h in l)if(!r[h]||r[h]<l[h]){f=!1;break}if(f)return c}}catch(e){s.e(e)}finally{s.f()}}},{key:"cook",value:function(){if(100===this.successRate)return!0;var e=randomInt(1,100);return this.successRate>=e}},{key:"equals",value:function(r){var n,i=e(this.methods);try{for(i.s();!(n=i.n()).done;){var o=n.value;if(Object.keys(r).length<Object.keys(o).length)return}}catch(e){i.e(e)}finally{i.f()}var a,s=e(this.methods.entries());try{for(s.s();!(a=s.n()).done;){var u=t(a.value,2),c=u[0],l=u[1],f=!0;for(var h in l)if(!r[h]||r[h]!==this.ingredients[h]){f=!1;break}if(f)return c}}catch(e){s.e(e)}finally{s.f()}}}])&&o(u.prototype,c),l&&o(u,l),Object.defineProperty(u,"prototype",{writable:!1}),u;var u,c,l}();setup.Recipe=u,window.Recipe=window.Recipe||u}()})(),(()=>{function e(t){return e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},e(t)}function t(e,t){var r="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(!r){if(Array.isArray(e)||(r=s(e))||t&&e&&"number"==typeof e.length){r&&(e=r);var n=0,i=function(){};return{s:i,n:function(){return n>=e.length?{done:!0}:{done:!1,value:e[n++]}},e:function(e){throw e},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var o,a=!0,u=!1;return{s:function(){r=r.call(e)},n:function(){var e=r.next();return a=e.done,e},e:function(e){u=!0,o=e},f:function(){try{a||null==r.return||r.return()}finally{if(u)throw o}}}}function r(e){return function(e){if(Array.isArray(e))return u(e)}(e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||s(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function n(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,o(n.key),n)}}function i(e,t,r){return(t=o(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(t){var r=function(t,r){if("object"!=e(t)||!t)return t;var n=t[Symbol.toPrimitive];if(void 0!==n){var i=n.call(t,r||"default");if("object"!=e(i))return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===r?String:Number)(t)}(t,"string");return"symbol"==e(r)?r:r+""}function a(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var r=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=r){var n,i,o,a,s=[],u=!0,c=!1;try{if(o=(r=r.call(e)).next,0===t){if(Object(r)!==r)return;u=!1}else for(;!(u=(n=o.call(r)).done)&&(s.push(n.value),s.length!==t);u=!0);}catch(e){c=!0,i=e}finally{try{if(!u&&null!=r.return&&(a=r.return(),Object(a)!==a))return}finally{if(c)throw i}}return s}}(e,t)||s(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function s(e,t){if(e){if("string"==typeof e)return u(e,t);var r={}.toString.call(e).slice(8,-1);return"Object"===r&&e.constructor&&(r=e.constructor.name),"Map"===r||"Set"===r?Array.from(e):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?u(e,t):void 0}}function u(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=Array(t);r<t;r++)n[r]=e[r];return n}!function(){"use strict";var o,s=function(){function i(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Map,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[];if(function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,i),!(t instanceof Map))throw new Error('Expected "recipes" to be an instance of Map');if(!Array.isArray(r))throw new Error('Expected "invs" to be an array');this.invs=r,this.ct=e,State.variables[this.ct]=State.variables[this.ct]||new Inventory,this.recipes=t,this._recipes=i.sort(t)}return o=i,s=[{key:"has",value:function(e){return this.recipes.has(e)}},{key:"hasItems",value:function(e){for(var t=State.variables[this.ct],r=0,n=Object.entries(e);r<n.length;r++){var i=a(n[r],2),o=i[0],s=i[1];if(t.count(o)<s)return!1}return!0}},{key:"drop",value:function(e){var t=State.variables[this.ct],n=function(e){for(var t=[],r=0,n=Object.entries(e);r<n.length;r++){var i=a(n[r],2),o=i[0],s=i[1];t.push(o,s)}return t}(e);void 0===t.pickup?t.delete.apply(t,r(n)):t.drop.apply(t,r(n))}},{key:"update",value:function(){this._recipes=i.sort(this.recipes)}},{key:"hasAllTags",value:function(){var e,r=[].slice.call(arguments).flat(1/0),n=[],i=t(this._recipes);try{for(i.s();!(e=i.n()).done;){var o=e.value;o.hasAllTags(r)&&n.push(o)}}catch(e){i.e(e)}finally{i.f()}return n}},{key:"searchIndex",value:function(e){for(var t=0,r=this._recipes.length-1;t<=r;){var n=Math.floor((t+r)/2);if(this._recipes[n].priority===e)return n;this._recipes[n].priority<e?t=n+1:r=n-1}return t}},{key:"insert",value:function(e,t,r,n){Array.isArray(t)||(t=[t]);var i=this.set(e,t,r,n),o=this.searchIndex(i.priority);this._recipes.splice(o,0,i)}},{key:"set",value:function(e,t,r,n){Array.isArray(t)||(t=[t]);var i=new Recipe(e,t,r,n);return this.recipes.set(e,i),i}},{key:"calculate",value:function(e){var t=a(this.match(e),2),r=t[0],n=t[1];return void 0===r||void 0===n?[i.default_no_recipe,0]:[n.name,n.calculate(e,r)*n.servings]}},{key:"cook",value:function(e){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1,n=a(this.match(e),2),o=n[0],s=n[1],u={id:"",success:!1,unlock:!1,exist:!1,servings:0,message:i.not_found};if(null==s&&null==o);else if(s.unlock||"string"!=typeof e)if("string"==typeof e&&void 0===o){u.id=s.name,u.servings=0,u.success=!1,u.message=i.missing_materials;var c,l=t(s.multiply(r));try{for(l.s();!(c=l.n()).done;){var f=c.value;if(this.hasItems(f)){this.drop(f),u.success=!0,u.servings=r,u.message=i.success;break}}}catch(e){l.e(e)}finally{l.f()}}else void 0!==s&&(u.id=s.id,u.success=s.cook(),e.length=0,u.success?(u.servings=s.calculate(e,o),s.unlock?u.message=i.success:u.message=i.unlocked_success,s.unlock=!0):(u.servings=0,u.message=i.failure));else u.id=s.name,u.success=!1,u.unlock=!1,u.message=i.not_unlocked;return s&&(u.servings*=s.servings),u}},{key:"cookSave",value:function(e,t){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1,n=this.cook(t,r);return n.success&&i.pickup(e,n.id,n.servings),n}},{key:"match",value:function(r){if("object"!==e(r)||null===r){if("string"==typeof r){var n=this.recipes.get(r);return void 0===n?[void 0,void 0]:[void 0,n]}throw new Error("Invalid argument: ".concat(r))}var i,o=t(this._recipes);try{for(o.s();!(i=o.n()).done;){var a=i.value;if(!(a instanceof Recipe))throw new Error("Invalid Recipe: ".concat(a));var s=a.validate(r);if(void 0!==s)return[s,a]}}catch(e){o.e(e)}finally{o.f()}return[void 0,void 0]}},{key:"filter",value:function(e){return"undefined"==typeof filterObjs?this.error('The "filter-utils" is required but has not been imported'):filterObjs(this._recipes,e,(function(e,t){return!t.tags||e.methods.some((function(e){return Object.keys(e).some((function(e){var r,n;return null!==(r=null===(n=Item.get(e))||void 0===n?void 0:n.hasAnyTags(t.tags))&&void 0!==r&&r}))}))}))}},{key:"crafting_table",get:function(){return this.ct},set:function(e){this.ct=e,State.variables[this.ct]=State.variables[this.ct]||new Inventory}}],u=[{key:"sort",value:function(e){var t=Array.from(e.values()),r={};t.forEach((function(e){var t=void 0!==e.priority?e.priority:100;r[t]=(r[t]||0)+1}));var n=Object.keys(r).map(Number).sort((function(e,t){return e-t})),i={},o=0;n.forEach((function(e){i[e]=o,o+=r[e]}));for(var a=Array(t.length),s=t.length-1;s>=0;s--){var u=t[s],c=void 0!==u.priority?u.priority:100;a[i[c]]=u,i[c]++}return a}},{key:"pickup",value:function(e){if(!(e instanceof Inventory))throw new Error("Invalid inventory");for(var t=arguments.length,r=new Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];if(void 0!==e.pickup)return e.pickup.apply(e,r);for(var i,o=0;o<r.length-1;o+=2){var a=r[o],s=r[o+1];if(!a||!s)return i;if(!(i=e.store(a,s)).success)return i}}}],s&&n(o.prototype,s),u&&n(o,u),Object.defineProperty(o,"prototype",{writable:!1}),o;var o,s,u}();i(s,"success","制作成功"),i(s,"failure","制作失败"),i(s,"not_found","配方不存在"),i(s,"not_unlocked","配方未解锁"),i(s,"missing_materials","缺少材料"),i(s,"unlocked_success","配方成功解锁"),i(s,"default_no_recipe","空配方"),i(s,"crafting_table","crafting_table"),o=s,["success","failure","not_found","not_unlocked","missing_materials","unlocked_success","default_no_recipe"].forEach((function(e){Object.defineProperty(o.prototype,e,{get:function(){return o[e]},set:function(t){o[e]=t}})})),setup._RecipeBook=s,window._RecipeBook=window._RecipeBook||s,setup.RecipeBook=setup.RecipeBook||new s(s.crafting_table),window.RecipeBook=window.RecipeBook||setup.RecipeBook}()})(),(()=>{function e(e,r){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var r=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=r){var n,i,o,a,s=[],u=!0,c=!1;try{if(o=(r=r.call(e)).next,0===t){if(Object(r)!==r)return;u=!1}else for(;!(u=(n=o.call(r)).done)&&(s.push(n.value),s.length!==t);u=!0);}catch(e){c=!0,i=e}finally{try{if(!u&&null!=r.return&&(a=r.return(),Object(a)!==a))return}finally{if(c)throw i}}return s}}(e,r)||function(e,r){if(e){if("string"==typeof e)return t(e,r);var n={}.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?t(e,r):void 0}}(e,r)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function t(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=Array(t);r<t;r++)n[r]=e[r];return n}function r(e){return r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},r(e)}Macro.add("cook",{tags:null,handler:function(){if(this.args.length<1)return this.error("Not enough arguments provided. At least two arguments are required");var e,t=this.args[0];if("object"!==r(t)&&"string"!=typeof t||null===t)return this.error("Expected an object or a string, but received: "+r(t));if(this.args.length>=2){var n=this.args[1];if(!(n&&n instanceof Inventory))return this.error("Expected an instance of Inventory, but received: "+r(n));e=RecipeBook.cookSave(n,t,parseInt(this.args[2])||1)}else e=RecipeBook.cook(t);WikiVars({result:e},this)}}),Macro.add("filter_recipe",{tags:null,handler:function(){if(this.args.length<1)return this.error("Not enough arguments provided. At least two arguments are required.");var e=this.args[0];if(e&&"object"!==r(e))return this.error("Invalid input: 'filters' should be an object");var t=RecipeBook.filter(e);WikiVars({result:t},this)}}),Macro.add("recipes_with_tag",{handler:function(){if(this.args.length<1)return this.error("Not enough arguments provided. At least one tag is required");var e=RecipeBook.filter(this.args);WikiVars({result:e},this)}}),Macro.add("calculate",{tags:null,handler:function(){if(this.args.length<1)return this.error("Not enough arguments provided. At least one tag is required");var t=this.args[0];if("object"!==r(t))return this.error("Invalid argument: expected an object as the first argument");var n=e(RecipeBook.calculate(t),2),i=n[0],o=n[1];WikiVars({servings:o,name:i},this)}})})();
/* End Recipes */