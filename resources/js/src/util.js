var Util = {
	XMLEntityConversionTable : {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&apos;"
	},
	shimCounter: 0,
	browserDetails: (function(){
		var ua= navigator.userAgent, tem,
			M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		if(/trident/i.test(M[1])){
			tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
			return 'IE '+(tem[1] || '');
		}
		if(M[1]=== 'Chrome'){
			tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
			if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
		}
		M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
		if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
		return {browser: M[0], version: M[1]};
	}),
	isIE : function() {
		return this.browserDetails()['browser'].indexOf('MSIE') > -1;
	},
	isFF : function() {
		return this.browserDetails()['browser'].indexOf("Firefox") > -1;
	},
	isChrome : function(){
		return this.browserDetails()['browser'].indexOf("Chrome") > -1;
	},
	convertToDecimalEntities : function(astr, convertEntities) {
		var bstr = '', cstr, i = 0;
		for(i; i < astr.length; ++i){
			if(astr.charCodeAt(i) > 127){
				cstr = astr.charCodeAt(i).toString(10);
				while(cstr.length < 4){
					cstr = '0' + cstr;
				}
				bstr += '&#' + cstr + ';';
			} else if (convertEntities && Util.XMLEntityConversionTable[astr.charAt(i)]) {
				bstr += Util.XMLEntityConversionTable[astr.charAt(i)];
			} else {
				bstr += astr.charAt(i);
			}
		}
		return bstr;
	},
	decodeDecimalEntities : function(d) {

		// look for numerical entities &#34;
		var arr = d.match(/&#[0-9]{1,5};/g);
		
		// if no matches found in string then skip
		if(arr != null) {
			for (var x = 0; x < arr.length; x++) {
				var m = arr[x];
				var c = m.substring(2, m.length - 1); //get numeric part which is refernce to unicode character
				// if its a valid number we can decode
				if(c >= -32768 && c <= 65535){
					// decode every single match within string
					d = d.replace(m, String.fromCharCode(c));
				}else{
					d = d.replace(m, ""); //invalid so replace with nada
				}
			}			
		}

		return d;
	},
	sanitizeEditorString : function(str, convertEntities) {
		return this.isFF() ? this.convertToDecimalEntities(str, convertEntities) : str;
	},
	getFilename : function(uri) {
		var filename = uri;
		if (filename.lastIndexOf("/") > -1)
			filename = filename.substring(filename.lastIndexOf("/") + 1);
		return filename;
	},
	getFilenameWithoutExtension: function (uri) {
		var filename = this.getFilename(uri);
		if (filename.indexOf(".") > -1) {
			filename = filename.substring(0, filename.lastIndexOf("."));
		}
		return filename.replace(/\./g, '');
	},
	removeSuffix : function(str, suffix) {
		if (str.length >= suffix.length && str.indexOf(suffix) == str.length - suffix.length)
			str = str.substring(0, str.length - suffix.length);
		return str;
	}, 
	showShim: function(createNew, zIndex) {
		
		var shimFrame = document.getElementById("shim");
		var shimID = "";
		if (createNew)
			shimID = Util.getTimestamp();
			
		if (!shimFrame || createNew)
		{
			var opacityStyle = Util.isFF() ? "background-color:#FFFFFF;" : "filter:progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0);opacity:0;";
			$(document.body).append('<iframe name = "shim' + shimID + '" id="shim' + shimID + '" style="DISPLAY:none;LEFT: 0px; POSITION: absolute; TOP: 0px;width:160px;height:10px;' + opacityStyle + '" scrolling="no">-</iframe>');
			shimFrame = document.getElementById("shim" + shimID);
		}
		if (!createNew)
			Util.shimCounter++;
			
		if (!zIndex)
			zIndex = 0;
		
    	shimFrame.style.top = "0";
		shimFrame.style.left = "0";
		shimFrame.style.width = "100%";
		shimFrame.style.height = "100%";
		shimFrame.style.zIndex = zIndex;
		shimFrame.style.display = "";
		return shimFrame;
	},
	getIllegalChars : function() {
		return ['&', '/', '=', '?', ':', '\\', '*', '|', '<', '>', '"', '+', '\'', '[', ']'];
	},
	validateUri : function(uri) {
        var illegalCharArr = this.getIllegalChars();
        var isLegal = true;
        for (var i = 0; i < illegalCharArr.length; i++)
        {
        	if (uri.indexOf(illegalCharArr[i]) > -1)
        	{
        		isLegal = false;
        		break;
        	}
        }
        
        if (isLegal)
            return true;
        else
        	return false;
    },
    replaceIllegalChars : function(str, replaceStr)
    {
        if (!str) return str;
        var replacedStr = "";
        var illegalCharArr = this.getIllegalChars();
        for (var pos = 0; pos < str.length; pos++)
        {
	        var isIllegalChar = false;
	        var ch = str.charAt(pos);
	        for (var i = 0; i < illegalCharArr.length; i++)
	        {
	        	if (ch == illegalCharArr[i])
	        	{
	    			isIllegalChar = true;
	    			break;
	        	}
	        }
	        if (isIllegalChar)
	        {
	        	if (replaceStr == null)	// not defined
	        		ch = '_';
	        	else
	        		ch = replaceStr;
	        }
	        replacedStr += ch;
        }
        return replacedStr;
    },
	
	xmlAttrs2Obj : function(elem) {
		var o = {};
		for (var i = 0; i < elem.attributes.length; i++)
		{
			var a = elem.attributes.item(i);
			o[a.nodeName] = a.nodeValue;
		}
		return o;
	},
	getQueryString : function(params) {
		var qs = "";
		for (var key in params)
		{
			if (params[key] != null)
				qs += key + "=" + encodeURIComponent(params[key]) + "&";
		}
		return qs.substring(0, qs.length - 1);
	},
	parseQueryString : function(queryString) {
		var params = new Object();
		if (queryString == null)
			return params;
		if (queryString.substring(0, 1) == "?")
			queryString = queryString.substring(1);
		
		var paramsArr = queryString.split("&");
		for (var i = 0; i < paramsArr.length; i++)
		{
			var item = paramsArr[i];
			var pos = item.indexOf("=");
			if (pos > -1)
			{
				var arr = item.split("=");
				params[arr[0]] = decodeURIComponent(arr[1]);
			}
			else
				params[item] = "";
		}
		return params;
	},
	getTimestamp : function() {
		return new Date().getTime().toString();
	},
    repaint : function(dom){
        $(dom).addClass("x-repaint");
        setTimeout(function(){
            $(dom).removeClass("x-repaint");
        }, 1);
    },
    getCurrentEvent : function(evt)
    {
        return (evt) ? evt : ((event) ? event : null);
    },
    getEventElement : function(evt)
    {
        return (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
    },
    extend : function(subc, superc, overrides)
    {
        //This function was taken from YAHOO yui library
        /*
        Copyright (c) 2007, Yahoo! Inc. All rights reserved.
        Code licensed under the BSD License:
        http://developer.yahoo.net/yui/license.txt
        version: 2.3.0
        */
        if (!superc||!subc) {
            throw new Error("Util.extend failed, please check that " +
                            "all dependencies are included.");
        }
        var F = function() {};
        F.prototype=superc.prototype;
        subc.prototype=new F();
        subc.prototype.constructor=subc;
        subc.superclass=superc.prototype;
        if (superc.prototype.constructor == Object.prototype.constructor)
            superc.prototype.constructor=superc;
        if (overrides)
        {
            for (var i in overrides)
            {
                subc.prototype[i]=overrides[i];
            }
        }
    },
    getParentURI : function(uri)
    {
        if ((uri == null) || (uri == ''))
            return '/';
        var idx = uri.lastIndexOf('/');
        if (idx == 0)
        	return '/';
    	else
        	return uri.substr(0, idx);
    },
    stopEvents : function()
    {
        if (!e) var e = window.event;
	    e.cancelBubble = true;
	    if (e.stopPropagation) e.stopPropagation();
	    return false;
    },
    copyObject : function(object)
    {
        var copied = new Object();
        for (var key in object)
        {
            copied[key] = object[key];
        }
        return copied;
    },
	createDelegate : function(method, obj, args, appendArgs){
        return function() {
            var callArgs = args || arguments;
            if(appendArgs === true){
                callArgs = Array.prototype.slice.call(arguments, 0);
                callArgs = callArgs.concat(args);
            }else if(typeof appendArgs == "number"){
                callArgs = Array.prototype.slice.call(arguments, 0); // copy arguments first
                var applyArgs = [appendArgs, 0].concat(args); // create method call params
                Array.prototype.splice.apply(callArgs, applyArgs); // splice them in
            }
            return method.apply(obj || window, callArgs);
        };
    },
    defer : function(method, millis, obj, args, appendArgs){
        var fn = Util.createDelegate(method, obj, args, appendArgs);
        if(millis){
            return setTimeout(fn, millis);
        }
        fn();
        return 0;
    },
    Transformer : 
    {
        appendParameter : function(name, value, node)
        {
            var doc = node;
            var DOM = new Dom();
            if (DOM.getNodeTypeString(node) != "document")
                doc = node.ownerDocument;
                
            var DOM = new Dom();
            var params = this.getParametersElem(node, doc);
            var param = params.appendChild(doc.createElement("Parameter"));
            param.setAttribute("name", name);
            param.appendChild(doc.createTextNode(value));
        },
        appendParameters : function(hashTable, node)
        {
            var doc = node;
            var DOM = new Dom();
            if (DOM.getNodeTypeString(node) != "document")
                doc = node.ownerDocument;
                
            var DOM = new Dom();
            var params = this.getParametersElem(node, doc);
            for (var name in hashTable)
            {
                var value = hashTable[name];
                var param = params.appendChild(doc.createElement("Parameter"));
                param.setAttribute("name", name);
                param.appendChild(doc.createTextNode(value));
            }
        },
        removeParameters : function(node)
        {
            
        },
        getParametersElem : function(node, doc)
        {
            var DOM = new Dom();
            
            if (doc == null)
                throw new Error("[Util.Transformer.getParametersElem] Invalid 'doc' parameter (is null)! ");
            if (node == null)
                throw new Error("[Util.Transformer.getParametersElem] Invalid 'node' parameter (is null)! ");
                
            var params = DOM.getSingleNode(node, "Parameters");
            if (params == null)
                params = node.appendChild(doc.createElement("Parameters"));
            return params;
        }
    },
    
    
    /**
     * Main class that builds a query 
     */

    XMLQuery : {
        getSimpleSearchConditionElem : function(name, value, doc) {
			var SearchFieldElem = doc.createElement("SearchCondition");
			var FieldElem = SearchFieldElem.appendChild(doc.createElement("Field"));
			FieldElem.appendChild(doc.createTextNode(name));
			var ValueElem = SearchFieldElem.appendChild(doc.createElement("Value"));
			ValueElem.appendChild(doc.createTextNode(value));
			return SearchFieldElem;
        },
        getSimpleSearchCondition : function(fieldname, fieldvalue) {
			var doc = Smc.DOM.getBlankDocument();
			
			var elem = this.getSimpleSearchConditionElem(fieldname, fieldvalue, doc);
			doc.appendChild(elem);
			return doc;
        },
		// to do: send operands by an array of {"operand1", "value"} or {"operand2", "field"}  
        getSimpleSearchFunction : function(operator, operands) {
			var DOM = new Dom();
			var doc = DOM.getBlankDocument();
			
			var SearchConditionElem = doc.createElement("SearchCondition");
			doc.appendChild(SearchConditionElem);
			SearchConditionElem.setAttribute("operator", operator);
			
			for (fieldtype in operands)
			{
				var operandValue = operands[fieldtype];
				if (fieldtype == "field")
				{
					var argumentElem = SearchConditionElem.appendChild(doc.createElement("Field"));
					argumentElem.appendChild(doc.createTextNode(operandValue));
				}
				else if (fieldtype == "value")
				{
					var argumentElem = SearchConditionElem.appendChild(doc.createElement("Value"));
					argumentElem.appendChild(doc.createTextNode(operandValue));
				}
				else if (fieldtype == "set") // adding a new DOM fragment
				{
					var argumentElem = SearchConditionElem.appendChild(doc.createElement("Set"));
					
					if (operandValue != null &&
						DOM.getNodeTypeString(operandValue) == "document" &&
						DOM.getDocumentElement(operandValue) != null)
					{
						argumentElem.appendChild(DOM.importNode(DOM.getDocumentElement(operandValue), doc, true));
					}
					if (operandValue != null &&
						DOM.getNodeTypeString(operandValue) == "element")
					{
						argumentElem.appendChild(DOM.importNode(operandValue, doc, true));
					}
				}
				else if (fieldtype == "searchcondition") // adding a send search-condition (available in or/and/not
				{
					if (operandValue != null &&
						DOM.getNodeTypeString(operandValue) == "document" &&
						DOM.getDocumentElement(operandValue) != null)
					{
						SearchConditionElem.appendChild(DOM.importNode(DOM.getDocumentElement(operandValue), doc, true));
					}
					if (operandValue != null &&
						DOM.getNodeTypeString(operandValue) == "element")
					{
						SearchConditionElem.appendChild(DOM.importNode(operandValue, doc, true));
					}
				}
			}
			return doc;
        },
        getSimple : function(fields, operator) {

			var doc = Smc.DOM.getBlankDocument();
			
			operator = operator.toUpperCase();
			
			var SearchFieldElem = doc.appendChild(doc.createElement("SearchCondition"));
			SearchFieldElem.setAttribute("operator", operator);
			
			if (operator == 'OR' || operator == 'AND')	// any number of operans
			{
				for (var fieldname in fields)
				{
					var fieldvalue = fields[fieldname];
					var field_SearchConditionElem = this.getSimpleSearchConditionElem(fieldname, fieldvalue, doc);
					SearchFieldElem.appendChild(field_SearchConditionElem);
				}
			}
			else if (operator == 'NOT')	// just one operand, take the first one
			{
				var fieldname;
				for (fieldname in fields)
					continue;
				var fieldvalue = fields[fieldname];
				var field_SearchConditionElem = this.getSimpleSearchConditionElem(fieldname, fieldvalue, doc);
				SearchFieldElem.appendChild(field_SearchConditionElem);
			}
			return doc;
        },
        getComplex : function (sc1, sc2, operator, doc) {
			var DOM = new Dom();
			if (!doc)
				doc = DOM.getBlankDocument();
			operator = operator.toUpperCase();
        	
			var SearchFieldElem = doc.appendChild(doc.createElement("SearchCondition"));
			SearchFieldElem.setAttribute("operator", operator);
			
			if ((operator == 'OR') || (operator == 'AND'))	// any number of operans
			{
				var importedNode = DOM.importNode(sc1.documentElement, doc, true);
				SearchFieldElem.appendChild(importedNode);
				
				importedNode = DOM.importNode(sc2.documentElement, doc, true);
				SearchFieldElem.appendChild(importedNode);
			}
			return doc;
        },
        getComplexFromArray : function (scArr, operator) {
			var DOM = new Dom();
			var doc = DOM.getBlankDocument();
			operator = operator.toUpperCase();
        	
			var SearchFieldElem = doc.appendChild(doc.createElement("SearchCondition"));
			SearchFieldElem.setAttribute("operator", operator);
			
			if (operator == 'OR' || operator == 'AND' || operator == 'NOT')	// any number of operans
			{
				for (var i = 0; i < scArr.length; i++)
				{
					var sc = scArr[i];
					if (sc != null)
					{
						var importedNode = DOM.importNode(sc.documentElement, doc, true);
						SearchFieldElem.appendChild(importedNode);
					}
				}
			}
			return doc;
        }        
    },
    
    /**
     * Helper class that helps in built-in search features
     */

    SearchHelper : {
    	
        getSynonymsTerms : function(context, language, fullText, includesSourceTextAsSynomym) {
			
			var words = Array();
			
			if (includesSourceTextAsSynomym && fullText)
				words.push(fullText);
			
			var TERM_OBJECT_TYPE = 'term';
			var synSearchDocTem = Util.XMLQuery.getComplexFromArray([
													Util.XMLQuery.getSimpleSearchFunction("EQUALS", {"field":"SMC_objType", "value": TERM_OBJECT_TYPE}),
													Util.XMLQuery.getSimpleSearchFunction("CONTAINS", {"field":"*/title", "value": fullText})
													], 'AND');
		//	Smc.DOM.setAttribute(Smc.DOM.getDocumentElement(synSearchDocTem), 'forceXPath', 'true');
			
			var pluginAPI = new PluginAPI(context, TERM_OBJECT_TYPE);	
			var synResultDoc = pluginAPI.getThemesBySearchCondition(synSearchDocTem, {"getOriginalInfo": "true", "language": language});
			
			var propList = Smc.DOM.getNodeList(synResultDoc, "/GotThemes/Theme/Properties/Property[@name='title']");
			for (var i = 0; i < propList.length; i++)
			{
				var prop = propList[i];
				var value = Smc.DOM.getAttribute(prop, "value");
				var strings = value.split(';');
				for (var stringIdx = 0; stringIdx < strings.length; stringIdx++)
				{
					var word = strings[stringIdx];
					if (word == '') continue;
					
					var found = false;
					for (wordidx = 0; wordidx < words.length; wordidx++)
					{
						if (words[wordidx] == word)
						{
							found = true;
							break;
						}
					}
					if (!found)
						words.push(word);
				}
			}
			return words;
        }
	
	}
};

SmcUtil = {};
SmcUtil.Array = function() {
	SmcUtil.Array.superclass.constructor.call(this);
};
Util.extend(SmcUtil.Array, Array, {
	item : function(i) {
		return this[i];
	}
});