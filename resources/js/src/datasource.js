function Datasource(context, pluginObj, extraDataResourceMethods) {
	this.NAME = "Datasource";
	this.pluginObj = pluginObj;
	this.context = context;
	this.themeDoc = null;
 	this.linksFragment = null;
 	this.productionTasks = null;
 	this.currentURI = null;
 	this.metaCharacterizationDocument = null;
 	this.metaCharacterizationDocument_Checkboxes = null;
 	this.metaCharacterizationDocument_PropList = null;
 	this.t = this.context.getTranslatorCtrl();
 	
 	this.hasMetaCharacterization = false;
 	this.currentCharacterization = "";
 	this.workflowFragment = null;
 	this.characterizationDoc = null;
 	this.permissionDocument = null;
 	this.noteDocument = null;
 	this.categoriesSearchFieldDocument = null;
 	this.currentCharacterizationLimit = null;

 	this.datasouceHash = new Object();
 	
 	
 	this.guiDocs = new Object();
	//this.vars = new Object();

 	Ext.apply(this, extraDataResourceMethods);
}

Datasource.themeListCache = {};
Datasource.resetThemeListCache = function(objType) {
	if (objType)
		Datasource.themeListCache[objType] = null;
	else
		Datasource.themeListCache = {};
};
Datasource.treeCache = {};

Datasource.prototype = {
	destroy : function() {
		for (var key in this)
			delete this[key];
	},
	
	setDatasourceByName : function (dsname, ds)
	{
		this.datasouceHash[dsname] = Smc.DOM.getDocumentElement(ds);
	},
	
	setThemeDoc : function (themeDoc) {
		this.linksFragment = null;
  		this.themeDoc = themeDoc;

  		var gotThemeInfoElem = Smc.DOM.getSingleNode(themeDoc, "//GotThemeInfo");
  		this.currentURI = Smc.DOM.getAttribute(gotThemeInfoElem, "uri");
		
		this.metaCharacterizationDocument = null;

		var viewNode = Smc.DOM.getSingleNode(themeDoc, "//Views");
		if (viewNode)
			this.currentCharacterizationLimit = Smc.DOM.getAttribute(viewNode, "characterizationFilter");
    },
    getLinksFragment : function() {
    	if (!this.linksFragment)
    	{
	    	var linksElem = Smc.DOM.getSingleNode (this.themeDoc, "/*/ReferenceInfo");
			this.linksFragment = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), linksElem, true);
    	}
    	return this.linksFragment;
    },
	get : function (dataID, params) {

		if (typeof (this[dataID]) == "function")
			return this[dataID].call(this, params);
		
		var DOM = Smc.DOM;
		dataID = new String(dataID);
		
		var guiDoc = this.guiDocs[dataID]; 
		if (guiDoc != null)
		{
			return DOM.getDocumentElement(guiDoc);
		}



		var pt = new String("Plugin.Trafos");
		
    	if (dataID.indexOf(pt) == 0)
		{
			if (dataID.length == pt.length)
				return DOM.getDocumentElement(this.getTransformers());
			else 
				return DOM.getDocumentElement(this.getTransformers(dataID.substring(pt.length + 1)));
		}
		
		
		
		else if (dataID == "InnerDocStructure")
		{
			if (this.datasouceHash[dataID.toString()] != null)
			{
				return this.datasouceHash[dataID.toString()];
			}			
			else		
				return DOM.getDocumentElement(DOM.parse("<TreePanel/>"));

		}
		
		else if (dataID == "Plugin.OriginalLanguages")
			return DOM.getDocumentElement(this.getPluginOriginalLanguages());
		else if (dataID == "Plugin.OriginalLanguages.Filters")
			return DOM.getDocumentElement(this.getPluginOriginalLanguages(true));				
		else if (dataID == "Plugin.AvailableLanguages")
			return DOM.getDocumentElement(this.getPluginAvailableLanguages());
		else if (dataID == "Plugin.Versions")
			return DOM.getDocumentElement(this.getVersions());
    	else if (dataID == "Plugin.Links")
			return DOM.getDocumentElement(this.getLinksFragment());
		else if (dataID == "Plugin.Links.Refresh")
			return DOM.getDocumentElement(this.getLinks());
    	else if (dataID == "Plugin.Metadata")
    		return DOM.getDocumentElement(this.getPluginProperties());
    	else if (dataID == "Plugin.Metadata.Properties")
    		return DOM.getDocumentElement(this.getInheritedProps());
    	else if (dataID == "FilteredThemeList.system.metadataform.notes")
			return DOM.getDocumentElement(this.getThemeList("system.metadataform", params, false, "purpose", "note"));
		else if (dataID.indexOf("ThemeList.") == 0)
			return DOM.getDocumentElement(this.getThemeList(dataID.substring("ThemeList.".length), params));
		else if (dataID.indexOf("FuzzyThemeList.") == 0)
			return DOM.getDocumentElement(this.getThemeList(dataID.substring("FuzzyThemeList.".length), params, true));
		else if (dataID == "Plugin.SubstitutionRules")
    		return DOM.getDocumentElement(this.getThemeList("system.substitutionrules"));
		else if (dataID == "System.Ranges")
    		return DOM.getDocumentElement(this.getRanges());    		
		else if (dataID == "System.Searchprofile")
			return DOM.getDocumentElement(this.getProfiles(params, "system.searchprofile"));  		
		else if (dataID == "System.Production")
			return DOM.getDocumentElement(this.getProfiles(params, "system.production"));
		else if (dataID == "System.Translation")
			return DOM.getDocumentElement(this.getProfiles(params, "system.translation"));
		else if (dataID == "System.Filterprofile")
			return DOM.getDocumentElement(this.getProfiles(params, "system.filterprofile"));
						    		
		else if (dataID == "Plugin.SystemStyles")
    		return DOM.getDocumentElement(this.getThemeList("system.styles"));
		else if (dataID == "Plugin.Styles")
    		return DOM.getDocumentElement(this.getThemeList("style"));
		else if (dataID == "System.Languages")
    		return DOM.getDocumentElement(this.getLanguages());
		else if (dataID == "System.Languages2")
    		return DOM.getDocumentElement(this.getLanguages2("all", Smc.System.getTranslatorCtrl().t("smc.languages.all")));
		else if (dataID == "System.Languages3")
			return DOM.getDocumentElement(this.getLanguages2("auto", Smc.System.getTranslatorCtrl().t("smc.languages.auto")));
    	else if (dataID == "ProductionTasks")
    		return DOM.getDocumentElement(this.getProductionTasks());
		else if (dataID == "ProductionTasksList.finished")
			return DOM.getDocumentElement(this.getProductionTasksList("finished"));
		else if (dataID == "ProductionTasksList.running")
			return DOM.getDocumentElement(this.getProductionTasksList("running"));
		else if (dataID == "Typo3Sync.list")
			return DOM.getDocumentElement(this.getTypo3SyncList());
		else if (dataID == "Dataserver")
			return DOM.getDocumentElement(this.getDataservers());
		else if (dataID == "MetaCharacterization.Doc")
		{
			var filterPropValue = DOM.getSingleNode(this.pluginObj.getData().xmlDoc, "/*/Properties/Property[@name = 'SMCFILTER:characterization']");
			var filterValue = "";
			if (this.currentCharacterization !== null) 
				filterValue = this.currentCharacterization;
			else
				filterValue = filterPropValue != null ? filterPropValue.getAttribute("value") : "";
			return this.getDocMetaCharacterization(filterValue);
		}
		else if (dataID == "ContextCharacterization")
		{
			var filterPropValue = DOM.getSingleNode(this.pluginObj.getData().xmlDoc, "/*/Properties/Property[@name = 'SMCFILTER:characterization']");
			var filterValue = "";
			if (this.currentCharacterization !== null) 
				filterValue = this.currentCharacterization;
			else
				filterValue = filterPropValue != null ? filterPropValue.getAttribute("value") : "";
			
			return this.getContextCharacterization(filterValue);				
		}
		else if (dataID == "MetaCharacterization.Doc.Refresh")
		{
			var filterPropValue = DOM.getSingleNode(this.pluginObj.getData().xmlDoc, "/*/Properties/Property[@name = 'SMCFILTER:characterization']");
			var filterValue = "";
			if (this.currentCharacterization !== null) 
				filterValue = this.currentCharacterization;
			else
				filterValue = filterPropValue != null ? filterPropValue.getAttribute("value") : "";
			
			return this.refreshDocMetaCharacterization(filterValue);
		}
		else if (dataID == "MetaCharacterization.Folder")
			return DOM.getDocumentElement(this.getFolderMetaCharacterization());
		else if (dataID == "Sub-Characterization")
		{	
			var charRootElem = this.context.getCharacterizationManager().getCharacterization();
			charRootElem = DOM.getSingleNode(charRootElem, "/*");
			DOM.setAttribute(charRootElem, "mode", "sub-characterization");

			var filterPropValue = DOM.getSingleNode(this.pluginObj.getData().xmlDoc, "/*/Properties/Property[@name = 'SMCFILTER:characterization']");				
    		var filterValue = "";
    		
    		if (this.currentCharacterization !== null) 
    			filterValue = this.currentCharacterization;
    		else
    			filterValue = filterPropValue != null ? filterPropValue.getAttribute("value") : "";				
			
			DOM.setAttribute(charRootElem, "currentCharacterization", filterValue);
			var tree = DOM.transform(this.context.getAll2uiXSLTProc(), charRootElem, true);
			return DOM.getDocumentElement(tree);
		}				

		else if (dataID == "Obj-Characterization")
		{	
			var charRootElem;
			if (this.currentCharacterizationLimit)
			{
				charRootElem = this.context.getCharacterizationManager().limitCharacterizationTree(this.currentCharacterizationLimit);
			}
			else
			{
				charRootElem = this.context.getCharacterizationManager().getCharacterization();
			}
			
			charRootElem = DOM.getSingleNode(charRootElem, "/*");
			DOM.setAttribute(charRootElem, "mode", "obj-characterization");

			var filterPropValue = DOM.getSingleNode(this.pluginObj.getData().xmlDoc, "/*/Properties/Property[@name = 'SMCFILTER:characterization']");				
    		var filterValue = "";
    		
    		if (this.currentCharacterization !== null) 
				filterValue = this.currentCharacterization;
			else
				filterValue = filterPropValue != null ? filterPropValue.getAttribute("value") : "";				
			
			DOM.setAttribute(charRootElem, "currentCharacterization", filterValue);
			var tree = DOM.transform(this.context.getAll2uiXSLTProc(), charRootElem, true);

			return DOM.getDocumentElement(tree);
		}
		else if (dataID == "Node-Characterization")
		{		
			var charRootElem;
			if (this.currentCharacterizationLimit)
			{
				charRootElem = this.context.getCharacterizationManager().limitCharacterizationTree(this.currentCharacterizationLimit);
			}
			else
			{
				charRootElem = this.context.getCharacterizationManager().getCharacterization();
			}
			
			charRootElem = DOM.getSingleNode(charRootElem, "/*");
			DOM.setAttribute(charRootElem, "mode", "obj-characterization");

			if (this.currentCharacterizationLimit)
				DOM.setAttribute(charRootElem, "currentCharacterization", this.currentCharacterizationLimit);
			var tree = DOM.transform(this.context.getAll2uiXSLTProc(), charRootElem, true);
			return DOM.getDocumentElement(tree);
		}
		else if (dataID == "Characterization")
		{		
			var charRootElem = this.context.getCharacterizationManager().getCharacterization();
			charRootElem = DOM.getSingleNode(charRootElem, "/*");
			DOM.setAttribute(charRootElem, "mode", "");
			tree = DOM.transform(this.context.getAll2uiXSLTProc(), charRootElem, true);			
			return DOM.getDocumentElement(tree);
		}
		else if (dataID == "Export.Book.Versions")
		{
			var blankDoc = Smc.DOM.createSimpleDocument("Combo");
			
			var objectUri = this.context.getExporter().currentStructureURL;
			var objType = this.context.getExporter().currentObjType;
			if (!objectUri)
				return blankDoc;
			
			return this.getExportVersions(objectUri, objType);
		}
		else if (dataID == "Translation.Export.Book.Versions")
		{
			var blankDoc = Smc.DOM.createSimpleDocument("Combo");
			
			var objectUri = this.context.getTranslationExporter().currentStructureURL;
			var objType = this.context.getTranslationExporter().currentObjType;
			if (!objectUri)
				return blankDoc;
			
			return this.getExportVersions(objectUri, objType);
		}
		else if (dataID == "MetaCharacterization.Export")
		{
			this.metaCharacterizationDocument_PropList = null;
			return DOM.getSingleNode(this.getExportMetaCharacterization(), "//Doc/PropertyList");
		}
		else if (dataID == "Characterization.Tree")
		{
			return DOM.getDocumentElement(this.getCharacterizationTree(params));
		}
		else if (dataID == "PartialContentTree")
		{
			return DOM.getDocumentElement(this.getPartialContentTree(params));
		}
		else if (dataID == "Plugin.CurrentVersions")
		{
			return this.getCurrentVersions();
		}
		else if (dataID == "Plugin.CurrentRevisions")
		{
			return this.getCurrentRevisions();
		}		
		else if (dataID == "Plugin.Workflow.Transitions")
		{
			var workflowElem = this.pluginObj.getWorkflow().getLanguageWorkflow(this.pluginObj.getCurrentLanguage());
			if (!workflowElem)
				return DOM.getDocumentElement(DOM.parse("<Combo></Combo>"));
			
			return DOM.getDocumentElement(DOM.transform(this.context.getAll2uiXSLTProc(), workflowElem, true));
		}

		else if (dataID == "Plugin.Workflow.Transitions.Data")
		{
			if (!this.wfTransitionsRoot)
				return DOM.getDocumentElement(DOM.parse("<Combo></Combo>"));
			
			return DOM.getDocumentElement(DOM.transform(this.context.getAll2uiXSLTProc(), this.wfTransitionsRoot, true));
		}

		else if (dataID == "BookTree")
		{
			var tw = this.pluginObj.treeWrapper;
			if (!tw || !tw.treeXML)
				return DOM.getDocumentElement(DOM.parse("<TreePanel/>"));

			var treeXMLCopy = DOM.getDocumentCopy(tw.treeXML);
			var root = DOM.getDocumentElement(treeXMLCopy);
			root.setAttribute("currentLanguage", this.pluginObj.getDefaultLanguage());
			var treeUI = DOM.transform(this.context.getAll2uiXSLTProc(), root, true);
			return DOM.getDocumentElement(treeUI);
		}
		
		else if (dataID == "BookTree.FolderCheckboxes")
		{
			var tw = this.pluginObj.treeWrapper;
			if (!tw || !tw.treeXML)
			{
				return DOM.getDocumentElement(DOM.parse("<TreePanel/>"));
			}
			var root = DOM.getDocumentElement(DOM.getDocumentCopy(tw.treeXML));
			root.setAttribute("showFolderCheckboxes", "true");
			var treeUI = DOM.transform(this.context.getAll2uiXSLTProc(), root, true);			
			return DOM.getDocumentElement(treeUI);					
		}
		
		else if (dataID == "Plugin.Doc.Deltas")
		{
			var deltaDoc = this.getDeltaDoc(this.deltaDocID);
			if (deltaDoc == null) return Smc.DOM.getDocumentElement(Smc.DOM.parse("<Group></Group>"));
			return Smc.DOM.transform(this.context.getAll2uiXSLTProc(),deltaDoc, true);
		}			
		
		else if (dataID == "Plugin.Doc.SPSFiles")
		{
			var spsFiles = DOM.getSingleNode(this.context.getSettingsDoc(), "//SPSFiles");

			if (spsFiles == null)
			{
				return DOM.getDocumentElement(DOM.parse("<None/>"));
			}

			var comboUI = DOM.transform(this.context.getAll2uiXSLTProc(), spsFiles, true);			
			return DOM.getDocumentElement(comboUI);
		}
		else if (dataID == "note.metadata.generated")
		{
			if (!this.noteDocument)
				this.noteDocument = DOM.getDocumentElement(DOM.parse("<Group/>"));
			return this.noteDocument;
		}
		else if (dataID == "smc.search.metadata.generated")
		{
			if (!this.categoriesSearchFieldDocument)
				this.categoriesSearchFieldDocument = DOM.parse("<Group/>");
			return DOM.getDocumentElement(this.categoriesSearchFieldDocument);
		}
		// Pro def search
		else if (dataID == "search-prodef-group-datasource")
		{
			if (!this.productDefRoot)
				return DOM.parse("<Combo/>");
			return this.getComboXML();
		}
		else if (dataID == "smc.external-data.form")
		{
			if (!this.externalSearchFormDocument)
				this.externalSearchFormDocument = DOM.parse("<Group/>");
			return DOM.getDocumentElement(this.externalSearchFormDocument);
		}

		else if (dataID == "Objtypes")
		{
			var guiDom = DOM.createSimpleDocument("Combo");
			var comboElem = DOM.getDocumentElement(guiDom);
		
            var itemElem = DOM.createElement(guiDom, "Item");
            DOM.setAttribute(itemElem, "id", "");
            DOM.setAttribute(itemElem, "text", "");		
            DOM.appendChild(comboElem, itemElem);			
		
		
	    	var pluginList = DOM.getNodeList(this.context.getSettingsDoc(), "/*/Plugins/Plugin");
		    if (pluginList.length > 0)
		    {
		    	for (var i = 0, len = pluginList.length; i < len; i++)
		    	{
		    	    var pluginName = pluginList.item(i).getAttribute("name");
		    	    if (pluginList.item(i).getAttribute("hidden") == "true")
    	                continue;
    	            var itemElem = DOM.createElement(guiDom, "Item");
    	            DOM.setAttribute(itemElem, "text", this.t.t("Webdav.ContextMenu." + pluginName + ".New"));
    	            DOM.setAttribute(itemElem, "id", pluginName);
    	            DOM.appendChild(comboElem, itemElem);
    	                
    	                    	            
			        var pluginElem = pluginList.item(i);
		    	    var subTypeList = DOM.getNodeList(pluginElem, "Subtypes/*");
		    	    if (subTypeList.length > 0)
		    	    {
		    	        var subTypeItems = [];
		    	        	
		    	        var subTypeElem = DOM.getChildElement(pluginElem, "Subtypes");
		    	            
		    	        for (var k = 0, len2 = subTypeList.length; k < len2; k++)
		    	        {
		    	            var subTypeElem = subTypeList.item(k);
		    	            var hidden = subTypeElem.getAttribute("hidden");
		    	            if (hidden == "true")
		    	                continue;
		    	            var subTypeName = subTypeElem.nodeName;
		    	            var completeType = pluginName + "." + subTypeName;
		    	            var objTypeText = this.t.t("Webdav.ContextMenu." + completeType + ".New");
		    	                
		    	            var itemElem = DOM.createElement(guiDom, "Item");
		    	            DOM.setAttribute(itemElem, "id", completeType);
		    	            DOM.setAttribute(itemElem, "text", objTypeText);
		    	            DOM.appendChild(comboElem, itemElem);
		    	        }
		    	    }
		    	}
		    	    
		    }
			return DOM.getDocumentElement(guiDom);
		}
		
		else if (dataID == "SpecificSearchConditions")
		{
			var searchConditionsList = DOM.getNodeList(this.context.getSettingsDoc(), "//SearchConditions");
			
			var doc = DOM.createSimpleDocument("SearchConditionContainer");
			var root = DOM.getDocumentElement(doc);
			
			for (var i = 0; i < searchConditionsList.length; i++)
			{
				var pluginElem = DOM.getSingleNode(searchConditionsList[i], "ancestor::Plugin");
				var pluginName = DOM.getAttribute(pluginElem, "name");
				var searchConditionsElem = DOM.importNode(searchConditionsList[i], doc,true);
				DOM.setAttribute(searchConditionsElem, "plugin", pluginName);
				DOM.appendChild(root, searchConditionsElem);
			}

			var comboUI = DOM.transform(this.context.getAll2uiXSLTProc(), doc, true);			
			return DOM.getDocumentElement(comboUI);				
		}
		
		else if (dataID == "System.Users")
		{
			return  DOM.getDocumentElement(this.getSystemUsersDoc());
		}
		else if (dataID == "System.Countries")
		{
			return this.getSystemCountries();
		}
		
		else if (dataID == "term.synonyms.list")
		{
			if (!this.synListDoc)
			{
				this.synListDoc = DOM.parse("<Synonyms/>");
			}

			var synListGUI = DOM.transform(this.context.getAll2uiXSLTProc(), this.synListDoc, true);
			return DOM.getDocumentElement(synListGUI);
		}
		
		else if (dataID == "servicecase-list")
		{
			if (!this.serviceCaseList)
			{
				this.setServiceCasesList(DOM.parse("<GotThemes/>"));
			}

			return DOM.getDocumentElement(this.serviceCaseList);
		}

		else if (dataID == "servicecase-trace-list")
		{
			if (!this.serviceCaseTraceList)
			{
				this.setServiceCasesTraceList(DOM.parse("<GotThemes/>"));
			}
			return DOM.getDocumentElement(this.serviceCaseTraceList);
		}

		else if (dataID == "servicecase-translation-list")
		{
			if (!this.serviceCaseTranslationList)
			{
				this.setServiceCasesTranslationList(DOM.parse("<GotThemes/>"));
			}
			return DOM.getDocumentElement(this.serviceCaseTranslationList);
		}

		else if (dataID == "servicecase-task-list")
		{
			if (!this.serviceCaseTaskList)
			{
				this.setServiceCasesTaskList(DOM.parse("<GotThemes/>"));
			}
			return DOM.getDocumentElement(this.serviceCaseTaskList);
		}
		
		else if (dataID == "servicecase-statistics-list")
		{
			if (!this.serviceCasesStatisticsList)
			{
				this.setServiceCasesStatisticsList(DOM.parse("<GotStatistics/>"));
			}
			return DOM.getDocumentElement(this.serviceCasesStatisticsList);
		}

		else if (dataID == 'System.Workflow.States')
		{
			return DOM.getDocumentElement(this.getSystemWorkflowStates());
		}
		
		else if (dataID == 'doc-journalentry-list')
		{
			if (!this.docJournalEntryList)
			{
				this.setDocJournalEntryList(DOM.parse("<GotJournalItems/>"));
			}
			return DOM.getDocumentElement(this.docJournalEntryList);
		}
				
		else if (dataID == 'doc-admin-journalentry-list')
		{
			if (!this.docAdminJournalEntryList)
			{
				this.setDocAdminJournalEntryList(DOM.parse("<GotJournalItems/>"));
			}
			return DOM.getDocumentElement(this.docAdminJournalEntryList);
		}
    },
    getExportVersions : function(objectUri, objType) {
    	var blankDoc = Smc.DOM.createSimpleDocument("Combo");
    	
    	var pAPI = new PluginAPI(this.context, objType);
				
		var infoDoc = pAPI.getThemeInfo(objectUri);
		 
    	var defLangElem = Smc.DOM.getSingleNode(infoDoc, "/*/Properties/Property[@name = 'SMCSYS:defaultLanguage']");
    	if (!defLangElem)
    		return blankDoc;
		
		var defLang = defLangElem.getAttribute("value");
		
		var origElem = Smc.DOM.getSingleNode(infoDoc, "/*/Original[@language = '" + defLang + "']");
		if (!origElem)
			return blankDoc;
		
		return this.getCurrentVersions(origElem);
    },
    getCurrentRevisions: function(currentOriginalNode){
				
		var doc = this.pluginObj.getData().xmlDoc;
		var revsList = Smc.DOM.getNodeList(doc, "/*/revisions/revision");
		
    	var guiDom = Smc.DOM.createSimpleDocument("Combo");
		var comboElem = guiDom.documentElement;
		var itemElem = guiDom.createElement("Item");
		itemElem.setAttribute("id", "00");
		itemElem.setAttribute("text", "00");
		comboElem.appendChild(itemElem);
		
		for (var i = 0, len = revsList.length; i < len; i++)
		{
			var revNr = revsList[i].getAttribute("revno");
			var itemElem = guiDom.createElement("Item");
			itemElem.setAttribute("id", revNr);
			itemElem.setAttribute("text", revNr);
			comboElem.appendChild(itemElem);
		}
    	
    	return comboElem;	
	},
    getCurrentVersions : function(currentOriginalNode) {
    	if (!currentOriginalNode)
    		currentOriginalNode = this.pluginObj.getCurrentOriginalNode();
    	
    	var versionHistoryElem = currentOriginalNode != null ? Smc.DOM.getSingleNode(currentOriginalNode, "VersionHistory") : null;
    	if (versionHistoryElem != null)
    	{
    		var vLabel = currentOriginalNode.getAttribute("versionLabel");
    		if (vLabel)
    			versionHistoryElem.setAttribute("versionLabel", vLabel);
    		
    		var hasDraftVersionStr = currentOriginalNode.getAttribute("hasDraftVersion");
    		if (hasDraftVersionStr)
    			versionHistoryElem.setAttribute("hasDraftVersion", hasDraftVersionStr);
    		
    		var parsed = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), versionHistoryElem, true);
    		return parsed.documentElement;
    	}
    	else
    	{
    		var blankDoc = Smc.DOM.getBlankDocument();
    		var root = blankDoc.createElement("Combo");
    		blankDoc.appendChild(root);
    		var item = blankDoc.createElement("Item");
    		root.appendChild(item);
    		item.setAttribute("id", "Draft");
    		item.setAttribute("text", "Draft");
    		return root;
   		}
    },
	getVersions : function() {
    	var props = Smc.DOM.getSingleNode(this.pluginObj.getData().xmlDoc, "/");
  		var propsUI = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), props);
  		var resultDoc = Smc.DOM.parse(propsUI);
  		return resultDoc;
	},
    getMetaCharacterization_Checkboxes : function(filterValue) {
    	if (!this.metaCharacterizationDocument_Checkboxes)
    	{
    		var pAPI = new PluginAPI(this.context, this.pluginObj ? this.pluginObj.getObjectType() : null);

			this.metaCharacterizationDocument = pAPI.getMetaCharacterization(this.currentURI, filterValue);
			
			if (Smc.DOM.getSingleNode(this.metaCharacterizationDocument, "//Field[@name != '_SYSCatalogue']")) 
			{	
				this.hasMetaCharacterization = true;
			}
			else
			{	
				this.hasMetaCharacterization = false;
			}
			
			

			this.context.getCharacterizationManager().setCharacterizationPropHash(this.metaCharacterizationDocument);
	
			var processNode = Smc.DOM.getDocumentElement(this.metaCharacterizationDocument);		

			Smc.DOM.setAttribute(processNode, "mode" , "proplist");
			var doc1= Smc.DOM.getDocumentCopy(processNode);
			
			this.metaCharacterizationDocument_PropList = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), Smc.DOM.getDocumentElement(doc1), true);

			Smc.DOM.setAttribute(processNode, "mode" , "checkboxes");
			var doc2= Smc.DOM.getDocumentCopy(processNode);
			
			
			var addProps = Smc.DOM.getNodeList(this.context.getSettingsDoc(), "/*/Plugins/Plugin[@name = '" + this.pluginObj.NAME + "']/AdditionalProperties/Doc");
			var root2 = Smc.DOM.getDocumentElement(doc2);
			for (var i = 0; i < addProps.length; i++)
			{
				var newNode = Smc.DOM.importNode(addProps[i],doc2, true);
				Smc.DOM.appendChild(root2,newNode);
			}
			
			this.metaCharacterizationDocument_Checkboxes = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), Smc.DOM.getDocumentElement(doc2), true);
    	}
    	return this.metaCharacterizationDocument_Checkboxes;
    },


    getMetaCharacterization_PropList : function(filterValue, mode) {
    	if (!this.metaCharacterizationDocument_PropList)
    	{
    		var pAPI = new PluginAPI(this.context, this.pluginObj && this.pluginObj.getObjectType 
    				? this.pluginObj.getObjectType() : null);

			this.metaCharacterizationDocument = pAPI.getMetaCharacterization(this.currentURI, filterValue);

			if (Smc.DOM.getSingleNode(this.metaCharacterizationDocument, "//Field[@name != '_SYSCatalogue']")) 
			{	
				this.hasMetaCharacterization = true;
			}
			else
			{	
				this.hasMetaCharacterization = false;
			}

			this.context.getCharacterizationManager().setCharacterizationPropHash (this.metaCharacterizationDocument);

			var processNode = Smc.DOM.getDocumentElement(this.metaCharacterizationDocument);
			
			Smc.DOM.setAttribute(processNode, "mode" , "proplist");
			if (mode == "export") Smc.DOM.setAttribute(processNode, "export" , "true");
			var doc1= Smc.DOM.getDocumentCopy(processNode);

			this.metaCharacterizationDocument_PropList = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), Smc.DOM.getDocumentElement(doc1), true);


			Smc.DOM.setAttribute(processNode, "mode" , "checkboxes");
			var doc2= Smc.DOM.getDocumentCopy(processNode);
			
			this.metaCharacterizationDocument_Checkboxes = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), Smc.DOM.getDocumentElement(doc2), true);

			
    	}
    	return this.metaCharacterizationDocument_PropList;
    	
    	
    },

	getHasMetaCharacterization : function () {
		return this.hasMetaCharacterization;
	},


	setCurrentCharacterization : function (charac) {
		this.currentCharacterization = charac;
	},


    getDocMetaCharacterization : function (filterValue) {
		var metaDoc = this.getMetaCharacterization_Checkboxes(filterValue);
		return Smc.DOM.getSingleNode(metaDoc, "//Doc/List");
    },
    
    getContextCharacterization : function (filterValue) {
		var metaDoc = this.getMetaCharacterization_PropList(filterValue, "");
		return Smc.DOM.getSingleNode(metaDoc, "//Doc/PropertyList");
    },

    resetDocMetaCharacterization : function() {
    	this.metaCharacterizationDocument = null;
    	this.metaCharacterizationDocument_Checkboxes = null;
 		this.metaCharacterizationDocument_PropList = null;
    },

    refreshDocMetaCharacterization : function(filterValue) {
    	this.metaCharacterizationDocument = null;
    	this.metaCharacterizationDocument_Checkboxes = null;
 		this.metaCharacterizationDocument_PropList = null;
    	return this.getDocMetaCharacterization(filterValue);
    },
    getFolderMetaCharacterization : function () {
		var metaDoc = this.getMetaCharacterizationDocument();
		var doc2 = Smc.DOM.getBlankDocument();
		Smc.DOM.appendChild(doc2, Smc.DOM.importNode(Smc.DOM.getSingleNode(metaDoc, "//Folder/TreePanel"), doc2, true));
		return doc2;
    },
    getExportMetaCharacterization : function() {
    	var checkedStructTreeNodeIDs = this.context.GUI.getTreeNodeIDs("smc-context-characterization-tree", true); 
 		var metaDoc = this.getMetaCharacterization_PropList(checkedStructTreeNodeIDs.join(","), "export");
 		return metaDoc;
    },
    getPluginProperties : function() {
    	var props = Smc.DOM.getSingleNode(this.pluginObj.getData().xmlDoc, "//Properties");
    	Smc.DOM.setAttribute(props, "mode", "");
  		return Smc.DOM.transform(this.context.getAll2uiXSLTProc(), props, true);
    },
    getProductionTasksList : function(status) {
		var xPath = null;
		if (status == "finished")
			xPath = "/Tasks/FinishedTasks";
		else if (status == "running")
			xPath = "/Tasks/RunnningTasks";
			
		if (xPath == null)
			throw new Error("[getProductionTasksList] Invalid state: " + status);
			
		var tasksDoc = this.context.getRunningProductionTasksDoc();
		
		var processesNode = Smc.DOM.getSingleNode(tasksDoc, xPath);
		
		if (processesNode == null)
			throw new Error("[getProductionTasksList] Node not found, xpath: " + xPath);
		
		return Smc.DOM.transform(this.context.getAll2uiXSLTProc(), processesNode, true);
    },
	
	getTypo3SyncList : function() {
    	var DOM = new Dom();
		var tasksDoc = Smc.System.getTypo3SyncListDoc();		
		return DOM.transform(this.context.getAll2uiXSLTProc(), tasksDoc, true);
    },

	getDefaultStyleID : function () {
		return this.defaultStyleID;
	},

	getThemeList : function(objType, params, isFuzzy, filterProp, filterVal) {
		if (objType == "styles")
		{
			try
			{
				var viewNode = Smc.DOM.getSingleNode(this.themeDoc.documentElement, "//Views");
			}
			catch (e) 
			{
				viewNode = null;
			}
			if (viewNode != null)
			{
				var guiDef = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), viewNode, true);
				var defaultStyleNode = Smc.DOM.getSingleNode(guiDef, "//Item[@default='true']");
				defaultStyleNode
					? this.defaultStyleID = Smc.DOM.getAttribute(defaultStyleNode, "id")
					: this.defaultStyleID = null;
				return guiDef;
			}
		}
		
		if (isFuzzy) objType = objType + "*";
		
		if (Datasource.themeListCache[objType] == null)
		{
			var serverID = params && params['serverID'] ? params['serverID'] : Smc.System.getDefaultDataServerID();
			
			var pAPI = new PluginAPI(this.context, null, serverID);
			var respDoc;
			if (!isFuzzy)
			{
				respDoc = pAPI.getThemesByObjectType(objType);
			}
			else
			{
				respDoc = pAPI.getFuzzyThemesByObjectType(objType);
			}

			var uiDoc = Smc.DOM.getBlankDocument();
			var root = uiDoc.appendChild(uiDoc.createElement("Combo"));
			
			var themeList = Smc.DOM.getNodeList(respDoc.documentElement, "Theme[not(starts-with(@uri, '"
					+ Smc.System.TRASHCAN_BASE_PATH + "'))]");

			for (var i = 0, len = themeList.length; i < len; i++)
			{
				if (filterProp)
				{
					var propNode = Smc.DOM.getSingleNode(themeList[i], "Properties/Property[@name='"+filterProp+"']");
					if (propNode)
					{
						var propValue = Smc.DOM.getAttribute(propNode, "value");
						if (propValue != filterVal) continue;
					}
					else
					{
						continue;
					}
				}
				
				var itemElem = root.appendChild(uiDoc.createElement("Item"));
				itemElem.setAttribute("id", themeList[i].getAttribute("id"));
				itemElem.setAttribute("text", themeList[i].getAttribute("realName"));
			}


			
			Datasource.themeListCache[objType] = uiDoc;
		}
		return Datasource.themeListCache[objType];

	},
	getInheritedProps : function () {
		var pluginAPI = new PluginAPI(this.context, this.pluginObj.getObjectType());
		var objURI = this.pluginObj.getData().getProp("uri");
		var inheritedPropsDoc = pluginAPI.getProps(objURI, false);
		var propsElem = Smc.DOM.getSingleNode(inheritedPropsDoc, "/props/copy");		
		return Smc.DOM.transform(this.context.getAll2uiXSLTProc(), propsElem, true);
	},
	getLinks : function () {
		var pluginAPI = new PluginAPI(this.context, this.pluginObj.getObjectType());
		var objURI = this.pluginObj.getData().getProp("uri");
		var linksDoc = pluginAPI.getLinks(objURI);
		return Smc.DOM.transform(this.context.getAll2uiXSLTProc(), Smc.DOM.getDocumentElement(linksDoc), true);
	},
	
	getProfiles : function(params, type) {
		var serverID = params && params['serverID'] ? params['serverID'] : Smc.System.getDefaultDataServerID();
		var pAPI = new PluginAPI(this.context, null, serverID);
		var respDoc = pAPI.getThemesByObjectType(type);
		var uiDoc = Smc.DOM.getBlankDocument();
		var root = uiDoc.appendChild(uiDoc.createElement("Combo"));

		var currentUser = Smc.DOM.getSingleNode(respDoc.documentElement, "/GotThemes").getAttribute("user");
		var themeList = Smc.DOM.getNodeList(respDoc.documentElement, "Theme[not(starts-with(@uri, '"
				+ Smc.System.TRASHCAN_BASE_PATH + "'))]");
				
		var rangeDoc = this.context.getRangesDoc();
		var rangeNodes = Smc.DOM.getNodeList(rangeDoc, "/*/*");

		for (var i = 0, len = themeList.length; i < len; i++){
			var ranges = Smc.DOM.getSingleNode(themeList[i],"./Properties/Property[@name='ranges']");
			if(ranges != null){
				var arrayRanges = ranges.getAttribute("value").split(",");
				var included =  true;
				for(var z ; z<arrayRanges.legth; z++)
				{
					if(!this.isRangeIncluded(rangeNodes, arrayRanges[z]))
					{
						included = false;
						break;
					}
				}
				if(included){
					var itemElem = root.appendChild(uiDoc.createElement("Item"));
					itemElem.setAttribute("id", themeList[i].getAttribute("id"));
					itemElem.setAttribute("text", themeList[i].getAttribute("realName"));
				}
			}
			else 
			{
//				var owner = Smc.DOM.getSingleNode(themeList[i],"./Properties/Property[@name='SMC:createdBy']").getAttribute("value");
//				if(owner == currentUser)
//				{
					var itemElem = root.appendChild(uiDoc.createElement("Item"));
					itemElem.setAttribute("id", themeList[i].getAttribute("id"));
					itemElem.setAttribute("text", themeList[i].getAttribute("realName"));					
//				}
			}
		}
		return uiDoc;
	},		
	isRangeIncluded : function(rangeNodes, range){
		var val = false;
		for (var k = 0; k < rangeNodes.length; k++)
        {
     		if(rangeNodes[k].getAttribute("id")==range)
     		{
				val = true;
				break;
     		}
        }		
        return val;
	},
	getRanges : function() {
		var rangeDoc = this.context.getRangesDoc();
		var rangeNodes = Smc.DOM.getNodeList(rangeDoc, "/*/*");
		
		
		var doc = Smc.DOM.getBlankDocument();
		var root = doc.createElement("MultiSelectCombo");
		doc.appendChild(root);
    	
        for (var i = 0; i < rangeNodes.length; i++)
        {
        	var langElem = doc.createElement("Item");
        	langElem.setAttribute("id", rangeNodes[i].getAttribute("id"));
        	langElem.setAttribute("text", rangeNodes[i].getAttribute("name"));
			root.appendChild(langElem);
        }
		return doc;
	},
	getLanguages : function() {
		var langArr = this.context.getLanguages();
		var doc = Smc.DOM.getBlankDocument();
		var root = doc.createElement("Combo");
		doc.appendChild(root);
    	
        for (var i = 0; i < langArr.length; i++)
        {
        	var langElem = doc.createElement("Item");
        	langElem.setAttribute("id", langArr[i].name);
        	langElem.setAttribute("text", this.getLanguageText(langArr[i].name, langArr[i].description));
			root.appendChild(langElem);
        }
		return doc;
	},
	getLanguageText : function(langCode, langDesc) {
		return langDesc + " - " + langCode;
	},
	getLanguages2 : function(fixedId, fixedText) {

		var langArr = this.context.getLanguages();
		var doc = Smc.DOM.getBlankDocument();
		var root = doc.createElement("Combo");
		doc.appendChild(root);
    	
    	var allLangElem = doc.createElement("Item");
    	allLangElem.setAttribute("id", fixedId);
    	allLangElem.setAttribute("text", fixedText);
    	root.appendChild(allLangElem);
    	
        for (var i = 0; i < langArr.length; i++)
        {
        	var langElem = doc.createElement("Item");
        	langElem.setAttribute("id", langArr[i].name);
        	langElem.setAttribute("text", this.getLanguageText(langArr[i].name, langArr[i].description));
			root.appendChild(langElem);
        }

		return doc;
	},
	getPluginOriginalLanguages : function(includeEmpty) {

		var doc = Smc.DOM.getBlankDocument();
		var root = doc.createElement("Combo");
		doc.appendChild(root);
    	var origNodeList = Smc.DOM.getNodeList(this.pluginObj.getData().getDoc().documentElement, "//Original[not(@isVersionInfo)]");
    	
    	var langsObj = [];
    	
        for (var i = 0; i < origNodeList.length; i++)
        {
        	var origElem = origNodeList.item(i);
        	var origLanguage = origElem.getAttribute("language");
    		var langDesc = Smc.System.getLanguageDescription(origLanguage);
        	var itemElem = doc.createElement("Item");
        	itemElem.setAttribute("id", origLanguage);
        	itemElem.setAttribute("text", this.getLanguageText(origLanguage, langDesc));
        	
        	langsObj[origLanguage] = itemElem;
        }
        
        if(includeEmpty)
        {
        	var itemElem = doc.createElement("Item");
        	itemElem.setAttribute("id", "");
        	itemElem.setAttribute("text", Smc.System.getTranslatorCtrl().t("smc.languages.all"));
			root.appendChild(itemElem);        	
        }
        
        var languages = Smc.System.getLanguages();
        
        for (var i = 0, len = languages.length; i < len; i++)
        {
        	var code = languages[i].name;
        	if (langsObj[code])
        		root.appendChild(langsObj[code]);
        }
        
		return doc;
	},
	getPluginAvailableLanguages : function () {
		var doc = Smc.DOM.getBlankDocument();
		var root = doc.createElement("Combo");
		doc.appendChild(root);
    	var langNodeList = Smc.DOM.getNodeList(this.pluginObj.getData().getDoc().documentElement, "//Languages/Language");
    	
        for (var i = 0; i < langNodeList.length; i++)
        {
        	var langElem = langNodeList.item(i);
        	var lang = langElem.getAttribute("name");
    		var langDesc = Smc.System.getLanguageDescription(lang);
        	var itemElem = doc.createElement("Item");
        	itemElem.setAttribute("id", lang);
        	itemElem.setAttribute("text", this.getLanguageText(lang, langDesc));
			root.appendChild(itemElem);
        }
		return doc;		
	},
	getTransformers : function(objType) {
		if (!objType)
			objType = "doc";

		var trafos = Smc.DOM.getSingleNode(this.context.getSettingsDoc(), "/*/Plugins/Plugin[@name = '" + objType + "']/Transformers");
		
		if (trafos == null)
			throw new Error("Could not find transformer for plugin type: " + objType);
			
		return Smc.DOM.transform(this.context.getAll2uiXSLTProc(), trafos, true);
	},
	getProductionTasks : function() {
		if (this.productionTasks == null)
		{
			var tasksDoc = this.context.getProductionTasksDoc();
			
			var taskList = Smc.DOM.getNodeList(tasksDoc, "//Transformer[not(@listed = 'false')]");
			var doc = Smc.DOM.getBlankDocument();
			var root = doc.createElement("Combo");
			doc.appendChild(root);
	    	
	        for (var i = 0; i < taskList.length; i++)
	        {
	        	var taskItem = taskList.item(i);
	        	var taskElem = doc.createElement("Item");
	        	
	        	var trafoName = taskItem.getAttribute("name");
	        	var taskName = taskItem.getAttribute("displayname");
	        	
	       		taskElem.setAttribute("id", trafoName);
	        	taskElem.setAttribute("text", taskName);
				root.appendChild(taskElem);
        	}
        	this.productionTasks = doc;
		}
		return this.productionTasks;
	},
	getCharacterizationTree : function(params) {
		var bookURL = params["bookURL"];
		if (bookURL == null)
			throw new Error("Characterization tree URL is not defined!");
		
		if (Datasource.treeCache[bookURL] == null)
		{
			try
			{
				var sysDefLang = this.context.getSystemDefaultLanguage();
				var pA = new PluginAPI(this.context, "book");
				var bookDoc = pA.editLoad(bookURL, sysDefLang);
				bookDoc.documentElement.setAttribute("mode", "characterization");
		  		Datasource.treeCache[bookURL] = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), bookDoc, true);
			}
			catch (e)
			{
				var blankDoc = Smc.DOM.getBlankDocument();
				blankDoc.appendChild(blankDoc.createElement("Blank"));
				Datasource.treeCache[bookURL] = blankDoc;
			}
		}
  		return Datasource.treeCache[bookURL];
	},
	getPartialContentTree : function(params) {
		var bookURL = params["bookURL"];
		if (bookURL == null)
			throw new Error("Tree URL is not defined!");
		
		if (Datasource.treeCache[bookURL] == null)
		{
			try
			{
				var sysDefLang = this.context.getSystemDefaultLanguage();
				var pA = new PluginAPI(this.context, "book");
				var requestDoc = pA.getThemes({
					"getDescendant": "true"
				}, null, bookURL);
				var bookDoc = Smc.DOM.postContent(this.context.getParameter("SLIDE_SERVER") + "/theme", requestDoc);
				bookDoc.documentElement.setAttribute("bookURL", bookURL);
				bookDoc.documentElement.setAttribute("mode", "partialcontenttree");
		  		Datasource.treeCache[bookURL] = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), bookDoc, true);
			}
			catch (e)
			{
				var blankDoc = Smc.DOM.getBlankDocument();
				blankDoc.appendChild(blankDoc.createElement("Blank"));
				Datasource.treeCache[bookURL] = blankDoc;
			}
		}
  		return Datasource.treeCache[bookURL];
	},
	getDataservers : function() {
		var dsArr = this.context.getDataServers();
		var doc = Smc.DOM.getBlankDocument();
		var root = doc.createElement("Combo");
		doc.appendChild(root);
    	
        for (var i = 0; i < dsArr.length; i++)
        {
        	if (dsArr[i].serverName.length == 0)
        		continue;
        	var langElem = doc.createElement("Item");
        	langElem.setAttribute("id", dsArr[i].serverID);
        	langElem.setAttribute("text", dsArr[i].serverName);
        	if (dsArr[i]['default'] && dsArr[i]['default'] == "true")
    			langElem.setAttribute("default", "true");
			root.appendChild(langElem);
        }
		return doc;
	},
	
	// returns the workflow id of the plugin-object
	getWorkflowId : function() {
		if (this.workflowFragment != null)
		{
			var workflowInfo = Smc.DOM.getSingleNode(this.workflowFragment, "/WorkflowInfo/Language[@name != '' and @workflowId != '']");
		
			if (workflowInfo)
				return Smc.DOM.getAttribute(workflowInfo, "workflowId");
		}
		return null;
	},
	
	getWorkflowInfoMayEdit : function(language){
		
		if (this.workflowFragment != null && language != null)
		{
			var mayEdit = true;
			var workflowInfo = Smc.DOM.getSingleNode(this.workflowFragment, "/WorkflowInfo/Language[@name='" + language + "']");
		
			if (workflowInfo != null)
			{
				var mayEditValue = Smc.DOM.getAttribute(workflowInfo, "mayEdit");
				return mayEditValue != null && mayEditValue == 'true';
			}
			else
			{
				// no workflow info specifically for this original-language file
			//	return false;
				return true;// it might be trying to create a non existing language version!
			}
		}
		// return default value
		return true;
	},
	
	/**
	 * Sets the worfklow information to a specified language. The document is transformed before being internally stored.
	 * return: the new language-workflow document, according to getWorkflowInfo(language) function 
	 */
	setWorkflowInfo : function(workflowNode, language) {
		var workflowUIDoc = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), workflowNode, true);
	
  		var workflowFragmentRoot = null;
  		if (this.workflowFragment == null)
  		{
  			this.workflowFragment = Smc.DOM.getBlankDocument();
  			this.workflowFragment.appendChild(this.workflowFragment.createElement("WorkflowInfo"));
  		}
  		workflowFragmentRoot = Smc.DOM.getDocumentElement(this.workflowFragment);
  		
  		if (language == null)
  			return this.getWorkflowInfo(language);
  		
  		var LanguageElem = Smc.DOM.getSingleNode(workflowFragmentRoot, "Language[@name='" + language + "']");
  		if (LanguageElem != null) // remove language information!
  		{
  			Smc.DOM.deleteChildNodes(LanguageElem);
  		}
  		else
  		{
  			LanguageElem = this.workflowFragment.createElement("Language");
  			Smc.DOM.setAttribute(LanguageElem, "name", language);
  			Smc.DOM.appendChild(workflowFragmentRoot, LanguageElem);
  		}
  		
  		//set Language/@workflowId / Language/@mayEdit
  		var workflowIdValue = Smc.DOM.getAttribute(workflowNode, "workflowId");
  		if (workflowIdValue != null && workflowIdValue != '')
  		{
  			Smc.DOM.setAttribute(LanguageElem, "workflowId", workflowIdValue);
	  		//set Language/@mayEdit
	  		var mayEditValue = Smc.DOM.getAttribute(workflowNode, "mayEdit"); 
	  		Smc.DOM.setAttribute(LanguageElem, "mayEdit", (mayEditValue != null && mayEditValue == 'true') ? 'true' : 'false' );
  		}
  		else
  		{
  			Smc.DOM.setAttribute(LanguageElem, "mayEdit", "true");
  		}

		var newLangWorkflow = Smc.DOM.importNode (Smc.DOM.getDocumentElement(workflowUIDoc), this.workflowFragment, true);
		Smc.DOM.appendChild(LanguageElem, newLangWorkflow);
  		
  		return this.getWorkflowInfo(language);
	},


	setTermGUI : function(termNode)
	{
		this.termDocument = Smc.DOM.getOwnerDocument(termNode); 
	},

	setNoteGUI : function(noteNode)
	{
		this.noteDocument = Smc.DOM.getOwnerDocument(noteNode); 
	},
	setCategoriesSearchFieldDocument : function (categoriesSearchFieldNode)
	{
		this.categoriesSearchFieldDocument = (categoriesSearchFieldNode) ? Smc.DOM.getOwnerDocument(categoriesSearchFieldNode) : null;
	},

	setExternalSearchFormDocument : function (externalSearchFormDocument)
	{
		this.externalSearchFormDocument = (externalSearchFormDocument) ? Smc.DOM.getOwnerDocument(externalSearchFormDocument) : null;
	},
	setProductDefRoot: function (rootElem) {
		this.productDefRoot = rootElem;
	},
	setSynListDoc : function (synListDoc)
	{
		this.synListDoc = synListDoc;
	},
	getLastValueSelected : function() {
		if (!this.comboGroupSelection)
			this.comboGroupSelection = {};
		return this.comboGroupSelected ? this.comboGroupSelection[this.comboGroupSelected] : null; 
	},
	// pro def search
	getComboXML : function() {
		var containerKey = this.getLastValueSelected();
		var nodeList = null;
		var docRoot = this.productDefRoot;
		var resultDoc = Smc.DOM.getBlankDocument();
		var combo = resultDoc.createElement("Combo");
		
		if (containerKey)
			nodeList = Smc.DOM.getNodeList(docRoot, containerKey + "/*[self::Group[.//Field[not(@inUse)]] or self::Field]");
		else
			nodeList = Smc.DOM.getNodeList(docRoot, "*[self::Group[.//Field[not(@inUse)]] or self::Field]");

		if(nodeList && nodeList.length > 0)
		{
			for(var i = 0; i < nodeList.length; i++ )
			{
				var node = nodeList[i];
				var nodeDeleted = node.getAttribute("deleted") == "true";
				
				if(node.getAttribute("isNew")
						|| (node.getAttribute("inUse") && !nodeDeleted))
					continue;
				
				var displayNameElem = Smc.DOM.getSingleNode(node, "Displayname");
				
				var comboText = displayNameElem ? Smc.DOM.getText(displayNameElem) : node.getAttribute("name");
				if(node.tagName == "Group")
					comboText = "* " + comboText;
				
				var item = resultDoc.createElement("Item");
				item.setAttribute("id", Smc.DOM.getElementXPath(node));
				item.setAttribute("text", comboText);
				combo.appendChild(item);
			}
		}
		
		return combo;
	},
	
	getSystemUsersDoc : function() {
		
		if (Datasource.treeCache['system.users'] == null)
		{
			try
			{
				var sysDefLang = this.context.getSystemDefaultLanguage();
				var pA = new PluginAPI(this.context, "book");
				var gotUsersDoc = pA.getUsers();
				Smc.DOM.setAttribute(Smc.DOM.getDocumentElement(gotUsersDoc), "mode", "system.users.combo");

		  		Datasource.treeCache['system.users'] = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), gotUsersDoc, true);
			}
			catch (e)
			{
				var blankDoc = Smc.DOM.getBlankDocument();
				blankDoc.appendChild(blankDoc.createElement("Blank"));
				Datasource.treeCache['system.users'] = blankDoc;
			}
		}
  		return Datasource.treeCache['system.users'];
	},
	
	getSystemWorkflowIconHash : function ()
	{
		if (!this.systemWorkflowIconHash)
		{
			this.getSystemWorkflowStates;
		}		
		return this.systemWorkflowIconHash;
	},

	
	getSystemWorkflowStates : function() {
		
		
		if (Datasource.treeCache['system.workflow.states'] == null)
		{
			this.systemWorkflowIconHash = {};
			
			var WORKFLOW_OBJECT_TYPE = "system.workflow";
			var pAPI = new PluginAPI(this.context, WORKFLOW_OBJECT_TYPE, Smc.System.getDefaultDataServerID());
			
			var getThemesWFDoc = pAPI.getThemesByObjectType(WORKFLOW_OBJECT_TYPE);
			
			var nodes = Smc.DOM.getNodeList(getThemesWFDoc, "/GotThemes/Theme");
			for (var i = 0; i < nodes.length; i++)
			{
				var ThemeElem = nodes[i];
				var PropertyElem = Smc.DOM.getSingleNode(ThemeElem, "Properties/Property[@name='SMCSYS:defaultLanguage']");
				var wfLanguage = (PropertyElem) ? Smc.DOM.getAttribute(PropertyElem, "value") : Smc.System.getSystemDefaultLanguage();
				var ThemeID = Smc.DOM.getAttribute(ThemeElem, "id");
				
				var wfDoc = null;
				try
				{
					wfDoc = pAPI.load(null, ThemeID, wfLanguage, null, null, {}, null);
				}
				catch (err) {
					wfDoc = null;
				}
				
				if (wfDoc && Smc.DOM.getDocumentElement(wfDoc) != null)
				{
					var OriginalElem = Smc.DOM.createElement(wfDoc, "Original");
					Smc.DOM.setAttribute(OriginalElem, "language", wfLanguage);
					Smc.DOM.appendChild(ThemeElem, OriginalElem);
					
					var elem = Smc.DOM.importNode(Smc.DOM.getDocumentElement(wfDoc), getThemesWFDoc, true);
					Smc.DOM.appendChild(OriginalElem, elem);
				}
			}
			Smc.DOM.setAttribute(Smc.DOM.getDocumentElement(getThemesWFDoc), "mode", "System.Workflow.States");

			var doc = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), getThemesWFDoc, true);

			var nl = Smc.DOM.getNodeList(getThemesWFDoc, "//state");
			
			for (var i = 0; i < nl.length; i++)
			{	
				var icon = Smc.DOM.getAttribute(nl[i],"icon");
				var name = Smc.DOM.getAttribute(nl[i],"name");
				this.systemWorkflowIconHash[name] = icon;
			}

	  		Datasource.treeCache['system.workflow.states'] = doc;
		}
			
		return Datasource.treeCache['system.workflow.states'];
	},

	getGuiDoc : function (id, guiDoc){
		return this.guiDocs[id];	
	},
	
	setGuiDoc : function (id, guiDoc){
		this.guiDocs[id] = guiDoc;	
	},
	setDeltaDocID : function (id)
	{
		this.deltaDocID = id;
	},
	
	setDeltaDoc : function (id, deltaDoc)
	{
		if (!this.deltaDocObj) this.deltaDocObj = {};
		this.deltaDocObj [id] = deltaDoc; 
	},
	setServiceCasesList : function (serviceThemes){
		var root = Smc.DOM.getDocumentElement(serviceThemes);
		Smc.DOM.setAttribute(root, "mode", "serviceCases");
		this.serviceCaseList = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), serviceThemes, true);
	},

	setServiceCasesTraceList : function (serviceThemes){
		var root = Smc.DOM.getDocumentElement(serviceThemes);
		Smc.DOM.setAttribute(root, "mode", "serviceCases");
		this.serviceCaseTraceList = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), serviceThemes, true);
	},

	getDeltaDoc : function (id) {
		if (!this.deltaDocObj)
			return null;	
		return this.deltaDocObj[id];	
	},
	setDocJournalEntryList : function (journalEntries){
		var root = Smc.DOM.getDocumentElement(journalEntries);
		Smc.DOM.setAttribute(root, "mode", "System.JournalEntry");
		this.docJournalEntryList = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), journalEntries, true);
	},
	setDocAdminJournalEntryList : function (journalEntries){
		var root = Smc.DOM.getDocumentElement(journalEntries);
		Smc.DOM.setAttribute(root, "mode", "System.JournalEntry.MultiPO");
		this.docAdminJournalEntryList = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), journalEntries, true);
	},
	
	setServiceCasesTranslationList : function (serviceThemes){
		var root = Smc.DOM.getDocumentElement(serviceThemes);
		Smc.DOM.setAttribute(root, "mode", "referedDocs");
		this.serviceCaseTranslationList = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), serviceThemes, true);
	},
	
	getServiceCasesTranslationList : function (){
		return this.serviceCaseTranslationList;
	},

	setServiceCasesTaskList : function (taskThemes){
		var root = Smc.DOM.getDocumentElement(taskThemes);
		Smc.DOM.setAttribute(root, "mode", "taskList2relationbuilderTasks");
		this.serviceCaseTaskList = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), taskThemes, true);
	},
	
	getServiceCasesTaskList : function (){
		return this.serviceCaseTaskList;
	},
	
	setServiceCasesStatisticsList : function (statistics){
		var root = Smc.DOM.getDocumentElement(statistics);
		Smc.DOM.setAttribute(root, "mode", "servicecases");
		this.serviceCasesStatisticsList = Smc.DOM.transform(this.context.getAll2uiXSLTProc(), statistics, true);
	},
	setWFTransitions : function (wfRoot) {
		this.wfTransitionsRoot = wfRoot;
	}
};
