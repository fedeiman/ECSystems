Dom = function() {
	return Smc.DOM;
};

Smc.DOM = function() {
	var isIE = navigator.userAgent.search("MSIE") >= 0;
	
	var protoType = {
			
		rename : function (node, newname)
		{
			var xmlDoc = this.getOwnerDocument(node);
			var newNode = xmlDoc.createElement(newname);
			this.copyAttributes(node, newNode);

            for (var i = 0; node.childNodes != null && i < node.childNodes.length; i++)
            {
                var childNode = this.importNode(node.childNodes.item(i), xmlDoc, true);
                if (childNode != null)
                    newNode.appendChild(childNode);
            }
			
            var parent = this.getParent(node);
            if (parent != null)
            {
	            this.remove(parent, node);
	            this.appendChild(parent, newNode);
			}  	
			return newNode;
		},
		isElementNode : function(node) {
			return this.getNodeTypeString(node) == "element";
		},
		getNodeName : function(node) {
        	return node.nodeName;
	    },
	    getAttribute : function(node, attrName) {
	        return node.getAttribute(attrName);
	    },
		getXmlResponseData : function(request) {
			if (request.responseXML) {
		    	var newDoc = request.responseXML;
		    	this.checkForParseErrors(newDoc);
		    	this.setDocumentProperties(newDoc);
		    	return newDoc;
		    }
		    else
		        return this.parse(request.responseText);
		},
		getContent : function (uri, requestHeaders, noParse) {
		    var request = this.getXHR();
		    request.open("GET", uri, false);
		    this.onAfterOpenXhrConnection(request);
		    for (var name in requestHeaders)
		    {
		        if (requestHeaders[name])
		        	request.setRequestHeader(name,requestHeaders[name]);
		    }
//		    if (Smc && Smc.System)
//		    	request.setRequestHeader("X-timeZone",Smc.System.getTimeZone());
		    
		    request.send(null);
		    if (request.status > 399)
		    	throw new Error(request.statusText);
		    if (noParse)
		        return request.responseText;
		    else if (request.responseXML) {
		    	var newDoc = request.responseXML;
		    	this.checkForParseErrors(newDoc);
		    	this.setDocumentProperties(newDoc);
		    	return newDoc;
		    }
		    else
		        return this.parse(request.responseText);
		},
		getContentAsync: function (uri, callback) {
			var successFn = function (response, status, request) {
				if (request.responseXML && request.responseXML.documentElement) {
					var newDoc = request.responseXML;
					this.checkForParseErrors(newDoc);
					if (isIE)
						newDoc.setProperty('SelectionLanguage', 'XPath');
					this.setDocumentProperties(newDoc);

					callback.call(this, newDoc, status, request);
				} else {
					var parsed = this.parse(request.responseText);
					callback.call(this, parsed, status, request);
				}
			};

			var options = {
				context: this,
				type: "GET",
				url: uri,
				contentType: "text/xml;UTF-8",
				processData: false,
				async: true,
				dataType: "xml",
				success: successFn,
				error: function (xhr, statusText, errorThrown) {
					throw new Error(errorThrown);
				}
			};
			jQuery.ajax(options);
		},
		postContent : function (uri, strContent, requestHeaders, noParse) {
		    var request = this.getXHR();
		    request.open("POST", uri, false);
		    this.onAfterOpenXhrConnection(request);
		    request.setRequestHeader("Content-Type","text/xml;charset=UTF-8");
		    for (var name in requestHeaders)
		    {
		        if (requestHeaders[name])
		        	request.setRequestHeader(name,requestHeaders[name]);
		    }
//		    if (Smc && Smc.System)
//		    	request.setRequestHeader("X-timeZone",Smc.System.getTimeZone());
		    
		    request.send(strContent);
		    if (request.status > 399)
		    	throw new Error(request.statusText);
		    if (noParse)
		        return request.responseText;
		    else if (request.responseXML) {
		    	var newDoc = request.responseXML;
		    	this.checkForParseErrors(newDoc);
		    	this.setDocumentProperties(newDoc);
		    	return newDoc;
		    }
		    else
		        return this.parse(request.responseText);
		},
		checkForParseErrors: function(newDoc) {
			if (newDoc.parseError && newDoc.parseError.reason.length > 0) {
		    	throw new Error("Parse error: " + newDoc.parseError.reason + " in line: " + newDoc.parseError.line);
			}
			else if (newDoc.documentElement.nodeName == "parsererror") {
		    	throw new Error("Parse error: " + newDoc.documentElement.childNodes[0].nodeValue);
		    }
		},
		postContentAsync : function (uri, strContent, fn, scope, fnError) {			
			var options = {
				type: "POST",
				data: strContent,
				url: uri,
				contentType: "text/xml;UTF-8",
				processData: false,
				async: true,
				dataType: "xml",
				success: scope ? Util.createDelegate(fn, scope) : fn
			};
			if (typeof fnError == "function")
				options.error = scope ? Util.createDelegate(fnError, scope) : fnError;
			jQuery.ajax(options);
		},

		putContent : function (uri, strContent, requestHeaders) {
		    var request = this.getXHR();
		    request.open("PUT", uri, false);
		    this.onAfterOpenXhrConnection(request);
		    for (var name in requestHeaders)
		    {
		        if (requestHeaders[name])
		        	request.setRequestHeader(name,requestHeaders[name]);
		    }
		    request.send(strContent);
		    return request.status;
		},
		getDocumentCopy : function(docOrElem) {
			if (docOrElem == null)
				return null;
			
			var newDoc = this.getBlankDocument();
			if (this.getNodeTypeString(docOrElem) == "document")
			{
				this.appendChild(newDoc, this.importNode(this.getDocumentElement(docOrElem), newDoc, true));
			}
			else if (this.getNodeTypeString(docOrElem) == "element")
			{
				this.appendChild(newDoc, this.importNode(docOrElem, newDoc, true));
			}
			return newDoc;
		},
		getDocumentElement : function (thisDoc) {
		    return thisDoc.documentElement;
		},
		getAsynchronousDocumentFromUri : function(strUri, params, onComplete)
		{
		    var async = new Asynchronous();
		    async.complete = onComplete;
		    async.call(strUri, params);
		},
		
		getCachedDocumentFromUri : function(strUri)
		{
		    var request = this.getXHR();
		    request.open("GET", strUri, false);
		    this.onAfterOpenXhrConnection(request);
		    request.send(null);
		    return request.status == 200 ? request.responseXML || this.parse(request.responseText) : "";
		},
		downloadFile : function(strUri)
		{
		    var request = this.getXHR();
		    request.open("GET", strUri, false);
		    this.onAfterOpenXhrConnection(request);
		    request.send(null);
		    
		    if (request.status == 200)
		        return request.responseText;
		    else
		        return "";
		},
		importNode : function (node, newXmlDoc, importChildren)
		{
			try
			{
				return newXmlDoc.importNode(node, !!importChildren);
			}
			catch (e)
			{
			    var newNode = null;
			    if (this.getNodeTypeString(node) == "text")
			    {
			        newNode = newXmlDoc.createTextNode(node.nodeValue);
			    }
			    else if (this.getNodeTypeString(node) == "element")
			    {
			        newNode = newXmlDoc.createElement(node.nodeName);
			        this.copyAttributes(node, newNode);
			        if (importChildren)
			        {
			            for (var i = 0; node.childNodes != null && i < node.childNodes.length; i++)
			            {
			                var childNode = this.importNode(node.childNodes.item(i), newXmlDoc, importChildren);
			                if (childNode != null)
			                    newNode.appendChild(childNode);
			            }
			        }
			    }
			    return newNode;
			}
		},
		getChildElement : function(node, elementName) {
			var tmpChild = node.firstChild;
			while (tmpChild)
			{
				if (tmpChild.nodeType == 1 && tmpChild.nodeName == elementName)
					return tmpChild;
				tmpChild = tmpChild.nextSibling;
			}
			return null;
		},
		getChildElements : function(node, elementName) {
			var res = new SmcUtil.Array();
			if (elementName == "*")
			{
				var tmpChild = node.firstChild;
				while (tmpChild)
				{
					if (tmpChild.nodeType == 1)
						res.push(tmpChild);
					tmpChild = tmpChild.nextSibling;
				}
			}
			else
			{
				var tmpChild = node.firstChild;
				while (tmpChild)
				{
					if (tmpChild.nodeType == 1 && tmpChild.nodeName == elementName)
						res.push(tmpChild);
					tmpChild = tmpChild.nextSibling;
				}
			}
			return res;
		},
		copyNode : function (node, importChildren) {
		    return this.importNode(node, node.ownerDocument, importChildren);
		},
		appendChild : function (parentNode, childNode) {
			return parentNode.appendChild(childNode);
		},
		insertBefore : function (parentNode, newNode, existingChild) {
			return parentNode.insertBefore(newNode,existingChild);
		},
		getAttributes : function (node) {
		    return node.attributes;
		},
		setAttribute : function (node, attrName, attrValue) {
		    node.setAttribute(attrName, attrValue);
		},
		
		removeAttribute : function (node, attrName) {
		    node.removeAttribute(attrName);
		},		
		
		copyAttributes : function (sourceNode, newNode) {
		    var oAttrList = sourceNode.attributes;
		    if (oAttrList != null)
		    {
			    for (var j = 0, len = oAttrList.length; j < len; j++) 
			    {
			        var attr = oAttrList.item(j);
			        newNode.setAttribute(attr.name, attr.value);	
			    }
		    }   
		},
		getParent : function (node) {
		    return node.parentNode;
		},
		setText : function(node, newText) {
			
			while (node.firstChild)
				node.removeChild(node.firstChild);

			var doc = this.getOwnerDocument(node);
			node.appendChild(doc.createTextNode(newText));
			return
		},
		replaceText : function(node, newText) {
			var replaced = false;
			for (var i = 0; !replaced && i < node.childNodes.length; i++)
			{
				var childNode = node.childNodes.item(i);
				if (this.getNodeTypeString(childNode) == "text")
				{
					childNode.nodeValue = newText;
					replaced = true;
				}
			}
			
			if (!replaced)
			{
				var doc = this.getOwnerDocument(node);
				node.appendChild(doc.createTextNode(newText));
			}
		},
		serializeChildren : function(node) {
			var strArr = [];
			for (var i = 0, len = node.childNodes.length; i < len; i++)
				strArr.push(this.serialize(node.childNodes[i]));
			return strArr.join("");
		},
		deleteChildNodes : function(node) {
		    if (node == null)
		    	return;
		    
		    while (node.firstChild)
		        node.removeChild(node.firstChild);
		},
		replaceChild : function(newChild, replaceChild) {
		    if (newChild == null || replaceChild == null)
		    	return;
		    replaceChild.parentNode.replaceChild(newChild, replaceChild);  
		},
		getOwnerDocument : function(node) {
			return node.ownerDocument;
		},
		createTextNode : function (xmlDoc, data) {
			return xmlDoc.createTextNode(data);
		},		
		createElement : function (xmlDoc, nodeName) {
			return xmlDoc.createElement(nodeName);
		},
		createSimpleDocument : function (nodeName) {
		    var newDoc = this.getBlankDocument();
		    var root = newDoc.appendChild(newDoc.createElement(nodeName));
		    return newDoc;
		} ,
		getElementName : function (node) {
			return node.nodeName;	
		}, 
		remove : function (parentNode, childNode) {
			if (childNode == null)
			{
				this.getParent(parentNode).removeChild(parentNode);	
			}
			else
			{
				parentNode.removeChild(childNode);
			}	
		},
		getElementXPath : function(element) {
		     var path = "";
		     for (; element && element.nodeType == 1; element = element.parentNode)
		     {
				var xname = element.tagName + "[" + this.getElementIdx(element) + "]";
				path = "/" + xname + path;
		     }
		 
		     return path;	
		},
		getElementIdx : function(element) {
		    var count = 1;
		    for (var sib = element.previousSibling; sib ; sib = sib.previousSibling)
		    {
		        if(sib.nodeType == 1 && sib.tagName == element.tagName)
		        	count++;
		    }
		    
		    return count;
		}		
	};
	
	/* Code not work more with IE7 the minimum version supported is IE9 */
	// if ($.browser.msie && parseInt($.browser.version) <= 7) {
	// 	// since IE7 doesn't support the Smc.Array sub class (because of incorrect length property)
	// 	protoType.getChildElements = function(node, elementName) {
	// 		return this.getNodeList(node, elementName);
	// 	};
	// }
	
	if (window.XPathEvaluator) {
		protoType.getSingleNode = function(node, xpath, ns) {
			var oEvaluator = new XPathEvaluator();
			
			var nsResolver;
			if (ns)
				nsResolver = oEvaluator.createNSResolver(node.ownerDocument == null ?
					node.documentElement : node.ownerDocument.documentElement);
			
		    var oResult = oEvaluator.evaluate(xpath, node, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
			return oResult != null ? oResult.singleNodeValue : null;
		};
		protoType.getNodeList = function (node, xpath, ns) {
			var oEvaluator = new XPathEvaluator();
			var nsResolver = null;
			if (ns)
				nsResolver = oEvaluator.createNSResolver(node.ownerDocument == null ?
					node.documentElement : node.ownerDocument.documentElement);

		    var oResult = oEvaluator.evaluate(xpath, node, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);    
			  
			var aNodes = new SmcUtil.Array();
		    
		    if (oResult != null) {
		        var oElement = oResult.iterateNext();
		        while(oElement) {
		            aNodes.push(oElement);
		            oElement = oResult.iterateNext();
		        }
		    }
		    return aNodes;
		};
	} else {
		protoType.getSingleNode = function(node, xpath, ns) {
			if (ns != null)
			{
			    var myDoc = node.ownerDocument;
			    myDoc.setProperty("SelectionNamespaces", ns);
			}
	    	return node.selectSingleNode(xpath);
		};
		protoType.getNodeList = function (node, xpath, ns) {
	    	if (ns != null)
			{
			    var myDoc = node.ownerDocument;
			    myDoc.setProperty("SelectionNamespaces", ns);
			}
	    	return node.selectNodes(xpath);
		};
	}
	
	var canActiveX = function() {
		try {
			new ActiveXObject("Microsoft.XMLHTTP");
			return true;
		} catch (e) {
			return false;
		}
	}
	
	if (window.XMLHttpRequest && (window.location.protocol !== "file:" || !canActiveX()))
	{
		protoType.getXHR = function() {
			return new XMLHttpRequest();
		};
		if (!window.XPathEvaluator)
		{
			protoType.onAfterOpenXhrConnection = function(xhr) {
				xhr.responseType = "msxml-document";
			};
			$.ajaxSetup({
				xhrFields : {
					responseType : 'msxml-document'
				}
			});
		}
		else
		{
			protoType.onAfterOpenXhrConnection = function(xhr) {};
		}
	}
	else
	{
		protoType.onAfterOpenXhrConnection = function(xhr) {};
		
		protoType.getXHR = function() {
			try {
    			return new ActiveXObject("Microsoft.XMLHTTP");
	    	} catch (e) {
	    		return new Error("Unsupported Browser! XMLHttpRequest object could not be found!");
	    	}
		};
	}

	if (window.DOMParser && window.XPathEvaluator)
	{
		protoType.parse = function (xmlStr) {
	    	var newDoc = new DOMParser().parseFromString(xmlStr, "application/xml");
	    	if (newDoc.documentElement.nodeName == "parsererror")
		    {
		    	throw new Error("Parse error: " + newDoc.documentElement.childNodes[0].nodeValue);
		    }
	    	return newDoc;
		};
		
		protoType.getBlankDocument = function () {
			// that's an hack in order to create empty dom documents in FF3 with correct charset
	    	var domDocument = this.parse("<?xml version='1.0' encoding='UTF-8'?><dummy/>");
			domDocument.removeChild(domDocument.firstChild);
		    domDocument.async = false;
		    return domDocument;	
		};
	}
	else
	{
		protoType.parse = function (xmlStr) {
	    	var newDoc = this.getBlankDocument();
	    	newDoc.resolveExternals = false;
	    	newDoc.validateOnParse = false;
		    newDoc.loadXML(xmlStr);
		    this.checkForParseErrors(newDoc);
		    return newDoc;
		};
		
		{
			var progIDsDOM = [ 'Msxml2.DOMDocument.6.0', 
								'Msxml2.DOMDocument.5.0', 
								'Msxml2.DOMDocument.4.0', 
								'Msxml2.DOMDocument.3.0', 
								'Msxml2.DOMDocument' ];

	        for (var i = 0; i < progIDsDOM.length; i++)
	        {
	            try {
	                new ActiveXObject(progIDsDOM[i]);
	                protoType.domDocProgId = progIDsDOM[i];
	                break;
	            }
	            catch (ex) {
	            	
	            }
	        }
	        
	        progIDsDOM = null;
	        
//	        if (!protoType.domDocProgId)
//	        	throw new Error("Could not instantiate Msxml2.DOMDocument!");
		}
        
		protoType.getBlankDocument = function () {
			var doc = new ActiveXObject(protoType.domDocProgId);
		    doc.async = false;
		    doc.setProperty("SelectionLanguage", "XPath");
		    return doc;
		};
	}
	
	if (window.XSLTProcessor)
	{
		protoType.getXSLDocumentFromUri = function(strUri) {
			return this.getDocumentFromUri(strUri);
		};
		protoType.getXSLTProcessor = function(strUri, xslParams) {
			"xslParams:nomunge, key:nomunge";
		   
	    	var xsltProc = new XSLTProcessor();
	    	if (typeof(strUri) == "string")
		    	xsltProc.importStylesheet(this.getXSLDocumentFromUri(strUri));
			else
				xsltProc.importStylesheet(strUri);
	    	
	    	if (xslParams)
		    {
		        for (var key in xslParams)
		        {
					var paramValue = new String(xslParams[key]).valueOf();
					xsltProc.setParameter(null, key, paramValue);
		        }
		    }
		    return xsltProc;
		};
		protoType.transform = function(xsltProc, node, returnDomResult) {
	    	var newDoc = xsltProc.transformToDocument(node);
            if (returnDomResult === true)
		    		return newDoc;
	    	var xSer = new XMLSerializer();
	    	var de = newDoc.documentElement;
	    	
	    	if (de.nodeName == "transformiix:result")
	    	{
		    	var result = "";
		    	for (var i = 0, len = de.childNodes.length; i < len; i++)
		    	{
		    		var node = de.childNodes[i];
		    		if (this.getNodeTypeString(node) == "text")
		    		{
		    			var text = this.getText(node);
		    			if (text.trim().length > 0)
		    				result += text;
		    		}
		    		else
		    			result += xSer.serializeToString(node);
		    	}
		    	return result;
	    	}
	    	else
	    	{
	    		return xSer.serializeToString(newDoc);
	    	}
		};
	}
	else
	{
		{
			var progIDsFreeThreaded = [ 'Msxml2.FreeThreadedDOMDocument.6.0', 
			    						'Msxml2.FreeThreadedDOMDocument.5.0', 
			    						'Msxml2.FreeThreadedDOMDocument.4.0', 
			    						'Msxml2.FreeThreadedDOMDocument.3.0'];
			for (var i = 0; i < progIDsFreeThreaded.length; i++)
			{
				try {
					new ActiveXObject(progIDsFreeThreaded[i]);
					protoType.freeThreadedDomDocProgId = progIDsFreeThreaded[i];
					break;
				}
				catch (ex) {
				
				}
			}
			
			progIDsFreeThreaded = null;
			
//			if (!protoType.freeThreadedDomDocProgId)
//				throw new Error("Could not instantiate Msxml2.FreeThreadedDOMDocument!");
		}
		
		protoType.getXSLDocumentFromUri = function(strUri) {
	    	var xslDoc = new ActiveXObject(protoType.freeThreadedDomDocProgId);
		    xslDoc.async = false;
		    xslDoc.resolveExternals = true;
		    xslDoc.load(strUri);
		    this.checkForParseErrors(xslDoc);
		    
		    return xslDoc;
		};

		{
			var progIDsTemplate = [ 'Msxml2.XSLTemplate.6.0', 
									'Msxml2.XSLTemplate.5.0', 
									'Msxml2.XSLTemplate.4.0', 
									'Msxml2.XSLTemplate.3.0'];
	        for (var i = 0; i < progIDsTemplate.length; i++)
	        {
	            try {
	                new ActiveXObject(progIDsTemplate[i]);
	                protoType.xslTemplateProgId = progIDsTemplate[i];
	                break;
	            }
	            catch (ex) {
	            	
	            }
	        }
//	        if (!protoType.xslTemplateProgId)
//	        	throw new Error("Could not instantiate Msxml2.XSLTemplate!");
	        
	        progIDsTemplate = null;
		}
        
        protoType.getXSLTProcessor = function(strUri, xslParams) {
			"xslParams:nomunge, key:nomunge";
		   
	    	var xslt = new ActiveXObject(protoType.xslTemplateProgId);
	    	
		    if (typeof(strUri) == "string")
		    	xslt.stylesheet = this.getXSLDocumentFromUri(strUri);
			else
				xslt.stylesheet = strUri;
		    var XsltProc =  xslt.createProcessor();
		    if (xslParams)
		    {
		        for (var key in xslParams)
		        {
		            XsltProc.addParameter(key, xslParams[key], "");
		        }
		    }
		    return XsltProc;
		};
		
		protoType.transform = function (xsltProc, node, returnDomResult) {
			var tempDoc = new ActiveXObject(protoType.freeThreadedDomDocProgId);
			tempDoc.async = false;
			tempDoc.loadXML(this.serialize(node));
			xsltProc.input = tempDoc;
			xsltProc.transform();
			return returnDomResult === true ? Smc.DOM.parse(xsltProc.output) : xsltProc.output;
		};
	}
	
	var testDoc = protoType.getBlankDocument();
	var docElem = testDoc.createElement("root");
	docElem.appendChild(testDoc.createTextNode("testtext"));
	
	var canSerialize = true;
	try
	{
		// need to test because IE can't serialize XML interface
		new XMLSerializer().serializeToString(testDoc);
	}
	catch (e)
	{
		canSerialize = false;
	}
	
	if (canSerialize)
	{
		protoType.serialize = function (node) {
			return new XMLSerializer().serializeToString(node);
		};
	}
	else
	{
		protoType.serialize = function (node) {
			return node.xml;
		};
	}
	
	if (docElem.textContent == "testtext")
	{
		protoType.getText = function(node, result) {
			return node.textContent;
		};
	}
	else if (docElem.text == "testtext")
	{
		protoType.getText = function(node, result) {
			return node.text;
		};
	}
	else
	{
		protoType.getText = function(node, result) {
			if (!result)
				result = "";
			for (var i = 0; i < node.childNodes.length; i++)
			{
				var childNode = node.childNodes.item(i);
				if (this.getNodeTypeString(childNode) == "text")
					result += childNode.nodeValue;
				else
					result += this.getText(childNode);
			}
			return result;
		};
	}
	
	if (docElem.nodeTypeString)
	{
		protoType.getNodeTypeString = function(node) {
			return node.nodeTypeString;
		};
	}
	else
	{
		var nodeTypesObj = {};
		nodeTypesObj[Node.ELEMENT_NODE] = "element";
		nodeTypesObj[Node.TEXT_NODE] = "text";
		nodeTypesObj[Node.ATTRIBUTE_NODE] = "attribute";
		nodeTypesObj[Node.DOCUMENT_NODE] = "document";
		protoType.getNodeTypeString = function(node) {
			return nodeTypesObj[node.nodeType];
		};
	}
	
	if (typeof testDoc.load == "unknown") // returns unknown if implemented (in IE)
	{
		protoType.getDocumentFromUri = function(strUri) {
	    	var newDoc = this.getBlankDocument();
		    newDoc.async = false;
		    newDoc.loadXML(this.getContent(strUri, null, true));
		    return newDoc;
		};
	}
	else
	{
		protoType.getDocumentFromUri = function(strUri) {
		    return this.getCachedDocumentFromUri(strUri);
		};
	}
	
	if (typeof testDoc.setProperty == "unknown") // returns unknown if implemented (in IE)
	{
		protoType.setDocumentProperties = function(doc) {
			doc.setProperty('SelectionLanguage', 'XPath');
		};
	}
	else
	{
		protoType.setDocumentProperties = function(doc) {};
	}
	
	testDoc = docElem = null;

	return protoType;
}();