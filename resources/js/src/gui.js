
Gui = function(uiNode, context, datasourceObj, pluginObj, eventScope) {
	this.context = context;
	this.eventScope = eventScope;
	
	this.uiNode = uiNode;
	this.datasourceObj = datasourceObj;
	this.t = this.context.getTranslatorCtrl();
	this.dataLinkHandler = this.context.getDataLinkHandler();
	this.dataLinkSubscriptions = new Array();
	this.multipleUploadStore = new Object();
	
	this.eventArray = new Object();

	this.rootObject = null;

	this.propertyGridStates = new Object();
	this.dataLinks = new Object();
	this.guiObjects = new Object();

	this.HTMLContainer = null;

	this.smcProperties = new Object(); 
	this.smcAttrNames = new Object();
	this.smcFunctions = new Object();
	this.refreshSleeperStore = {};
	
	this.showContextBase = new Object();
	
	this.actions = {};
	this.hiddenObjects = {};
	
	// TODO isn't this.guiDef the same as this.uiNode?
	this.guiDef = null;
	
	// TODO RSH ?
	this.controlRSH = 0;
	
	// TODO ds?
	this.ds = {};
	
	// TODO sm ?
	this.vectorSm = {};
	this.vectorData = [];
	this.vectorSelectedItems = {};
	this.vectorFilters = [];
	this.filterChain = {};

	this.visibleTabs = [];
};
Gui.prototype = {
	subscribe : function(eventDataLink, eventHandler, id, strictScope, subscriberScope) {
		this.dataLinkHandler.subscribe(eventDataLink, eventHandler, id, strictScope, subscriberScope);
		this.dataLinkSubscriptions.push({
			dataLink: eventDataLink,
			handler: eventHandler,
			id: id
		});
	},
	unsubscribe : function(eventDataLink, eventHandler) {
		this.dataLinkHandler.unsubscribe(eventDataLink, eventHandler);
		var dlObj;
		for (var i = 0, len = this.dataLinkSubscriptions; !dlObj && i < len; i++)
		{
			var o = this.dataLinkSubscriptions[i];
			if (o.dataLink == eventDataLink && o.handler == eventHandler)
				dlObj = o;
		}
		if (dlObj)
			this.dataLinkSubscriptions.remove(o);
	},
	setActiveItem : function (objectID, itemObjID) {
		var guiO = this.getGuiObject(objectID);
		var itmID = this.getGuiObject(itemObjID);
		guiO.getLayout().setActiveItem(itmID.getId());
		itmID.doLayout();
	},
	getActiveItem : function (objectID) {
		var guiO = this.getGuiObject(objectID);
		return guiO.getLayout().activeItem;
	},	
	removeRecords : function (objectID, fieldID, fieldValue) {
		var guiO = this.getGuiObject(objectID);
		var store = guiO.store;
		store.each(function (){
			if (this.get(fieldID) == fieldValue)
			{
				store.remove(this);
			}				
		});
	},
	/*gets the structure trees availables in a view*/
	getStructureTrees : function(){
		var trees = [];
		
		// TODO isn't this.context.GUI == this ?
		for(var obj in this.context.GUI.guiObjects) {
			var res = obj.search("structuredit");
			
			if(res != -1)
				trees.push(this.context.GUI.guiObjects[obj]);
		}
		
		for(var obj in this.guiObjects){
			var res = obj.search("structuredit");
			
			if(res != -1)		
				trees.push(this.guiObjects[obj]);
			
		}
		
		return trees;
	},
		
	getBodyHTMLElement : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO && guiO.body && guiO.body.dom)
			return guiO.body.dom;
		else if (guiO && guiO.innerHTML)
			return guiO;
		return null;
	},
	getFormHTMLElement : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO && guiO.getForm)
			return guiO.getForm().getEl().dom;
		return null;
	},
	
	markTreeNode : function (node, className) {
		node.getUI().addClass(className);
	},
	
	unmarkTreeNode : function (node, className) {
		node.getUI().removeClass(className);
	},
	
	setTreeNodeAttribute : function (node, attrName, attrValue) {
    	node.attributes[attrName] = attrValue;
	},
	
	getDisplayFormFieldValue : function(formFieldID) {
		var val = null;
		var guiO = this.getGuiObject(formFieldID);
		if (guiO != null && guiO.getValue)
		{
			val = guiO.getValue();
			var recordsColl = guiO.store.query("id", val);
			var record = recordsColl.item(0);
			if (record)
				val = record.get("text");
		}
		return val;
	},
	/*
	* disables the buffer resize to speed up resizing when many objects are displayed and resizing takes too long.
	*/
	killBufferResize : function() {
		Ext.Container.prototype.bufferResize = false;
	},
	getFormFieldType : function(formFieldID) {
		var val = null;
		var guiO = this.getGuiObject(formFieldID);
		if (guiO != null && guiO.getValue)
		{
			val = guiO.getXType();
		}
		return val;
	},
	getRawFormFieldValue : function(formFieldID) {
		var val = null;
		var guiO = this.getGuiObject(formFieldID);
		if (guiO && guiO.getRawValue)
			val = guiO.getRawValue();
		
		return val;
	},
	getFormFieldValue : function(formFieldID) {
		var val = null;
		var guiO = this.getGuiObject(formFieldID);
		if (guiO && guiO.getValue)
			val = guiO.getValue();
			
		// In the case of OptionGroup
		if (val != null && typeof(guiO.items)=="object") {
			if (val.inputValue)
		  		val = val.inputValue;
		}
		
		return val;
	},
	resetFormField : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.reset)
		{
			guiO.reset();
		}
	},
	enable : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.enable)
		{
			guiO.enable();
		}
	},
	disable : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.disable)
		{
			guiO.disable();
		}
	},
	disableSiblingTabs : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.ownerCt)
		{
			var owner = guiO.ownerCt;
			for (var i = 0; i < owner.items.length; i++)
			{
				if (owner.items.item(i) != guiO)
					owner.items.item(i).disable();
			}
		}
	},
	enableSiblingTabs : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.ownerCt)
		{
			var owner = guiO.ownerCt;
			for (var i = 0; i < owner.items.length; i++)
			{
				if (owner.items.item(i) != guiO)
					owner.items.item(i).enable();
			}
		}
	},
	setFormFieldValue : function(formFieldID, newValue) {
		var guiO = this.getGuiObject(formFieldID);
		if (guiO != null && guiO.setValue)
		{
			guiO.setValue(newValue);
		}
	},
	getGuiObject : function(objectID) {
		if (typeof objectID == "object")
			return objectID;
		
		return this.guiObjects[objectID];
	},
	findGuiObjects : function(matchObjectID) {
		var currentObject = null;
		var result = new Array();
		
		for(objectID in this.guiObjects)
		{
			currentObject = this.guiObjects[objectID];
			
			if( typeof currentObject != "object" )
				continue;
			
			if( currentObject.name && currentObject.name.match && currentObject.name.match(matchObjectID) )
				result.push(currentObject);
		}
		
		return result.length > 0 ? result : null;
	},
	findByName : function(name) {
		var currentObject = null;
		
		for(objectID in this.guiObjects)
		{
			currentObject = this.guiObjects[objectID];
			if( typeof currentObject != "object" )
				continue;
			
			if( currentObject.name && currentObject.name == name )
				return currentObject;
		}
		
		return null;
	},
	hide : function(objectID) {

		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.hide)
		{
			if (!guiO.ownerCt || typeof(guiO.ownerCt.hideTabStripItem) != "function") {
				guiO.hide();
				
				// TODO this gui ID should not be here. What is the purpose of the hidden objects feature?
				if(typeof(objectID.indexOf) == "function" && objectID.indexOf("note.field") != -1)
					this.hiddenObjects[objectID] = true;
			}
			else
			{
				this.visibleTabs[objectID] = false;
				guiO.ownerCt.hideTabStripItem(guiO);
			}
		}
	},
	doLayout : function(objectID, shallow, force) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.doLayout)
		{
			guiO.doLayout(shallow, force);
		}
	},
	show : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.show)
		{
			guiO.show();
			if(!guiO.ownerCt || typeof(guiO.ownerCt.hideTabStripItem) != "function")
			{
				if(typeof(objectID.indexOf) == "function" && objectID.indexOf("note.field")!=-1)
					this.hiddenObjects[objectID] = false;
			}
			else
			{
				this.visibleTabs[objectID] = true;
				guiO.ownerCt.unhideTabStripItem(guiO);
			}
		}
	},
	setVisible : function(objectID, visible) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.setVisible)
		{
			guiO.setVisible(visible);
		}
	},
	showFormField : function(objectID) {
		
		this.hiddenObjects[objectID] = false;

		var guiO = this.getGuiObject(objectID);
		if (!guiO || !guiO.el)
        	return;
		 
        var xFormItem = guiO.el.up('.x-form-item');

        if (!xFormItem)
        	xFormItem = guiO.el
        
    	xFormItem.hideLabel = false;
        xFormItem.setDisplayed(true);
        
        guiO.show();
	},

	hideFormField : function(objectID) {
		
		this.hiddenObjects[objectID] = true;
		
		var guiO = this.getGuiObject(objectID);
        if (!guiO || !guiO.el)
        	return;
        var xFormItem = guiO.el.up('.x-form-item');
        if (!xFormItem)
        	xFormItem = guiO.el;
        xFormItem.setDisplayed(false);
	},
	validate : function(objectID) {
		var guiO = this.getGuiObject(objectID);
        if (!guiO || typeof guiO.validate != "function")
        	return;
        return guiO.validate();
	},
	isVisible : function(objectID) {
		var guiO = this.getGuiObject(objectID);

		if(this.hiddenObjects[objectID] != null)
			return !this.hiddenObjects[objectID];

		if(!guiO)
			return;
	
		// TODO find workaround
//		if (typeof(guiO.ownerCt.hideTabStripItem) == "function")
//		{
//			return this.visibleTabs[objectID];
//		}

		return guiO ? guiO.isVisible() : false;
	},
	
	isExpanded : function (objectID) {
		var guiO = this.getGuiObject(objectID);
	    var scOwner = guiO.ownerCt;
	    return scOwner.getLayout().activeItem == guiO;
	},
	
	
	getDomID : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.getId)
		{
			return guiO.getId();
		}
		return null;
	},
	collapse : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.collapse)
		{
			guiO.collapse(false);
		}
	},
	collapseTreeNodes : function(objectID, checked) {
		var guiO = this.getGuiObject(objectID);
		if (guiO)
		{
			var rootNode = guiO.getRootNode();
			for (var i = 0; i < rootNode.childNodes.length; i++)
				this.collapseTreeNode(rootNode.childNodes[i], checked);
		}
	},
	collapseTreeNode : function(node, checked) {
		var checkStateChildren = checked;
		for (var i = 0; i < node.childNodes.length; i++)
		{
			var childNode = node.childNodes[i];
			var tempCheckState = this.collapseTreeNode(childNode, checked);
			if (tempCheckState != checked)
			{
				checkStateChildren = tempCheckState;
				break;
			}
		}
		if (checkStateChildren == checked)
			node.collapse();
		
		var currentCheckState = node.ui.isChecked();
		if (currentCheckState != checked)
			return currentCheckState;
		else if (checkStateChildren != checked)
			return checkStateChildren;
		else
			return checked;
	},
	expand : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.expand)
		{
			guiO.expand(false);
		}
	},
	expandTreeNodeByUri : function(rootPath, uri, objectID) {
		var guiO = this.getGuiObject(objectID);
		try
		{
		    if (uri == rootPath)
		    {
		    	var node = guiO.getRootNode();
		    	node.expand(false, true);
		    	node.select();
		    }
		    else
		    {
			    var treeUri = "/Root" + uri;
			    guiO.selectPath(treeUri, "objectTitle");
			    
			    var node = guiO.getSelectionModel().getSelectedNode();
			    var nodeUri = node != null ? node.attributes.uri : null;
			    
			    if (uri == nodeUri && node != null && node != guiO.getRootNode())
			    {
			    	node.expand(false, true);
			    	node.ensureVisible();
			    }
		    }
		}
		catch (e)
		{
			alert("[Gui.expandTreeNodeByUri] Could not expand tree node! Reason: " + e.message);
		}
	},
	deleteTreeNodeByUri : function(nodeURI, objectID) {
		var tree = this.getGuiObject(objectID);
		var node = this.findTreeNodeByAttribute(tree, "uri", nodeURI);
		if (node != null)
			node.remove();
	},
	refreshTreeNodeByUri : function(rootPath, uri, objectID) {
		var guiO = this.getGuiObject(objectID);
		try
		{
		    if (uri == rootPath)
		    {
		    	var node = guiO.getRootNode();
		    	node.reload();
		    	node.select();
		    }
		    else
		    {
			    var treeUri = "/Root" + uri;
			    guiO.selectPath(treeUri, "objectTitle");
			    
			    var node = guiO.getSelectionModel().getSelectedNode();
			    var nodeUri = node != null ? node.attributes.uri : null;
			    
			    if (uri == nodeUri && node != null && node != guiO.getRootNode())
			    {
			    	node.reload();
			    	node.ensureVisible();
			    }
		    }
		}
		catch (e)
		{
			alert("[Gui.refreshTreeNodeByUri] Could not expand tree node! Reason: " + e.message);
		}
	},
	onGridClick : function (grid, rowIndex, columnIndex, e) {
		var eventObj = new Object ();
		

		
        var record = grid.getStore().getAt(rowIndex);  // Get the Record
        var fieldName = grid.getColumnModel().getDataIndex(columnIndex); // Get field name
        var data = record.get(fieldName);	
        
        var sm = grid.getSelectionModel();
        if (sm != null)
        {
        	var clickArr = grid.getSelectionModel().getSelections();
        	var found = false;
        	for (var i = 0; i < clickArr.length; i++)
        	{
        		if (record.data.id == clickArr[i].data.id)
        		{
        			found = true;
        			i = clickArr.length;
        		} 
        	}
 		
 			if (found)
 				eventObj.isChecked = true;
 			else
 				eventObj.isChecked = false;
        }
        
		eventObj.name = "GridClick";
		eventObj.clickedID = new Object(record.data.id);
		eventObj.record = new Object(record.data);
				
		var dataLink = this.dataLinks[grid.id];
		if (dataLink != null)
			this.dataLinkHandler.fire(dataLink, eventObj, this.eventScope, this);
	
		var method = this.eventArray[grid.id];
		if (method) 
			method.call(this, eventObj); 
	},
	onPropertyGridChange : function (item, record, number, grid) {
		var gridID = grid.getId();

		var propertyGridDataLink = this.dataLinks[gridID];	
		if (typeof propertyGridDataLink == undefined)
			return;
		
		var eventObj = new Object ();
		eventObj.name = "PropertyList";
		eventObj.propertyList = grid.getSource();

		this.dataLinkHandler.fire(propertyGridDataLink, eventObj, this.eventScope, this);
	},
	onPropertyGridTextFieldChange : function (formField, newValue, oldValue, grid) {
		var gridID = grid.getId();

		var propertyGridDataLink = this.dataLinks[gridID];		
		if (typeof propertyGridDataLink == undefined)
			return;
		
		var eventObj = new Object ();
		eventObj.name = "PropertyList";
		eventObj.propertyList = grid.getSource();

		this.dataLinkHandler.fire(propertyGridDataLink, eventObj, this.eventScope, this);		
	},
	setTitle : function(objectID, newTitle) {
		
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.setTitle)
		{
			guiO.setTitle(newTitle);
		}
	},

	setText : function(objectID, newText) {

		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.setText)
		{
			guiO.setText(newText);
			return;
		}
		if (guiO != null && guiO.getEl)
		{
			var el = guiO.getEl();
			if (el.innerHTML && el.innerHTML.toLowerCase().indexOf("<span") == 0)
				el.innerHTML = "<span class = 'smc-tb-title'>"+newText+"</span>";
			else
				el.innerHTML = newText;
			guiO.show();
		}
	},



	updateUI : function(currentStatesArr) {
		var DOM = new Dom();
		var disabledWhenList = DOM.getNodeList(this.uiNode, ".//*[@disabledWhen]");
		for (var i = 0, len = disabledWhenList.length; i < len; i++)
		{
			var guiElem = disabledWhenList[i];
			var statesStr = guiElem.getAttribute("disabledWhen").trim();
			if (statesStr.length == 0)
				continue;
			
			var statesArr;
			
			if (statesStr.indexOf(" ") > -1)
				statesArr = statesStr.split(" ");
			else
				statesArr = [statesStr];
			
			var found = false;
			
			for (var k = 0, len2 = currentStatesArr.length; k < len2; k++)
			{
				var currentState = currentStatesArr[k];
				for (var m = 0, len3 = statesArr.length; m < len3; m++)
				{
					if (statesArr[m] == currentState)
					{
						found = true;
						break;
					}
				}
				if (found)
					break;
			}
		
			var id = guiElem.getAttribute("id");
			if (!id)
				throw new Error("[setUIState] Cannot set disabled state because gui object " + guiElem.nodeName + " has no id!");
			
			var obj = this.getGuiObject(id);
			if (!obj)
				continue; //throw new Error("[setUIState] Could not retrieve gui object with id: " + id);
			
			if (found)
				obj.disable();
			else
				obj.enable();
		}
	},
	getDatasource : function() {
		return this.datasourceObj;
	},
	processToolbar : function(tbCurrElem, tbObj, tabLabelID, stateName, resolveDatasources) {
		
		var stateElem;
		
		if (stateName)
			stateElem = Smc.DOM.getSingleNode(tbCurrElem, "State[@name = '" + stateName + "']");
		else
			stateElem = Smc.DOM.getSingleNode(tbCurrElem, "State[@default = 'true' or count(../State) = 1]");
		
		if (resolveDatasources === true) {
			stateElem = this.resolveDatasources(stateElem);
		}

		var childList = Smc.DOM.getChildElements(stateElem, "*");

		var currentState;
		for (var j = 0, len = childList.length; j < len; j++) {
			var currElem = childList.item(j);

			var guiNodeID = currElem.getAttribute("id");

			var myobj = this.processGUINode(currElem, tbObj);

			if (myobj == null)
				continue;

			if (guiNodeID)
				this.guiObjects[guiNodeID] = myobj;

			tbObj.add(myobj);

			if (!currentState)
				currentState = tbObj.currentState = currElem.parentNode;
		}
	},

	getState : function (guiObjectID) {
		
		if (!guiObjectID)
		{
			alert("Error: tabID is undefined!");
			return;
		}

		var panelElem = this.getGuiNode(guiObjectID);
		var panelObj = this.getGuiObject(guiObjectID);
		
		var tbCurrElem = Smc.DOM.getSingleNode(panelElem, "Toolbar");
		
		try
		{
			var tbObj = panelObj.getTopToolbar();
			if (tbObj && tbObj.currentState) {
				var stateElem = tbObj.currentState;
				var state = Smc.DOM.getAttribute(stateElem, "name");
				return state;
			}	
		}
		catch (e) {
			alert(e.message);
		}				
		
		return null;
	},

	setState : function(stateName, guiObjectID) {
		if (!guiObjectID)
		{
			alert("Error: tabID is undefined!");
			return;
		}

		var panelElem = this.getGuiNode(guiObjectID);
		var panelObj = this.getGuiObject(guiObjectID);
		
		var tbCurrElem = Smc.DOM.getSingleNode(panelElem, "Toolbar");
		
		try
		{
			var tbObj = panelObj.getTopToolbar();
			if (tbObj && tbObj.currentState) {
				var stateObjects = Smc.DOM.getNodeList(tbObj.currentState, ".//*[@id]");
				for (var i = 0, len = stateObjects.length; i < len; i++)
					delete this.guiObjects[stateObjects[i].getAttribute("id")];
			}
			var tbItems = tbObj.items;
			while (tbItems.getCount() > 0)
			{
				var tbItem = tbItems.first();
				tbObj.remove(tbItem, true);
			}
			
			this.processToolbar(tbCurrElem, tbObj, guiObjectID, stateName, true);
			tbObj.doLayout(false, true);
		}
		catch (e) {
			alert(e.message);
		}
	},
	setFullHeight : function(objectID) {
		var guiO = this.getGuiObject(objectID);
		if (guiO != null && guiO.ownerCt)
		{
			var ctInnerHeight = guiO.ownerCt.getInnerHeight();
			var currentSize = guiO.getSize();
			guiO.setHeight(ctInnerHeight);
		}
	},
	renderChildren : function(guiElem, guiObject, contextObj) {
		var DOM = new Dom();
		if (guiElem.getAttribute("lazyChildRendering") != null)
		{
			guiElem.removeAttribute("lazyChildRendering");
			guiElem = this.resolveDatasources(guiElem);
			
			var nodeList = DOM.getNodeList(guiElem, "*");
				
			for (var i = 0, len = nodeList.length; i < len; i++)
			{	
				var guiNode = nodeList.item(i);
				if (guiNode.nodeName == "Toolbar")
					continue;
				
				var guiNodeID = guiNode.getAttribute("id");
							 			
				var dataLink = guiNode.getAttribute("dataLink");			
				if (dataLink != null)
					contextObj.dataLink = dataLink; 
				
				var myobj = this.processGUINode(guiNode, guiObject, contextObj);
				if (myobj != null)
				{
					guiObject.add (myobj);
					if (guiNodeID != null && guiNodeID.length > 0)
						this.guiObjects[guiNodeID] = myobj;
					
					var monitorResizeAttr = guiNode.getAttribute("monitorResize");
					var monitorResize = monitorResizeAttr != null ? monitorResizeAttr.toLowerCase() == "true" : false;
					
					if (monitorResize)
					{
						guiObject.addListener("resize", this.onResizeHandlerInternal, myobj);
					}
					
				}
			}
			guiObject.doLayout();
		}
	},
	reloadHTMLContent : function(objectID, restoreRefreshOnReuseAttribute, executeRefreshHandler) {
		var guiObj = this.getGuiObject(objectID);
		
		if (guiObj == null)
			return;
		
		var objectsUINode = this.getGuiNode(objectID);
		if (objectsUINode == null)
			throw new Error("Could not find gui description of gui object: " + objectID);
		
		if (restoreRefreshOnReuseAttribute === true)
			objectsUINode.setAttribute("refreshOnReuse", "true");
		
		var contentHandler = this.getEventHandlerRef(objectsUINode, "contentHandler");
		
		var chResult = contentHandler.call(this.eventScope);
						
		this.removeXMLSpyEditor(guiObj.body.dom);
		
		if (Ext.isIE)
		{
			guiObj.body.dom.innerHTML = "";
		}
		else
			$("*", guiObj.body.dom).remove();
		
		guiObj.body.dom.innerHTML = chResult;
		
		if (executeRefreshHandler) {
			var refreshHandler = this.getEventHandlerRef(objectsUINode, "refreshHandler");
			if (typeof refreshHandler == "function")
				refreshHandler.call(this.eventScope);
		}
	},
	/**
	 * If the reset method has been called, the GUI can be woken up with this method.
	 */
	wakeup : function() {
		for (var i = 0; i < this.dataLinkSubscriptions.length; i++)
		{
			var subItem = this.dataLinkSubscriptions[i];
			this.dataLinkHandler.subscribe(subItem.dataLink, subItem.handler, subItem.id, true, this.eventScope);
		}
	},
	reuse : function(newEventscope, themeDoc) {
		try
		{
			this.datasourceObj.pluginObj = newEventscope;
			if (themeDoc)
				this.datasourceObj.setThemeDoc(themeDoc);
			
			this.eventScope = newEventscope;
			
			this.wakeup();

			var cHList = Smc.DOM.getNodeList(this.uiNode, ".//*[@refreshOnReuse]");
			for (var i = 0, len = cHList.length; i < len; i++)
			{
				var guiElem = cHList[i];
				var id = guiElem.getAttribute("id");
				var nn = guiElem.nodeName;
				
				if (!id)
				{
					alert("Can't update gui object: " + nn + " because it has no ID");
					continue;
				}
				
				var guiObj = this.getGuiObject(id);
				
				if (!guiObj)
					continue;
				
				var refresh = guiElem.getAttribute("refreshOnReuse");
				var ch = this.getEventHandlerRef(guiElem, "contentHandler");
				
			    var isTab = guiElem.parentNode.nodeName == "TabPanel";
			    
				if (refresh == "true" && ch)
				{
					if (nn == "PluginCont" || nn == "Panel" || nn == "Group")
					{
						var titleContentHandlerRef = this.getEventHandlerRef(guiElem, "titleContentHandler");
						if (titleContentHandlerRef)
						{
							var htmlCode = titleContentHandlerRef.call(this.eventScope);
							guiObj.setTitle(htmlCode);
						}
						
						var isActive = isTab ? guiObj.ownerCt.getLayout().activeItem == guiObj
								: typeof guiObj.isVisible != "function" || guiObj.isVisible();
						
						var activationEventName = isTab ? "activate" : "show";
						
						if (isActive)
							this.reloadHTMLContent(id, false, true);
						else
						{
							var sleeperConfig = {
								eventName: activationEventName,
								guiElement: guiElem,
								guiObject: guiObj,
								fn: this.reloadHTMLContent.createDelegate(this, [id, true, true])
							};
							
							this.refreshSleeperStore[id] = sleeperConfig;
							
							guiElem.removeAttribute("refreshOnReuse");
							
							guiObj.on(sleeperConfig.eventName, sleeperConfig.fn, this, {
								single:true
							});
						}
					}
					else if (nn == "Toolbar.TextItem")
					{
						var text = ch.call(newEventscope);
						var cls = guiElem.getAttribute("cls");
						if (cls)
							text = "<span class='" + cls + "'>" + text + "</span>";
						guiObj.setText(text);
						/*var j = $("span", guiObj.getEl());
						if (j.length > 0)
							j.get(0).innerHTML = chResult;*/
					}
				}
				else if (refresh == "true")
				{					
					var isActive;
					if (isTab)
						isActive = guiObj.ownerCt.getLayout().activeItem == guiObj;
					else
						isActive = typeof guiObj.isVisible != "function" || guiObj.isVisible();
					
					var activationEventName;
					if (isTab) 
						activationEventName = "activate";
					else
						activationEventName = "show";
					
					if (isActive)
					{								
						this.refreshGuiObject(id, false);
					}
					else
					{
						var sleeperConfig = {
							eventName: activationEventName,
							guiElement: guiElem,
							guiObject: guiObj,
							fn: this.refreshGuiObject.createDelegate(this, [id, false, true, true])
						};
						
						this.refreshSleeperStore[id] = sleeperConfig;
						
						guiElem.removeAttribute("refreshOnReuse");
						
						guiObj.on(sleeperConfig.eventName, sleeperConfig.fn, this, {
							single:true
						});
					}
				}
			}
			
			var rootObj = this.rootObject;
			var lay = this.HTMLContainer.getLayout();
			
			if (lay.activeItem != rootObj)
				lay.setActiveItem(rootObj.getItemId());
		}
		catch(e)
		{
			alert("Exception while reusing! Reason: " + e.message);
		}
	},
	render : function (htmlContainer, doLayoutCt) {

    	this.HTMLContainer = htmlContainer;
        
        var resolvedUINode = this.resolveDatasources(this.uiNode);
        
        var nl = Smc.DOM.getNodeList(resolvedUINode, "//*[name()='OptionGroup' or name()='Checkbox' or name()='RichText' or name() = 'Flash' or name() = 'SButton' or name() = 'Combo' or name()='TextField' or name()='Remark' or name()='FieldVector']");
       
        for (var i = 0; i < nl.length; i++)
       	{
       		var guiItem = nl[i];
       		var id = Smc.DOM.getAttribute(guiItem, "id");
       		var hidden = Smc.DOM.getAttribute(guiItem, "hidden");
       		if (hidden == "true")
       		{
       			this.hiddenObjects[id] = true;
       		} 
       		else
       		{
       			this.hiddenObjects[id] = false;
       		}
       	}

		this.rootObject = this.processGUINode(resolvedUINode, null, null);

		if (htmlContainer && htmlContainer.add && htmlContainer.getXType)
		{
			htmlContainer.add(this.rootObject);
			if (htmlContainer.getLayout().setActiveItem)
				htmlContainer.getLayout().setActiveItem(htmlContainer.items.length - 1);

			if (htmlContainer.getXType() == "window")
			{
				var cH = htmlContainer.getInnerHeight();
				this.rootObject.setHeight(cH);
			}
			if (doLayoutCt)
				htmlContainer.doLayout();
		}
		else if (htmlContainer)
		{
			var htmlID = htmlContainer.id;
			this.rootObject.render(htmlID);
		}
		
		return this.rootObject;
	},
	onResizeHandler : function(popup) {
		var height = popup.getInnerHeight() - 10; // 10 for body padding in main frame 
		var width = popup.getInnerWidth() - 10; // 10 for body padding in main frame
		this.setSize(width, height);
	},
	onResizeHandlerInternal : function(popup) {
		var height = popup.getInnerHeight(); 
		var width = popup.getInnerWidth();
		this.setSize(width, height);
	},
	reset : function() {
		for (var i = 0; i < this.dataLinkSubscriptions.length; i++)
		{
			var subItem = this.dataLinkSubscriptions[i];
			this.dataLinkHandler.unsubscribe(subItem.dataLink, subItem.handler, subItem.id);
		}
	},
	destroy : function() {
		this.reset();
		
		var ct = this.HTMLContainer;
		if (ct && ct.remove)
			ct.remove(this.rootObject, false);
		
		this.datasourceObj.destroy();
		
		delete this.guiObjects;

		var rootObject = this.rootObject;
		delete this.rootObject;
		this.destroyGuiObject(rootObject);

		for (var key in this)
			delete this[key];
	},
	destroyGuiObject : function(guiObject) {
		if (typeof guiObject == "string")
			guiObject = this.getGuiObject(guiObject);
		
		// XML Spy Editor <object>-Tag has to be removed first, because if not IE crashes
		if (guiObject && guiObject.body && guiObject.body.dom)
			this.removeXMLSpyEditor(guiObject.body.dom);
		
		// remove resize listener added to owner when rootObject was rendered
		/*if (guiObject == this.rootObject && this.rootObject.ownerCt)
			this.rootObject.ownerCt.removeListener('resize', this.onResizeHandler, this.rootObject);*/
		
		try
		{
			guiObject.destroy();
		}
		catch (e)
		{
			alert('Destroy error: ' + e.message);
		}
	},
	removeXMLSpyEditor : function(htmlElement) {
		$("object", htmlElement).remove();
	},
	destroyChildGuiObjects : function(guiObj) {
		
		if (guiObj.items)
		{
			while(guiObj.getComponent(0))
			{
				var childGuiObject = guiObj.getComponent(0);
				guiObj.remove(childGuiObject, false);
				this.destroyGuiObject(childGuiObject);
			}
			this.removeXMLSpyEditor(guiObj.body.dom);
			
			if (Ext.isIE)
				guiObj.body.dom.innerHTML = "";
			else
				$("*", guiObj.body.dom).remove();
		}
		else if (guiObj.body)
		{
			this.removeXMLSpyEditor(guiObj.body.dom);
			
			if (Ext.isIE)
				guiObj.body.dom.innerHTML = "";
			else
				$("*", guiObj.body.dom).remove();
		}
		else if (guiObj.innerHTML)
		{
			this.removeXMLSpyEditor(guiObj);
			if (Ext.isIE)
				guiObj.innerHTML = "";
			else
				$("*", guiObj).remove();
		}
	},
	getTitle : function (uiNode) {
		var DOM = new Dom();
		var labelID = uiNode.getAttribute("LabelID");
		if (labelID != null) return this.t.t(labelID);
		return null;
	},
	applyTitle : function(uiNode, configObject)	{
		var objTitle = this.getTitle(uiNode);
		configObject.title = objTitle;
	},
	applyPropertiesFromUINode : function(uiNode, configObject, mappingObj) {
		for (var configOptionName in mappingObj)
		{
			var attributeName = mappingObj[configOptionName];
			if (attributeName == null || attributeName.length == 0)
				continue;
			
			var attrValue = uiNode.getAttribute(attributeName);
			
			if (attrValue != null && attrValue.length > 0 && attrValue != undefined)
			{
				// TODO a test with FF 3.6 doesn't behave like that, please check
				/*//it seems that an empty space is a number for FF
				if (!isNaN(attrValue.trim()) && attrValue.trim() != "" ) {
					attrValue = parseInt(attrValue);
				}*/
				if (!isNaN(attrValue))
					attrValue = parseInt(attrValue);
				else if (attrValue.toLowerCase() == "true")
					attrValue = true;
				else if (attrValue.toLowerCase() == "false")
					attrValue = false;
				// TODO this is a hack. Why weren't invalid attribute values preprocessed elsewhere?
				/*else if (attrValue.toLowerCase() == "undefined")
					attrValue = "";
				else if (attrValue.toLowerCase() == "nan")
					attrValue = "";
				
				if (attrValue != undefined && attrValue != "NaN" && attrValue != NaN)
				{*/
					configObject[configOptionName] = attrValue;
				//}
			}
		}
	},
	
	processRichAreaNode: function(currElem) {
		var isHidden = Smc.DOM.getAttribute (currElem, "hidden");
		
		var configObject = {
			enableAlignments : true,
		 	enableColors : true,
		 	enableFont : true,
		 	enableFontSize : true,
		 	enableFormat : true,
		 	enableLinks : true,
		 	enableLists : true,
		 	enableSourceEdit : false,
		 	labelSeparator: ''
		};

		this.applyPropertiesFromUINode(currElem, configObject, {
			region : "region",
			hidden : "hidden",
			fieldLabel:"LabelID",
			height : 'height',
			width: 'width',
			disabled: 'disabled',
			itemId: 'id',
			contentEl : 'contentEl',
			value : 'value', 
			labelStyle : 'labelStyle', 
			fieldClass : 'fieldClass'        
		});

		this.addHandler(obj, currElem, "expandHandler", "expand");
		
		if(isHidden=="true")
			configObject.hideLabel = true;
		else
			configObject.hideLabel = false;
		
		var obj = new Ext.form.HtmlEditor(configObject);

		this.addTooltipHelp(currElem, obj);

		this.guiObjects[obj.getId()] = obj;
		
		return obj;
	},
	/*Single Button*/
	processSButtonNode : function(currElem) {

		var configObject = {iconCls:'smc-next-btn',scale:'large'};
		
		//var flashLabel = Smc.DOM.getAttribute (currElem, "value");

		// TODO isn't that a bit too hardcoded?
		var flashLabel = "S2";	

		this.applyPropertiesFromUINode(currElem, configObject, {
			region : "region",
			hidden : "hidden",
			//fieldLabel:"LabelID",
			//height : 'height',
			autoShow: 'autoShow',
			scale: 'scale',
			disabled: 'disabled',
			contentEl : 'contentEl',
			text : 'LabelID', 
			iconCls:'iconCls',
			labelStyle : 'labelStyle', 
			fieldClass : 'fieldClass'        
		});
		
		
		var fn = Util.createDelegate(function() {
			
			var eventHandler = this.getEventHandlerRef(currElem);
			
			if (eventHandler)
				eventHandler.apply(this.eventScope, arguments);
			
		}, this, [], true);
		
		configObject.handler = fn;
		return new Ext.Button(configObject);	
	},
	processFlashNode: function(currElem) {
		
		// TODO: there is still a TODO
		// TODO: implement either flashParams or flashVars to send parameter to flash movie
		
		var configObject = {};
	
		var flashLabel = Smc.DOM.getAttribute (currElem, "value");
		var fieldID = Smc.DOM.getAttribute (currElem, "id");
		var instanceID = Smc.DOM.getAttribute (currElem, "instanceID");
		var isHidden = Smc.DOM.getAttribute (currElem, "hidden");
		
		if(!flashLabel){
			flashLabel = "Start";		
		}else{
			if(flashLabel == "undefined")
				flashLabel = "Start";
		}
	
		this.applyPropertiesFromUINode(currElem, configObject, {
			hidden : "hidden",
			fieldLabel:"LabelID",
			disabled: 'disabled',
			border:'false', 
			labelStyle : 'labelStyle',
			fieldClass : 'fieldClass'
		});
	
		var params = null;
		params = Smc.DOM.getSingleNode(currElem,"FlashParameters");
		var path = null;	
		if (params){
			this.applyPropertiesFromUINode(params, configObject, {
				
				height : 'height',
				width: 'width'
					           
			});
			path = this.context.getParameter("SLIDE_SERVER")+"/"+Smc.DOM.getAttribute(params,"path");
		}
		
		var id = Ext.id();
		
		// TODO use array and then do a join. String concats are very slow in IE
		var html = "<object classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000' codebase='http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0' width='"+configObject.width+"' height='"+configObject.height+"' id='" + id + "' align='middle'>";
		html +="<param name='allowScriptAccess' value='sameDomain' />";
		html +="<param name='allowFullScreen' value='false' />";
		html +="<param name='FlashVars' value='flabel="+flashLabel+"&fieldID="+fieldID+"&instanceID="+instanceID+"'/>";			
		html +="<param name='movie' value='"+ path + "' /><param name='quality' value='high' /><param name='bgcolor' value='#ffffff' />";	
		html +="<embed src='"+path+"' quality='high' bgcolor='#ffffff' width='"+ configObject.width +"' height='"+configObject.height+"' name='"+id+"' align='middle' allowScriptAccess='sameDomain' allowFullScreen='false' type='application/x-shockwave-flash' pluginspage='http://www.adobe.com/go/getflashplayer' FlashVars='flabel="+flashLabel+"&fieldID="+fieldID+"&instanceID="+instanceID+"' />";
		html +="</object>";		
		
		configObject.html  = html;
		configObject.swfid = id;

		if(isHidden=="true")
			configObject.hideLabel = true;
		
		var obj = new Ext.Panel(configObject);

		this.addTooltipHelp(currElem, obj);
		
		return  obj;

	},

	// TODO is a hack. The active plugin should not be referenced like this.
	receiveValueFromFlash  : function (val, fieldID, instanceID)
	{
		var obj = Smc.System.contentExplorer.activePlugin.GUI.guiObjects[fieldID + "_VAL"];	
		if(!obj)
			obj = Smc.System.contentExplorer.activePlugin.contentExplorer.activePlugin.GUI.guiObjects[fieldID+ "_VAL"];
		
		if(!obj)
			obj = Smc.System.contentExplorer.activePlugin.contentExplorer.activePlugin.contentExplorer.activePlugin.GUI.guiObjects[fieldID+ "_VAL"];
		obj.setValue(val);
	},
	
	// TODO is a hack. The active plugin should not be referenced like this.
	receiveValueFromJS  : function (fieldID, instanceID)
	{
		var obj = Smc.System.contentExplorer.activePlugin.GUI.guiObjects[fieldID + "_VAL"];
		
		if(!obj)
			obj = Smc.System.contentExplorer.activePlugin.contentExplorer.activePlugin.GUI.guiObjects[fieldID + "_VAL"];
		
		if(!obj)
			obj = Smc.System.contentExplorer.activePlugin.contentExplorer.activePlugin.contentExplorer.activePlugin.GUI.guiObjects[fieldID + "_VAL"];


		var result = obj.getValue();
		return result.replace(/\./g," ");
	},
	
	/* process the multiple uploader ext
	 * 
	 * @param currentEm : xml configuration node
	 * 
	 * @return obj : ext fieldest container for the upladers
	 */
	processMultipleUploadNode : function(parent,currentEm){
		
		var guiNodeID = Smc.DOM.getAttribute(currentEm, "id");
		var labelID = Smc.DOM.getAttribute(currentEm, "LabelID");
		var widthConf = Smc.DOM.getAttribute(currentEm, "width");
		
		if(!widthConf)
			widthConf = 500;
			
		var obj = new Ext.ux.UploadPanel({
			fieldLabel : labelID,
			labelSeparator: '',
			xtype : 'uploadpanel',
			buttonsAt : 'tbar',
			width : parseInt(widthConf),
			// TODO translate IDs should be more generic: "smc.upload.panel" instead of "smc.risk"
			addText : this.t.t("smc.risk.upload.addText"),
			uploadText : this.t.t("smc.risk.upload.uploadText"),
			removeText : this.t.t("smc.risk.upload.removeText"),
			removeAllText : this.t.t("smc.risk.upload.removeAllText"),
			stopAllText : this.t.t("smc.risk.upload.stopAllText"),
			clickRemoveText : this.t.t("smc.risk.upload.clickRemoveText"),
			clickStopText : this.t.t("smc.risk.upload.clickStopText"),	
			url : this.context.getParameter("SLIDE_SERVER") + '/multipleupload',
			path : 'root',
			enableProgress : false 
		});
		

		if (this.multipleUploadStore == null)
		{
			this.multipleUploadStore = new Object();
		}
		
		//store the upladers 
		this.multipleUploadStore[guiNodeID] = obj;
		
		return obj;
	},
	
	/* processRemarkNode
	 * Handles the remark field type
	 */
	processRemarkNode : function(currElem) {
		var DOM = Smc.DOM;
		var data = "";
			
		var dtField = Smc.DOM.getSingleNode(currElem, "remarkField");
		
		if (dtField != null)
		{
			var icon = DOM.getAttribute(dtField, "icon");
			var sClass = DOM.getAttribute(dtField, "class");
			
			// TODO use array and then join
			if(icon)
				data = "<table><tr><td><div style='float:left;padding-right:10px' ><img border='0' src='client/images/ec/icons/"+icon+".png'> </div></td>";
			
			if(sClass)
				data = data + "<td><div class='x-form-item " + sClass + "'>" +Smc.DOM.getText(dtField)+"</div></td>";
			else
				data = data + "<td><div class='x-form-item'>" +Smc.DOM.getText(dtField)+"</div></td>";

			// -br- replacement text for return markup <br/>, if found replace all		
			if(data.indexOf("-br-")!=-1)
				data = data.replace(/-br-/g,"<br/>");
				
			data+="</tr></table>";
		}
		
		var configObject = {
			border : false
			,html:data
		};

		this.applyPropertiesFromUINode(currElem, configObject, {
			layout : "layout",
			flex : "flex",
			bodyStyle : "bodyCSS",
			region : "region",
			hidden : "hidden",
			height : 'height',
			width: 'width',
			border : 'border',
			contentEl : 'contentEl',
			split : 'split',
			autoScroll : 'autoScroll',
			margins: 'margins',
	       	autoShow: 'autoShow',
			collapsible : "collapsible",
			collapsed : "collapsed",
			disabled: 'disabled',
			cls: 'cls',
			activeItem: 'activeItem',
			header: 'header',
			iconCls: "iconCls",
			labelAlign: 'labelAlign',
			anchor: 'anchor',
            columnWidth: 'columnWidth',
            closable: 'closable',
            disabledClass : 'disabledClass',
            style: 'style',            
            labelWidth: 'labelWidth'
		});
		
		configObject.layoutConfig = {};
		configObject.tplWriteMode = "override";
	
		return new Ext.Panel(configObject);		
	},
	/* processLinkNode
	 * Handles the Link field type
	 */
	processLinkNode : function(currElem) {

		var DOM = Smc.DOM;

		var LabelID = DOM.getAttribute(currElem, "LabelID");
		
		var href 		= "";
		var varSp 		= "&";
		var uri 		= "uri=";
		var language 	= "language=" + this.context.getSystemDefaultLanguage();;
		var objType 	= "objType=doc";
		var serverID 	= "serverID=" + this.context.getCurrentDataServerID();
		var plugin		= "plugin=doc";
		var trafo		= "trafo=HTML";
		var title		= "";

		href += this.context.getParameter("SLIDE_SERVER");
		href += "/plugin-transformer?";


		var helpID = Smc.DOM.getAttribute(currElem, "helpID");

		if (helpID.length > 0)
		{
			href+= "Q_HelpID=" + encodeURIComponent(helpID)
				+ varSp
				+ language
				+ varSp
				+ objType
				+ varSp
				+ serverID
				+ varSp
				+ plugin
				+ varSp	
				+ trafo;
		}
		else
		{
			var dtField = Smc.DOM.getSingleNode(currElem, "link.xref/link.xref.controller/RefControl/Properties/Property[@name='uri']");
			var paramUri = "";
			
			if (dtField != null)
			{
				uri += DOM.getAttribute(dtField, "value");
				paramUri = DOM.getAttribute(dtField, "value");
			}
					
			var dtitleField = Smc.DOM.getSingleNode(currElem,"link.xref/link.xref.controller/RefControl/Properties/Property[@name='title']");
			if (dtitleField != null)
			{
				title = DOM.getAttribute(dtitleField, "value");
			}
			
			href+= uri
				+ varSp
				+ language
				+ varSp
				+ objType
				+ varSp
				+ serverID
				+ varSp
				+ plugin;
		}
		
		var data = "<a href='#' class='smc-linkPopup' onclick='javascript:window.open(\"" + href + "\",\""+LabelID+"\",\"toolbar=no,menubar=no,location=no,scrollbars=no,resizable=yes,width=550,height=250\");'>" + LabelID + "</a>";		
		
		var configObject = {
			border : false
			,html:data			
		};

		this.applyPropertiesFromUINode(currElem, configObject, {
			layout : "layout",
			flex : "flex",
			bodyStyle : "bodyCSS",
			region : "region",
			hidden : "hidden",
			height : 'height',
			width: 'width',
			border : 'border',
			contentEl : 'contentEl',
			split : 'split',
			autoScroll : 'autoScroll',
			margins: 'margins',
	       	autoShow: 'autoShow',
			collapsible : "collapsible",
			collapsed : "collapsed",
			disabled: 'disabled',
			cls: 'cls',
			activeItem: 'activeItem',
			header: 'header',
			iconCls: "iconCls",
			labelAlign: 'labelAlign',
			anchor: 'anchor',
            columnWidth: 'columnWidth',
            closable: 'closable',
            disabledClass : 'disabledClass',
            style: 'style',            
            labelWidth: 'labelWidth'
		});
		
		configObject.layoutConfig = {};

		return new Ext.Panel(configObject);		
	},	
	processPanelNode : function(currElem, panelType) {
		var DOM = Smc.DOM;

		var configObject = {};

		var guiNodeID = currElem.getAttribute("id");
		
		this.visibleTabs[guiNodeID] = true;
		
		var propertiesFromUINode = {
			objectID: "id",
			bodyStyle: "bodyCSS",
			region: "region",
			hidden: "hidden",
			layout: 'layout',
			height: 'height',
			width: 'width',
			border: 'border',
			contentEl: 'contentEl',
			split: 'split',
			scrollable: 'scrollable',
			margins: 'margins',
			autoShow: 'autoShow',
			autoWidth: 'autoWidth',
			collapsible: "collapsible",
			collapsed: "collapsed",
			disabled: 'disabled',
			cls: 'cls',
			activeItem: 'activeItem',
			activeTab: 'activeTab',
			header: 'header',
			iconCls: "iconCls",
			labelAlign: 'labelAlign',
			anchor: 'anchor',
			columnWidth: 'columnWidth',
			closable: 'closable',
			disabledClass: 'disabledClass',
			style: 'style',
			labelWidth: 'labelWidth',
			forceLayout: 'forceLayout',
			autoHeight: 'autoHeight',
			labelSeparator: 'labelSeparator',
			autoShowTab: 'autoShowTab',
			tabPosition: 'tabPosition',
			flex: 'flex',
			maxTabWidth: 'maxTabWidth',
			minWidth: 'minWidth',
			minTabWidth: 'minTabWidth',
			tabWidth: 'tabWidth',
			animCollapse: 'animCollapse'
		}

		this.applyPropertiesFromUINode(currElem, configObject, propertiesFromUINode);
		
		this.processResponsiveConfig(currElem, configObject, propertiesFromUINode);
		
		var splitterWidth = currElem.getAttribute("splitterWidth");
		if (splitterWidth) {
			configObject.listeners = {
				add: function (me, item) {
					if (item.xtype == 'bordersplitter') {
						item.width = parseInt(splitterWidth);
					}
				}
			};
		}
		
		var tabBar = currElem.getAttribute("tabBar");
		if (tabBar) {
			tabBar = tabBar.replace(/'/g, '"');
			try {
				configObject.tabBar = JSON.parse(tabBar);
			} catch (e) {
				console.log(e);
			}
		}

		configObject.layoutConfig = {};
	
		this.applyPropertiesFromUINode(currElem, configObject.layoutConfig, {
			activeOnTop: 'activeOnTop', // for accordian layout
			columns: 'columns', // for table layout
			renderHidden: 'renderHidden', // general layout config
			autoWidth: 'autoWidth'
		});

		var headerHtml = currElem.getAttribute("headerHtml");
		var headerHeight = currElem.getAttribute("headerHeight");
		if (headerHtml) {
			configObject.header = {
				title: {
					text: headerHtml
				},
				height : headerHeight ? parseInt(headerHeight) : ''
			};
		}


		var toolIcons = Smc.DOM.getChildElement(currElem, "ToolIcons");
		if (toolIcons != null) {
			if (!configObject.tools) {
                configObject.tools = [];
            }
            var comboField = Smc.DOM.getChildElement(toolIcons, "Combo");
			if (comboField) {
                configObject.tools.push(this.processGUINode(comboField, toolIcons, this));
            }

			var toolIconList = Smc.DOM.getChildElements(toolIcons, "ToolIcon");
			for (var i = 0, len = toolIconList.length; i < len; i++) {
				var toolIconElem = toolIconList[i];
				var toolCfgObj = {};
				this.applyPropertiesFromUINode(toolIconElem, toolCfgObj, {
					itemId : "type",
					type : "type",
					iconCls : "iconCls"
				});
				if (toolIconElem.getAttribute("tooltip")) {
                    toolCfgObj.tooltip = this.t.t(toolIconElem.getAttribute("tooltip"));
                }

                var eventHandler = this.getEventHandlerRef(toolIconElem);
				if (eventHandler) {
                    toolCfgObj.handler = this.createHandler(toolIconElem, "eventHandler", this);
				} else {
					var url = toolIconElem.getAttribute("url");
					if (url) {
                        toolCfgObj.hander = Util.createDelegate(this.onToolIconOpenLink, this, [url]);
                    }
				}

				configObject.tools.push(toolCfgObj);
			}
        }

		// hack for IE because when panels with border layouts are hidden, they get messed up sometimes
		if ((configObject.layout == "card" || configObject.layout == "border" || panelType == Ext.TabPanel)
				&& (Ext.isIE6 || Ext.isIE7))
		{
			configObject.defaults = {};
			
			if (currElem.getAttribute("hideMode"))
				configObject.defaults.hideMode = currElem.getAttribute("hideMode");
			else
				configObject.defaults.hideMode = "offsets";
		}

		if (configObject.layout == "vbox")
		{	
			configObject.layoutConfig.align = "strech";
			configObject.layoutConfig.pack = "start";
		}
		else if (configObject.layout == "hbox")
		{
			configObject.layoutConfig.align = "top";
			configObject.layoutConfig.pack = "start";
		}

		this.processContentHandler(configObject, currElem);
		
		this.applyTitle(currElem, configObject);
		
		this.processTitleHandler(configObject, currElem);
		
		if (panelType == Ext.form.FormPanel)
		{
			configObject.onSubmit = Ext.emptyFn;
			configObject.submit = function() {
	            this.getForm().getEl().dom.submit();
	        };
	        configObject.items = [{
	        	xtype : 'label',
	        	text : ''
	        }];
			configObject.xtype = 'form';
		}
		else if (panelType == Ext.TabPanel)
		{
			configObject.activeTab = configObject.activeItem = 0;
			
			// TODO this has possibly a lot of impact and should therefore depend on a global 
			// configuration variable. Changed back to "false" for now.
            var deferredRender = currElem.getAttribute("deferredRender");
            deferredRender = deferredRender == "true" ? true : false;
			configObject.deferredRender = deferredRender;
		}

		//tabs addition to handle initial status
		var defaultState = Smc.DOM.getAttribute(currElem, "defaultState");
		if(defaultState == "Hide") {
			configObject.hidden = true;
		} else if(defaultState == "Inactive") {
			configObject.disabled = true;
		} else if(defaultState == "") {
			configObject.hidden = false;
		}
        if (currElem.getAttribute("id") == "smc-content-preview") {
            currElem;
        }

        if (currElem.getAttribute("responsive") == "true") {
            configObject.platformConfig = {
				'!desktop': {
					collapsed: true
				}
			}
        }

		var obj = new panelType(configObject);
		
		if (guiNodeID != null && guiNodeID.length > 0)
			this.guiObjects[guiNodeID] = obj;
		
		this.processEventSubscriptions(currElem, obj);
		
		this.guiObjects[obj.getId()] = obj;
		
		this.addActivateHandler(obj, currElem);
		this.addRenderHandler(obj, currElem);
		
		this.addHandler(obj, currElem, "expandHandler", "expand");
		this.addHandler(obj, currElem, "afterRenderEventHandler", "afterrender");
		this.addHandler(obj, currElem, "activateEventHandler", "activate");

		this.addShowHandler(obj, currElem);

		if (configObject.deferredRender == true) {
			obj.on("render",function(o) {
				//force to recalculate layout because of deferrender
				o.doLayout(true, true);
			}, this);
		}

		if(Smc.DOM.getAttribute(currElem, "noRelayout") == "true")
			obj.noRelayoutId = true;
		
		return obj;		
	},
	processResponsiveConfig : function(currElem, configObject, propertiesFromUINode) {
		var responsiveConfig = Smc.DOM.getSingleNode(currElem, "ResponsiveConfigs");
		if(responsiveConfig) {
			var responsiveConfigList = Smc.DOM.getNodeList(responsiveConfig, "ResponsiveConfig");
			configObject.plugins = "responsive";
			configObject.responsiveConfig = {};
			for (var i = 0; i < responsiveConfigList.length ; i++) {
				var condition = responsiveConfigList[i].getAttribute("condition");
				configObject.responsiveConfig[condition] = {};
				this.applyPropertiesFromUINode(responsiveConfigList[i].firstChild, configObject.responsiveConfig[condition], propertiesFromUINode);
			}
		}
			
	},
	processEventSubscriptions : function(currElem, obj) {
		
		try
		{
			var DOM = new Dom();
			var eventSubscriptionList = DOM.getNodeList(currElem, "EventSubscription");
			for (var i = 0; i < eventSubscriptionList.length; i++)
			{
				var eventSubElem = eventSubscriptionList.item(i);
				this.processEventSubscriptionNode(eventSubElem, obj);
			}
		}
		catch (e)
		{
			alert('Could not subscribe to events!');
		}
	},
	processEventSubscriptionNode : function(eventSubElem, obj) {
		var eventDataLink = eventSubElem.getAttribute("dataLink");
		var ins = this;
		
		this.subscribe(eventDataLink, function() {
			var eventHandler2 = ins.getEventHandlerRef(eventSubElem);
			eventHandler2.apply(ins.eventScope, arguments);
		}, obj.getId(), true, this.eventScope);
		// set obj to null in order to release it for gc
		obj = null;
	},
	processWindowNode : function(currElem) {
		var configObject = {
			closable: true,
			shim: true,
			floating: true,
			shadow: false
		};
		this.applyTitle(currElem, configObject);
		
		if (currElem.getAttribute("autoAdjustSize") == "true")
		{
			var uiPickerSize = {
	    		width: parseInt(currElem.getAttribute("width")),
	    		height: parseInt(currElem.getAttribute("height"))
	    	};
	    	
	    	if (!Smc.System.checkPopupDimensions(uiPickerSize))
	    	{
	    		currElem.setAttribute("width", uiPickerSize.width);
	    		currElem.setAttribute("height", uiPickerSize.height);
	    	}
		}
		
		this.applyPropertiesFromUINode(currElem, configObject, {
			height: 'height',
			width: 'width',
			resize: 'resize',
			y: 'top',
            x: 'left',
            modal : 'modal',
            iconCls : 'iconCls',
            closable: 'closable',
            autoDestroy: 'autoDestroy',
            closeAction: 'closeAction',
            autoScroll: 'autoScroll',
            layout: 'layout',
            buttonAlign: 'buttonAlign',
            footer: 'footer',
            minimizable: 'minimizable',
            maximizable: 'maximizable',
            shadow: 'shadow'
		});
		var obj = new Ext.Window(configObject);
		if (configObject.minimizable)
		{
			obj.on("minimize", function() {
				if (this.body.isDisplayed())
				{
					this.origHeight = this.getSize().height;
					this.body.setDisplayed(false);
					this.setHeight(40);
				}
				else
				{
					this.body.setDisplayed(true);
					var height = 600;
					if (this.origHeight)
						height = this.origHeight;
					this.setHeight(height);
				}
			});
		}
		var id = currElem.getAttribute("id");
		if(id)
			this.guiObjects[id] = obj;
		
		var beforehideEventHandler = this.getEventHandlerRef(currElem, "beforehideEventHandler");
		if (beforehideEventHandler != null)
			obj.addListener('beforehide', function() {
				var beforehideEventHandler2 = this.getEventHandlerRef(currElem, "beforehideEventHandler");
				beforehideEventHandler2.apply(this.eventScope, arguments);
			}, this);
			
		return obj;
	},
    processTreePanelNode : function(currElem) {
        var reqURL = this.context.getParameter("SLIDE_SERVER") + this.context.getParameter("XML_API_PATH");
        var checked = (currElem.getAttribute("checked") == "true");
        var preloadAll = (currElem.getAttribute("preloadAll") == "true");
        var rootNodeName = currElem.getAttribute("rootNodeName");
        if (rootNodeName == null || rootNodeName.length == 0)
            rootNodeName = "CMS";
        else
            rootNodeName = this.t.t(rootNodeName);

        var baseUri = currElem.getAttribute("baseuri");
        if (baseUri == null)
            baseUri = this.context.getRootPath();

        if (currElem.getAttribute("loaderUri")) {
        	reqURL = currElem.getAttribute("loaderUri");
		}

        var nodeParams = {};

        var nodeClickEventHandler = this.getEventHandlerRef(currElem, "nodeClickEventHandler");
        if (nodeClickEventHandler != null)
            nodeClickEventHandler = this.createHandler(currElem, "nodeClickEventHandler", this);

        var nodeDoubleClickEventHandler = this.getEventHandlerRef(currElem, "nodeClickEventHandler");
        if (nodeDoubleClickEventHandler != null)
            nodeDoubleClickEventHandler = this.createHandler(currElem, "nodeDoubleClickEventHandler", this);

        var beforeNodeClickEventHandler = this.getEventHandlerRef(currElem, "beforeNodeClickEventHandler");
        if (beforeNodeClickEventHandler != null)
            beforeNodeClickEventHandler = this.createHandler(currElem, "beforeNodeClickEventHandler", this);

		var keyupEventHandler = this.getEventHandlerRef(currElem, "keyupEventHandler");
        if (keyupEventHandler != null)
			keyupEventHandler = this.createHandler(currElem, "keyupEventHandler", this);

        nodeParams.showObjectCheckboxes = (currElem.getAttribute("showObjectCheckboxes") == "true");
        nodeParams.showFolderCheckboxes = (currElem.getAttribute("showFolderCheckboxes") == "true");
        nodeParams.singleClickExpand = (currElem.getAttribute("singleClickExpand") == "true");

        nodeParams.checked = checked;
        nodeParams.filter = currElem.getAttribute("filter");

		var expandBookNodes = (currElem.getAttribute("expandBookNodes") == "true");

		var treeType = currElem.getAttribute("treeLoader");
		var dataSource = currElem.getAttribute("datasource");
		var usingProxy = true;

		if (dataSource != null  && Smc.DOM.getChildElement(currElem, "Node") && treeType != "Smc.StructureTreeLoader") {
			var expanded = true;
			usingProxy = false;
		}

		var storeConfig = {
			url : reqURL,
        	context : this.context,
        	checked : checked,
			preloadAll : preloadAll,
			root : {
				expanded : expanded || expandBookNodes,
				uri : baseUri,
				objectTitle : 'Root',
				text : rootNodeName,
				filter : nodeParams.filter
			}
		};

		if (usingProxy) {
			storeConfig.proxy = Ext.create("Smc.BrokerTree.Proxy", {
									context : this.context,
									nodeParams : nodeParams,
									preloadAll : preloadAll,
									url : reqURL
								});
		}

        var configPlugin = {
            ptype : 'treeviewdragdrop',
            enableDrag : (currElem.getAttribute("enableDrag") == "true"),
            enableDrop : (currElem.getAttribute("enableDrag") == "true"),
            appendOnly : (currElem.getAttribute("ddAppendOnly") == "true")
        };

        if (currElem.getAttribute("ddGroup") != null) {
            configPlugin.ddGroup = currElem.getAttribute("ddGroup");
        }

        var configObject = {
            animate : true,
            autoScroll : true,
            containerScroll : true,
            viewConfig : {
                plugins : configPlugin
            },
            listeners : {
                'itemclick' : {
                    fn : nodeClickEventHandler || Ext.emptyFn,
					buffer : 300,
                    scope : this
                },
                'beforeitemclick' : {
                    fn : beforeNodeClickEventHandler || Ext.emptyFn,
                    scope : this
                },
                'itemdblclick' : {
                	fn : nodeDoubleClickEventHandler || Ext.emptyFn,
					scope : this
				},
				'itemkeyup' : {
					fn : keyupEventHandler || Ext.emptyFn,
					scope : this
				}
            }
        };

        this.applyPropertiesFromUINode(currElem, configObject, {
            "singleExpand": "singleExpand"
        });

        this.applyPropertiesFromUINode(currElem, storeConfig.root, {
            "iconCls": "rootNodeIconCls",
            "isTarget": "rootNodeIsTarget"
        });

        var loadHandler = this.getEventHandlerRef(currElem, "loadEventHandler");
        if (loadHandler) {
            storeConfig.listeners = {
                'load': {
                    fn: loadHandler,
                    scope: this.getScope(currElem)
                }
            };
        }

        var treeStore = Ext.create("Ext.data.TreeStore", storeConfig);

        configObject.store = treeStore;

        this.applyPropertiesFromUINode(currElem, configObject, {
            height : 'height',
            width : 'width',
            disabled : 'disabled',
            region : 'region',
            border : 'border',
            split : 'split',
            collapsible: 'collapsible',
            cls: 'cls',
            hidden: 'hidden',
            enableDD: 'enableDD',
            autoScroll: 'autoScroll',
            iconCls: "iconCls",
            bodyStyle: "bodyCSS",
			bodyBorder: "bodyBorder",
            style: "style",
            margins: "margins",
            anchor: 'anchor',
            columnWidth: 'columnWidth',
            useArrows: 'useArrows',
			rootVisible: 'rootVisible',
			ariaLabel: 'ariaLabel'
        });

        if (configObject.collapsible === true)
            configObject.header = true;

        this.applyTitle(currElem, configObject);

        this.processTitleHandler(configObject, currElem);

        var preloadRootStr = currElem.getAttribute("preloadRoot");
        var preloadRoot = preloadRootStr != null ? preloadRootStr.toLowerCase() == "true" : false;

        var obj = Ext.create('Ext.tree.Panel', configObject);

        this.processTreeNode(currElem, obj.getRootNode(), currElem);

        if (preloadRoot)
        {
            var preloadAllCallback = this.getEventHandlerRef(currElem, "preloadAllCallback");
            obj.on('render', function() {
                if (preloadAllCallback != null)
                {
                    this.getRootNode().expand(false, true, this.createHandler(currElem, "preloadAllCallback"), this);
                    preloadAllCallback = null;
                }
                else
                    this.getRootNode().expand(false, true);
            });
        }
        if (this.getEventHandlerRef(currElem, "checkchangeEventHandler") != null) {
            obj.on('checkchange', this.createHandler(currElem, "checkchangeEventHandler"), this);
        }

        if (this.getEventHandlerRef(currElem, "nodeRemoveEventHandler") != null) {
            obj.on('remove', this.createHandler(currElem, "nodeRemoveEventHandler"), this);
        }

        if (this.getEventHandlerRef(currElem, "beforenodedropEventHandler") != null) {
            obj.on('beforedrop', this.createHandler(currElem, "beforenodedropEventHandler"), this);
        }

        if(this.getEventHandlerRef(currElem, "nodeDragOverEventHandler") != null) {
            obj.on('nodedragover', this.createHandler(currElem, "nodeDragOverEventHandler"), this);
        }

        if (this.getEventHandlerRef(currElem, "contextmenuEventHandler") != null) {
            obj.on('rowcontextmenu', this.createHandler(currElem, "contextmenuEventHandler"), this);
        }

        this.addHandler(obj, currElem, "afterRenderEventHandler", "afterrender");

        var dataLink = currElem.getAttribute("dataLink");
        if (dataLink != null)
        {
            this.addDataLink(obj.getId(), dataLink);
            obj.addListener('checkchange',this.onTreeCheckChange, this);
        }

        this.processEventSubscriptions(currElem, obj);

        this.addActivateHandler(obj, currElem);
        this.addShowHandler(obj, currElem);
        this.addHandler(obj, currElem, "expandHandler", "expand");
        this.addRenderHandler(obj, currElem);

        var smcProperty = currElem.getAttribute("smcProperty");
        var smcAttrName = currElem.getAttribute("smcAttrName");
        var smcFunction = currElem.getAttribute("smcFunction");

        this.smcProperties[obj.getId()] = smcProperty;
        this.smcAttrNames[obj.getId()] = smcAttrName;
        this.smcFunctions[obj.getId()] = smcFunction;

        return obj;
    },
    createHandler : function(currElem, handlerName, scope) {
		return function() {
			if (!scope)
				scope = this;
			var eventHandler = scope.getEventHandlerRef(currElem, handlerName);
			var eventScope = scope.getScope(currElem);
			return eventHandler.apply(eventScope || scope.eventScope, arguments);
		};
	},
	processTreeNode : function(currElem, treeNode, nodeClickHandler, treePanelElem) {
	
		var DOM = new Dom();
		var nList = DOM.getNodeList(currElem, "Node");
		for (var i = 0; i < nList.length; i++)
		{
			var nodeElem = nList.item(i);
			var configObject = {};
			this.applyPropertiesFromUINode(nodeElem, configObject, {
				text: 'title',
				draggable: 'draggable',
				checked: 'checked',
				objectID: 'objectID',
				objType: 'objType',
				expanded: 'expanded',
				nodeID: 'nodeID',
				icon: "icon",
				nodeConfId:"nodeConfId",
				iconCls: "iconCls"
			});

			var objType = nodeElem.getAttribute("objType");
			if (objType && objType != 'folder')
			{
				var simpleObjType = objType;
				if (simpleObjType.indexOf(".") > 0)
					simpleObjType = simpleObjType.substring(0, simpleObjType.indexOf("."));
				configObject.iconCls = "smc-node smc-" + objType.replace(/\./g, "-");
			}
			if (nodeElem.getAttribute("LabelID"))
			    configObject.text = this.t.t(nodeElem.getAttribute("LabelID"));
			// workflow handling
			var currWorkflowStatus = null;
			var workflow = nodeElem.getAttribute("workflow");
			var workflowstatus = nodeElem.getAttribute("workflowstatus");
			if (workflow != null && workflow != '' && workflowstatus != null)
			{
				currWorkflowStatus = (workflowstatus != '') ? workflowstatus : 'Draft';
				configObject.icon = "client/images/ec/gui/workflow." + currWorkflowStatus.toLowerCase().replace(" ", "-") + ".gif";
			}
			///////////////
			
			var child = new Ext.tree.TreeNode(configObject);
			if (nodeClickHandler != null)
				child.on('click', this.createHandler(treePanelElem, "nodeClickEventHandler"), this);

			treeNode.appendChild(child);
			this.processTreeNode(nodeElem, child, nodeClickHandler, treePanelElem);
		}
		nodeClickHandler = null;
	},
	processTreeGridNode : function(currElem, treeNode, nodeClickHandler, treePanelElem) {
	
		var DOM = new Dom();
		var nList = DOM.getNodeList(currElem, "Node");
		for (var i = 0; i < nList.length; i++)
		{
			var nodeElem = nList[i];
			var configObject = {
				uiProvider : Ext.ux.tree.TreeGridNodeUI
			};

			if (nodeElem.getAttribute("checkbox") == "false")
				configObject.checkbox = false;
			
			var nEntry = DOM.getNodeList(nodeElem, "Entry");
			for(var j = 0; j<nEntry.length; j++){
				var nodeElem = nEntry.item(j);
				var name = nodeElem.getAttribute("name");
				var translate = nodeElem.getAttribute("translate");
				var val = nodeElem.getAttribute("value");
				
				if(translate==='true'){
					configObject[name]=this.t.t(val);
				}
				else{
					configObject[name]=val;
				}
				
				if (nodeElem.getAttribute("LabelID"))
				    configObject[text] = this.t.t(nodeElem.getAttribute("LabelID"));
				if(name==="smc_objtype"){
					configObject.iconCls="smc-node smc-" + val.replace(/\./g, "-");
				}
			}
			var child = new Smc.AsyncTreeGridNode(configObject);

			if (nodeClickHandler != null)
				child.on('click', this.createHandler(treePanelElem, "nodeClickEventHandler"), this);
	
			treeNode.appendChild(child);
			this.processTreeGridNode(nodeElem, child, nodeClickHandler, treePanelElem);
			
		}
		nodeClickHandler = null;
	},	
	processButtonNode : function(currElem) {
		var labelID = currElem.getAttribute("LabelID");
		
		var eventHandler = this.getEventHandlerRef(currElem);
		
		var iconFilename = currElem.getAttribute("iconFilename");
		var tooltip = currElem.getAttribute("tooltip");

		var buttonText = this.t.t(labelID);				

		var iconURL;
		if (iconFilename)
			iconURL = this.context.getParameter('UI_IMG_URL') + '/icons/' + iconFilename;
		
		var configObj = {
			text: buttonText
		};
		if (tooltip)
			configObj.tooltip = this.t.t(tooltip);

		var itemId = Smc.DOM.getAttribute(currElem, "id");
		if (itemId != null)
			configObj.itemId = itemId;
		
		var objectType = Smc.DOM.getAttribute(currElem, "objectType");
		if (objectType)
			configObj.objectType = objectType;
		
		this.applyPropertiesFromUINode(currElem, configObj, {
			handleMouseEvents: 'handleMouseEvents',
			baseCls: 'baseCls',
			cls: 'cls',
			overCls: 'overCls',
			minWidth: 'width',
			hidden: 'hidden',
			iconCls: 'iconCls',
			disabled: 'disabled',
			arrowVisible: 'arrowVisible',
			style: 'style',
			ariaLabel: 'ariaLabel',
			tooltipType: 'tooltipType'
		});
		if (!configObj.cls && iconURL)
			configObj.cls = 'x-btn-text-icon';
		
		if (currElem.getAttribute("simple") == "true")
		{
			if (!Gui.simpleButtonTemplate){
                // hideous table template
				Gui.simpleButtonTemplate = new Ext.Template(
					'<div class="smc-simple-button"><button type="{0}"></button></div>');
				Gui.simpleButtonTemplate.compile();
            }
			configObj.buttonSelector = "button";
			configObj.template = Gui.simpleButtonTemplate;
		}
		
		if (!configObj.icon && iconURL)
			configObj.icon = iconURL;
	
		var menuElem = Smc.DOM.getSingleNode(currElem, "Menu");
		if (menuElem)
		{
			var menuObj = this.processGUINode(menuElem);
			
			if (menuObj != null)
			{
				configObj.menu = menuObj;
			}
		}
		
		var obj;
		if (currElem.nodeName == "SplitButton")
		{
			configObj.menu = this.buildSplitButtonMenu(currElem);
				
			obj = new Ext.SplitButton(configObj);
			if (!eventHandler)
				obj.addListener('click', function() {
					this.showMenu();
				}, obj);				

			this.addHandler(obj, currElem, "menushowHandler", "menushow");	
		}
		else
			obj = new Ext.Button(configObj);
		
		if (eventHandler != null)
			obj.addListener('click', this.createHandler(currElem), this);
		
		eventHandler = null;
		
		return obj;
	},
	
	buildSplitButtonMenu : function (currElem) {
		var resMenu; 
		
		var itemList = Smc.DOM.getNodeList(currElem, "Item");		
		if (itemList.length > 0)
		{
			var menuConfig = {};
			for (var i = 0, len = itemList.length; i < len; i++)
				this.processSplitButtonItem(itemList[i], menuConfig);
			resMenu = new Ext.menu.Menu(menuConfig);	
		}				
		else
		{
			var menuElem = Smc.DOM.getSingleNode(currElem, "Menu");
			if (menuElem)
			{
				resMenu = this.processGUINode(menuElem);
				
				var guiNodeID = menuElem.getAttribute("id");
				if (guiNodeID && resMenu)
					this.guiObjects[guiNodeID] = resMenu;
			}
		}
		return resMenu;
	},


	rebuildMenu : function (menuObj, subStruct) {

		menuObj.removeAll();
		var menuItmList = Smc.DOM.getNodeList(subStruct, "*");
		for (var i = 0;  i<menuItmList.length;i++)
		{
			var menuObjDef = this.processGUINode(menuItmList[i]);
			menuObj.add(menuObjDef);			
		}
	
	},

	
	
	
	processSplitButtonItem : function(itemElem, configObj) {
		
		
		
		if (!configObj.items)
			configObj.items = [];
		
		var fn = Util.createDelegate(function() {
			var eventHandler = this.getEventHandlerRef(itemElem);
			if (eventHandler)
				eventHandler.apply(this.eventScope, arguments);
		}, this, [], true);
		
		var iconFilename = itemElem.getAttribute("iconFilename");
		
		var itemConfigObj = {
			text: this.context.getTranslatorCtrl().t(itemElem.getAttribute("LabelID")),
			handler: fn
		};
		
		if (iconFilename)
			itemConfigObj.icon = this.context.getParameter('UI_IMG_URL') + '/icons/' + iconFilename;
		
		configObj.items.push(itemConfigObj);
	},
	getScope : function(currElem) {
		var eventScope = currElem.getAttribute("eventScope");
		if (eventScope)
			return eval(eventScope);
	},
	setVectorValues : function (objID, xmlContent) {
		var guiO = this.getGuiObject(objID);
		var datastore = guiO.getStore();
	},
	getVectorValues : function (vectorName) {
		return {sm:this.vectorSm[vectorName] , ds:this.ds[vectorName]};
	},	
	/*fill the global data for the processVectorNode
	 * 
	 * @param data:array of items 
	 */
	fillVectorStore : function(vectorName,data,rSelected) {
		//fill the data
		this.vectorData[vectorName] = data;
		
		//store the selected items
		this.vectorSelectedItems[vectorName] = rSelected;
		
		//reload the store
		if (this.ds) {
			this.ds[vectorName].loadData(this.vectorData[vectorName]);
		}
		
		if (this.vectorFilters.length) {
			this.ds[vectorName].filter(this.vectorFilters);
		}
	},
	selectedVectorItems : function(vectorName) {
		var store = Ext.getCmp(vectorName + "-form-grid").getStore();
		var rowSelm = Ext.getCmp(vectorName + "-form-grid").getSelectionModel();
		var rSelected = new Array();
		if (this.vectorSelectedItems[vectorName]) {
			for ( var i = 0; i < this.vectorSelectedItems[vectorName].length; i++) {

				var selId = Smc.DOM.getText(this.vectorSelectedItems[vectorName][i]);
				var sRow = store.getById(selId);

				rSelected[i] = sRow;
			}
			rowSelm.unlock();
			rowSelm.selectRecords(rSelected);
		}
	},
	/**
	 * custom column Renderer to generate link to a pdf in grids
	 * 
	 */
	// TODO This method should probably be somewhere else
	vectorColRenderer : function(value, metaData, record, rowIndex, colIndex, store) {

		var cRow = record.node;

		if (!cRow)
			return value;

		// get the field with pdfObjContURI attribute
		var fProp = Smc.DOM.getSingleNode(cRow, "Field[@name='" + metaData.id
				+ "' and string-length(@pdfObjContURI)]");

		if (fProp) {
			// object container of pdfs uri
			var hrefPropCont = Smc.DOM.getAttribute(fProp, "pdfObjContURI");
			var fileNamePDF = Smc.DOM.getAttribute(fProp, "fileNamePDF");

			var pAPI = new PluginAPI(this.context, "form.norm");
			var pdfObj = pAPI.load(hrefPropCont, null, Smc.System.uiLanguage);

			// get the actual uri to the pdf object from the object container
			var aLink = Smc.DOM.getSingleNode(Smc.DOM.getDocumentElement(pdfObj), "//Field/value[text() = '"
					+ fileNamePDF + "']");

			// if not present return the previous value
			if (!aLink)
				return value;

			var objPath = Smc.DOM.getAttribute(aLink, "filePath");

			// TODO there should be an event handler bound to the DOM element
			// build link to open window with the pdf
			value = "<a href='#' onclick='window.Smc.System.GUI.context.openMedianWin(\"" + objPath
					+ "\",\"file-pdf\")' >" + value + "</a>";
		}

		return value;
	},
	// TODO this method is has approx. 600 lines. Isn't that a bit too long? Refactor code to Ext.Panel subclass.
	processVectorNode : function(currElem){
		var context = this;

		var fields = Smc.DOM.getNodeList(currElem, "*");
		var vectorName = Smc.DOM.getAttribute(currElem, "name");
		var vectorDName = Smc.DOM.getAttribute(currElem, "displayname");
		var checksVector = Smc.DOM.getAttribute(currElem, "checkbox");
		var vheight = Smc.DOM.getAttribute(currElem, "height");
		var gheight = Smc.DOM.getAttribute(currElem, "gridHeight");
		var vwidth = Smc.DOM.getAttribute(currElem, "width");
		var dblclickToEdit = Smc.DOM.getAttribute(currElem, "dblclickToEdit");
		var doNotEdit = Smc.DOM.getAttribute(currElem, "doNotEdit");
		var labelBar = Smc.DOM.getAttribute(currElem, "labelBar");

		var disableFields = [];

		if (doNotEdit == "true" || labelBar)
			doNotEdit = true;
		else
			doNotEdit = false;

		if (!dblclickToEdit)
			dblclickToEdit = "true";

		var clicksToEdit = 0;

		if (dblclickToEdit == "true")
			clicksToEdit = 2;

		var viewType = Smc.DOM.getAttribute(currElem, "viewType");
		viewType == "editorGrid" ? viewType = "editorGrid" : viewType == "vector";

		if (vheight)
			vheight = parseInt(vheight);

		if (vwidth)
			vwidth = parseInt(vwidth);
		else
			vwidth = 710; // default width to avoid scrollbars

		var fItems = new Array();
		var fReaders = new Array();
		var fColmodels = new Array();
		var fItms = new Array();
		

		// set the configurations for dataReader y columnModel
		for ( var i = 0; i < fields.length; i++) {

			var attsetsFilter = Smc.DOM.getAttribute(fields[i], "setsFilter");
			var fDisabled = Smc.DOM.getAttribute(fields[i], "disabled");

			if (attsetsFilter) {
				var fFields = attsetsFilter.split(",");
				var filterSetter = Smc.DOM.getAttribute(fields[i], "id");
				for ( var e = 0; e < fFields.length; e++) {
					var fid = "note.field." + fFields[e].trim();

					var ftredFields = Smc.DOM.getSingleNode(currElem.parentNode.parentNode.parentNode,
							"//FieldVector/*[@id='" + fid + "']");
					if (ftredFields) {

						// get the parent fieldvector
						ftredFields = ftredFields.parentNode;

						var vecName = Smc.DOM.getAttribute(ftredFields, "name");
						if (!this.filterChain[vectorName])
							this.filterChain[vectorName] = {};

						this.filterChain[vectorName][e] = {
							vector : vecName,
							field : 'note.field.' + fFields[e],
							filterSetter : filterSetter
						};
						this.filterChain[vectorName].length = e + 1;
					}
				}
			}

			fItems[i] = this.processGUINode(fields[i]);
			var fId = Smc.DOM.getAttribute(fields[i], "id");
			var fLabel = Smc.DOM.getAttribute(fields[i], "LabelID");
			var fCWidth = Smc.DOM.getAttribute(fields[i], "columnWidth");

			var fEditor = fields[i].nodeName; // Smc.DOM.getAttribute(fields[i],"editor");

			if (fDisabled == "true")
				disableFields.push(fId);

			var cWidth = 60;
			var cHidden = false;
			fItms[i] = fId;

			if (fCWidth == "0") {
				cHidden = true;
			}

			if (fCWidth != "" && fCWidth != null) {
				cWidth = parseInt(fCWidth);
			}

			// define readers for the fields
			fReaders[i] = {
				name : fId,
				mapping : "Field[@name='" + fId + "']"
			};

			if (fEditor == "Combo") {
				fEditor = fEditor.toLowerCase();
				var combo = this.processGUINode(fields[i]);

			} else {
				fEditor = "textfield";
			}

			if (checksVector == "true" || checksVector == "option") {
				if (combo && viewType == "editorGrid")
					fColmodels[i + 1] = {
						resizable : false,
						renderer : {
							fn : this.vectorColRenderer,
							scope : this
						},
						id : fId,
						header : fLabel,
						width : cWidth,
						hidden : cHidden,
						sortable : true,
						dataIndex : fId,
						editor : {
							xtype : fEditor,
							store : combo.getStore(),
							mode : 'local',
							valueField : combo.valueField,
							displayField : combo.displayField,
							disableKeyFilter : true,
							selectOnFocus : true,
							triggerAction : "all"
						}
					};
				else
					fColmodels[i + 1] = {
						resizable : false,
						renderer : {
							fn : this.vectorColRenderer,
							scope : this
						},
						id : fId,
						header : fLabel,
						width : cWidth,
						hidden : cHidden,
						sortable : true,
						dataIndex : fId,
						editor : {
							xtype : fEditor
						}
					};

			} else {

				if (combo && viewType == "editorGrid")
					fColmodels[i] = {
						resizable : false,
						renderer : {
							fn : this.vectorColRenderer,
							scope : this
						},
						id : fId,
						header : fLabel,
						width : cWidth,
						hidden : cHidden,
						sortable : true,
						dataIndex : fId,
						editor : {
							xtype : fEditor,
							store : combo.getStore(),
							mode : 'local',
							valueField : combo.valueField,
							displayField : combo.displayField,
							disableKeyFilter : true,
							selectOnFocus : true,
							triggerAction : "all"
						}
					};
				else
					fColmodels[i] = {
						resizable : false,
						renderer : {
							fn : this.vectorColRenderer,
							scope : this
						},
						id : fId,
						header : fLabel,
						width : cWidth,
						hidden : cHidden,
						sortable : true,
						dataIndex : fId,
						editor : {
							xtype : fEditor
						}
					};
			}
		}

		var editor = new Ext.ux.grid.RowEditor({
			saveText : this.t.t("smc.update"),
			cancelText : this.t.t("smc.cancel"),
			clicksToEdit : clicksToEdit,
			disableFields : disableFields,
			floating : false

		});

		this.ds[vectorName] = new Ext.data.Store({
			reader : new Ext.data.XmlReader({
				record : "row",
				idProperty : "id"
			}, fReaders)
		});

		// selectionmodel listener
		var listeners = {
			rowselect : function(sm, row, rec) {

				if (Ext.getCmp(vectorName + "-form"))
					Ext.getCmp(vectorName + "-form").getForm().loadRecord(rec);

				if (attsetsFilter) {
					// debugger;
					for ( var e = 0; e < context.filterChain[vectorName].length; e++) {
						var vec = context.filterChain[vectorName][e];
						context.ds[vec.vector].filter([ {
							property : vec.field,
							value : rec.data[vec.filterSetter]
						} ]);
					}
				}

				var form = Ext.getCmp(vectorName + "-form-fieldset");
				// enable the form to edit on section
				if (form)
					form.enable();

			}
		};

		// default selectionmodel
		var sm = new Ext.grid.RowSelectionModel({
			singleSelect : false,
			listeners : listeners,
			checkOnly : false
		});

		if (checksVector == "true" || checksVector == "option") {
			var chkC = new Ext.grid.CheckboxSelectionModel();
			fColmodels[0] = chkC;

			// override selectionmodel
			sm = new Ext.grid.CheckboxSelectionModel({
				singleSelect : (checksVector == "option") ? true : false,
				listeners : listeners
			});
		}

		// create the columnModel
		var colModel = new Ext.grid.ColumnModel(fColmodels);

		/*
		 * handlers for buttons
		 * 
		 */
		var vectorAddHandler = function(b, e) {

			var store = Ext.getCmp(vectorName + "-form-grid").getStore();

			var rtype = store.recordType;

			var nrow = new rtype({});
			var ttbar = Ext.getCmp(vectorName + '-tbar-del');

			store.insert(0, nrow);

			var rowSelm = Ext.getCmp(vectorName + "-form-grid").getSelectionModel();
			rowSelm.unlock();

			rowSelm.selectRow(0, false);

			var bform = Ext.getCmp(vectorName + "-form");

			if (bform)
				bform = bform.getForm();

			var form = Ext.getCmp(vectorName + "-form-fieldset");

			if (bform)
				bform.reset();

			if (form) {
				form.enable();
				for ( var i = 0; i < form.items.length; i++) {

					try {
						form.items.items[i].enable();
					} catch (e) {
						// TODO: handle exception
					}

				}
			} else {
				editor.startEditing(0);

			}

			// enable the del button
			ttbar.enable();

		};

		var vectorSaveHandler = function(b, e) {

			var fform = Ext.getCmp(vectorName + "-form-fieldset");
			var form = Ext.getCmp(vectorName + "-form").getForm();
			var store = Ext.getCmp(vectorName + "-form-grid").getStore();
			var rowSelected = Ext.getCmp(vectorName + "-form-grid").getSelectionModel().getSelected();

			if (form.isValid()) {

				if (rowSelected) {

					var cRow = store.getById(rowSelected.id);

				} else {

					var p = new store.recordType({}, 0); // create new record
					store.insert(0, p);
					var cRow = store.getAt(0);

				}
				cRow.beginEdit();

				var fValues = form.getFieldValues();
				var fValuesF = {};
				for ( var vals in fValues) {

					fValuesF[vals] = "";
					if (typeof (fValues[vals]) == "object") {
						if (fValues[vals].inputValue) {
							fValuesF[vals] += fValues[vals].inputValue;
						} else {
							for ( var v in fValues[vals]) {

								if (!isNaN(v) && v != undefined) {

									fValuesF[vals] += fValues[vals][v].inputValue + ",";
								}
							}
							fValuesF[vals] = fValuesF[vals].substring(0, fValuesF[vals].length - 1);
						}
					} else {
						fValuesF[vals] = fValues[vals];
					}
				}

				cRow.data = fValuesF;
				cRow.endEdit();
				cRow.commit();

			}
		};

		var vectorDelHandler = function(b, e) {

			var store = Ext.getCmp(vectorName + "-form-grid").getStore();
			var rowSelected = Ext.getCmp(vectorName + "-form-grid").getSelectionModel();

			if (rowSelected.getSelected())
				rowSelected = rowSelected.getSelected().id;

			var ttbar = Ext.getCmp(vectorName + '-tbar-del');
			var form = Ext.getCmp(vectorName + "-form-fieldset");
			var cRow = null;

			if (rowSelected)
				cRow = store.getById(rowSelected);

			if (cRow)
				store.remove(cRow);

			var totR = store.getCount();

			if (totR == 0)
				ttbar.disable();

			if (form)
				form.disable();
		};

		var vectorCancelHandler = function(b, e) {
			var form = Ext.getCmp(vectorName + "-form-fieldset");
			var bform = Ext.getCmp(vectorName + "-form").getForm();
			bform.reset();
		};

		var vectorEditHandler = function() {
			var grid = Ext.getCmp(vectorName + "-form-grid");
			var gridSM = grid.getSelectionModel();
			var rSelected = gridSM.getSelected();
			var rowIndex = grid.getStore().indexOf(rSelected);

			editor.startEditing(rowIndex, true);
		};

		/* /handlers */

		// toolbars configurations
		var tbar = (doNotEdit) ? ((labelBar) ? {
			items : [ {
				text : labelBar
			} ]
		} : {}) : {
			items : [ {
				text : this.t.t("smc.add"),
				iconCls : 'smc-add-btn',
				handler : vectorAddHandler
			}, '-', {
				text : this.t.t("smc.delete"),
				iconCls : 'smc-del-btn',
				handler : vectorDelHandler,
				id : vectorName + '-tbar-del'
			} ]
		};
		var fbar = {
			items : [ {
				text : this.t.t("smc.save"),
				iconCls : 'smc-save',
				handler : vectorSaveHandler,
				id : vectorName + '-form-fieldset-save'
			}, '-', {
				text : this.t.t("smc.cancel"),
				iconCls : 'smc-cancel',
				handler : vectorCancelHandler
			} ]
		};

		if (viewType == "editorGrid" && dblclickToEdit == "false") {
			if (!doNotEdit)
				tbar.items.push({
					text : this.t.t("smc.edit"),
					iconCls : 'smc-editThree',
					handler : vectorEditHandler
				});

		}
		var vupSel = function() {
			// selections
			context.selectedVectorItems(vectorName);

			var store = Ext.getCmp(vectorName + "-form-grid").getStore();

			var ttbar = Ext.getCmp(vectorName + '-tbar-del');
			var totR = store.getCount();

			if (ttbar) {
				if (totR == 0)
					ttbar.disable();
				else
					ttbar.enable();
			}

		};

		var monitValid = function(fPanel, valid) {

			if (valid == true) {
				var save = Ext.getCmp(vectorName + '-form-fieldset-save');
				save.enable();

			} else {
				var save = Ext.getCmp(vectorName + '-form-fieldset-save');
				save.disable();

			}
		};
		if (viewType != "editorGrid") {

			// crate the panel with a grid and a form
			var gridForm = new Ext.Panel({
				id : vectorName + '-form',
				frame : true,
				height : (vheight) ? vheight : 'auto',
				width : (vwidth) ? vwidth : 'auto',
				labelAlign : 'top',
				title : vectorDName,
				bodyStyle : 'padding:1px',
				items : [ {
					items : {
						xtype : 'grid',
						id : vectorName + '-form-grid',
						ds : this.ds[vectorName],
						tbar : (!doNotEdit) ? tbar : null,
						cm : colModel,
						sm : sm,
						height : (gheight) ? parseInt(gheight) : 150,
						title : '',
						border : true,
						listeners : {
							viewready : vupSel
						}
					}
				}, {
					xtype : 'fieldset',
					labelWidth : 120,
					title : '',
					disabled : doNotEdit,
					defaults : {
						border : false,
						allowBlank : true,
						validateOnBlur : false,
						disabled : false,
						width : (vwidth) ? (vwidth - 50) : 'auto',
						value : ""
					}, // Default config options for child items
					defaultType : 'textfield',
					autoHeight : false,
					// TODO still valid for IE9?
					bodyStyle : Ext.isIE ? 'padding:0 0 5px 5px;' : 'padding:10px 10px;',
					border : false,
					id : vectorName + '-form-fieldset',
					tbar : (!doNotEdit) ? fbar : null,
					items : fItems
				} ]

			});
		} else {
			editor.on("afteredit", function(redit, obj, record, number) {
				record.commit();
			});

			editor.on("editing", function(roweditor, rowIndex) {
				// roweditor.refreshFields();

				var cm = roweditor.grid.getColumnModel();
				for ( var i = 0, len = cm.getColumnCount(); i < len; i++) {
					var c = cm.getColumnAt(i), ed = c.getEditor();
					if (ed) {
						if (ed.xtype == "combo")
							ed.clearValue();
					}
				}
			});

			var gridForm = new Ext.grid.GridPanel({
				id : vectorName + '-form-grid',
				ds : this.ds[vectorName],
				tbar : tbar,
				height : (vheight) ? vheight : 'auto',
				width : (vwidth) ? vwidth : 'auto',
				cm : colModel,
				sm : sm,
				plugins : [ editor ],
				height : (gheight) ? parseInt(gheight) : 150,
				title : '',
				border : true,
				style : {
					'padding-right' : '8px',
					'padding-bottom' : '5px'
				},
				listeners : {
					viewready : vupSel
				}
			});
		}

		this.vectorSm[vectorName] = Ext.getCmp(vectorName + "-form-grid").getSelectionModel();

		this.guiObjects[vectorName + "-form"] = gridForm;

		if (checksVector == "true") {

			gridForm.on("render", function(o) {

				$(".x-grid3-hd-checker").css("display", "none");
			});
		}

		return gridForm;
	},
	processComboNode : function(currElem, extType) {
		var DOM = new Dom();
		var labelID = currElem.getAttribute("LabelID");
		var comboID = currElem.getAttribute("id");

		var comboLabel = this.t.t(labelID);
				
		var eventHandler = this.getEventHandlerRef(currElem);
		var filter =  DOM.getAttribute(currElem, "setsFilter");

		var storeHandler = this.getEventHandlerRef(currElem, "storeHandler");
		
		var firstValue;
		var firstValueIdx;
		var myStore;
		
		if (!storeHandler) {
			var preSelectFirstValueStr = currElem.getAttribute("preSelectFirstValue");
			var preSelectFirstValue = preSelectFirstValueStr != null ? preSelectFirstValueStr.toLowerCase() == "true" : false;
			
			var myRecordArr = new Array();
			if (currElem.getAttribute("forceSelection") == "false")
				myRecordArr.push(["", "-"]);
			
			myRecordArr = myRecordArr.concat(this.getDataArray(currElem));
			
			var itemNodes = DOM.getNodeList(currElem, "Item");		
			for (var j = 0; j < itemNodes.length; j++)
			{
				var itm = itemNodes.item(j);
				var id = itm.getAttribute("id");

				if (itm.getAttribute("default") == "true")
				{
					firstValue = id;
					firstValueIdx = j;
				}
				else if (preSelectFirstValue && j == 0)
				{
					firstValue = id;
					firstValueIdx = j;
				}
			}
	
		    myStore = new Ext.data.SimpleStore({
		        fields: ['id', 'text'],
		        data: myRecordArr
		    });
		}
		else {
			myStore = storeHandler.call(this.getScope(currElem) || this.eventScope || this);
		}

		var hideLabel = comboLabel ? false : true;

		if(labelID == "-") {
			comboLabel = "";
		}

		var ariaLabel = currElem.getAttribute("ariaLabel");

		var configObj = {
	    	store: myStore,
	        displayField:'text',
			queryMode: 'local',
	        emptyText: comboLabel,
	        fieldLabel: comboLabel,
	        width:135,
			id: comboID,
	        editable: false,
	        valueField: 'id',
	        forceSelection: true,
	        typeAhead: true,
	        triggerAction: 'all',
	        msgTarget: 'under',
	        lazyRender: true,
	        name: labelID,
	        labelSeparator: '',
	        hideLabel : hideLabel,
	        shadow: false,
			listeners: {
				render: function(c) {
					if (ariaLabel) {
						// Needed for display the browser tooltip
						c.getEl().dom.setAttribute('title', ariaLabel);
					}
				}
			}
		};

		this.applyPropertiesFromUINode(currElem, configObj, {
			width: 'width',
			ctCls: 'ctCls',
			cls: 'cls',
			fieldClass: 'fieldClass',
			linkedGUIObj: 'linkedGUIObj',
			itemCls: 'itemCls',
			hideLabel : 'hideLabel',
			hidden : 'hidden',
			name: 'name',
			itemId: 'id',
			editable: 'editable',
			forceSelection: 'forceSelection',
			labelAlign : 'labelAlign',
			listAlign : 'listAlign',
			disabledClass : 'disabledClass',
			readOnly: 'readOnly',
			disabled: 'disabled',
			value: 'value',
			clearCls: 'clearCls',
			height: 'height',
			hideTrigger: 'hideTrigger',
			mode: 'mode',
			displayField: 'displayField',
			typeAhead: 'typeAhead',
			minChars: 'minChars',
			disableKeyFilter :'disableKeyFilter',
			emptyText: 'emptyText',
			hiddenName: 'hiddenName',
			enableKeyEvents: 'enableKeyEvents',
			labelStyle: 'labelStyle',
			isContentProperty: "isContentProperty",
			namespace: "namespace",
			ariaLabel: 'ariaLabel'
		});

		var emptyText = currElem.getAttribute("emptyText");
		if (emptyText)
			configObj.emptyText = this.t.t(emptyText);

		// TODO this is not allowed. Should be done else where
		/*
		 * if(configObj.value){ //trim spaces configObj.value =
		 * configObj.value.trim(); }
		 */

		if (firstValue != null && typeof configObj.value !== 'number' && !configObj.value) {
			configObj.value = firstValue;
		}
		
		var templateHandler = this.getEventHandlerRef(currElem, "templateHandler");
		if (templateHandler)
			configObj.tpl = templateHandler.call(this.eventScope || this);
		
		if (currElem.getAttribute("translateValue"))
			configObj.value = this.t.t(currElem.getAttribute("translateValue"));
		
		if (currElem.getAttribute("invalidText"))
		{
			configObj.invalidText = this.t.t(currElem.getAttribute("invalidText"));
			configObj.validator = function(val) {
				return val ? true : this.invalidText;
			};
		}
		if (configObj.width)
		{
			var newSize = configObj.width / 6.25;
			configObj.autoCreate = {tag: "input", type: "text", size: newSize, autocomplete: "off"};
		}
		
		//removed because i dont know what it is for label should be comboLabel which is the translated value
		/*if (currElem.parentNode.nodeName == "FormPanel" || currElem.parentNode.nodeName == "Group")
			configObj.fieldLabel = this.getTitle(currElem);
		*/
		
	    var combo = new extType(configObj);

	    this.addHandler(combo, currElem, "changeEventHandler", "change");
	    this.addHandler(combo, currElem, "keyupEventHandler", "keyup");
        this.addHandler(combo, currElem, "specialkeyHandler", "specialkey");
	    
	    //combo vector filters
		if (filter) {

			var pNode = currElem.parentNode;
			// TODO the gui ID shouldn't be hardcoded here.
			var fField = Smc.DOM.getSingleNode(DOM.getParent(pNode), "descendant-or-self::*[@id='note.field." + filter
					+ "']");
			var vector = fField.parentNode;
			var vectorName = Smc.DOM.getAttribute(vector, "name");

			combo.on('select', function(obj, val) {

				if (combo.value != "all") {
					this.ds[vectorName].filter([ {
						property : "note.field." + filter,
						value : combo.value
					} ]);
				} else {
					this.ds[vectorName].clearFilter();
				}
			}, this);
		} else {
	    
		    if (eventHandler != null)
	    	{
	    		this.addEvent(combo.getId(), function() {
	    			var eventScope = this.getScope(currElem);
					var eventHandler2 = this.getEventHandlerRef(currElem);
					if (eventScope)
						eventHandler2.apply(eventScope, arguments);
					else
						eventHandler2.apply(this.eventScope, arguments);
	    		});
	    		combo.addListener('select', this.onComboChange, this);
	    	}
		}

    	var dataLink = currElem.getAttribute("dataLink");
	    if (dataLink != null)
    	{
    		this.addDataLink(combo.getId(), dataLink);
    		combo.addListener('select',this.onComboDataLinkChange, this);

			try
			{
	    		if (firstValue != null)
	    			this.onComboDataLinkChange(combo, myStore.getAt(firstValueIdx), firstValueIdx);
			}
			catch (e) {}
    	}
	
		this.addTooltipHelp(currElem, combo);

	    this.storeFieldActions(currElem, combo.getId());
    	
    	return combo;
	},
	processMultipleComboNode : function(currElem) {
		var DOM = Smc.DOM;

		// get the fields by level
		var fields = DOM.getNodeList(currElem, "//Level");

		var dataStruct = function(cfield, level) {

			var data = new Array();

			var dataRaw = new Object();

			dataRaw = DOM.getNodeList(currElem, "descendant-or-self::MultipleValue[ancestor::MultipleValue/@level="
					+ level + "]]");

			for ( var i = 0; i < dataRaw.length; i++) {
				var val = dataRaw[i].getAttribute("value");
				data[i] = [ i, val ];
			}

			return data;

		};

		var myStore = new Object();
		var combo = new Object();

		// iterate tru the levels
		for (i = 0; i < fields.length; i++) {

			fieldElem = fields[i];
			var level = DOM.getAttribute(fieldElem, "level");
			var id = DOM.getAttribute(fieldElem, "id");
			var data = dataStruct(fieldElem, level);

			myStore[level] = new Ext.data.SimpleStore({
				fields : [ 'id', 'text' ],
				data : data
			});

			combo[level] = new Ext.form.ComboBox({
				store : myStore[level],
				name : id,
				displayField : 'text',
				mode : 'local',
				editable : false,
				valueField : 'id',
				forceSelection : false,
				selectOnFocus : true,
				typeAhead : true,
				triggerAction : 'all'
			});

		}

		return combo[0];

	},
	processToolbarSpacerNode : function() {
		return new Ext.Toolbar.Spacer();
	},
	getListRowData : function(currElem) {
		
		var myRecordArr = new Array();
		
		var lineList =  Smc.DOM.getNodeList(currElem, "Line");
		for (var i = 0; i < lineList.length; i++)
		{	
			var lineNode = lineList.item(i);
			var entryList =  Smc.DOM.getNodeList(lineNode, "Entry");
			var myArr = new Array();
			for (var j = 0; j < entryList.length; j++)
			{
				var entryNode = entryList.item(j);
				var val = entryNode.getAttribute("value");
				if (entryNode.getAttribute("translate") == "true")
					val = this.t.t(val);
				myArr.push(val);
				
			}
			myRecordArr.push(myArr);
		}
		return myRecordArr;
	},
	getPropertyListRowData : function(currElem) {
		var myRecordArr = new Array();
		var DOM = new Dom();
		var lineList =  DOM.getNodeList(currElem, "Line");
		for (var i = 0; i < lineList.length; i++)
		{	
			var lineNode = lineList.item(i);
			var entryList =  DOM.getNodeList(lineNode, "Entry");
			var myArr = new Array();
			for (var j = 0; j < entryList.length; j++)
			{
				var entryNode = entryList.item(j);
				var val = entryNode.getAttribute("value");
				myArr.push(val);
			}
			myRecordArr.push(myArr);
		}
		return myRecordArr;
	},
	processListNode : function(currElem, contextObj) {
		var DOM = new Dom();
		var title = this.getTitle(currElem);
		
		var guiNodeID = currElem.getAttribute("id");

		var checkboxes = currElem.getAttribute("checkboxes");
		var sm = null; 
		if (checkboxes == "true") 
			sm = new Ext.grid.CheckboxSelectionModel();
		
		var headNode =  DOM.getSingleNode(currElem, "Head");
		var headCheckBox = headNode.getAttribute("checkbox");
		var showHeader = headNode.getAttribute("show");
		
		var isEditingEnabled = "true" == currElem.getAttribute("editingEnabled");
		
		if (headCheckBox == "false")
		{
			sm.header = "<div></div>";
		}

		var isMultiGroup = currElem.getAttribute("multiGroup") == "true";
	
		var colHeadList =  DOM.getNodeList(currElem, "Head/ColHead");
		
		// build colModel		
		var config = this.getColumnConfig(colHeadList, checkboxes, sm);						
			
		var cm = new Ext.grid.ColumnModel(config.columnModelConfig);				
	    
	    // build store		
	    var gridConfig = this.getGridConfig(currElem, cm, checkboxes, config.idIndex, 
	    		config.autoexpandField, config.startGroupField, config.groupFields, config.readerConfig, sm);
	    
	    this.applyPropertiesFromUINode(currElem, gridConfig, {
	    	width:'width',
	    	height:'height',
	    	frame: 'frame',
	    	border: 'border',
	    	autoHeight: 'autoHeight',
	    	hidden: 'hidden',
	    	ctCls: 'ctCls',
	    	cls: 'cls',
	    	style: 'style',
	    	disabled: 'disabled',
	    	region: 'region',
	    	deferRowRender: 'deferRowRender',
	    	autoScroll: 'autoScroll'
	    });
	    
	    if (showHeader == "false")
	    	gridConfig.hideHeaders = true; 
	    
	    if (title != null)
	    	gridConfig.title = title;
	    
	    if (config.startGroupField.length > 0)
	    {
	    	if (isMultiGroup)
		    	gridConfig.view = new Ext.ux.MultiGroupingView({
		            forceFit:true,
		           	groupTextTpl: '{text}'
		        });
	    	else
	    		gridConfig.view = new Ext.grid.GroupingView({
		            forceFit:true,
		           	groupTextTpl: '{text}'
		        });
	    }
	    
	    if (currElem.getAttribute("paging") == "true")
		{
			var pagingBar = new Ext.PagingToolbar({
		        pageSize: 20,
		        store: gridConfig.store,
		        displayInfo: true,
		        displayMsg: 'Displaying topics {0} - {1} of {2}',
		        emptyMsg: "No topics to display"
		    });
		    gridConfig.bbar = pagingBar;
		}
	    
	    var grid;
	    if (isEditingEnabled)
	    {
	    	gridConfig.clicksToEdit = 1;
	    	grid = new Ext.grid.EditorGridPanel(gridConfig);
	    }
	    else
	    	grid = new Ext.grid.GridPanel(gridConfig);

	    var eventHandler = this.getEventHandlerRef(currElem);
	    
	    if ((contextObj.dataLink || eventHandler) && (!checkboxes || checkboxes != "true"))
	    {
	    	if (contextObj.dataLink != "")
	    		this.addDataLink(grid.getId(), contextObj.dataLink);
	    	if (eventHandler != null)
	    		this.addEvent(grid.getId(), this.createHandler(currElem));
			grid.addListener('cellclick', this.onGridClick, this);	    	
	    }
	    eventHandler = null;
	    
	    var cellClickEventHandler = this.getEventHandlerRef(currElem, "cellClickEventHandler");	    
	    if (cellClickEventHandler != null)
	    	grid.on('cellclick', this.createHandler(currElem, "cellClickEventHandler"), this);
	    
	    cellClickEventHandler = null;
	    
	    var cellContextmenuEventHandler = this.getEventHandlerRef(currElem, "cellContextmenuHandler");	    
	    if (cellContextmenuEventHandler != null)
	    	grid.on('cellcontextmenu', this.createHandler(currElem, "cellContextmenuHandler"), this);
	    
	    cellContextmenuEventHandler = null;
	    
	    
    	var dataLink = currElem.getAttribute("dataLink");
	    if (dataLink != null && checkboxes == "true")
    	{
    		this.addDataLink(grid.getId(), dataLink);   		
    		var scopeObj = new Object ();
    		scopeObj.name = grid.getId();
    		
    		var fnSelect = Util.createDelegate(this.onListCheckChange, this, [grid, true], true);
    		var fnUnselect = Util.createDelegate(this.onListCheckChange, this, [grid, false], true);
    		
    		sm.addListener('rowselect', fnSelect, this);
    		sm.addListener('rowdeselect', fnUnselect, this);
    		
    		grid.addListener('cellclick', this.onListCellClick, this);
    	}	    
    	

    	var checkBoxReset = currElem.getAttribute("checkBoxReset");
	    if (checkBoxReset == "no")
    		sm.addListener('beforerowselect',this.onBeforeListCheckChange, scopeObj);
		
		this.addShowHandler(grid, currElem);
		
		this.processEventSubscriptions(currElem, grid);
	
		return grid;
	},	
	processTreeListNode : function(currElem, contextObj) {

		var DOM = new Dom();
		var colHeadList =  DOM.getNodeList(currElem, "Head/ColHead");
		
		// build colModel		
		var config = this.getColumnConfig(colHeadList);	
		
		var treeLoader = eval("Smc.BrokerTreeGridLoader");
		var reqURL = this.context.getParameter("SLIDE_SERVER") + "/theme";
		var loaderConfig = {
			url : reqURL,
        	context : this.context,
        	nodeClickEventHandler : Ext.emptyFn,
        	preloadAll : false,
        	checked : false,
        	guiInstance : this 
		};
		var treeLoaderObj = new treeLoader(loaderConfig);	
				
	    var tree = new Ext.ux.tree.TreeGrid({
	        enableDD: true,
	        columns: config.columnModelConfig,
	        loader: treeLoaderObj
	    });
	    var nodeClickHandler = this.getEventHandlerRef(currElem, "nodeClickEventHandler");

		this.processTreeGridNode(currElem, tree.getRootNode(), nodeClickHandler, null);
		tree.getRootNode().loaded = true;

	    return tree;
	},	
	getGridConfig: function(currElem, cm, checkboxes, idIndex, autoexpandField, startGroupField, 
			groupFields, readerConfig, sm) {

		var gridConfig = { 
				cm: cm,
		        collapsible: false,
		        animCollapse: false,
		        viewConfig: {
		        	forceFit:true
	        	}
			};
		
		var isMultiGroup = currElem.getAttribute("multiGroup") == "true";
		
		var startSortField = "";
		if (currElem.getAttribute("sortBy"))
			startSortField = currElem.getAttribute("sortBy");	
		
		var myRecordArr = this.getListRowData(currElem, gridConfig);	
		
		var sortDirection = currElem.getAttribute("sortDirection") || "ASC";		
		
		if (checkboxes == "true")
			gridConfig.sm = sm;
		
	    gridConfig.autoExpandColumn = autoexpandField;
		
		if (startGroupField.length > 0)
    	{
    		if (startSortField.length == 0)
    			startSortField = startGroupField;
			
			var indexConfig = {};
			
			indexConfig.id = idIndex;						
			
    		var reader = new Ext.data.ArrayReader(indexConfig, Ext.data.Record.create(readerConfig));
    		
    		var gridStoreConfig = {
    			reader: reader,
    			data: myRecordArr,
            	groupField: startGroupField,
            	sortInfo: {field: startSortField, direction: sortDirection}
    		};
    		
    		if (isMultiGroup)
    		{
    			gridStoreConfig.groupField = groupFields;
    			gridConfig.store = new Ext.ux.MultiGroupingStore(gridStoreConfig);
    		}
    		else
    			gridConfig.store = new Ext.data.GroupingStore(gridStoreConfig);
    	}
    	else
		{
			var gridStoreConfig = {
    			data: myRecordArr,
				fields: readerConfig,
            	sortInfo: startSortField ? {field: startSortField, direction: sortDirection} : null
    		};
    		
			gridConfig.store = new Ext.data.SimpleStore(gridStoreConfig);
		}	  
		
		return gridConfig; 
	},
	getColumnConfig : function(fieldDefList, checkboxes, sm) {
		
		var columnsDefArray = new Array();
		if (checkboxes == "true")
			columnsDefArray.push(sm);
		var readerDefArray = new Array();
		var startGroupField = "";
		var groupFields = [];
		var autoexpandField = "";		
		var idIndex = -1;		
		
		for (var i = 0; i < fieldDefList.length; i++)
		{	
			var fieldDefElem = fieldDefList.item(i);
			var fieldID = fieldDefElem.getAttribute("name");
			var fieldName = this.t.t(fieldDefElem.getAttribute("LabelID") || fieldDefElem.getAttribute("name"));
			if (!fieldName)
				fieldName = fieldID;
			
			var autoexpand = fieldDefElem.getAttribute("autoexpand");
			if (autoexpand == "true")
				autoexpandField = fieldID;
			
			if (fieldID == null || fieldID.length == 0)
				throw new Error("List column defintion is invalid: ID is not defined!");
			
			var sortable = fieldDefElem.getAttribute("sortable");
			var groupBy = fieldDefElem.getAttribute("groupBy");
			var dataType = fieldDefElem.getAttribute("dataType");
			var editorType = fieldDefElem.getAttribute("editorType");
			
			if (groupBy == "true" && startGroupField == "")
				startGroupField = fieldID;
			if (groupBy == "true")
				groupFields.push(fieldID);
			
			// prepare column object
			var colObj = new Object();
			if (fieldID == "id")
				colObj.id = fieldID;
				
			var isID = fieldDefElem.getAttribute("isID");

			if (isID=="true")
			{
				idIndex = i;
			}			
				
			colObj.header = fieldName;
			colObj.dataIndex = fieldID;
			if (sortable == "true")
				colObj.sortable = true;			
					
			colObj.renderer = this.getColumnRenderer(dataType);
			
			if(editorType == "Combo")
				colObj.editor = this.getColumnComboEditor(fieldDefElem);
			
			this.applyPropertiesFromUINode(fieldDefElem, colObj, {
				width: 'width',
				hidden: 'hidden',
				hideable: 'hideable',
				menuDisabled: 'menuDisabled',
				fixed: 'fixed',
				css: 'css'
			});			
						
			columnsDefArray.push(colObj);
			
			var fieldDefObj = {
				name: fieldID
			};
			
			if (fieldDefElem.getAttribute("type"))
				fieldDefObj.type = fieldDefElem.getAttribute("type");
			if (fieldDefElem.getAttribute("sortType"))
				fieldDefObj.sortType = fieldDefElem.getAttribute("sortType");
			
			readerDefArray.push(fieldDefObj);
		}	
		
		var config = {
			columnModelConfig : columnsDefArray, 
			readerConfig : readerDefArray,
			startGroupField : startGroupField,
			groupFields : groupFields,
			autoexpandField : autoexpandField,
			idIndex : idIndex				
		};
	
		return config;
	},	
	getColumnComboEditor : function(fieldDefElem) {
		
		var possibleValueList = Smc.DOM.getNodeList(fieldDefElem, "PossibleValues/Entry");

		var comboDataArr = new Array();

		for (var k = 0, len2 = possibleValueList.length; k < len2; k++)
		{								
			var possibleValueElem = possibleValueList.item(k);
			var valueID = this.t.t(possibleValueElem.getAttribute("id"));
			var displayValue = this.t.t(possibleValueElem.getAttribute("value"));
			comboDataArr[k] = [valueID, displayValue];
		}

		var comboStore = new Ext.data.SimpleStore({
			fields: ['id', 'text'],
			data: comboDataArr
		});
		
		var cellClickEventHandler = this.getEventHandlerRef(fieldDefElem, "comboLoadEventHandler");	    
		if (cellClickEventHandler != null)
		{
			var proxy = new Ext.data.DataProxy();
			proxy.load = this.createHandler(fieldDefElem, "comboLoadEventHandler", this);
			comboStore.proxy = proxy;
		}
		
		var comboBoxObj = new Ext.form.ComboBox({
			store: comboStore,
			name: id,
			displayField:'text',
			mode: cellClickEventHandler != null ? 'remote' : 'local',
			editable: false,
			typeAhead: false,
			valueField: 'id',
			forceSelection: false,
			selectOnFocus:true,
			typeAhead: true,
			triggerAction: 'all'
		});
		
		var cbId = fieldDefElem.getAttribute("comboId");
		if (cbId)
			this.guiObjects[cbId] = comboBoxObj;
		
		return comboBoxObj;
	},
	getColumnRenderer : function(dataType) {       
		var renderer;
		
		if (dataType == "icon")
		{
			renderer = function(value, cell, row, rowIndex, colIndex, ds) {
				if (value.length > 0)
				{
					var html = "<img style='margin-left:2px' src='{0}'/>";
					return String.format(html, value);
				}
			};
		}
		else if (dataType == "objType")
		{
			renderer = function(value, cell, row, rowIndex, colIndex, ds) {
				if (value)
				{
					var html = '<div class="smc-{0}" title="{1}" style="background-repeat:no-repeat;background-position:left;padding-left:18px;">{2}</div>';
					return String.format(html, value.replace(".", "-"), value, Smc.System.getTranslatorCtrl().t("Webdav.ContextMenu." + value + ".New"));
				}
			};
		}
		else if (dataType == "colorformat")
		{
			renderer = function(value, cell, row, rowIndex, colIndex, ds) {
				var html = '<span style="cursor:hand;color:{1}">{0}</span>';
				
				var startPos = value.indexOf ('{');
				var endPos = value.indexOf ('}', startPos);
				
				if (startPos > -1 && endPos > -1)
				{
					var show = value.substring(0, startPos);
					var col = value.substring(startPos+1, endPos);					
				}
				else
				{
					show = value;
				}
				
				//return String.format(html, value , row.get("smc.color"));
				return String.format(html, show, col);
			};
		}
		else if (dataType == "flags")
		{
			renderer = function(value, cell, row, rowIndex, colIndex, ds) {
				
				var langArr = row.get("smc.flags").split(";");
				var htmlCode = [];
				
				for (var i = 0; i < langArr.length-1; i++)
				{
					htmlCode.push("<img style='margin-left:2px' src='");
					htmlCode.push(Smc.System.getParameter("UI_IMG_URL"));
					htmlCode.push("lang/flag_");
					htmlCode.push(langArr[i]);
					htmlCode.push(".png'/>");
				}
				
				return htmlCode.join("");
			};
		}
		else if (dataType == "flags2")
		{
			renderer = function(value, cell, row, rowIndex, colIndex, ds) {
				
				var htmlCode = [];
				htmlCode.push('<span style="background-repeat:no-repeat;padding:2px 0 0 20px;background-image:url(');
				htmlCode.push(Smc.System.getParameter("UI_IMG_URL"));
				htmlCode.push("lang/flag_");
				htmlCode.push(value);
				htmlCode.push('.png);">');
				htmlCode.push(Smc.System.getLanguageDescription(value));
				htmlCode.push('</span>');
				return htmlCode.join("");
			};
		}
		else if (dataType == "hyperlink")
		{
			renderer = function(value, cell, row, rowIndex, colIndex, ds) {
				if (value.indexOf("|||") > -1)
				{
					var valueArr = value.split("|||");
					var html = '<a class="{0}" href="{1}" target="_blank">{2}</a>';
					return String.format(html, valueArr[0], valueArr[1], "Download");
				}
				else // actually the same as event2
				{
					var html = '<a href="{0}" target="_blank">{1}</a>';
					return String.format(html, value, "Download");
				}
			};
		}
		else if (dataType == "event")
		{
			renderer = function(value, cell, row, rowIndex, colIndex, ds) {				
				var html = '<a href="#" onclick="return false;">{0}</a>';
				return String.format(html, this.header || this.dataIndex);
			};
		}
		else if (dataType == "event2")
		{
			renderer = function(value, cell, row, rowIndex, colIndex, ds) {				
				var html = '<span class="smc-grid-link">{0}</span>';
				return String.format(html, Smc.System.getTranslatorCtrl().t(value));
			};
		}
		else if (dataType == "event3")
		{
			renderer = function(value, cell, row, rowIndex, colIndex, ds) {				
				if (value.indexOf("|||") > -1)
				{
					var valueArr = value.split("|||");
					var html = '<span class="smc-grid-link {0}">{1}</span>';
					return String.format(html, valueArr[0].toLowerCase(), Smc.System.getTranslatorCtrl().t(valueArr[1]));
				}
				else // actually the same as event2
				{
					var html = '<span class="smc-grid-link">{0}</span>';
					return String.format(html, value);
				}
			};
		}
		return renderer;
	},	
	
	getPropertyListNames : function(currElem) {
		var DOM = Smc.DOM;
		var myPropNames = {};
		var lineList =  DOM.getNodeList(currElem, "Line");	
		for (var i = 0; i < lineList.length; i++)
		{	
			var lineNode = lineList.item(i);
			var entryList =  DOM.getNodeList(lineNode, "Entry");
			var id = entryList.item(0).getAttribute("id");
			var displayValue = entryList.item(0).getAttribute("value");
			
			myPropNames[id] = displayValue;
		}
		return myPropNames;
	},
	getPropertyListSource : function(currElem) {
		var DOM = Smc.DOM;
		var myPropObject = {};
		var lineList =  DOM.getNodeList(currElem, "Line");	
		for (var i = 0; i < lineList.length; i++)
		{	
			var lineNode = lineList.item(i);
			var entryList =  DOM.getNodeList(lineNode, "Entry");
			var id = entryList.item(0).getAttribute("id");
			var val = entryList.item(1).getAttribute("value");
			myPropObject[id] = val;
		}
		return myPropObject;
	},
	processPropertyListNode : function(currElem) {

		var title = this.getTitle(currElem);
		var myPropObject = this.getPropertyListSource(currElem);
		var myPropNames = this.getPropertyListNames(currElem);

	    var gridConfig = {
	    	nameText: 'Properties Grid',
	        source:myPropObject,
	        propertyNames: myPropNames,
	        //autoHeight:true,
	        viewConfig : {
	            scrollOffset:2 // the grid will never have scrollbars
	        }
	    };
	    
	    this.applyPropertiesFromUINode(currElem, gridConfig, {
	    	width:'width',
	    	height:'height',
	    	frame: 'frame',
	    	border: 'border',
	    	autoHeight: 'autoHeight',
	    	autoScroll: 'autoScroll',
	    	region: 'region'
	    });
	    
	    if (title != null)
			gridConfig.title = title;
	    
	    var obj = new Smc.PropertyGrid(gridConfig);
	    
		this.loadPropertyListData(obj, currElem);
		
		var dataLink = currElem.getAttribute("dataLink");
		if (dataLink != null)
			this.addDataLink(obj.getId(), dataLink);
		
		return obj;
	},
	loadPropertyListData : function(obj, currElem) {
		var DOM = Smc.DOM;
		if (obj.customEditors)
			for (var key in obj.customEditors)
				obj.customEditors[key].destroy();
		
		obj.customEditors  = {};		
		
		var lineList =  DOM.getNodeList(currElem, "Line");
		for (var i = 0, len = lineList.length; i < len; i++)
		{	
			var lineNode = lineList.item(i);
			
			var type = lineNode.getAttribute("type");
			
			var entryList =  DOM.getNodeList(lineNode, "Entry");
			var id = entryList.item(0).getAttribute("id");

			if (type == "Combo")
			{
				var possibleValueList = DOM.getNodeList(lineNode, "PossibleValues/Entry");
			
				var myRecordArr = new Array();

				for (var j = 0, len2 = possibleValueList.length; j < len2; j++)
				{								
					var possibleValueElem = possibleValueList.item(j);
					var valueID = possibleValueElem.getAttribute("id");
					var displayName = possibleValueElem.getAttribute("value");
					myRecordArr[j] = [valueID, displayName];
				}

			    var myStore = new Ext.data.SimpleStore({
			        fields: ['id', 'text'],
			        data: myRecordArr
			    });

			    var combo = new Ext.form.ComboBox({
			    	store: myStore,
			    	name: id,
			        displayField:'text',
			        mode: 'local',
			        editable: false,
			        valueField: 'id',
			        forceSelection: false,
			        selectOnFocus:true,
			        typeAhead: true,
			        triggerAction: 'all'
			    });

				combo.addListener('select', Util.createDelegate(this.onPropertyGridChange, this, [obj], true));
				obj.customEditors[id] = new Ext.grid.GridEditor(combo);
			}
			else if (type == "String")
			{
			    var textField = new Ext.form.Field({
			    	name: id,
			    	inputType: "text",
			        triggerAction: 'all'
			    });		
			    textField.addListener('change', Util.createDelegate(this.onPropertyGridTextFieldChange, this, [obj], true));				
				obj.customEditors[id] = new Ext.grid.GridEditor(textField);
			}

			else if (type == "Option")
			{
			    var optionField = new Ext.form.Checkbox({
			    	name: id,
			    	inputType: "checkbox",
			        triggerAction: 'all'
			    });		
			    optionField.addListener('change', Util.createDelegate(this.onPropertyGridTextFieldChange, this, [obj], true));				
				obj.customEditors[id] = new Ext.grid.GridEditor(optionField);
			}	



		}
		
		var fieldDefList =  DOM.getNodeList(currElem, "Head/ColHead");
		for (var i = 0, len = fieldDefList.length; i < len; i++)
		{	
			var fieldDefElem = fieldDefList.item(i);
			
			var fieldName = this.t.t(fieldDefElem.getAttribute("name"));

			this.applyPropertiesFromUINode(fieldDefElem, obj.colModel.config[i], {
				width: 'width',
				sortable: 'sortable'
			});
			obj.colModel.config[i].header = fieldName;
		}
	},
	addActivateHandler : function(obj, currElem) {
		this.addHandler(obj, currElem, "activateHandler", "activate");
	},
	addRenderHandler : function(obj, currElem) {
		this.addHandler(obj, currElem, "renderHandler", "render");
	},
	addShowHandler : function(obj, currElem) {
		this.addHandler(obj, currElem, "showHandler", "show");
	},
	addHideHandler : function(obj, currElem) {
		this.addHandler(obj, currElem, "hideHandler", "hide");
	},	
	processContentHandler : function(configObject, currElem) {
		var contentHandlerRef = this.getEventHandlerRef(currElem, "contentHandler");
		if (typeof contentHandlerRef == "function")
		{
			var htmlCode = contentHandlerRef.call(this.getScope(currElem) || this.eventScope);
			configObject.html = htmlCode;
		}
	},
	processTitleHandler : function(configObject, currElem) {
		var contentHandlerRef = this.getEventHandlerRef(currElem, "titleContentHandler");
		if (typeof contentHandlerRef == "function")
		{
			var htmlCode = contentHandlerRef.call(this.getScope(currElem) || this.eventScope);
			configObject.title = htmlCode;
		}
	},
	addHandler : function(obj, currElem, handlerName, eventName) {
		var handlerFnTemp = this.getEventHandlerRef(currElem, handlerName);
		if (handlerFnTemp)
		{
			obj.addListener(eventName, function() {
				var handlerFn = this.getEventHandlerRef(currElem, handlerName);
				handlerFn.apply(this.getScope(currElem) || this.eventScope, arguments);
			}, this);
			handlerFnTemp = null;
		}
	},
	processViewportNode : function(currElem, contextObj) {
		var DOM = new Dom();
		var nodeList = DOM.getNodeList(currElem, "*");
		
		var items = new Array();
		for (var i = 0; i < nodeList.length; i++)
		{	
			var guiNode = nodeList.item(i);
			var guiNodeID = guiNode.getAttribute("id");
			var dataLink = guiNode.getAttribute("dataLink");			
			if (dataLink != null)
				contextObj.dataLink = dataLink; 
			
			var myobj = this.processGUINode(guiNode, null, contextObj);
			if (myobj != null)
			{
				items.push(myobj);
				if (guiNodeID != null && guiNodeID.length > 0)
				{
					this.guiObjects[guiNodeID] = myobj;
				}
			}
		}
		
		var myViewPort = new Ext.Viewport({
			layout: 'fit',
			items: items
		});

		return myViewPort;
	},
	processReferenceFieldNode : function(currElem) {
		var fieldName = currElem.getAttribute("name");
		var configObj = {
			name : fieldName,
			msgTarget: 'under',
			context: this.context,
			labelSeparator: ''
		};
		
		this.applyPropertiesFromUINode(currElem, configObj, {
			"objType": "referenceType",
			"isContentProperty": "isContentProperty",
			"namespace": "namespace"
		});
		
		var title = this.getTitle(currElem);
		if (title != null)
			configObj.fieldLabel = title;
			
		var contentElem = fieldName ? Smc.DOM.getSingleNode(currElem, fieldName) : null;
		if (contentElem)
			configObj.value = contentElem;
		
		var obj = new Smc.RefField(configObj);
		return obj;
	},
	processMultiReferenceFieldNode : function(currElem) {
		var fieldName = currElem.getAttribute("name");
		var configObj = {
			name : fieldName,
			msgTarget: 'under',
			context: this.context,
			labelSeparator: ''
		};
		
		this.applyPropertiesFromUINode(currElem, configObj, {
			"objType": "referenceType",
			"isContentProperty": "isContentProperty",
			"namespace": "namespace"
		});
		
		var title = this.getTitle(currElem);
		if (title != null)
			configObj.fieldLabel = title;
			
		var contentElem = fieldName ? Smc.DOM.getSingleNode(currElem, fieldName) : null;
		if (contentElem)
			configObj.value = contentElem;
		
		var obj = new Smc.MultipleRefField(configObj);
		return obj;
	},
	
	displayContext : function (showContext)
	{
		for (var obj in this.showContextBase)
		{
			var arr = this.showContextBase[obj];
			if (showContext == obj)
			{
				for (var i = 0; i < arr.elemList.length; i++)
				{
					this.show(arr.elemList[i]);
				}
			}
			else
			{
				for (var i = 0; i < arr.elemList.length; i++)
				{
					this.hide(arr.elemList[i]);
				}
			}
		}
	},
	storeFieldActions: function(currElem,objId){
		
		var actions = Smc.DOM.getSingleNode(currElem, "Actions");
		
		if(actions){
			this.actions[objId] = actions;
		}
	},
	/*
	 * applies properties/create each ext object based on the node type
	 * 
	 * @param currElem xmlElement
	 * @param parentObject DOM obj container
	 * @param contextObj DOM context
	 * 
	 * @retun obj ext object instance
	 */
	processGUINode : function (currElem, parentObject, contextObj) {
		var DOM = new Dom();
		
		var showContextAttr = DOM.getAttribute(currElem, "showContext");
		if (showContextAttr)
		{
			var id = DOM.getAttribute(currElem, "id");
			if (!this.showContextBase[showContextAttr]) 
			{
				this.showContextBase[showContextAttr] = new Object();
				this.showContextBase[showContextAttr].elemList = new Array();
			}
			this.showContextBase[showContextAttr].elemList.push(id);
		}
	
		
		if (contextObj == null)
			contextObj = new Object();
			
		var nodeName = DOM.getNodeName(currElem);
		
		
		var nodeList = DOM.getNodeList(currElem, "*");
		var obj = null;
		
		if (nodeName == "TreePanel")
		{
			obj = this.processTreePanelNode(currElem);
		}
		else if (nodeName == "FormPanel")
		{
			obj = this.processPanelNode(currElem, Ext.form.FormPanel);
		}
		else if (nodeName == "Panel")
		{
			obj = this.processPanelNode(currElem, Ext.Panel);
		}
		else if (nodeName == "Container")
		{
			obj = this.processPanelNode(currElem, Ext.Container);
		}
		else if (nodeName == "Combo")
		{
			return this.processComboNode(currElem, Ext.form.ComboBox);
		}
		else if (nodeName == "Flash")
		{
			return this.processFlashNode(currElem);
		}
		else if (nodeName == "SButton")
		{
			return this.processSButtonNode(currElem);
		}
		else if (nodeName == "MultipleCombo")
		{
			return this.processMultipleComboNode(currElem);
		}
		else if (nodeName == "MultiSelectCombo")
		{
			return this.processComboNode(currElem, Ext.ux.form.LovCombo);
		}
		else if (nodeName == "List")
		{
			obj = this.processListNode(currElem, contextObj);	
		}
		else if (nodeName == "TreeList")
		{
			obj = this.processTreeListNode(currElem, contextObj);	
		}		
		else if (nodeName == "PropertyList")
		{
			obj = this.processPropertyListNode(currElem);
		}
		else if (nodeName == "FieldVector")
		{
			obj = this.processVectorNode(currElem);
		}
		else if (nodeName == "Toolbar" || nodeName == "Statusbar")
		{			
			var barClass = nodeName == "Statusbar" ? Ext.StatusBar : Ext.Toolbar;
			
			var position = currElem.getAttribute("position");
			var configObj = {
				cls: 'smc-toolbar'
			};
			this.applyPropertiesFromUINode(currElem, configObj, {
				cls: 'cls',
				ctCls: 'ctCls',
				hidden: 'hidden',
				disabled: 'disabled',
				style: 'style',
				height: 'height'
			});
			if (position == "top" || position == "bottom") {
				configObj.dock = position;
				var newToolbar = new barClass(configObj);	
				var guiNodeID = currElem.getAttribute("id");
				if (guiNodeID)
					this.guiObjects[guiNodeID] = newToolbar;
				
				this.processToolbar(currElem, newToolbar, parentObject != null ? parentObject.id : "");
				
				if (parentObject.isPanel) {
					parentObject.addDocked(newToolbar);
				} else {
					parentObject.add(newToolbar);
				}
			} else {
				obj = new barClass(configObj);
			}

		}
		else if (nodeName == "TabPanel")
		{
			obj = this.processPanelNode(currElem, Ext.TabPanel);
		}
		else if (nodeName == "PluginCont")
		{
			var parentName = DOM.getNodeName(DOM.getParent(currElem)); 
			
			var title = this.getTitle(currElem);
			
			var configObject = new Object ();
			configObject.border = false;
			configObject.split = true;
			if (title != null) configObject.title = title;
			
			this.applyPropertiesFromUINode(currElem, configObject, {
				autoScroll : "autoScroll",
				collapsible : "collapsible",
				collapsed : "collapsed",
				region : "region", 
				height: "height",
				width: "width",
				split: 'split'
			});

			this.processContentHandler(configObject, currElem);
			
			obj = new Ext.Panel(configObject);
			
			this.processEventSubscriptions(currElem, obj);
			
			var dataLink = currElem.getAttribute("dataLink");
			if (dataLink != null)
				contextObj.dataLink = dataLink;
		}
		else if (nodeName == "ReferenceField")
		{
			obj = this.processReferenceFieldNode(currElem);
		}
		else if (nodeName == "MultiReferenceField")
		{
			obj = this.processMultiReferenceFieldNode(currElem);
		}
		else if (nodeName == "Toolbar.Spacer")
		{
			obj = this.processToolbarSpacerNode();
		}
		else if (nodeName == "Toolbar.Fill")
		{
			obj = new Ext.Toolbar.Fill();
		}
		else if (nodeName == "Toolbar.TextItem")
		{
			var text = "";
			var titleContentHandlerRef = this.getEventHandlerRef(currElem, "contentHandler");
			if (titleContentHandlerRef != null)
			{
				text = titleContentHandlerRef.call(this.eventScope);
			}
			var cls = currElem.getAttribute("cls");
			if (cls)
				text = "<span class='" + cls + "'>" + text + "</span>";
			obj = new Ext.Toolbar.TextItem(text);
		}
		else if (nodeName == "Toolbar.ImgItem")
		{
			var src = "";
			var srcContentHandlerRef = this.getEventHandlerRef(currElem, "contentHandler");
			if (srcContentHandlerRef != null)
			{
				src = srcContentHandlerRef.call(this.eventScope);
			}
			var cls = currElem.getAttribute("cls");
			obj = new Ext.Toolbar.TextItem(src);
		}
		else if (nodeName == "Menu")
		{
			var configObject = {
				shadow: false
			};
			obj = new Ext.menu.Menu(configObject);
		}
		else if (nodeName == "MenuItem")
		{
			var configObject = {};
			
			configObject.text = this.getTitle(currElem);
			
			this.applyPropertiesFromUINode(currElem, configObject, {
				cls: "cls",
				disabled: "disabled",
				itemId : "id",
				hidden: "hidden"
			});
			
			var iconFilename = currElem.getAttribute("iconFilename");
            var procedureName = currElem.getAttribute("procedureName");
            var procedureParam = currElem.getAttribute("handlerParam");
            var procedurePopup = currElem.getAttribute("procedurePopup");

			var iconURL;
			if (iconFilename)
				configObject.icon = this.context.getParameter('UI_IMG_URL') + '/icons/' + iconFilename;
			
            if(procedureName){
                configObject.procedureName = procedureName;
            }
            if(procedureParam){
                configObject.procedureParam = procedureParam;
            }
            if(procedurePopup){
                configObject.procedurePopup = procedurePopup;
            }

			var tooltip = currElem.getAttribute("tooltip");
			var tooltipTranslated = tooltip ? this.t.t(tooltip) : null;


			var menuList = DOM.getChildElements(currElem, "Menu");
			for (var i = 0; i < menuList.length; i++)
			{	
				var menu = menuList.item(i);
				var menuConfigObj = this.processGUINode(menu);
				configObject.menu = menuConfigObj;
			}
			
			obj = new Ext.menu.Item(configObject);
			
			this.addHandler(obj, currElem, null, "click");
		}
		else if (nodeName == "Window")
		{
			obj = this.processWindowNode(currElem);
		}
		else if (nodeName == "RichText")
		{
			obj = this.processRichAreaNode(currElem);
		}
		else if (nodeName == "MultipleUploadField")
		{
			obj = this.processMultipleUploadNode(parentObject,currElem);
			this.addTooltipHelp(currElem, obj);
		}	
		else if (nodeName == "CustomTextField" || nodeName == "TextField" || nodeName == "UploadField" || nodeName == "Checkbox"
				 || nodeName == "TextArea"  || nodeName == "DateField" || nodeName == "Option"
				 || nodeName == "OptionGroup" || nodeName =="Checkgroup")
		{
			var name = currElem.getAttribute("name");
			var helpIcon = DOM.getAttribute(currElem, "helpIcon");
			
			var configObj = {
				name : name,
				msgTarget: 'under',
				labelSeparator: ''
			};
			
			var title = this.getTitle(currElem);
			if (title != null)
				configObj.fieldLabel = title;				
			
			var emptyText  = currElem.getAttribute("emptyText");
			if (emptyText)
				configObj.emptyText = this.t.t(emptyText);	
			
			this.applyPropertiesFromUINode(currElem, configObj, {
				id: 'id',
				width: 'width',
				maxWidth: 'maxWidth',
				height: 'height',
				hideLabel : 'hideLabel',
				checked: 'checked',
				disabledClass : 'disabledClass',
				readOnly: 'readOnly',
				hidden: 'hidden',
				disabled:'disabled',
				cls: 'cls',
				itemCls: 'itemCls',
				ctCls: 'ctCls',
				enableKeyEvents: 'enableKeyEvents',
				value: 'value',
				fieldClass: 'fieldClass',
				inputType: 'inputType',
				invalidText :'invalidText',
				inputValue: 'inputValue',
				name: 'name',
				vtype: 'vtype',
				allowBlank: 'allowBlank',
				labelStyle: 'labelStyle',
				"isContentProperty": "isContentProperty",
				"namespace": "namespace" // custom property
			});

			// apply value manually in order to avoid automatic type conversion
			if ((nodeName == "TextField" || nodeName == "CustomTextField") 
					&& currElem.getAttribute("value") !== null)
				configObj.value = currElem.getAttribute("value");

			if (currElem.getAttribute("translateValue"))
				configObj.value = this.t.t(currElem.getAttribute("translateValue"));

			if (currElem.getAttribute("invalidText"))
			{
				configObj.invalidText = this.t.t(currElem.getAttribute("invalidText"));
				configObj.validator = function(val) {
					if (currElem.getAttribute("dataType") == "numeric")
						return val.trim().length > 0 && val != "-" ? !isNaN(val.replace(",", ".")): true;
					else
						return val ? true : this.invalidText;
				};
			}
			
			if (nodeName == "UploadField")
				configObj.inputType = "file";
			
			if (nodeName == "Checkbox")
			{
				var boxLabel = currElem.getAttribute("boxLabel");
				var boxName = DOM.getAttribute(currElem, "name") || DOM.getAttribute(currElem, "id");
				
				if (boxLabel)
					configObj.boxLabel = this.t.t(boxLabel);
				
				if (boxName)
					configObj.name = boxName;

				obj = new Ext.form.Checkbox(configObj);
				
				this.storeFieldActions(currElem, obj.getId());
				this.addHandler(obj, currElem, null, "check");
			}
			else if (nodeName == "Option")
			{
				var boxLabel = currElem.getAttribute("boxLabel");
				var boxName = DOM.getAttribute(currElem, "name") || DOM.getAttribute(currElem, "id");
				var boxValue = DOM.getAttribute(currElem, "value");
				
				if (boxLabel)
					configObj.boxLabel = this.t.t(boxLabel);
				
				if (boxName)
					configObj.name = boxName;
				
				if (boxValue)
					configObj.inputValue = boxValue;
				
				configObj.inputType = "radio";
				
				obj = new Ext.form.Radio(configObj);
				
				this.addHandler(obj, currElem, null, "check");
			}
			else if (nodeName == "OptionGroup")
			{				
				var nodeList = DOM.getNodeList(currElem, "Option");

				var items = [];
				for (var i = 0; i < nodeList.length; i++)
				{	
					var guiNode = nodeList.item(i);

					var myobj = this.processGUINode(guiNode);
					
					if (myobj != null)
					{
						items.push(myobj);

						var guiNodeID = DOM.getAttribute(guiNode, "id") || DOM.getAttribute(guiNode, "name");
						if (guiNodeID)
							this.guiObjects[guiNodeID] = myobj;
					}
				}
		
				configObj.items = items;
				
				// TODO commented because it gets too wide. Why was it set to true in the first place? 
				// configObj.autoWidth = true;

				this.applyPropertiesFromUINode(currElem, configObj, {
					'columns': 'columns',
					'value' : 'value',
					'disabled':'disabled'
				});
			
				obj = new Ext.form.RadioGroup(configObj);
				
				this.storeFieldActions(currElem, obj.getId());
				this.addHandler(obj, currElem, null, "change");
				
				var filter = DOM.getAttribute(currElem, "setsFilter");
				
				// vector filters
				if (filter) {

					var pNode = currElem.parentNode;
					// TODO this gui ID should be hardcoded
					var fField = Smc.DOM.getSingleNode(DOM.getParent(pNode), "descendant-or-self::*[@id='note.field."
							+ filter + "']");
					var vector = fField.parentNode;
					var vectorName = Smc.DOM.getAttribute(vector, "name");

					obj.on('change', function(obj, checked) {

						if (checked.inputValue != "all") {
							this.ds[vectorName].filter([ {
								property : "note.field." + filter,
								value : checked.boxLabel
							} ]);
						} else {
							this.ds[vectorName].clearFilter();
						}

					}, this);
				}
			    
			    this.addTooltipHelp(currElem, obj);

				var guiNodeID = DOM.getAttribute(currElem, "id");
				
				if (guiNodeID)
					this.guiObjects[guiNodeID] = obj;
				
				return obj;
			}
			else if (nodeName == "Checkgroup")
			{				
				var nodeList = DOM.getNodeList(currElem, "Checkbox");
				
				var defaultValues = DOM.getAttribute(currElem, "checked");
				
				if(defaultValues)
					defaultValues = defaultValues.split(",");
				
				var isResetOthersPresent = DOM.getSingleNode(currElem, 
						"descendant-or-self::*[string-length(@resetOthers) > 0]");

				var items = [];
				for (var i = 0; i < nodeList.length; i++)
				{	
					var guiNode = nodeList.item(i);
					var guiNodeVal = DOM.getAttribute(guiNode, "inputValue");
					var resetOthers = DOM.getAttribute(guiNode, "resetOthers");
					
					if(defaultValues){
						for(var z = 0; z < defaultValues.length; z++){
							if(defaultValues[z] == guiNodeVal)
								DOM.setAttribute(guiNode,"checked", "true");
						}
					}

					var myobj = this.processGUINode(guiNode);
					
					/*Reset other checks on check and reset the resetter on check another item*/
					if(resetOthers){
					
						myobj.on("check",function(o,i){
							if(o.ownerCt && i==true){
								o.ownerCt.items.each(function(it){
									if(o.id != it.id)
										it.setValue(false);
																		
								},this);
							}
						});
						
						var objReset = myobj;
					}
					
					if(isResetOthersPresent && objReset && !resetOthers){
						
						myobj.on("check",function(o,i){
							if(i==true){
								if(o.inputValue != objReset.inputValue){
									objReset.setValue(false);
								}
							}
						});
					}
					
					if (myobj != null)
					{
						items.push(myobj);
						
						var guiNodeID = DOM.getAttribute(guiNode, "name");
						if (guiNodeID)
							this.guiObjects[guiNodeID] = myobj;
					}
				}
				
				configObj.items = items;
				
				this.applyPropertiesFromUINode(currElem, configObj, {
					'columns': 'columns',
					'disabled':'disabled'
				});
				
				obj = new Ext.form.CheckboxGroup(configObj);
				
				var filter =  DOM.getAttribute(currElem, "setsFilter");
				
				// vector filters
			    if(filter){
		    		obj.on('change', function(obj, checked) {
						
						if(checked.inputValue!="all"){
							this.ds.filter([{property: "note.field."+filter, value: checked.inputValue}]);
						}else{
							this.ds.clearFilter();
						}
					}, this);
				}
			    
				var guiNodeID = DOM.getAttribute(currElem, "name");
				if (guiNodeID)
					this.guiObjects[guiNodeID] = obj;
				
				this.addTooltipHelp(currElem, obj);
				return obj;
			}
			else if (nodeName == "TextArea")
			{
				var textAreaMode = currElem.getAttribute("mode");
				
				switch( textAreaMode )
				{
					case "HtmlEditor": 
						this.applyPropertiesFromUINode(currElem, configObj, {
							enableAlignments: 'enableAlignments',
							enableColors: 'enableColors',
							enableFont: 'enableFont',
							enableFontSize: 'enableFontSize',
							enableLinks: 'enableLinks',
							enableLists: 'enableLists',
							enableSourceEdit: 'enableSourceEdit'
						});
						
						configObj.plugins = [ new Ext.ux.form.HtmlEditor.SubSuperScript() ];
						
						obj = new Ext.form.HtmlEditor(configObj); 
						break;
						
					default: 
						obj = new Ext.form.TextArea(configObj); 
						break;
				}
			}
			else if (nodeName == "DateField")
			{
				if (configObj && !configObj.format)
					configObj['format'] = 'Y-m-d';
				if (configObj.value)
				{
					var format = currElem.getAttribute("parseFormat");
					configObj.value = format ? Date.parseDate(configObj.value, format)
							: new Date(configObj.value);
				}
				obj = new Ext.form.DateField(configObj);

			}
			else if (nodeName == "CustomTextField")
			{
				this.applyPropertiesFromUINode(currElem, configObj, {
					beforeInput: 'beforeInput',
					afterInput: 'afterInput'
				});
				
				obj = new Ext.smc.form.CustomTextField(configObj);
			}
			else
			{
				obj = Ext.create("Ext.form.field.Text", configObj);
			}
			if (nodeName == "TextField" || nodeName == "TextArea") {
				this.addHandler(obj, currElem, "keyupHandler", "keyup");
				this.addHandler(obj, currElem, "specialkeyHandler", "specialkey");
				this.addTooltipHelp(currElem, obj);
			}
	    	var dataLink = DOM.getAttribute(currElem, "dataLink");
		    if (dataLink != null)
	    	{
	    		this.addDataLink(obj.getId(), dataLink);   		
	    		obj.addListener('specialkey',this.onTextFieldEnter, this);
	    	}
	    	
	    	obj.on('beforedestroy', function(field) {
	    		if (field.isFormField && field.el && field.el.dom)
					Ext.destroy(field.el.up(".x-form-item"));
	    	}, this);

	    	this.addHandler(obj, currElem, "focusHandler", "focus");
		}
		else if (nodeName == "Label")
		{
			var id = currElem.getAttribute("id");
			var name = currElem.getAttribute("name");
			var configObj = {
				//id : id
			};
			
			this.applyPropertiesFromUINode(currElem, configObj, {
				width: 'width',
				text: 'text',
				cls: 'cls',
				ctCls: 'ctCls',
				autoHeight: 'autoHeight',
				style: 'style',
				labelStyle: 'labelStyle'
			});
			
			var objTitle = this.getTitle(currElem);
			configObj.text = objTitle;

			obj = new Ext.form.Label(configObj);
			if (id)
				obj.smcId = id;
			if (name)
				obj.smcName = name;
		}
		else if (nodeName == "UI")
		{}
		else if (nodeName == "Item")
		{}
		else if (nodeName == "State")
		{}
		else if (nodeName == "Toolbar.Separator")
		{
			obj = new Ext.Toolbar.Separator();
		}
		else if (nodeName == "PanelContainer")
		{
			obj = this.processPanelNode(currElem, Ext.Panel);
		}		
		else if (nodeName == "Tab")
		{		
			obj = this.processPanelNode(currElem, Ext.Panel);
		}		
		else if (nodeName == "Button" || nodeName == "SplitButton")
		{
			return this.processButtonNode(currElem);	
		}
		else if (nodeName == "Remark" )
		{			
			return this.processRemarkNode(currElem);	
		}
		else if (nodeName == "Link" )
		{
			return this.processLinkNode(currElem);	
		}
		else if (nodeName == "Group" || nodeName == "CustomGroup")
		{
			var hidden = false;
			var disabled = false;
			
			var status = Smc.DOM.getAttribute(currElem, "defaultState");
			
			switch (status) {
				case "Hide":
					hidden = true;
					break;
				case "Disable":
					disabled = true;
					break;
	
				default:
					hidden = false;
				 	//disabled = false;
					break;
			}

			var configObj = {
				autoHeight: true,
				labelWidth:150,
				hidden:hidden,
				disabled:disabled
			};

			if (Ext.isIE6) {
				configObj.forceLayout = true;
				configObj.hideMode = "offsets";
			}

			var checkboxDefault = currElem.getAttribute("checked");
			if(checkboxDefault) {
				if(checkboxDefault=="true") {
					configObj.collapsed = false;
				} else {
					configObj.collapsed = true;
				}
			}

			this.applyTitle(currElem, configObj);
			this.processContentHandler(configObj, currElem);
	
			this.applyPropertiesFromUINode(currElem, configObj, {
				disabled : 'disabled',
				collapsible: 'collapsible',
				collapsed: 'collapsed',
				layout: 'layout',
				bodyStyle: 'bodyStyle',
				style: 'style',
				labelAlign: 'labelAlign',
                labelWidth: 'labelWidth',
				title:'displayname',
				autoHeight:'autoHeight',
				hidden : 'hidden',
                itemCls: 'itemCls',
				cls: 'cls',
				checkboxToggle:'checkbox',
				labelWidth:	'labelWidth',
                name: 'name',
				border: 'border'
			});
			
			if(nodeName == "CustomGroup")
				obj = new Ext.smc.form.CustomFieldSet(configObj);
				//obj = new Ext.form.FieldSet(configObj);
			else
				obj = new Ext.form.FieldSet(configObj);

			this.addShowHandler(obj, currElem);
			this.addHideHandler(obj, currElem);
			
			this.addHandler(obj, currElem, "expandHandler", "expand");
			
			// obj.addEvents({validate:true});
			
			if(hidden == true) {
			    obj.on("show",function(o){
				    //try to recalculate height
					    try{
						    o.ownerCt.setHeight("auto");
					    }
					    catch(e){
					    //	alert(e);
					    }
			    }, this);
			}
		}
		else if (nodeName == "Radio")
		{
			var name = currElem.getAttribute("name");
			var value = currElem.getAttribute("value");
			var title = this.getTitle(currElem);
			var isDefaultStr = currElem.getAttribute("default");
			var isDefault = (isDefaultStr != null && isDefaultStr.toLowerCase() == "true") ? true : false;

			var configObj = {
				name : name,
				inputValue : value,
				checked : isDefault,
				fieldLabel : title
			};

			var boxLabel = currElem.getAttribute("boxLabel");
			if (boxLabel)
				configObj.boxLabel = this.t.t(boxLabel);

			obj = new Ext.form.Radio(configObj);
		}
		else if (nodeName == "Hidden")
		{
			var name = currElem.getAttribute("name");
			var value = currElem.getAttribute("value");
			var configObj = {
				name: name,
				value: value
			};
			obj = new Ext.form.Hidden(configObj);
		}
		else if (nodeName == "KeywordField")
		{
			var title = this.getTitle(currElem);
			
			var recordArr = [];
			var keywords = currElem.getAttribute("keywords");
			if (keywords) {
				var keywordsArr = keywords.split(",");
				var avoidDuplicateArr = [];
				for (var i = 0, len = keywordsArr.length; i < len; i++)
				{
					var val = keywordsArr[i].trim();
					if (val.length > 0 && avoidDuplicateArr.indexOf(val) == -1)
					{
						recordArr.push([val]);
						avoidDuplicateArr.push(val);
					}
				}
			}
			
			var store = new Ext.data.SimpleStore({
		        fields: ['id'],
		        data: recordArr
		    });
			
			var configObj = {
				xtype:'superboxselect',
				fieldLabel: title,
				anchor:'100%',
				store: store,
				mode: 'local',
				displayField: 'id',
				displayFieldTpl: '{id}',
				allowAddNewData: true,
				valueField: 'id',
				listeners: {
                    newitem: function(bs,v){
                        var newObj = {
                            id: v
                        };
                        bs.addItem(newObj);
                    }
				}
			};
			
			this.applyPropertiesFromUINode(currElem, configObj, {
				width: 'width',
				hideLabel : 'hideLabel',
				disabledClass : 'disabledClass',
				readOnly: 'readOnly',
				cls: 'cls',
				itemCls: 'itemCls',
				ctCls: 'ctCls',
				value: 'value',
				name: 'name',
				allowAddNewData: 'allowAddNewData',
				"isContentProperty": "isContentProperty" // custom property
			});
			
			obj = new Ext.ux.form.SuperBoxSelect(configObj); 
		}
		else if (nodeName == "Viewport")
		{
			return this.processViewportNode(currElem, contextObj);
		}

		if (!obj)
			return obj;
		
		var lazyChildRenderingStr = currElem.getAttribute("lazyChildRendering");
		var lazyChildRendering = lazyChildRenderingStr != null ? lazyChildRenderingStr.toLowerCase() == "true" : false;
		
		if (lazyChildRendering == true)
		{
			var eventName = "activate";
			if (currElem.parentNode && currElem.parentNode.getAttribute("layout") == "accordion")
				eventName = "expand";
			
			obj.addListener(eventName, function() {
				this.renderChildren(currElem, obj, contextObj);
			}, this, {
				single:true
			});
			var toolbarElem = DOM.getSingleNode(currElem, "Toolbar");
			if (toolbarElem)
				this.processGUINode(toolbarElem, obj, contextObj);
			return obj;
		}
		
		if (nodeName != "MenuItem" && nodeName!="FieldVector")
		{
			var nodeList = DOM.getNodeList(currElem, "*");
			for (var i = 0; i < nodeList.length; i++)
			{	
				var guiNode = nodeList.item(i);
				var guiNodeID = guiNode.getAttribute("id");
				var dataLink = guiNode.getAttribute("dataLink");			
				if (dataLink)
					contextObj.dataLink = dataLink; 
				
				var myobj = this.processGUINode(guiNode, obj, Util.copyObject(contextObj));
							
				if (myobj != null)
				{
					obj.add (myobj);
					if (guiNodeID)
						this.guiObjects[guiNodeID] = myobj;
					
					var monitorResizeAttr = guiNode.getAttribute("monitorResize");
					var monitorResize = monitorResizeAttr != null ? monitorResizeAttr.toLowerCase() == "true" : false;
					
					if (monitorResize)
						obj.addListener("resize", this.onResizeHandlerInternal, myobj);
				}
			}
		}
		return obj;
	},
	addTooltipHelp : function (currElem, obj) {
		var toolTipElem = Smc.DOM.getChildElement(currElem, "tooltip");
		if (toolTipElem!=null) {
			var ajaxLoad = Smc.DOM.getAttribute(toolTipElem, "ajaxPetition");
			var newUri = Smc.System.getBrokerURL() + "/plugin-transformer?uri="
					+ Smc.DOM.getAttribute(toolTipElem, "uri") + "&objType="
					+ Smc.DOM.getAttribute(toolTipElem, "objType") + "&language="
					+ Smc.DOM.getAttribute(toolTipElem, "language") + "&topicID="
					+ Smc.DOM.getAttribute(toolTipElem, "fieldID") + "&serverID="
					+ this.context.getCurrentDataServerID() + "&plugin=doc&trafo=Tooltip";

			var data = Smc.DOM.getText(toolTipElem);
			if ((data != null && data.length > 0) || ajaxLoad=="true") {
				
				obj.on("render", function(ob) {

					var configObj = new Object();

					if(ajaxLoad=="true") {//tooltip comes in html format
					
						var configObj = {
							width: 500,
							html:null,
							autoLoad: {url: newUri},
							dismissDelay: 15000,
							target: "bottomCallout",
							anchor: "top"
						};							

					}
					else //we have plain text
					{
						var configObj = {
							html: data,
							dismissDelay: 15000,
							target: "bottomCallout",
							anchor: "top"							
						}
					}
					 
					var tt = new Ext.ToolTip(configObj);

					var t = new Ext.Template("<div id='{1}' style='float:left;padding-left:10px'><img border='0' src='{0}'></div>");
					var tid = ob.getId()+"-tc";

					var myServerUri = Smc.System.getBrokerURL() + "/client/images/ec/icons/help.png"; 

					//the last html element is a div that makes a clear.. so inserting before the last child puts it in the righ place 
					var tNode = t.insertBefore(ob.itemCt.dom.lastChild, [myServerUri, tid], true);
					
					var pClass="padding-left:2px !important;float:left";

					tNode.dom.previousSibling.setAttribute("style", pClass);
					
					tt.initTarget(tid);
				});
			}
		}
	},
	getDataArray : function(guiElem) {
		var DOM = new Dom();
		var myRecordArr = new Array();
		var itemNodes = DOM.getNodeList(guiElem, "Item");
		for (var j = 0; j < itemNodes.length; j++)
		{	
			var itm = itemNodes.item(j);
			
			var id = itm.getAttribute("id");
			var text = itm.getAttribute("text");
			var itmLabelID = itm.getAttribute("LabelID");
			
			if (itmLabelID != null)
				text = this.t.t(itmLabelID);
			
			myRecordArr.push([id, text]);
		}
		return myRecordArr;
	},
	/*
	 * This method renders a EXT JS component again. Note that this will not work always
	 * because sometimes an EXT JS component cannot be added to an already rendered container.
	 * This happens when using for example a border layout: Replacing a region panel is not possible.
	 * */
	refreshGuiObject : function(objectID, useRefreshDatasource, restoreRefreshOnReuseAttribute, executeRefreshHandler) {
	
		var guiObject = this.getGuiObject(objectID);
		
		if (guiObject == null)
			return;
		
		var objectsUINode = this.getGuiNode(objectID);
		if (objectsUINode == null)
			throw new Error("Could not find gui description of gui object: " + objectID);
		
		if (restoreRefreshOnReuseAttribute === true)
		{
			objectsUINode.setAttribute("refreshOnReuse", "true");
			delete this.refreshSleeperStore[objectID];
		}
		else if (this.refreshSleeperStore[objectID])
		{
			objectsUINode.setAttribute("refreshOnReuse", "true");
			var sleeperConfig = this.refreshSleeperStore[objectID];
			delete this.refreshSleeperStore[objectID];
			sleeperConfig.guiObject.removeListener(sleeperConfig.eventName, sleeperConfig.fn, this);
		}
		
		var nn = objectsUINode.nodeName;
		
		var titleContentHandlerRef = this.getEventHandlerRef(objectsUINode, "titleContentHandler");
		if (titleContentHandlerRef)
		{
			var htmlCode = titleContentHandlerRef.call(this.eventScope);
			guiObject.setTitle(htmlCode);
		}
		
		var contentHandlerRef = this.getEventHandlerRef(objectsUINode, "contentHandler");
		if (contentHandlerRef)
		{
			var htmlCode = contentHandlerRef.call(this.eventScope);
			
			if (Smc.DOM.getNodeName(objectsUINode) == "Toolbar.ImgItem")
			{
				guiObject.getEl().innerHTML = htmlCode;
			}
			else
			{
				if (Ext.isIE)
				{
					guiObject.body.dom.innerHTML = "";
					guiObject.body.dom.innerHTML = htmlCode;
					//$(guiObject.body.dom).html(htmlCode); --> crashes XML Spy sometimes
				}
				else
				{
					$("*", guiObject.body.dom).remove();
					$(guiObject.body.dom).html(htmlCode);
				}
			}
		}
		else if (nn == "TreePanel")
		{
			this.reloadTreeNodes(objectID);
		}
		else if (nn == "List" || nn == "PropertyList" || nn == "Combo")
		{
			var resolvedNode;
			if (useRefreshDatasource === false)
				this.reloadDataSource(objectID, false);
			else
				this.reloadDataSource(objectID, true);
		}
		else if (nn == "Toolbar")
		{
			var parentGuiObject = guiObject;
			if (parentGuiObject == null)
				throw new Error("Can't refresh gui object because there is no parent!");
			
			var resolvedNode;
			if (useRefreshDatasource === false)
				resolvedNode = this.resolveDatasources(objectsUINode, false);
			else
				resolvedNode = this.resolveDatasources(objectsUINode, true);
			
			
			//get the childs items
			var childItems = Smc.DOM.getNodeList(resolvedNode,"//State/*");
		
			//remove all the items 
			parentGuiObject.removeAll();
			for ( var i = 0; i < childItems.length; i++) {
				
				var child = childItems[i];
			
				var newGUIObject = this.processGUINode(child, parentGuiObject, null);
				
				parentGuiObject.add(newGUIObject);
			}
			
			parentGuiObject.doLayout();
			parentGuiObject.enable();
		}
		else
		{
			var parentGuiObject = guiObject.ownerCt;
			if (parentGuiObject == null)
				throw new Error("Can't refresh gui object because there is no parent!");
			
			
			if (guiObject.body)
				this.removeXMLSpyEditor(guiObject.body.dom);
			
			delete this.guiObjects[objectID];
			delete this.eventArray[guiObject.getId()];
			
			parentGuiObject.remove(guiObject, true);
			
			guiObject = null;
			
			var resolvedNode;
			if (useRefreshDatasource === false)
				resolvedNode = this.resolveDatasources(objectsUINode, false);
			else
				resolvedNode = this.resolveDatasources(objectsUINode, true);
			
			var searchNode = objectsUINode;
			
			var newGUIObject = this.processGUINode(resolvedNode, parentGuiObject, null);
			
			parentGuiObject.add(newGUIObject);
			parentGuiObject.doLayout();
			parentGuiObject.enable();
			
			this.guiObjects[objectID] = newGUIObject;
		}
		
		if (executeRefreshHandler) {
			var refreshHandler = this.getEventHandlerRef(objectsUINode, "refreshHandler");
			if (typeof refreshHandler == "function")
				refreshHandler.call(this.eventScope);
		}
	},
	reloadTreeNodes : function(objectID, useRefreshDatasource) {
		var guiObject = this.getGuiObject(objectID);
		if (!guiObject)
			return;
		var objectsUINode = this.getGuiNode(objectID);
		if (objectsUINode == null)
			throw new Error("Could not find gui description of gui object: " + objectID);
		
		var resolvedNode;
		if (useRefreshDatasource === false)
			resolvedNode = this.resolveDatasources(objectsUINode, false);
		else
			resolvedNode = this.resolveDatasources(objectsUINode, true);
		
		var rootNode = guiObject.getRootNode();
		while (rootNode.hasChildNodes())
			rootNode.removeChild(rootNode.firstChild);
		
		var nodeClickHandler = this.getEventHandlerRef(resolvedNode, "nodeClickEventHandler");
		
		this.processTreeNode(resolvedNode, rootNode, nodeClickHandler);
		
		rootNode.expand();
	},
	reloadDataSource : function(objectID, useRefreshDatasource) {					
		
		var guiObject = this.getGuiObject(objectID);
		if (!guiObject)
			return;
		var objectsUINode = this.getGuiNode(objectID);
		if (objectsUINode == null)
			throw new Error("Could not find gui description of gui object: " + objectID);
		
		var reconfigureColumns = objectsUINode.getAttribute("reconfigureColumns")=="true";
		
		var resolvedNode;
		if (useRefreshDatasource === false)
			resolvedNode = this.resolveDatasources(objectsUINode, false);
		else
			resolvedNode = this.resolveDatasources(objectsUINode, true);
		
		var nn = objectsUINode.nodeName;
		if (nn == "PropertyList")
		{
			var listSource = this.getPropertyListSource(resolvedNode);
			var myPropNames = this.getPropertyListNames(resolvedNode);
			guiObject.propertyNames = myPropNames;
			guiObject.setSource(listSource);
			this.loadPropertyListData(guiObject, resolvedNode);
			if (guiObject.rendered)
				guiObject.getView().refresh(true);
		}
		else
		{					
			var newDataArr;
			if (nn == "List")
			{
				newDataArr = this.getListRowData(resolvedNode);
			}
			else
			{
				newDataArr = this.getDataArray(resolvedNode);
			}
			
			var myRecordArr = new Array();
			if (objectsUINode.getAttribute("forceSelection") == "false")
				myRecordArr.push(["", "-"]);
			
			newDataArr = myRecordArr.concat(newDataArr);					
			
			var colHeadList = Smc.DOM.getNodeList(resolvedNode, "Head/ColHead");			
			
			if(reconfigureColumns && plus != 0)
			{
				// retrieve colModel and store
				var cm = guiObject.getColumnModel();
				var config = this.getColumnConfig(colHeadList);
				var gridConfig = this.getGridConfig(resolvedNode, cm, null, config.idIndex, config.autoexpandField, 
						config.startGroupField, config.groupFields, config.readerConfig);
			  	
				guiObject.reconfigure(gridConfig.store, new Ext.grid.ColumnModel(config.columnModelConfig));
			}
			else
			{
				var guiObjectStore = guiObject.store;	
				guiObjectStore.removeAll();
				guiObjectStore.loadData(newDataArr);	
				
				if (nn == "List")
				{
					var cm = guiObject.getColumnModel();
					var plus = cm.getColumnCount() - colHeadList.length;
					var groupByField = Smc.DOM.getSingleNode(resolvedNode, "Head/ColHead[@groupBy = 'true']");
					if (groupByField && guiObjectStore.groupBy)
					{
						var fieldName = groupByField.getAttribute("name");
						guiObjectStore.groupBy(fieldName, true);
					}								
					
					for (var i = 0; i < colHeadList.length; i++)
					{
						var colName = colHeadList[i].getAttribute("LabelID") ? colHeadList[i].getAttribute("LabelID") : colHeadList[i].getAttribute("name");					
						cm.setColumnHeader(i + plus, this.t.t(colName));
					}

					// necessary because otherwise grid rows sometimes don't show up
					if (guiObject.rendered)
						guiObject.syncSize();
				}
			}
		}
	},

	restoreAllHeights : function(parentObjID) {
		this.restoreAll(parentObjID, "height");
	},
	restoreAllWidths : function(parentObjID) {
		this.restoreAll(parentObjID, "width");
	},
	restoreAll : function(parentObjID, widthOrHeight) {

		var parentUINode = this.getGuiNode(parentObjID);
		var parentGuiObject = this.getGuiObject(parentObjID);
		if (!parentGuiObject.rendered)
			return;
		var sumWidth = 0;

		var parentWidth;
		if (widthOrHeight == "width") {
			parentWidth = parentGuiObject.getInnerWidth();
		} else {
			parentWidth = parentGuiObject.getInnerHeight();
		}

		var panelList = Smc.DOM.getNodeList(parentUINode, "FormPanel | Panel | List");
		for ( var i = 0; i < panelList.length; i++) {
			var myWidth = panelList[i].getAttribute(widthOrHeight);
			var region = panelList[i].getAttribute("region");
			var id = panelList[i].getAttribute("id");

			if (region == "center") {
				var centerRegionID = id;
			} else if (!region) {
				var centerRegionID = id;
			} else if (id) {
				if (myWidth)
					sumWidth = sumWidth + parseInt(myWidth);
				var childGuiObject = this.getGuiObject(id);

				if (widthOrHeight == "width") {
					childGuiObject.setWidth(myWidth);
				} else {
					childGuiObject.setHeight(myWidth);
				}
			}
		}
		var centerWidth = parentWidth - sumWidth;
		if (centerRegionID) {
			var centerGuiObject = this.getGuiObject(centerRegionID);

			if (widthOrHeight == "width") {
				centerGuiObject.setWidth(centerWidth);
			} else {
				centerGuiObject.setHeight(centerWidth);
			}
		}

		parentGuiObject.syncSize();
	},

	restoreWidth : function (objectID) {
		var guiObject = this.getGuiObject(objectID);
		if (!guiObject)
			return;
		var objectsUINode = this.getGuiNode(objectID);
		var w = objectsUINode.getAttribute("width");
		guiObject.setWidth(w);
	},

	syncSize : function (objectID) {
		var guiObject = this.getGuiObject(objectID);
		if (!guiObject)
			return;
		guiObject.syncSize();
	},


	/*
	collapse : function (objectID) {
		var guiObject = this.getGuiObject(objectID);
		if (!guiObject)
			return;
		guiObject.collapse();
	},
	*/
	
	
	
	activateComboItem : function (objectID, value)
	{
		var guiObj = this.getGuiObject(objectID);
		if (guiObj)
		{
			guiObj.setValue(value);
		}
	},
	
	
	getGuiNode : function(objectID) {
		return Smc.DOM.getSingleNode(this.uiNode, "descendant-or-self::*[@id = '" + objectID + "']");
	},
	addEvent : function (guiID, funcRef) {
		this.eventArray[guiID] = funcRef;
	},
	addDataLink : function (guiID, dataLink) {
		this.dataLinks[guiID] = dataLink;
	},	
	onComboChange : function (item, record, number)	{
		var method = this.eventArray[item.id];
		// TODO last param was "item.id" instead of "item" in risk branch
		// please check dependent code for compatibility with "item"
		method.call(this, record.data.id, record.data.text, record, item);
	},

	onListCellClick : function (grid, rowIndex, columnIndex) {

		var dataLink = this.dataLinks[grid.getId()];		
		var eventObj = new Object ();
		eventObj.name = "ListCellClick";	
		eventObj.checkedID = "";	
		
		this.dataLinkHandler.fire(dataLink, eventObj, this.eventScope);		
	},
	// TODO CO ?
	getObjtCOName : function(name) {

		var strName = name;

		var strOpt = name.substring(0, 4);

		if (strOpt == "opt.") {
			strName = name.split(".")[1];

		} else {

			strOpt = name.substring(0, 11);

			// TODO shouldn't be hore
			if (strOpt == "note.field.") {
				strName = name.split(".")[2];
			}
		}
		return strName;
	}
	,
	/*
	 * executes show or hide to a fieldset @param ObjID: the object caller id
	 * @param chosenItm: the currently chosen item
	 */
	executeActions : function(objID, chosenItm) {

		var act = this.actions[objID];
		var obj = (typeof (chosenItm) == "object") ? chosenItm : Ext.getCmp(objID);

		if (!obj)
			obj = Ext.getCmp(objID);

		// button
		if (chosenItm.browserEvent) {
			if (chosenItm.browserEvent != null)
				obj = Ext.getCmp(objID);
		}

		// checkbox hack
		if (typeof (obj.checked) != "undefined" && obj.inputType != "radio") {

			obj.value = obj.checked;
		}

		var cv = null;
		var currentElementWithAutoShow = null;

		if (act) {

			cv = Smc.DOM.getNodeList(act, "descendant-or-self::*[@ifValueEq = '"
					+ ((obj.value) ? obj.value : obj.inputValue) + "']");

		}
		if (obj.name) {
			var strName = this.getObjtCOName(obj.name);
		} else {
			var strName = this.getObjtCOName(objID);
		}

		if (strName) {
			currentElementWithAutoShow = Smc.DOM.getSingleNode(this.guiDef, "descendant-or-self::*[@name='" + strName
					+ "' and string-length(Value/@autoShow) > 0] | descendant-or-self::*[@name='" + strName
					+ "' and string-length(@autoShow) > 0]");
			if (currentElementWithAutoShow) {

				var asP = null;
				asP = currentElementWithAutoShow.getAttribute("autoShow");

				if (!asP) {

					var vlist = Smc.DOM.getSingleNode(currentElementWithAutoShow, "Value");
					asP = vlist.getAttribute("autoShow");
				}
				var shareAutoshowList = Smc.DOM.getNodeList(Smc.DOM.getParent(currentElementWithAutoShow),
						"descendant::*[@autoShow='" + asP + "' and @name!='" + strName + "']");
			}
		}

		// standard actions
		if (cv) {

			for ( var i = 0; i < cv.length; i++) {

				var objToId = Smc.DOM.getAttribute(cv[i], "arg");
				var actionToApply = Smc.DOM.getAttribute(cv[i], "type");

				var objtTo = (this.getGuiObject(objToId)) ? this.getGuiObject(objToId) : this
						.getGuiObject("note.field." + objToId);
				try {

					if (actionToApply == "hide") {

						this.hide(objtTo.id);
					} else {

						this.show(objtTo.id);
						objtTo.removeClass("x-hide-display");

					}

				}
				// TODO empty catches should never be used, if necessary please
				// add comment why.
				catch (e) {// alert(e);

				}
			}
		}

		if (currentElementWithAutoShow) {
			this.controlRSH = 0;
			var forceShow = false;
			for ( var i = 0; i < shareAutoshowList.length; i++) {
				var e = shareAutoshowList[i];
				var fieldName = Smc.DOM.getAttribute(e, "name");
				if (strName != fieldName) {
					if (this.getFormFieldValue("note.field." + fieldName))
						forceShow = true;
				}
			}

			this.executeActionsSH(currentElementWithAutoShow, false, obj, shareAutoshowList, null, forceShow);
		}
	},
	executeActionsSH : function(fieldElem, hideAll, selObj, shareAutoshowList, skipG, forceShow) {

		var sAutoControl = false;
		this.controlRSH++;
		var vasList = Smc.DOM
				.getNodeList(fieldElem,
						"descendant-or-self::Value[string-length(@autoShow) > 0 ] | descendant-or-self::Field[string-length(@autoShow) > 0]");
		var fName = Smc.DOM.getAttribute(fieldElem, "name");
		var subAuto = fieldElem.getAttribute("subAutoShow");

		if (!subAuto) {
			this.preHideAll(fName);
		} else {

			if (selObj.checked == false)
				sbAut = true;
		}

		// Get all groups that are being set by autoshow ...
		// If a group is shown in one active Value, then show it.
		// if not hide it

		for ( var i = 0; i < vasList.length; i++) {

			var field = vasList[i];
			var objOwn = Smc.DOM.getAttribute(vasList[i], "autoShow");
			var lObjt = Smc.DOM.getAttribute(vasList[i], "displayname");

			var objtTo = (this.getGuiObject(objOwn)) ? this.getGuiObject(objOwn) : this.getGuiObject("note.field."
					+ objOwn);
			var obj = (this.getGuiObject(fName)) ? this.getGuiObject(fName) : this.getGuiObject("note.field." + fName);

			if (subAuto && sbAut || forceShow) {

				this.show(objtTo.id);
				// try to scroll to see the field
				try {
					objtTo.ownerCt.ownerCt.body.scrollTo('top', objtTo.getPosition()[1]);
				} catch (e) {
				}
				return;
			}

			if (!selObj)
				selObj = obj;

			if (selObj) {
				if (selObj.boxLabel == lObjt || selObj.id == obj.id) {

					if (selObj.checked == true || typeof (selObj.initButtonEl) == "function") {

						if (objtTo) {

							var fieldList = Smc.DOM.getNodeList(this.guiDef, "//Group[@name='" + objOwn + "']/Field");
							for ( var j = 0; j < fieldList.length; j++) {
								var fieldName = fieldList[j].getAttribute("name");
								var fieldObj = this.getGuiObject("note.field." + fieldName);

								if (typeof (fieldObj.reset) == "function") {
									if (fieldObj.defaultAutoCreate.type != "textarea") {
										try {

											fieldObj.reset();
										} catch (e) {
											alert(e)
										}
									}
								}
							}

							this.show(objtTo.id);
							// try to scroll to see the field
							try {
								objtTo.ownerCt.ownerCt.body.scrollTo('top', objtTo.getPosition()[1]);
							} catch (e) {
							}
							objtTo.removeClass("x-hide-display");

						}
					} else {

						if (objtTo && this.sAutoControl != objOwn) {

							this.hide(objtTo.id);

						}

						// Recursion || group
						if (!hideAll) {
							var asListc = this.chechAutoShowRec(fName);

							if (asListc && this.controlRSH < 9)
								this.executeActionsSH(asListc, true);

						} else {

							var asListc = Smc.DOM.getSingleNode(this.guiDef, "descendant-or-self::*[@name='" + objOwn
									+ "' and string-length(Field/Value/@autoShow) > 0] | descendant-or-self::*[@name='"
									+ objOwn
									+ "' and string-length(Value/@autoShow) > 0] | descendant-or-self::*[@name='"
									+ objOwn + "' and string-length(@autoShow) > 0]");
							if (asListc) {
								var asListcD = Smc.DOM.getSingleNode(asListc, "Field");
								var vasListG = Smc.DOM
										.getSingleNode(asListcD,
												"descendant-or-self::Value[string-length(@autoShow) > 0 ] | descendant-or-self::Field[string-length(@autoShow) > 0 ]");

								if (vasListG)
									var objOwnG = Smc.DOM.getAttribute(vasListG, "autoShow");

								var objtToG = (this.getGuiObject(objOwnG)) ? this.getGuiObject(objOwnG) : this
										.getGuiObject("note.field." + objOwnG);

								if (objtToG)
									this.hide(objtToG.id);

								if (this.controlRSH < 9)
									this.executeActionsSH(asListc, true);
							}
						}

					}

				} else {

					if (objtTo && this.sAutoControl != objOwn)
						this.hide(objtTo.id);

					// Recursion
					var asListc = this.chechAutoShowRec(objOwn);

					if (asListc && this.controlRSH < 9)
						this.executeActionsSH(asListc, true);
				}
			}
		}
	},
	chechAutoShowRec : function(objOwn) {
		var asListc = Smc.DOM.getSingleNode(this.guiDef, "descendant-or-self::*[@name='" + objOwn
				+ "' and string-length(Value/@autoShow) > 0] | descendant-or-self::*[@name='" + objOwn
				+ "' and string-length(@autoShow) > 0]");
		if (!asListc) {

			var asListSG;
			asListSG = Smc.DOM.getNodeList(this.guiDef, "//SuperGroup[@name='" + objOwn
					+ "']/GroupRef | //SuperGroup[@name='" + objOwn + "']/TabGroupRef");

			for ( var e = 0; e < asListSG.length; e++) {
				var gName = Smc.DOM.getAttribute(asListSG[e], "name");
				asListc = Smc.DOM.getSingleNode(this.guiDef, "descendant-or-self::*[@name='" + gName
						+ "' and string-length(Field/Value/@autoShow) > 0] | descendant-or-self::*[@name='" + gName
						+ "' and string-length(@autoShow) > 0]");

				if (asListc && this.controlRSH < 9) {
					var listc = Smc.DOM.getSingleNode(asListc, "Field");
					return listc;
				}
			}
		}
		return asListc;
	},
	preHideAll : function(firstNodeName, group) {

		var objtT = (this.getGuiObject("note.field." + firstNodeName)) ? this.getGuiObject("note.field."
				+ firstNodeName) : this.getGuiObject(firstNodeName);

		if (!objtT)
			return;

		if (group)
			var asElemList = Smc.DOM.getNodeList(this.guiDef, "//Group[@name='" + firstNodeName
					+ "' and string-length(Field/Value/@autoShow) > 0]/Field/Value | //Group[@name='" + firstNodeName
					+ "' and string-length(Field/@autoShow) > 0 and Field/@type='Option']/Field");
		else
			var asElemList = Smc.DOM.getNodeList(this.guiDef, "//*[@name='" + firstNodeName
					+ "' and string-length(Value/@autoShow) > 0]/Value");

		for ( var i = 0; i < asElemList.length; i++) {
			var asElem = asElemList[i];
			nextObjt = asElem.getAttribute("autoShow");
			if (nextObjt) {

				var nextO = this.getGuiObject(nextObjt);

				var fieldList = Smc.DOM.getNodeList(this.guiDef, "//Group[@name='" + nextObjt + "']/Field");
				for ( var j = 0; j < fieldList.length; j++) {
					var fieldName = fieldList[j].getAttribute("name");
					var fieldObj = this.getGuiObject("note.field." + fieldName);

				}

				try {
					if (nextO) {
						if (typeof (nextO.isVisible) == "function") {

							if (nextO.isVisible())
								this.hide(nextObjt);
						}
					}

				} catch (e) {

				}

				this.preHideAll(nextObjt, true);
			}
		}
	},
	onListCheckChange : function (sm, rowIndex, record, grid, checked) {
		var dataLink = this.dataLinks[grid.getId()];
		var recArray = sm.getSelections();
		var checkedItems = new Array(); 
		
		for (i = 0; i < recArray.length; i++)
		{
			var rec = recArray[i];
			var val = rec.data.id;
			if (typeof(val) == "boolean")
			{
				val = val ? "true" : "false";	
			}
			checkedItems[i] = val;
		}	
		
		var eventObj = new Object ();
		eventObj.name = "ListCheckChange";	
		eventObj.attrName = "metafilter";	
		eventObj.checkedNodes = checkedItems;
		eventObj.clickedID = record.data.id;
		eventObj.data = record.data;
		eventObj.checked = checked;
		
		this.dataLinkHandler.fire(dataLink, eventObj, this.eventScope);		
	},
	
	onBeforeListCheckChange : function (sm, rowIndex, keepExisting, record) {

		if (keepExisting) return true;


		var dataLink = this.dataLinks[this.name];
		
		var checkedItems = new Array(); 


		var recArr = new Array();
		recArr[0] = record;
		sm.suspendEvents();
		sm.selectRecords(recArr, true);
		sm.resumeEvents();
		var recArray = sm.getSelections();
		
		
		for (i = 0; i < recArray.length; i++)
		{
			var rec = recArray[i];
			checkedItems[i] = rec.data.id;
		}	
		
		var eventObj = new Object ();
		eventObj.name = "BeforeListCheckChange";	
		eventObj.attrName = "metafilter";	
		eventObj.checkedNodes = checkedItems;
		eventObj.clickedID = record.data.id;
		
		this.dataLinkHandler.fire(dataLink, eventObj, this.eventScope);		
		
		return false;

	},
	onTreeCheckChange : function (node, checked) {

		var treeID = node.getOwnerTree().getId();
		var dataLink = this.dataLinks[treeID];
		var eventObj = new Object ();
		eventObj.name = "TreeCheckChange";

		eventObj.fieldName = this.smcProperties[treeID];	
		eventObj.attrName = this.smcAttrNames[treeID];
		eventObj.smcFunction = this.smcFunctions[treeID];
		
		eventObj.checkedNodes = this.getTreeNodeIDs (node.getOwnerTree(),true);
		
		this.dataLinkHandler.fire(dataLink, eventObj, this.eventScope);
	},
	onTextFieldEnter : function (item, evtObj) {
		if (typeof evtObj != "undefined" && evtObj.getKey() != 13)
			return;

		evtObj.stopPropagation();
		evtObj.preventDefault();
		
		var eventObj = new Object();
		var dataLink = this.dataLinks[item.id];
		
		eventObj.name = "TextFieldEnter";
		eventObj.fieldID = item.getId();
		eventObj.fieldValue = item.getValue();
		
		this.dataLinkHandler.fire(dataLink, eventObj, this.eventScope);
	},
	onComboDataLinkChange : function (item, record, number)	{
		var eventObj = new Object ();
		var dataLink = this.dataLinks[item.id];
		
		eventObj.name = "ComboBoxSelect";
		eventObj.comboName = item.name;
		eventObj.comboValue = record.data.id;
		
		this.dataLinkHandler.fire(dataLink, eventObj, this.eventScope);
	},
	resolveDatasources : function (ui, isRefreshing) {
		var DOM = Smc.DOM;

		var resolved = ui.getAttribute("resolved");
		if (resolved == "true")
			return;
		
		ui = DOM.copyNode(ui, true);
		
		var uiNodeList = DOM.getNodeList(ui, ".//*[@datasource and ancestor::Toolbar] | self::*[@datasource and not(ancestor-or-self::*[@lazyChildRendering = 'true']) and not(ancestor::Toolbar)] | .//*[@datasource and not(ancestor-or-self::*[@lazyChildRendering = 'true']) and not(ancestor::Toolbar)]");
		for (var i = 0; i < uiNodeList.length; i++)
		{	
			var uiNode = uiNodeList.item(i);
			var datasourceRef = uiNode.getAttribute("datasource");
			var refreshDatasource = uiNode.getAttribute("refreshDatasource");
			if (isRefreshing === true && refreshDatasource != null && refreshDatasource.length > 0)
				datasourceRef = refreshDatasource;
			if (!isRefreshing && refreshDatasource != null && refreshDatasource.length > 0 && datasourceRef.length == 0)
				continue;
			
			var params = Util.xmlAttrs2Obj(uiNode);
			var resolvedResult = this.datasourceObj.get(datasourceRef, params);
			if (resolvedResult == null)
				throw new Error(datasourceRef + ": resolvedDataSourceXML is null");
			
			var resolvedDataSourceXML = resolvedResult.result || resolvedResult;
			
			if (DOM.getElementName(resolvedDataSourceXML) == "None")
				continue;
			
			DOM.copyAttributes (resolvedDataSourceXML, uiNode);
			
			while (uiNode.childNodes.length > 0)
			{
				var childNN = uiNode.firstChild.nodeName;
				if (childNN == "EventSubscription" || childNN == "Toolbar")
					resolvedDataSourceXML.appendChild(DOM.importNode(uiNode.firstChild, DOM.getOwnerDocument(resolvedDataSourceXML), true));
				uiNode.removeChild(uiNode.firstChild);
			}
			
			var childNodes = DOM.getNodeList(resolvedDataSourceXML, "*");
			for (var j = 0; j < childNodes.length; j++)
				DOM.appendChild(uiNode, DOM.importNode(childNodes.item(j), DOM.getOwnerDocument(ui), true));
			
			if (resolvedResult.doRecurseResolving)
			{
				// remove temporarily in order to prevent infinite loop
				uiNode.removeAttribute("datasource");
				
				var newUINode = this.resolveDatasources(uiNode, false);
				if (uiNode == ui)
					ui = uiNode = newUINode;
				else
					uiNode = uiNode.parentNode.replaceChild(newUINode, uiNode);
				
				uiNode.setAttribute("datasource", datasourceRef);
			}
		}
		ui.setAttribute("resolved", "true");
		return ui;				
	},
	setProgress : function(title, message) {
		Smc.MessageBox.progress(title, message);
	},
	updateProgress : function(number, progressText, msg) {
		Smc.MessageBox.updateProgress(number, progressText, msg);
	},
	clearProgress : function() {
		Smc.MessageBox.hide();
	},
	getEventHandlerRef : function(uiNode, eventHandlerNameAttribute) {
		if (!eventHandlerNameAttribute)
			eventHandlerNameAttribute = "eventHandler";
		
		var evHandlerStr = uiNode.getAttribute(eventHandlerNameAttribute);
		
		if (!evHandlerStr)
			return null;
		
		var evHandlerLen = evHandlerStr.length;
		
		if (evHandlerLen > 3 && evHandlerStr.substr(evHandlerLen - 2) == "()")
			evHandlerStr = evHandlerStr.substr(0, evHandlerLen - 2);
		
		var scopeStr = "this.eventScope.";
		
		// try to avoid eval because of bad performance
		var i = evHandlerStr.indexOf(scopeStr);
		if (i == 0)
		{
			var fnName = evHandlerStr.substring(scopeStr.length);
			if (fnName.indexOf(".") == -1)
			{
				return this.eventScope[fnName];
			}
		}
		
		if (evHandlerStr.length > 0)
			return eval(evHandlerStr);
		else
			return null;
	},
	disableTreeNodes : function(treeID) {
		var treeObj = this.getGuiObject(treeID);
		treeObj.getRootNode().cascade(function (){
			this.disable();
		});
	},
	disableTreeNodesCheckboxes : function(treeID) {
		var treeObj = this.getGuiObject(treeID);
		treeObj.getRootNode().cascade(function (){
			var cb = this.getUI().checkbox;
			if (!cb)
				return;
			cb.disabled = true;
		});
	},
	disableTreeNodesCheckboxesByAttribute : function(treeID, attrName, valueArr, disableFoundNodes) {
		var treeObj = this.getGuiObject(treeID);
		treeObj.getRootNode().cascade(function (){
			var attrValue = this.attributes[attrName];
			var cb = this.getUI().checkbox;
			if (!cb)
				return;
			
			var found = false;
			for (var i = 0; i < valueArr.length; i++)
			{
				valueArr[i] += "";
				if (valueArr[i].length > 0)
				{
					found = attrValue.indexOf(valueArr[i]) > -1;
					if (!found)
						break;
				}
			}
			
			if (disableFoundNodes === true && found)
				cb.disabled = true;
			else if (!disableFoundNodes && !found)
				cb.disabled = true;
			else
				cb.disabled = false;
			
			this.getUI().toggleCheck(!cb.disabled);
		});
	},
	replaceDataSource : function(objectID, xmlSource) {
		// check reloadDataSource!!!
		var guiObject = this.getGuiObject(objectID);
		var objectsUINode = this.getGuiNode(objectID);
		if (objectsUINode == null)
			throw new Error("Could not find gui description of gui object: " + objectID);

		var data = Array();
	   	var DOM = new Dom();
		var nl = DOM.getNodeList(xmlSource, "//Item");
		for (var j = 0; j < nl.length; j++)
		{	
			var currElem = nl.item(j);
			var option = Array();
			option.push(currElem.getAttribute("id"));
			option.push(currElem.getAttribute("text"));
			data.push(option);
		}
		guiObject.reset();
		guiObject.store.removeAll();
		guiObject.store.loadData( data ); 
	},
	
	resetCheckedTreeNodes : function(treeObjectID) {
		var treeObj = this.getGuiObject(treeObjectID);
		if (!treeObj)
			return;
		treeObj.suspendEvents();
		this.toggleCheckTreeNodes(treeObjectID, false);
		treeObj.resumeEvents();
	},	
	
	resetGuiObject : function (objID, resetOriginalFieldValue) {
		var obj = this.getGuiObject(objID);
		if (!obj)
			return;
		
		var type = obj.getXType();
		if (type == "treepanel")
		{
			obj.getRootNode().cascade(function (){
				var cb = this.getUI().checkbox;
				if (cb)
				{
					cb.checked = false;
				};
			});
		}
		else
		{
			if (resetOriginalFieldValue === true && typeof obj.originalValue != "undefined")
				delete obj.originalValue;
			obj.reset();
		}
	},
	
	enableTreeNodesCheckboxes : function(treeID) {
		var treeObj = this.getGuiObject(treeID);
		if (!treeObj)
			return;
		treeObj.getRootNode().cascade(function (){
			var cb = this.getUI().checkbox;
			if (cb)
				cb.disabled = false;
		});
	},
	enableTreeNodes : function(treeID) {
		var treeObj = this.getGuiObject(treeID);
		if (!treeObj)
			return;
		treeObj.getRootNode().cascade(function (){
			this.enable();
		});
	},
	
	expandTree : function (treeID)
	{
		var treeObj = this.getGuiObject(treeID);
		treeObj.expandAll();
	},
	
	
	
	toggleCheckTreeNodes : function(treeID, check, openPath) {
		var treeObj = this.getGuiObject(treeID);
		if (!treeObj)
			return;
		treeObj.getRootNode().cascade(function (){
			this.getUI().toggleCheck(check);
		});
	},
	toggleCheckAncestorTreeNodes : function(node) {
		var check = node.getUI().isChecked();
		var tn = node;
		while (tn.parentNode)
		{
			tn = tn.parentNode;
			tn.getUI().toggleCheck(check);
		}
	},
	toggleCheckTreeNode : function(nodeID, treeID, check) {
		var treeObj = this.getGuiObject(treeID);
		if (!treeObj)
			return;
		treeObj.getRootNode().cascade(function (){
			var currentNodeID = this.attributes.objectID;
			if (currentNodeID && currentNodeID == nodeID)
			{
				this.getUI().toggleCheck(check);
				return false;
			}
		});
	},
	
	checkNodeExistsNot : function (treeID, myArr)
	{
		var treeObj = this.getGuiObject(treeID);
		if (!treeObj)
			return new Array();
		var idArr = new Array();
		for (var i = 0; i < myArr.length; i++)
		{
			if (!treeObj.getNodeById(myArr[i])) idArr.push(myArr[i]);
		}
		return idArr;
	},
	
	getTreeNodeIDs : function(treeID, checked) {
		var treeObj = this.getGuiObject(treeID);
		if (!treeObj)
			return new Array();
		var idArr = new Array();
		treeObj.getRootNode().cascade(function (){
			var currentNodeID = this.attributes.objectID;
			var isChecked = this.getUI().isChecked();
			if (currentNodeID)
			{
				if (checked === isChecked)
					idArr.push(currentNodeID);
				else if (typeof checked == "undefined")
					idArr.push(currentNodeID);
			}
		});
		return idArr;
	},
	getTreeNodeIDs2 : function(treeID, checked) {
		var treeObj = this.getGuiObject(treeID);
		

		var groupEntryArr = new Array();
		if (treeObj)
		{
			treeObj.getRootNode().cascade(function (){
				
				var cb = this.getUI().checkbox;
				var objectID = this.attributes.objectID;
				if (cb && objectID)
				{
					var checkedAncestorEntry = null;
					for (var i = 0; i < groupEntryArr.length; i++)
					{
						var groupEntry = groupEntryArr[i];
						if (this.isAncestor(groupEntry.node))
						{
							checkedAncestorEntry = groupEntry;
							break;
						}
					}
					
					var isChecked = this.getUI().isChecked();
					if (checkedAncestorEntry)
					{
						// by default, this node is checked, since the ancestor has been chosen.
						checkedAncestorEntry.childIds.push(objectID);	
					}
					else if (isChecked)
					{
						//this node is checked and this node is not implicitly chosen by its ancestor.
						var groupEntry = new Object();
						groupEntry.node = this;
						groupEntry.id = objectID;
						groupEntry.childIds = new Array();
						groupEntryArr.push(groupEntry);
					}
				}
			});
		}
		
		var idArray = new Array();
		for (var i = 0; i < groupEntryArr.length; i++)
		{
			var groupEntry = groupEntryArr[i];
		//	alert("entry[" + i + "]: " + groupEntry.id + "\nchildIds: " + groupEntry.childIds);
			var ids = new Array();
			ids.push(groupEntry.id);
			for (var j = 0; j < groupEntry.childIds.length; j++)
				ids.push(groupEntry.childIds[j]);
			idArray.push(ids);
		}
		
		return idArray;
	},
	findTreeNodeByAttribute : function(treeID, attrName, attrValue) {
		var tree = this.getGuiObject(treeID);
		if (tree != null)
		{
			var rootNode = tree.getRootNode();
			
			if (rootNode.attributes[attrName] == attrValue)
				return rootNode;
			
			return this.findTreeNodeByAttributeRecurse(rootNode, attrName, attrValue);
		}
		return null;
	},
	
	findTreeNodeByAttributeRecurse : function(node, attrName, attrValue) {
		var foundNode = null;
		for (var i = 0; i < node.childNodes.length; i++)
		{
			if (node.childNodes[i].attributes[attrName] == attrValue)
			{
				foundNode = node.childNodes[i];
				break;
			}
			else
			{
				foundNode = this.findTreeNodeByAttributeRecurse(node.childNodes[i], attrName, attrValue);
				if (foundNode != null)
					break;
			}
		}
		return foundNode;
	},

	getPropList : function (guiObj) {
		var propListObj = this.getGuiObject(guiObj);
		return propListObj.getSource();
	},

	getListChecks : function (guiObj, fieldName)
	{
		var gridObj = this.getGuiObject(guiObj);
		var recs = gridObj.getSelectionModel().getSelections();
		var idList = [];
		
		
		
		for (i = 0; i < recs.length; i++)
		{
			if (!fieldName)
			{
				idList.push(recs[i].data.id);
			}
			else
			{
				idList.push(recs[i].get(fieldName));
			}
		}
				
		return idList;
	},
	clearListChecks : function(guiObjectID, idArr) {
		var gridObj = this.getGuiObject(guiObjectID);
		if (gridObj)
		{
			var gridStore = gridObj.store;
			var sm = gridObj.getSelectionModel();
			if (idArr)
			{
				sm.suspendEvents();
				sm.each(function(record) {
					if (idArr.indexOf(record.data.id) > -1)
					{
						var index = gridStore.indexOf(record);
						sm.deselectRow(index);
					}
				});
				sm.resumeEvents();
			}
			else
			{
				sm.suspendEvents();
		    	sm.clearSelections();
		    	sm.resumeEvents();
			}
		}
	},
	setListChecks : function (idArr, listObjID) {
		var gridObj = this.getGuiObject(listObjID);
		if (!gridObj)
			return;
		var recs = [];
    	gridObj.getStore().each(function(rec){
    		if (idArr.indexOf(rec.data.id) > -1)
    			recs.push(rec);
    	});
    	gridObj.getSelectionModel().suspendEvents();
    	gridObj.getSelectionModel().clearSelections();	
    	gridObj.getSelectionModel().selectRecords(recs);
    	gridObj.getSelectionModel().resumeEvents();
	},

	addTabPanel : function (guiObj, panelConfig) {
		var tabContainerObj = this.getGuiObject(guiObj);
		
		var panelObj;
		if (typeof panelConfig.getXType == "function")
			panelObj = panelConfig;
		else
			panelObj = new Ext.Panel(panelConfig);
		
		tabContainerObj.add (panelObj);
		return panelObj;
	},

	activateTab : function (tabID, panelID)
	{		
		var panelObj = this.getGuiObject(panelID);
		
		var tabObj;
		if (tabID != null)
	 	{
	 		tabObj = this.getGuiObject(tabID);
	 	}
		else
		{
			tabObj = panelObj.ownerCt;
		}

		if(typeof(tabObj.activate)=="function")
			tabObj.activate(panelObj);
		else
			tabObj.ownerCt.activate(panelObj);
	},
	clearList : function(guiObj) {
		var grid = this.getGuiObject(guiObj);
		grid.store.removeAll();
	},
	focus : function (guiObj) {
		var obj = this.getGuiObject(guiObj);
		if (obj)
			obj.focus();
	},
	stopEditing : function (guiObj) {
		var obj = this.getGuiObject(guiObj);
		if (!obj) return;
		obj.stopEditing();			
	}
	
};

Gui.showPopup = function(width, height, modal, resizeHandler, configOptions) {
	var tempWindow = Gui.getPopup(width, height, modal, resizeHandler, configOptions);
	tempWindow.show();
	tempWindow.center();
	return tempWindow;
};

Gui.getPopup = function(width, height, modal, resizeHandler, configOptions) {
	if (!configOptions)
		configOptions = {};
	if (!width || isNaN(width))
		width = 300;
	if (!height || isNaN(height))
		height = 300;
	if (modal !== true)
		modal = false;
	
	var defaultOpt = {
		autoDestroy: true,
		width: width,
		height: height,
		closable: true,
		modal: modal
	};
	
	Ext.apply(defaultOpt, configOptions);
	
	return new Ext.Window(defaultOpt);
};
Gui.showDocPopup = function(uri){
		
	var obj = {
		record: { 
			"smc.objtype": "doc",  
			"smc.uri": uri
		}
	};
	
	window.Smc.System.GUI.context.showDocumentInObj(obj);
};

Gui.setLoading = function(modal, text) {
	if (typeof modal == "undefined")
		modal = false;
	if (typeof text == "undefined")
		text = "Loading...";
	
	var fullText = '<div class="loading">' + text + '</div>';
	
	if (!Gui.loadWindow)
	{
		Gui.loadWindow = new Ext.Window({
			autoDestroy: true,
			width: 140,
			height: 50,
			closable: false,
			html: fullText,
			modal: modal
		});
	}
	Gui.loadWindow.show();
	Gui.loadWindow.center();
};

Gui.clearLoading = function(defer) {
	if (Gui.loadWindow)
	{
		if (defer && !isNaN(defer))
			(Gui.loadWindow.hide).defer(defer, Gui.loadWindow);
		else
			Gui.loadWindow.hide();
	}
};

Gui.alert = function(title, message, callback, callbackScope, iconName) {
	Smc.MessageBox.alert(title, message, callback, callbackScope);
	if (iconName && iconName.toLowerCase() == "warning")
		Smc.MessageBox.setIcon(Smc.MessageBox.WARNING);
};

Gui.warn = function(title, message, callback, callbackScope) {
	Smc.MessageBox.alert(title, message, callback, callbackScope);
	Smc.MessageBox.setIcon(Smc.MessageBox.WARNING);
};

Gui.confirm = function(title, message, callback, callbackScope, iconName) {
	Smc.MessageBox.confirm.apply(Smc.MessageBox, arguments);
	if (iconName && iconName.toLowerCase() == "warning")
		Smc.MessageBox.setIcon(Smc.MessageBox.WARNING);
};

Gui.prompt = function(title, message, callback, callbackScope, multiline, defaultValue) {
	Smc.MessageBox.prompt.apply(Smc.MessageBox, arguments);
};

Gui.showMessageBox = function(config) {
	Smc.MessageBox.show.apply(Smc.MessageBox, arguments);
};

Gui.init = function(context) {
	if (Ext)
    {
    	Ext.BLANK_IMAGE_URL = context.getParameter("UI_GUI_URL") + "/../extjs/default/s.gif";
    	Ext.QuickTips.init();
    	Ext.useShims = true;    	
    }
};

Gui.showContextMenu = function(items, event, menuOptions) {
	if (!menuOptions) {
		menuOptions = {
			shadow: false,
		};
	}
	menuOptions["floating"] = true;
	menuOptions["listener"] = {
		hide: function () {
			this.destroy();
		}
	};

	var menuC = new Ext.create(Ext.menu.Menu, menuOptions);

    if (Ext.isArray(items)) {
		for (var i = 0, len = items.length; i < len; i++)
			menuC.add(items[i]);
	} else {
        menuC.add(items);
    }
	
	if (Ext.isArray(event)) {
        menuC.showAt(event);
    } else {
		if(event.getXY){
			menuC.showAt(event.getXY());
		}else{
			menuC.showAt(event.x, event.y);
		}
    }
	menuC.el.dom.addEventListener("contextmenu", function(e){
		e.preventDefault()
	});
	return menuC;
};

Gui.notifier = function(){
    var msgCt;

    function createBox(t, s){
        return ['<div class="msg">',
                '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
                '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc"><h3>', t, '</h3>', s, '</div></div></div>',
                '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
                '</div>'].join('');
    }
    return {
        msg : function(title, format){
            if(!msgCt){
                msgCt = Ext.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
            }
            var docWidth = $(document).width();
            
            msgCt.alignTo(document, 'tl-tl', [(docWidth / 3) * 2, 0]);
            var s = String.format.apply(String, Array.prototype.slice.call(arguments, 1));
            var m = Ext.DomHelper.append(msgCt, {html:createBox(title, s)}, true);
            m.slideIn('t').pause(2).ghost("t", {remove:true});
        }
    };
}();

Smc.ui = {};
Smc.ui.SVGEditor = function (api, pluginObject, context) {
	var pars = Smc.System.getParameters();
	this.BASEURL = pars["BROKER_URL"];
	this.svgEdit = null;
	this.editorContainer = null;
	this.uri = null;
	this.pAPI = api;
	this.context = context;
	this.language = null;
	this.svgEditWin = null;
	this.pluginObject = pluginObject;
	this.ITEM_NAME = Smc.ui.SVGEditor.ITEM_NAME;
};
Smc.ui.SVGEditor.ITEM_NAME = "svglegend";

Smc.ui.SVGEditor.prototype = {
	open : function(uri, language, onCloseFn, onCloseFnScope) {
		this.uri = uri;		
		this.language = language;					
		
		var uiDef = Smc.DOM.getSingleNode(this.context.getSettingsDoc(), "CustomWindow[@function = 'SVGEdit']");
    	this.svgEditWin = this.context.createGuiControl("CustomWindow[@function = 'SVGEdit']", this, null);   	        	
    	
    	// show popup
    	this.svgEditWin.show();
    	this.svgEditWin.center();		
    	
    	var instance = this;
    	this.svgEditWin.on("beforeclose", function() {
    		instance.destroySvgEditWin();
    		if (typeof onCloseFn == "function")
    			return onCloseFn.call(onCloseFnScope || instance);
    	});
		

		var idStr = "svgedit" + Util.getTimestamp();
		this.idStr = idStr;
		var htmlContainer = this.svgEditWin.guiDef.getBodyHTMLElement("smc.svgedit.panel");
		var svgeditURL = this.context.getParameter("CMS_URL") + "/client/plugins/mediaset/svg-edit/svg-editor.html?no_save_warning=true";
		htmlContainer.innerHTML = '<iframe id = "' + idStr + '"  width="100%" height="100%" src="' + svgeditURL + '"></iframe>';
		var instance = this;
		$("#" + idStr, htmlContainer).on('load', function() {
			instance.svgEdit = this.contentWindow.svgEditor;
			//instance.svgCanvas = instance.svgEdit.canvas;
			var svg = instance.pAPI.editLoadObjectItem(instance.uri, instance.ITEM_NAME, instance.language);
			instance.displaySVGString(Smc.DOM.serialize(svg));
			if (Ext.isIE9) {
				instance.runImagePathFixSequence(0, 10);
			}
		});
		
	},
	runImagePathFixSequence : function(curr, max) {
		if (curr < max)
		{
			var instance = this;
			setTimeout(function() {
				if (!instance.doImagePathFix())
				{
					instance.runImagePathFixSequence(++curr, max);
				}
			}, 500);
		}
	},
	doImagePathFix : function() {
		var updated = false;
		var imageArr = this.svgEdit.canvas.getContentElem().getElementsByTagName("image");
		for ( var i = 0; i < imageArr.length; i++) {
			var imageElem = imageArr[i];
			var imageSrc = imageElem.getAttribute("xlink:href");
			if (imageSrc != null) {
				if (imageSrc.indexOf("?") > 0)
					imageSrc += "&rnd=1";
				else
					imageSrc += "?rnd=1";
				imageElem.setAttribute("xlink:href", imageSrc);
				updated = true;
			}
		}
		return updated;
	},
	destroySvgEditWin : function () {		
		var htmlContainer = this.svgEditWin.guiDef.getBodyHTMLElement("smc.svgedit.panel");
		$("#" + this.idStr, htmlContainer).off();
	},

    saveSVG : function () {		
    	this.saveSVGOnly(false);
    	this.exitSVG();    	
    },
    
    saveSVGOnly : function (enableMsg) {
    	var svgStr = this.getSVGString();
    	var svgDoc = Smc.DOM.parse(svgStr);
    	this.pAPI.saveObjectItem(this.uri, this.ITEM_NAME, this.language, svgDoc);
    	if(enableMsg !== false)    	
    		alert(this.context.getTranslatorCtrl().t("smc.svg.saved"));
    },
    deleteItem : function() {
    	try
        {
            var pAPI = new PluginAPI(this.context, this.pluginObject.getObjectType());                       
        	var result = pAPI.deleteObjectItem(this.uri, this.ITEM_NAME, this.language);
        	if (result !== true)
        	{
        		if (result.errorCode != "OBJECT_NOT_FOUND_ERROR")
        			throw new Error(result.getAlertMessage());
        	}
        	this.exitSVG();
        }
        catch (e)
        {        	
            alert("[ItemEditor.deleteItem] Could not delete! Error:\n" + e.message);
        }
    },
    exitSVG : function () {
    	// triggers beforeclose event
    	this.svgEditWin.close();
    },
    
    deleteSVG : function () {        
        this.pluginObject.onDeleteContent(this.ITEM_NAME);        
    },

	initSVGEditor : function(url) {
		this.svgEdit.loadFromURL(url); 	
	},
	
	displaySVGString : function(svgStr) {
		this.svgEdit.loadFromString(svgStr); 	
	},
	
	getSVGString : function () {
		return this.svgEdit.canvas.getSvgString(); 	
	}
};
