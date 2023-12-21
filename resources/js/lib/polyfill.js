/* Jquery WorkAround but have Security problem https://jquery.com/upgrade-guide/3.5/#description-of-the-change */
var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi;
jQuery.htmlPrefilter = function( html ) {
	return html.replace( rxhtmlTag, "<$1></$2>" );
};

/* Objects Polyfill */
if (!Object.entries) {
	Object.entries = function( obj ){
		var ownProps = Object.keys( obj ),
			i = ownProps.length,
			resArray = new Array(i); // preallocate the Array
		while (i--)
			resArray[i] = [ownProps[i], obj[ownProps[i]]];

		return resArray;
	};
}

if(!Object.values) {
	Object.values = function objectValues(obj) {
		var res = [];
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				res.push(obj[i]);
			}
		}
		return res;
	}
}

if (typeof Object.assign != 'function') {
	// Must be writable: true, enumerable: false, configurable: true
	Object.defineProperty(Object, "assign", {
		value: function assign(target, varArgs) { // .length of function is 2
			'use strict';
			if (target == null) { // TypeError if undefined or null
				throw new TypeError('Cannot convert undefined or null to object');
			}

			var to = Object(target);

			for (var index = 1; index < arguments.length; index++) {
				var nextSource = arguments[index];

				if (nextSource != null) { // Skip over if undefined or null
					for (var nextKey in nextSource) {
						// Avoid bugs when hasOwnProperty is shadowed
						if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
							to[nextKey] = nextSource[nextKey];
						}
					}
				}
			}
			return to;
		},
		writable: true,
		configurable: true
	});
}
/* String Polyfill */

if (!String.prototype.includes) {
	String.prototype.includes = function(search, start) {
		'use strict';
		if (typeof start !== 'number') {
			start = 0;
		}

		if (start + search.length > this.length) {
			return false;
		} else {
			return this.indexOf(search, start) !== -1;
		}
	};
}

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString, position){
		position = position || 0;
		return this.substr(position, searchString.length) === searchString;
	};
}

/* Array Polyfill */
if (!Array.isArray) {
	Array.isArray = function(arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	};
}

if (!Array.from) {
	Array.from = (function () {
		var toStr = Object.prototype.toString;
		var isCallable = function (fn) {
			return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
		};
		var toInteger = function (value) {
			var number = Number(value);
			if (isNaN(number)) { return 0; }
			if (number === 0 || !isFinite(number)) { return number; }
			return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
		};
		var maxSafeInteger = Math.pow(2, 53) - 1;
		var toLength = function (value) {
			var len = toInteger(value);
			return Math.min(Math.max(len, 0), maxSafeInteger);
		};

		// The length property of the from method is 1.
		return function from(arrayLike/*, mapFn, thisArg */) {
			// 1. Let C be the this value.
			var C = this;

			// 2. Let items be ToObject(arrayLike).
			var items = Object(arrayLike);

			// 3. ReturnIfAbrupt(items).
			if (arrayLike == null) {
				throw new TypeError("Array.from requires an array-like object - not null or undefined");
			}

			// 4. If mapfn is undefined, then let mapping be false.
			var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
			var T;
			if (typeof mapFn !== 'undefined') {
				// 5. else
				// 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
				if (!isCallable(mapFn)) {
					throw new TypeError('Array.from: when provided, the second argument must be a function');
				}

				// 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
				if (arguments.length > 2) {
					T = arguments[2];
				}
			}

			// 10. Let lenValue be Get(items, "length").
			// 11. Let len be ToLength(lenValue).
			var len = toLength(items.length);

			// 13. If IsConstructor(C) is true, then
			// 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
			// 14. a. Else, Let A be ArrayCreate(len).
			var A = isCallable(C) ? Object(new C(len)) : new Array(len);

			// 16. Let k be 0.
			var k = 0;
			// 17. Repeat, while k < len? (also steps a - h)
			var kValue;
			while (k < len) {
				kValue = items[k];
				if (mapFn) {
					A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
				} else {
					A[k] = kValue;
				}
				k += 1;
			}
			// 18. Let putStatus be Put(A, "length", len, true).
			A.length = len;
			// 20. Return A.
			return A;
		};
	}());
}

if (!Array.prototype.forEach) {

	Array.prototype.forEach = function forEach(callback, thisArg) {
		'use strict';
		var T, k;

		if (this == null) {
			throw new TypeError("this is null or not defined");
		}

		var kValue,
			// 1. Let O be the result of calling ToObject passing the |this| value as the argument.
			O = Object(this),

			// 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
			// 3. Let len be ToUint32(lenValue).
			len = O.length >>> 0; // Hack to convert O.length to a UInt32

		// 4. If IsCallable(callback) is false, throw a TypeError exception.
		// See: http://es5.github.com/#x9.11
		if ({}.toString.call(callback) !== "[object Function]") {
			throw new TypeError(callback + " is not a function");
		}

		// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
		if (arguments.length >= 2) {
			T = thisArg;
		}

		// 6. Let k be 0
		k = 0;

		// 7. Repeat, while k < len
		while (k < len) {

			// a. Let Pk be ToString(k).
			//   This is implicit for LHS operands of the in operator
			// b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
			//   This step can be combined with c
			// c. If kPresent is true, then
			if (k in O) {

				// i. Let kValue be the result of calling the Get internal method of O with argument Pk.
				kValue = O[k];

				// ii. Call the Call internal method of callback with T as the this value and
				// argument list containing kValue, k, and O.
				callback.call(T, kValue, k, O);
			}
			// d. Increase k by 1.
			k++;
		}
		// 8. return undefined
	};
}

if (!Array.prototype.find) {
	Object.defineProperty(Array.prototype, 'find', {
		value: function(predicate) {
			// 1. Let O be ? ToObject(this value).
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[1];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ! ToString(k).
				// b. Let kValue be ? Get(O, Pk).
				// c. Let testResult be ToBoolean(? Call(predicate, T, ' kValue, k, O ')).
				// d. If testResult is true, return kValue.
				var kValue = o[k];
				if (predicate.call(thisArg, kValue, k, o)) {
					return kValue;
				}
				// e. Increase k by 1.
				k++;
			}

			// 7. Return undefined.
			return undefined;
		},
		configurable: true,
		writable: true
	});
}

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
	Object.defineProperty(Array.prototype, 'includes', {
		value: function(searchElement, fromIndex) {

			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			var len = o.length >>> 0;

			if (len === 0) {
				return false;
			}

			var n = fromIndex | 0;

			var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

			function sameValueZero(x, y) {
				return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
			}

			while (k < len) {
				if (sameValueZero(o[k], searchElement)) {
					return true;
				}
				k++;
			}

			return false;
		}
	});
}

if (!Array.prototype.map) {
	Array.prototype.map = function(callback, thisArg) {

		var T, A, k;

		if (this == null) {
			throw new TypeError(' this is null or not defined');
		}

		// 1. Let O be the result of calling ToObject passing the |this| 
		//    value as the argument.
		var O = Object(this);

		// 2. Let lenValue be the result of calling the Get internal 
		//    method of O with the argument "length".
		// 3. Let len be ToUint32(lenValue).
		var len = O.length >>> 0;

		// 4. If IsCallable(callback) is false, throw a TypeError exception.
		// See: http://es5.github.com/#x9.11
		if (typeof callback !== 'function') {
			throw new TypeError(callback + ' is not a function');
		}

		// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
		if (arguments.length > 1) {
			T = thisArg;
		}

		// 6. Let A be a new array created as if by the expression new Array(len) 
		//    where Array is the standard built-in constructor with that name and 
		//    len is the value of len.
		A = new Array(len);

		// 7. Let k be 0
		k = 0;

		// 8. Repeat, while k < len
		while (k < len) {

			var kValue, mappedValue;

			// a. Let Pk be ToString(k).
			//   This is implicit for LHS operands of the in operator
			// b. Let kPresent be the result of calling the HasProperty internal 
			//    method of O with argument Pk.
			//   This step can be combined with c
			// c. If kPresent is true, then
			if (k in O) {

				// i. Let kValue be the result of calling the Get internal 
				//    method of O with argument Pk.
				kValue = O[k];

				// ii. Let mappedValue be the result of calling the Call internal 
				//     method of callback with T as the this value and argument 
				//     list containing kValue, k, and O.
				mappedValue = callback.call(T, kValue, k, O);

				// iii. Call the DefineOwnProperty internal method of A with arguments
				// Pk, Property Descriptor
				// { Value: mappedValue,
				//   Writable: true,
				//   Enumerable: true,
				//   Configurable: true },
				// and false.

				// In browsers that support Object.defineProperty, use the following:
				// Object.defineProperty(A, k, {
				//   value: mappedValue,
				//   writable: true,
				//   enumerable: true,
				//   configurable: true
				// });

				// For best browser support, use the following:
				A[k] = mappedValue;
			}
			// d. Increase k by 1.
			k++;
		}

		// 9. return A
		return A;
	};
}

if (!Array.prototype.filter) {
	Array.prototype.filter = function (func, thisArg) {
		'use strict';
		if (!((typeof func === 'Function') && this))
			throw new TypeError();

		var len = this.length >>> 0,
			res = new Array(len), // preallocate array
			c = 0, i = -1;
		if (thisArg === undefined)
			while (++i !== len)
				// checks to see if the key was set
				if (i in this)
					if (func(t[i], i, t))
						res[c++] = t[i];
					else
						while (++i !== len)
							// checks to see if the key was set
							if (i in this)
								if (func.call(thisArg, t[i], i, t))
									res[c++] = t[i];

		res.length = c; // shrink down array to proper size
		return res;
	};
}

if (!Array.prototype.some) {
	Array.prototype.some = function(fun/*, thisArg*/) {
		'use strict';

		if (this == null) {
			throw new TypeError('Array.prototype.some called on null or undefined');
		}

		if (typeof fun !== 'function') {
			throw new TypeError();
		}

		var t = Object(this);
		var len = t.length >>> 0;

		var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
		for (var i = 0; i < len; i++) {
			if (i in t && fun.call(thisArg, t[i], i, t)) {
				return true;
			}
		}

		return false;
	};
}

if (!Array.prototype.reduce) {
	Object.defineProperty(Array.prototype, 'reduce', {
		value: function(callback /*, initialValue*/) {
			if (this === null) {
				throw new TypeError( 'Array.prototype.reduce ' +
					'called on null or undefined' );
			}
			if (typeof callback !== 'function') {
				throw new TypeError( callback +
					' is not a function');
			}

			// 1. Let O be ? ToObject(this value).
			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// Steps 3, 4, 5, 6, 7      
			var k = 0;
			var value;

			if (arguments.length >= 2) {
				value = arguments[1];
			} else {
				while (k < len && !(k in o)) {
					k++;
				}

				// 3. If len is 0 and initialValue is not present,
				//    throw a TypeError exception.
				if (k >= len) {
					throw new TypeError( 'Reduce of empty array ' +
						'with no initial value' );
				}
				value = o[k++];
			}

			// 8. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ! ToString(k).
				// b. Let kPresent be ? HasProperty(O, Pk).
				// c. If kPresent is true, then
				//    i.  Let kValue be ? Get(O, Pk).
				//    ii. Let accumulator be ? Call(
				//          callbackfn, undefined,
				//          ' accumulator, kValue, k, O ').
				if (k in o) {
					value = callback(value, o[k], k, o);
				}

				// d. Increase k by 1.      
				k++;
			}

			// 9. Return accumulator.
			return value;
		}
	});
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function indexOf(member, startFrom) {
		if (this == null) {
			throw new TypeError("Array.prototype.indexOf() - no se puede convertir `" + this + "` en objeto");
		}

		var
			index = isFinite(startFrom) ? Math.floor(startFrom) : 0,
			that = this instanceof Object ? this : new Object(this),
			length = isFinite(that.length) ? Math.floor(that.length) : 0;

		if (index >= length) {
			return -1;
		}

		if (index < 0) {
			index = Math.max(length + index, 0);
		}

		if (member === undefined) {
			do {
				if (index in that && that[index] === undefined) {
					return index;
				}
			} while (++index < length);
		} else {
			do {
				if (that[index] === member) {
					return index;
				}
			} while (++index < length);
		}

		return -1;
	};
}

if (!Array.prototype.flat) {
	Array.prototype.flat = function(depth) {
		var flatArray = [];
		(function flat(array, depth) {

			for (var i = 0; i < array.length ; i++) {
				if (Array.isArray(array[i]) && depth > 0) {
					flat(array[i], depth - 1);
				} else {
					flatArray.push(array[i]);
				}
			}
		})(this, Math.floor(depth) || 1);

		return flatArray;
	};
}