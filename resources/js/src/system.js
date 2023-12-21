if (typeof Smc == "undefined")
	window.Smc = {};

Smc.System = function() {
	return {
		itemDblClick: false,
		contentDocs: {},
		generalConfigParams: {},
		loadDependencies: function(fn) {
			if (window.location.protocol == "file:") {
				this.appendScriptElem("config/settings.xml.js");
				this.appendScriptElem("data/helpcontent.xml.js");
				this.appendScriptElem("data/helpindex.xml.js");
				this.appendScriptElem("data/helptopicmapping.xml.js");
				if (fn) {
					setTimeout(function() {
						Smc.System.loadUIStrings(fn);
					}, 500);
				}
			} else if (fn) {
				fn.call(this);
			}
		},
		appendScriptElem: function(src) {
			var scriptElem = document.createElement("script");
			scriptElem.setAttribute("type", "text/javascript");
			scriptElem.setAttribute("src", src);
			scriptElem.setAttribute("charset", "UTF-8");
			document.body.appendChild(scriptElem);
		},
		appendScriptElemWithCallback: function(src, callback){
			var scriptElem = document.createElement("script");
			scriptElem.setAttribute("type", "text/javascript");
			scriptElem.setAttribute("charset", "UTF-8");
			document.body.appendChild(scriptElem);
			$(scriptElem).on('load', callback);
			scriptElem.setAttribute("src", src);
		},
		loadUIStrings: function(fn) {
			if (window.location.protocol == "file:") {
				this.appendScriptElem("resources/strings/" + this.getUILanguage() + ".xml.js");
				if (fn) {
					setTimeout(fn, 500);
				}
			} else if (fn) {
				fn.call(this);
			}
		},
		init : function(initCallback) {
			/* 
				Begin Patch
				Ext.js has some problems to allow to click on her pages
				when has a notebook with touch-screen, is a know issue From 2016
				https://www.fxsitecompat.dev/en-CA/docs/2016/touch-event-support-has-been-re-enabled-on-windows-desktop/
				https://www.sencha.com/forum/showthread.php?337169-ExtJS-5-is-broken-in-Firefox-52-when-laptop-has-a-touchscreen
				With this fix the click work has expected but some parts of the page
				can't not work with the tactile touch 
			*/
			Ext.define('Mb.override.dom.Element', {
				override: 'Ext.dom.Element'
			}, function(){
				var additiveEvents = this.prototype.additiveEvents,
					eventMap = this.prototype.eventMap;
				if(Ext.supports.TouchEvents && Ext.firefoxVersion >= 52 && Ext.os.is.Desktop){
					eventMap['touchstart'] = 'mousedown';
					eventMap['touchmove'] = 'mousemove';
					eventMap['touchend'] = 'mouseup';
					eventMap['touchcancel'] = 'mouseup';
					eventMap['click'] = 'click';
					eventMap['dblclick'] = 'dblclick';
					additiveEvents['mousedown'] = 'mousedown';
					additiveEvents['mousemove'] = 'mousemove';
					additiveEvents['mouseup'] = 'mouseup';
					additiveEvents['touchstart'] = 'touchstart';
					additiveEvents['touchmove'] = 'touchmove';
					additiveEvents['touchend'] = 'touchend';
					additiveEvents['touchcancel'] = 'touchcancel';

					additiveEvents['pointerdown'] = 'mousedown';
					additiveEvents['pointermove'] = 'mousemove';
					additiveEvents['pointerup'] = 'mouseup';
					additiveEvents['pointercancel'] = 'mouseup';
				}
			});
			/* End Patch */

			var params = Util.parseQueryString(window.location.search);
			if (params["topic"])
			{
				var mappingDoc = this.getContentDoc("data/helptopicmapping.xml");
				var mapElem = Smc.DOM.getSingleNode(mappingDoc, "/*/Topic[@id='" + params["topic"] + "']");
				if (mapElem)
				{
					var uri = window.location.href;
					uri = uri.substring(0, uri.indexOf("?"));
					window.location.href = uri + "?scrollTo=" + params["topic"] + "#" + mapElem.getAttribute("p");
					return;
				}
			}
			this.translator = new Smc.Translator(this, this.getStringsDoc());
			this.parseGeneralSettingsParams();
			this.initUI();

			if( this.getOnlineHelpType() === "jsonly" || window.location.protocol == "file:"){
				var searchIcon = this.GUI.getGuiObject("oh-txt-icon");
				if (searchIcon)
					searchIcon.hide();
			}

			this.reloadTree(function() {
				var startupHash = window.location.hash;
				if (startupHash && startupHash.indexOf("#") > -1)
					startupHash = startupHash.substring(startupHash.indexOf("#") + 1);

				var firstChild = this.getRootNode().firstChild;
				if (firstChild)
				{
					if (startupHash) {
						firstChild.currentPath = startupHash;
					}
					this.openPage(firstChild, true, true, null, null, true);
					firstChild.expand();
				}
				setTimeout(function(){
					$('#smc-system-loading').hide();
					$('#smc-system-loading-mask').fadeOut("slow");

					if (startupHash)
					{
						Smc.System.onHistoryChange(startupHash);
						Smc.System.syncTree();
					}
				}, 1);
			});
			if(window.location.protocol === "file:"){
				// This scripts loads a global variable 'textEntries'
				this.appendScriptElemWithCallback("autocomplete/textEntries.js", Util.createDelegate(function(){
					try{
						this.onTextEntriesLoad(window.textEntries);
					} catch (e){
						if(e instanceof ReferenceError){
							console.error("textEntries doesn't have the expected format for offline mode.");
						}
					}
				}, this));
			} else {
				Ext.Ajax.request({
					url: "autocomplete/textEntries.json",
					method: 'GET',
					scope: this,
					success: function (response) {
						this.onTextEntriesLoad(JSON.parse(response.responseText));
					}
				});
			}
			tabPanel = Smc.System.GUI.getGuiObject("sidebarTabs");
			tabPanel.setActiveTab(0);
			if(initCallback)
				initCallback();
			
			this.mobileView();
		},
		onTextEntriesLoad: function(entriesJSON){
			var context = this;
			$(document).keyup(function (evt) {
				// Focus search input text field
				if (evt.altKey && evt.keyCode === 83) { // Alt + S
					$("#smc-search-field").focus();
				}

				// Close the tab of the search result list and search result list item
				if (evt.altKey && evt.keyCode === 87) { // Alt + W
					var tabPanelBody = context.GUI.getGuiObject("smc-content-ct");
					if (tabPanelBody) {
						var activeTab = tabPanelBody.getActiveTab();
						if (activeTab && (!activeTab.objectID || activeTab.objectID !== "smc-content-preview")) {
							activeTab.close();
						}
					}
				}
			}).ready(function () {
				$("#smc-search-field").keyup(function (evt) {
					if (evt.keyCode === 40 || evt.keyCode === 38) {
						return;
					} else {
						if (context.timer) {
							clearTimeout(context.timer);
						}
						if (!this.run) {
							context.timer = setTimeout(function (scope) {
								scope.run = true;
								$(scope).keyup();
								scope.run = false;
							}, 400, this);

							evt.stopImmediatePropagation();
						}
					}
				});
				$("#smc-search-field").fuzzyComplete(entriesJSON.root);
				$("#smc-search-field").on('keydown', function (e) {
					if (e.keyCode === 13 || e.keyCode === 32) {
						context.doSearch();
						if (context.timer) {
							clearTimeout(context.timer);
						}
						e.target.blur();
					}
				});
				$("#smc-search-button").on('click', function () {
					context.doSearch();
				});
				$(".fuzzyResults").on("click", ".selected", function () {
					context.doSearch();
					$("#smc-search-field").blur();
				});
			});
		},
		showSearchHelp: function(bt, e) {
			if (!this.helpWindow)
			{
				this.helpWindow = new Ext.Window({
					height: 450,
					width: 350,
					x: e.getPageX() + 10,
					y: e.getPageY() + 10,
					autoScroll: true,
					closable: true,
					closeAction: "hide",
					bodyStyle: "background-color:white",
					title: this.getTranslatorCtrl().t("smc.search.help"),
					html: "<iframe src='resources/help/" + this.getUILanguage() + "/search-help.html' class='smc-content-iframe' frameborder='0' width='100%' height='100%'><iframe>"
				});
			}

			this.helpWindow.show();
		},
		onQuickAccessItemSelect: function(id) {
			var treePanel = this.GUI.getGuiObject("smc-index-tree");
			var rootNode = treePanel.getRootNode();
			var indexNode = rootNode.findChild("nodeId", id, true);
			if (indexNode) {
				treePanel.ensureVisible(indexNode.getPath());
				treePanel.getSelectionModel().select(indexNode);
				this.onTreeIndexNodeClick(treePanel, indexNode);
			}
		},
		getQuickAccessComboTemplate : function() {
			return new Ext.XTemplate(
				'<tpl for="."><div class="x-combo-list-item">',
				'<div class="smc-quickaccess-item smc-node-{type}">',
				'{text}',
				'</div></div></tpl>'
			);
		},
		getQuickAccessStore : function() {
			return new Ext.data.SimpleStore({
				fields: ['id', 'text', 'type'],
				data: this.getDataArray(this.getContentDoc("data/helpindex.xml").documentElement)
			});
		},
		getDataArray : function(guiElem) {

			var myRecordArr = [];
			var itemNodes = Smc.DOM.getNodeList(guiElem, "P | S | S/P");
			for (var j = 0; j < itemNodes.length; j++)
			{
				var itm = itemNodes.item(j);

				var id = itm.getAttribute("id");
				if (id == null)
				{
					id = "term-" + j;
					itm.setAttribute("id", id);
				}

				var text = itm.getAttribute("t");

				myRecordArr.push([id, text, itm.getAttribute("is")]);
			}
			return myRecordArr;
		},
		onPressSearchFieldKey: function(field, e) {
			if (e.getKey() == e.ENTER) {
				this.doSearch();
				return false;
			}
		},
		onKeyUpComboField : function (combo) {
			this.doLuceneAutoComplete(combo);
		},
		doLuceneAutoComplete : function (combo) {
			var searchText = combo.getRawValue();
			var store = combo.getStore();
			// var respJson = Smc.DOM.getContent("search.jsp?s=" + encodeURIComponent(searchText), {}, true);
			var respJson = JSON.parse('[{"id":"text","text":"text"},{"id":"text_new","text":"text new"}]');
			store.setData(respJson);
		},
		getAutoCompleteStore: function () {
			return new Ext.data.JsonStore({
				storeId: 'lucineId',
				fields: ['id', 'text']
			});
		},
		highlightInElement: function(textContainerNode, searchString) {

			var searchTerms = searchString.split('|');

			for (var i=0; i < searchTerms.length; i++ )	 {
				var regex = new RegExp(">([^<]*)?(" + searchTerms[i] + ")([^>]*)?<","gi");
				textContainerNode.innerHTML = textContainerNode.innerHTML.replace(regex,'>$1<span class="highlight">$2</span>$3<');

			}
		},
		doLocalSearch: function(searchField, resultCt){

			var specialChars = /(\s)?[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/](\s)?/gi;

			var searchFieldValue = searchField.split(" ");
			for(var word=0; word < searchFieldValue.length; word++){
				searchFieldValue[word] = searchFieldValue[word].replace(specialChars,"");
				if( !searchFieldValue[word] ){
					searchFieldValue.splice(word, 1);
				}
			}
			if (searchField.indexOf("-") > -1) {
				searchFieldValue = searchField.split("-");
				searchFieldValue = searchFieldValue.concat(searchField);
			}
			searchFieldValue = searchFieldValue.join("+");

			var container = $(resultCt.body.dom);
			
			container.empty();

			Smc.XSearch.init(container.attr("id"),"Ergebnisse","Nächste Seite","Vorige Seite", searchFieldValue);

			var tabPanelBody = this.GUI.getGuiObject("smc-content-ct");
			tabPanelBody.setActiveTab(resultCt);
			this.filterSearchByBook(container, searchFieldValue);

			$(".x-result-counter").focus();

			var anchorLink = container.find("a");
			$.each(anchorLink, function (index, value){

				var anchor = $(anchorLink[index]);
				
				var newPath = anchor.attr("href");
				newPath = "#" + Smc.System.splitPrefix(newPath);
				anchor.attr("href", newPath);
				
				anchor.on('click', function(event) {
					event.preventDefault();

					var path = anchor.attr("href");

					if (path.indexOf("#") == 0)
						path = path.substring(1);

					var newTab = tabPanelBody.add({
						closable: true,
						scrollable: true,
						listeners: {
							beforeclose: function() {
								tabPanelBody.setActiveTab(resultCt);
							}
						}
					});

					Smc.System.openPage({
						attributes: {
							path: path,
							text: $(this).text(),
							searchField: searchField
						}
					}, false, true, null, newTab);

					tabPanelBody.setActiveTab(newTab);
					return false;
				});
			});
		},
		doLuceneSearch: function(searchField, resultCt, extension, filterByBookName, comboBookFilter){
			if(!extension){
				extension = "jsp";
			}
			var url = window.location.href;
			if(url.includes("?filter")) {
				var pattern = "filter=";
				if(!this.filterQuery) {
					this.filterQuery = url.slice(url.indexOf(pattern) + 7, url.length).toLowerCase();
				}
			}
			var res;
			if(!filterByBookName || filterByBookName === "-") {
				if(this.filterQuery){
					res = Smc.DOM.getContent("search." + extension + "?s=" + encodeURIComponent(searchField) + "&metadataFields=" + this.filterQuery, {}, true)
				} else {
					res = Smc.DOM.getContent("search." + extension + "?s=" + encodeURIComponent(searchField), {}, true)
				}

			} else {
				if(this.filterQuery) {
					res = Smc.DOM.getContent("search." + extension + "?s=" + encodeURIComponent(searchField) + "&bookID=" + filterByBookName + "&metadataFields=" + this.filterQuery, {}, true);
				} else {
					res = Smc.DOM.getContent("search." + extension + "?s=" + encodeURIComponent(searchField) + "&bookID=", {}, true);
				}
			}

			var parsedHtml = $(res);
			var results = $(".smc-search-result-title", parsedHtml).length;

			var tabPanelBody = this.GUI.getGuiObject("smc-content-ct");
			tabPanelBody.setActiveTab(resultCt);

			$(resultCt.body.dom).find(".smc-search-result-title a").off("click");
			resultCt.show();
			$(resultCt.body.dom).empty()
				.append("<div class=\"smc-search-result-counter\">" + searchField + ": " + results + " "
					+ this.getTranslatorCtrl().t("smc.search.counter") + "</div>")
				.append(res).find(".smc-search-result-item").on('mouseover', function() {
				$(this).addClass("smc-search-result-item-hoover");
			}).on('mouseout', function() {
				$(this).removeClass("smc-search-result-item-hoover");
			}).find(".smc-search-result-title a").on('click', function() {
				var path = $(this).attr("href");
				if (path.indexOf("#") == 0)
					path = path.substring(1);

				if ($(this).attr("objType") != "file") {
					var newTab = tabPanelBody.add({
						closable: true,
						scrollable: true,
						listeners: {
							beforeclose: function (a) {
								tabPanelBody.setActiveTab(resultCt);
							}
						}
					});

					Smc.System.openPage({
						attributes: {
							path: path,
							text: $(this).text(),
							searchField: searchField
						}
					}, false, true, null, newTab);

					tabPanelBody.setActiveTab(newTab);
					return false;
				}
			}).each(function () {
				var anchor = $(this);
				var newPath = anchor.attr("href");
				newPath = "#" + Smc.System.splitPrefix(newPath);
				anchor.attr("href", newPath);
			})

			this.filterSearchByBookLucene(searchField, resultCt, extension, filterByBookName, comboBookFilter);
			
		},
		doSearch: function() {
			var searchField = this.GUI.getGuiObject("smc-search-field");
			if (!searchField) {
				searchField = $("#smc-search-field")[0].value;
			} else {
				searchField = searchField.value;
			}

			var tabPanelBody = this.GUI.getGuiObject("smc-content-ct");

			var resultCt = Ext.getCmp("smc-tab-search-result");

			if(this.isViewMobile()) {
				var panel = this.getActiveTab();
				panel.setTitle(searchField);
				resultCt = panel;
			} else {
				if(resultCt && resultCt !== this.getActiveTab()) {
					resultCt.close();
				}
				resultCt = tabPanelBody.add({
					closable: true,
					scrollable: true,
					id: "smc-tab-search-result"
				});
			}

			var searchID = this.getTranslatorCtrl().t("smc.search");

			/* Sanitize Input */
			searchField = searchField
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#x27;')
				.replace(/\//g, '&#x2F;')
				.replace(/`/g, '&#x60;')
				.replace(/=/g, '&#x3D;');

			resultCt.setTitle(searchID + ": " + searchField);

			if (searchField)
			{
				switch( this.getOnlineHelpType() ){
					case "auto":
						if(window.location.protocol == "file:"){
							this.doLocalSearch(searchField, resultCt);
						}else{
							this.doLuceneSearch(searchField, resultCt);
						}
						break;
					case "jsonly":
						this.doLocalSearch(searchField, resultCt);
						break;
					case "lucene":
						this.doLuceneSearch(searchField, resultCt);
						break;
					case "lucene-php":
						this.doLuceneSearch(searchField, resultCt, "php");
						break;
					default:
						this.doLocalSearch(searchField, resultCt);
						break;

				}
			}
		},
		handleTreeNodeBehavior: function (node) {
			if (!node.data["path"]) {
				node.expand();
			} else {
				this.openPage(node.data, null, null, null, null, true);
				if (node.expand) {
					node.expand();
				}
			}
		},
		onTreeNodeClick: function(tree, node) {
			var contextMenuVisible = Smc.System.contextMenu && Smc.System.contextMenu.isVisible();
			var treePanel = this.GUI.getGuiObject("smc-sidebar");
			$(".background-menu-mobile").removeClass("background-menu-mobile");
			if (this.itemDblClick) {
				this.itemDblClick = false;
				return;
			}

			this.handleTreeNodeBehavior(node);

			//This is the script that closes the left panel when the context menu IS NOT visible and you click something
			if (this.isViewMobile()) {
				if ((!treePanel.collapsed) && (!contextMenuVisible)) {
					treePanel.floatCollapsedPanel();//This is the line that closes the panel
				};
			}
		},
		onKeyUp: function(tree, node, element, position, event) {
			if (event.keyCode === 13) {
				event.preventDefault();
				this.handleTreeNodeBehavior(node);
			}
		},
		onTreeNodeDoubleClick: function (tree, node) {
			if (node.data["path"]) {
				this.openInNewTab(node);
			}
			this.itemDblClick = true;
		},
		openPage: function (node, startup, syncTree, fn, panel, getIdSubsection) {
			var path, title;
			while(!path && node){
				if (node.path) {
					path = node["path"];
					title = node["text"];
				} else {
					if (node.data) {
						path = node.data["path"];
						title = node.data["text"];
					} else {
						path = node.attributes["path"];
						title = node.attributes["text"];
					}
				}
				if (node.currentPath) {
					path = node.currentPath;
					node.currentPath = null;
				}
				if(!path){
					// Node might be a book, search inside for modules.
					node = node.firstChild;
				}
			}

			if (path && path.startsWith("#")){
				path = path.substring(1);
				if(node.attributes.path != null){
					node.attributes.path = path;
				}
			}

			if (!panel) {
				panel = this.getActiveTab();
			}

			if (this.getSyncTree() === 'true') {
				var cb = function () {
					Smc.System.forceSyncTree(null, fn, panel);
				};

				if (window.location.protocol == "file:" && cb) {
					var ifr = $(this.getTabContent("")).on("load", cb);
					setTimeout(function () {
						ifr.attr("src", path);
						panel.update(ifr);
					}, 500);
				} else if (cb) {
					var ifr = $(this.getTabContent("")).on("load", cb).attr("src", path);
					setTimeout(function () {
						ifr.attr("src", path);
						panel.update(ifr);
					}, 500);
				} else {
					panel.update(this.getTabContent(path))
				}
			} else {
				panel.currentPath = path;

				if(path) {
					if (window.location.protocol === "file:") {

						if (path) {
							var cleanerPath = path;
							if (cleanerPath.indexOf("%23") > -1){
								cleanerPath = cleanerPath.substring(0, cleanerPath.lastIndexOf("%23"));
							} else if (cleanerPath.indexOf("#") > -1){
								cleanerPath = cleanerPath.substring(0, cleanerPath.lastIndexOf("#"));
							}

							var filenameVariable = this.getFilenameVariable(path);
							if (window[filenameVariable]) {
								this.onSuccessPage(node, panel, title, window[filenameVariable]);
							} else {
								// This script loads its content into a global variable '<documentName>Xml'
								this.appendScriptElemWithCallback(cleanerPath + ".js", Util.createDelegate(function () {
									try {
										this.onSuccessPage(node, panel, title, window[filenameVariable]);
									} catch (e) {
										if (e instanceof ReferenceError) {
											console.error("Offline document didn't load.");
										}
									}
								}, this));
							}
						}
					} else {
						Ext.Ajax.request({
							url: path,
							method: 'GET',
							scope: this,
							success: function (response) {
								this.onSuccessPage(node, panel, title, response.responseText);
							}
						});
					}
				}

				if (!startup) {
					if (syncTree) {
						this.syncTree();
					}
					this.addHistoryToken(path);
				}

				var itemId = this.getNodeIdWithPath(path, getIdSubsection);
				var treePanel = this.GUI.getGuiObject("smc-content-tree");
				var treeNode = treePanel.getStore().getNodeById(itemId);
				if (treeNode) {
					treePanel.expandPath(treeNode.getPath());
					treePanel.setSelection(treeNode);
				}

				this.setActiveTab();
				if (panel.tab) {
					panel.tab.getEl().focus();
				}
			}
		},
		getFilenameVariable : function (path){
			if(path){
				var filename = Util.getFilenameWithoutExtension(path);
				filename = filename.replaceAll("[^A-z0-9_$]", "");
				filename = filename.replaceAll('-', "");
				return "m_" + filename + "Xml";
			}
			
		},
		runQuery: function(element, query, callback, scope, params) {
			var result = element.querySelectorAll(query);

			if (result) {
				for (var i = 0; i < result.length; i++) {
					callback.call(scope, result[i], params);
				}
			}
		},
		onSuccessPage: function(node, panel, title, response){
			var info = this.processResponseOpenPage(response);
			title = info["title"] || title;
			var path = panel.currentPath;
			
			if(Ext.os.is.Phone) {
				panel.body.dom.innerHTML = info["body"];
			} else {
				panel.update(info["body"]);
			}
			panel.setTitle(title);

			if (path.indexOf("#") !== -1) {
				var anchorId = path.slice(path.indexOf("#"));
				var targetSection = $(anchorId);
				if(targetSection.length > 0) {
					setTimeout(function() {
						if(targetSection.get(0)) {
							targetSection.get(0).scrollIntoView();
						}
					}, 100);
				}
			}

			if (node.attributes) {

				if(node.attributes.path != null && node.attributes.path.indexOf("#") > -1){
					var anchor = node.attributes.path.split("#")[1];
					var elem = $("#"+anchor);
					setTimeout(function() {
						if(elem.get(0)) {
							elem.get(0).scrollIntoView();
						}
					}, 100);
				}

				if (node.attributes["searchField"]) {
					var doc = panel.body.dom.querySelector("div.x-autocontainer-innerCt");
					var phrase = node.attributes.searchField.replace(/^\s+|\s+$/g, "").replace(/\s+/g, "|");
					Smc.System.highlightInElement(doc, phrase);
				}
			}

			var params = Util.parseQueryString(window.location.search);
			if (params["scrollTo"]) {
				var scrollElem = $("#" + params["scrollTo"]);
				if(scrollElem.get(0)){
					scrollElem.get(0).scrollIntoView();
				}else{
					var url = window.location.href;
					var scrollParam = url.split('?')[1];
					if (window.location.protocol !== "file:") {
						history.pushState({}, null, './');
					}
					window.location.hash = scrollParam.split('#')[1];
				}
			}

			this.runQuery(panel.body.dom, "img[src^='../'],source[src^='../'],track[src^='../'],iframe[src^='../']", this.adapterRootImg, this);
			this.runQuery(panel.body.dom, "a[class*='link-file'],a[class*='preview-image']", this.adapterRootLink, this);
			this.runQuery(panel.body.dom, "a[class*='link-xref']," +
				" a[class*='link-detail']," +
				" a[class*='link-element']," + " a[class*='lexicon']", this.asignLinkEvent, this, true);
			this.runQuery(panel.body.dom, " area[class*='link-xref']," +
				" div[class*='container-navButtons'] a:not([class*='smc-print'])," +
				" div[class*='index'] a", this.asignLinkEvent, this, false);
			this.runQuery(panel.body.dom, "div[class*='container-navButtons'] a[class*='smc-print']", this.asignPrintEvent, this, {path: path});
			this.asignMediaPreviewEvent();
		},
		splitPrefix : function(link) {
			if (link) {
				var subString = link.split("../")[1];

				if (!subString || subString.length == 0) {
					subString = link;
				}

				return subString;
			}
		},
		adapterRootImg: function (imgElem) {
			if (imgElem) {
				imgElem.setAttribute("src", this.splitPrefix(imgElem.getAttribute("src")));
			}
		},
		adapterRootLink: function (link) {
			if (link) {
				link.setAttribute("href", this.splitPrefix(link.getAttribute("href")));
			}
		},
		asignLinkEvent: function (link, addContextMenu) {
			var t = this.getTranslatorCtrl();
			if (link) {
				link.setAttribute("href", "#" + this.splitPrefix(link.getAttribute("href")));

				link.addEventListener("click", function (e) {
					e.preventDefault();

					Smc.System.openPage({
						attributes: {
							path: e.currentTarget.getAttribute("href"),
							text: e.currentTarget.text
						}
					});
				}, this);
				if(addContextMenu){
					link.addEventListener("contextmenu", function(e){
						e.preventDefault()

						var menuPath = e.currentTarget.getAttribute("href");

						if (menuPath && menuPath.startsWith("#")){
							menuPath = menuPath.substring(1);
						}

						var node = {
							attributes : {
								path : null
							},
							data : {
								"path" :  menuPath,
								"text" : e.currentTarget.text
							}
						};

						var menuItems = [];
						if (node.data["path"])
							menuItems.push({
								text : t.t("smc.opentab"),
								handler : function() {
									Smc.System.openInNewTab(node);
								},
								scope: this,
								iconCls : "smc-opentab"
							});
						if (node.data["path"])
							menuItems.push({
								text : t.t("smc.print"),
								handler : function() {
									Smc.System.printDoc(node.data["path"]);
								},
								scope: this,
								iconCls : "smc-print"
							});
						var contextMenu = Gui.showContextMenu(menuItems, e);

					});
				}
			}
		},
		asignMediaPreviewEvent: function () {
			// Removed for simplicity.
		},
		asignPrintEvent: function (link, params) {
			if (link) {
				link.addEventListener("click", function (evt) {
					evt.preventDefault();
					Smc.System.printDoc(params.path);
				},this)
			}
		},
		onTreeIndexNodeClick: function(tree, node, tr, level, event) {
			var treePanel = this.GUI.getGuiObject("smc-sidebar");
			$(".background-menu-mobile").removeClass("background-menu-mobile");
			var nodeElem = node.data.xmlElem;
			var menuItemList = Smc.DOM.getNodeList(nodeElem, "MenuItem");
			var menuItemArr = [];
			var iconCls = this.generalConfigParams.ONLINE_HELP_ICON_CLS !== null ? this.generalConfigParams.ONLINE_HELP_ICON_CLS : "smc-document";
			if (menuItemList.length > 0)
			{
				if (menuItemList.length > 1)
				{
					for (var i = 0; i < menuItemList.length; i++)
					{
						var menuItemElem = menuItemList[i];
						menuItemArr.push({
							text : menuItemElem.getAttribute("t"),
							handler : Util.createDelegate(this.onClickIndexTermTarget, this, [menuItemElem]),
							scope: this,
							iconCls : iconCls
						});
					}
					Gui.showContextMenu(menuItemArr, event, {
						cls: "smc-index-target-menu"
					});
				}
				else
				{
					this.onClickIndexTermTarget(menuItemList[0]);
				}
			}
			if (node.expand) {
				node.expand();
			}
			if (this.isViewMobile()) {
				if (!treePanel.collapsed) {
					treePanel.floatCollapsedPanel();
				}
			}
		},
		onClickIndexTermTarget: function(menuItemElem) {
			this.openPage({
				attributes: {
					path: menuItemElem.getAttribute("p"),
					text: menuItemElem.getAttribute("t")
				}
			}, false, true);
		},
		getNodeIdWithPath : function (path, getIdSubsection) {
			if (path) {
				var pathId = path.slice(path.indexOf("/") + 1, path.lastIndexOf("."));
				var pathIdSubsection = "";
				if(path.indexOf("#") !== -1 && getIdSubsection === true){
					pathIdSubsection = path.slice(path.indexOf("#"));
				}

				return pathId + pathIdSubsection;
			}
		},
		getTabContent: function(path) {
			return "<iframe src='" + path + "' class='smc-content-iframe' frameborder='0' width='100%' height='100%'></iframe>";
		},
		getActiveTab: function() {
			return this.GUI.getGuiObject("smc-content-preview");
		},
		setActiveTab: function() {
			var tabPanel = this.GUI.getGuiObject("smc-content-ct");
			tabPanel.setActiveTab(this.getActiveTab());
		},
		getMainTab: function() {
			return this.GUI.getGuiObject("smc-content-preview");
		},
		reloadTreeNode: function(node) {
			node.reload();
		},
		openInNewTab: function(node) {
			var iconCls = this.generalConfigParams.ONLINE_HELP_ICON_CLS !== null ? this.generalConfigParams.ONLINE_HELP_ICON_CLS : "smc-document";
			var panel = this.GUI.getGuiObject("smc-content-ct").add({
				title: node.data["text"],
				iconCls: iconCls,
				closable:true
			});
			panel.show();
			this.openPage(node, null, null, null, panel);
			if(this.getSyncTree()==='true'){
				panel.on("activate",function(){
					Smc.System.forceSyncTree(null,null,panel);
				})
			}
		},
		printDoc: function(path) {
			/* IE8 not support windowName with spaces */
			var thePopup = window.open(path, "Member_Listing", "menubar=0,location=0,height=700,width=700,scrollbars=yes");
			if (window.location.protocol == "file:") {
				setTimeout(function() {
					thePopup.focus();
					try {
						thePopup.print();
					} catch (e) {
						// this will create a cross origin error, but let's try anyway
					}
				}, 500);
			} else {
				var done = false;
				// note the usage of "new function". This is required for IE11!?!
				$(thePopup).on('load', new function() {
					if (thePopup.location.href != "about:blank") {
						thePopup.focus();
						thePopup.print();
						done = true;
					}
				});
				setTimeout(function() {
					$(thePopup).on('load', new function() {
						if (!done) {
							thePopup.focus();
							thePopup.print();
						}
					});
				}, 100);
			}
			thePopup.onafterprint = function () {
				this.close();
			};
		},
		onContextMenuTreeNode: function(tree, node, tr, level, event) {
			event.preventDefault();
			var t = this.getTranslatorCtrl();
			var treeElem = tree.el;
			var menuItems = [];
			if (node.data["path"]) {
				menuItems.push({
					text: t.t("smc.opentab"),
					handler: function () {
						this.openInNewTab(node);
					},
					scope: this,
					iconCls: "smc-opentab"
				});

				menuItems.push({
					text: t.t("smc.print"),
					handler: function () {
						this.printDoc(node.data["path"]);
					},
					scope: this,
					iconCls: "smc-print"
				});

				Smc.System.contextMenu = Gui.showContextMenu(menuItems, event);

				var sidebarPanel = this.GUI.getGuiObject("smc-sidebar");

				sidebarPanel.on("beforecollapse", function() {
					if (Smc.System.contextMenu.isVisible()) {
						return false;
					}
				}, sidebarPanel);
			}
		},
		initUI: function() {
			var url = window.location.href;
			var instance = this;
			if (url.includes("?filter")) {
				var htmlContent = this.getStructureDoc();
				var pattern = "filter=";
				var filterQuery = url.slice(url.indexOf(pattern) + 7, url.length).toLowerCase();
				var queries = filterQuery.replace("%7c","|").split("|");
				Array.prototype.slice.call(htmlContent.getElementsByTagName('P')).forEach(
					function (item) {
						var metadataFields = item.getAttribute("metadataFields");
						if (metadataFields) {
							var remove = true;
							var arrMetadataFields = metadataFields.split("|");
							arrMetadataFields.forEach(function (field) {
								var fieldLowerCase = field.toLowerCase();
								if (fieldLowerCase.includes(",")) {
									remove = instance.comboMultipleValues(fieldLowerCase, queries);
								} else if (queries.includes(fieldLowerCase)) {
									remove = false;
								}
							})
							if (remove) {
								item.remove();
							}
						}

					});
			}
			var settingsDoc = this.getSettingsDoc();
			var guiNode = Smc.DOM.getSingleNode(settingsDoc, "/*/UI/*");
			var ds = new Datasource(this, this, {});
			this.GUI = new Gui(guiNode, this, ds, null, this);
			var viewPort = this.GUI.render();

			if (!Ext.os.is.Windows && !Ext.os.is.Linux && !Ext.os.is.MacOS) {
				viewPort.getEl().on("swipe", function (e) {
					var panel = this.GUI.getGuiObject("smc-content-preview");
					var currPanel;
					if(e.direction == "left") {
						currPanel = panel.el.dom.querySelector("#nav_right");
						if (currPanel) {
							Smc.System.openPage({
								attributes: {
									path: currPanel.getAttribute("href"),
									text: currPanel.title
								}
							});
						}
					} else if (e.direction == "right") {
						currPanel = panel.el.dom.querySelector("#nav_left");
						if (currPanel) {
							Smc.System.openPage({
								attributes: {
									path: currPanel.getAttribute("href"),
									text: currPanel.title
								}
							});
						}
					}
				},this);
			}

			var structDoc = this.getStructureDoc();
			var titleElem = Smc.DOM.getSingleNode(structDoc, "/*/*[local-name() = 'Title']");
			var panel;
			if (titleElem) {
				if (titleElem.getAttribute("browserTitle")) {
					window.document.title = titleElem.getAttribute("browserTitle");
				}

				var title = "";
				for (var i = 0, len = titleElem.childNodes.length; i < len; i++) {
					title += Smc.DOM.serialize(titleElem.childNodes[i]);
				}

				panel = this.GUI.getGuiObject("smc-main-ct");
				if (panel.getInitialConfig()) {
					var initialConfig = panel.getInitialConfig();
					if (initialConfig.header && initialConfig.header.title) {
						title = title + ' ' + initialConfig.header.title.text;
					}
				}

				if (!this.isViewMobile()){
					this.GUI.setTitle("smc-main-ct", title);
				}
			}

			Ext.History.on("change", this.onHistoryChange, this);
			Ext.History.init();

			if(this.getSyncTree()==='true'){
				panel = this.GUI.getGuiObject("smc-content-preview");
				panel.on("activate",function(){
					Smc.System.forceSyncTree(null,null,panel);
				})
			}
		},
		comboMultipleValues : function(field, queries) {
			var search = field.substr(0, field.indexOf(':'));
			var comboValues = field.substr(field.indexOf(':') + 1, field.length).split(',');
			for (var i = 0; i < queries.length; i++) {
				if(queries[i].startsWith(search)) {
					var comboValuesQuery = queries[i].substr(queries[i].indexOf(':') + 1, queries[i].length).split(',');
					return !comboValuesQuery.every(function(value) {
						return comboValues.includes(value);
					});
				}
			}
		},
		onHistoryChange : function(token) {
			if (!!this.currentToken && decodeURI(token) == decodeURI(this.currentToken))
				return;

			if (!token || token == "null") {
				var firstChild = this.getRootNode().firstChild;
				if (firstChild) {
					this.onTreeNodeClick(null, firstChild);
				}
			} else {
				var path = decodeURIComponent(token);

				var panel = this.getActiveTab();
				panel.currentPath = path;
				var elem = this.getTreeNodeElemByPath(path);

				this.openPage({
					attributes: {
						path: path,
						text: (elem) ? elem.getAttribute("t") : ""
					}
				});
			}
		},
		getTreeNodeElemByPath: function(path) {
			var doc = this.getStructureDoc();
			return doc ? Smc.DOM.getSingleNode(doc, "//*[@p='" + path + "']") : null;
		},
		syncTree: function() {
			var panel = this.getActiveTab();
			var path = panel.currentPath;
			if (!path)
				return;
			var ancestorPosArr = this.getAncestorNodesByPath(path);
			this.expandNodeByPosition(this.getRootNode(), 0, ancestorPosArr);
		},
		expandNodeByPosition : function(node, idx, posArr) {
			node.expand(false, true, function() {
				if (idx < posArr.length)
					this.expandNodeByPosition(node.childNodes[posArr[idx]], idx + 1, posArr);
				else
					node.select();
			}, this);
		},
		getAncestorNodesByPath: function(path) {
			var doc = this.getStructureDoc();
			var node = this.getTreeNodeElemByPath(path);
			var posArr = [];
			var tmpNode = node;
			var rootNode = doc.documentElement;
			while (tmpNode && tmpNode != rootNode)
			{
				var counter = 0;
				var tmpNode2 = tmpNode.previousSibling;
				while (tmpNode2)
				{
					if (Smc.DOM.isElementNode(tmpNode2) && (tmpNode2.nodeName == "P" || tmpNode2.nodeName == "S"))
						counter++;
					tmpNode2 = tmpNode2.previousSibling;
				}
				posArr.push(counter);
				tmpNode = tmpNode.parentNode;
			}

			posArr.reverse();
			return posArr;
		},
		addHistoryToken : function(token) {
			token = encodeURIComponent(token).replace(/\%2F/g, "/");
			this.currentToken = token;
			Ext.History.add(token, true);
		},
		getUILanguage: function() {
			// Simplified.
			return "en";
		},
		getOnlineHelpType: function() {
			var structDoc = this.getStructureDoc();
			if (structDoc && structDoc.documentElement)
			{
				var ohtype = structDoc.documentElement.getAttribute("ohtype");
				return ohtype;
			}
			return null;
		},
		getSettingsDoc: function() {
			if (!this.settingsDoc)
			{
				if (window.settingsXml)
				{
					this.settingsDoc = Smc.DOM.parse(window.settingsXml);
					window.settingsXml = null;
				}
				else
					this.settingsDoc = Smc.DOM.getDocumentFromUri("config/settings.xml");
			}
			return this.settingsDoc;
		},
		getStringsDoc: function() {
			if (window[this.getUILanguage() + "Xml"])
			{
				var doc = Smc.DOM.parse(window[this.getUILanguage() + "Xml"]);
				window[this.getUILanguage() + "Xml"] = null;
				return doc;
			}
			else
				return Smc.DOM.getDocumentFromUri("resources/strings/" + this.getUILanguage() + ".xml");
		},
		getStructureDoc : function() {
			return this.getContentDoc("data/helpcontent.xml");
		},
		getContentDoc: function(uri, callback, scope) {
			var hasCallback = typeof callback == "function";
			if (!this.contentDocs[uri])
			{
				var filename = uri.indexOf("/") > 0 ? uri.substring(uri.lastIndexOf('/') + 1) : uri;
				filename = filename.indexOf(".") > 0 ? filename.substring(0, filename.lastIndexOf('.')) : filename;
				if (window[filename + "Xml"])
				{
					this.contentDocs[uri] = Smc.DOM.parse(window[filename + "Xml"]);
					window[filename + "Xml"] = null;
					if (hasCallback)
						callback.call(scope || this, this.contentDocs[uri]);
					else
						return this.contentDocs[uri];
				}
				else
				{
					if (hasCallback) {
						var instance = this;
						this.contentDocs[uri] = Smc.DOM.getContentAsync(uri, function (resp) {
							callback.call(scope || instance, resp);
							instance.contentDocs[uri] = resp;
						});
					} else {
						this.contentDocs[uri] = Smc.DOM.getDocumentFromUri(uri);
						return this.contentDocs[uri];
					}
				}
				return;
			}

			if (hasCallback)
				callback.call(scope || this, this.contentDocs[uri]);
			else
				return this.contentDocs[uri];
		},
		getTranslatorCtrl : function() {
			return this.translator;
		},
		getDataLinkHandler : function () {
			if (!this.datalinkHandler)
				this.datalinkHandler = new DataLink(this);
			return this.datalinkHandler;
		},
		getRootNode: function() {
			return this.GUI.getGuiObject("smc-content-tree").getRootNode();
		},
		reloadTree: function(fn) {
			this.GUI.getGuiObject("smc-content-tree").getRootNode().expand(false, fn, this);
		},
		getRootPath: function() {
			return "/";
		},
		getParameter: function() {},
		getSyncTree: function() {
			var structDoc = this.getStructureDoc();
			if (structDoc && structDoc.documentElement)
			{
				var syncTree = structDoc.documentElement.getAttribute("syncTree");
				return syncTree;
			}
			return null;
		},
		forceSyncTree: function(startup,fn,panel){
			var windowPath = window.location.href.split('#');
			var iframeElem = $("iframe", panel.body.dom)[0];
			var ifrPath = iframeElem.contentWindow.location.href;

			path = ifrPath.replace(windowPath[0].replace('index.html', ''),'');
			panel.currentPath = path;
			panel.setTitle(iframeElem.contentDocument.title);
			if (!startup) {
				Smc.System.syncTree();
				Smc.System.addHistoryToken(path);
			}
			if (fn) {
				fn.call();
			}
		},
		processResponseOpenPage: function (response) {
			if (response) {
				var ownerDocument = document.implementation.createHTMLDocument('virtual');
				var jEl = $(response, ownerDocument);
				var contentBody = jEl.filter("div,section,footer");
				var titleNode = jEl.filter("title");
				var contentBodyHtml = '';
				for (var i = 0; i < contentBody.length; i++) {
					contentBodyHtml += contentBody[i].outerHTML;
				}
				var info = {
					body: contentBodyHtml,
					title: typeof(titleNode.text) === "function" ? titleNode.text() : titleNode.text
				};
				return info;
			}
		},
		toggleCollapsed: function() {
			var panel = this.GUI.getGuiObject('smc-sidebar');
			panel.header = true;
			panel.setCollapsed(true);
		},
		checkIndexStore: function(){
			var indexPanel = Smc.System.GUI.getGuiObject("smc-index-tree");
			if(indexPanel && indexPanel.getStore().getCount() == 0)
				indexPanel.tab.hide();
		},
		asignHeaderEvent: function(header) {
			if (header) {
				header.addEventListener("click", function (e) {
					var bockCt = $(this).closest(".collapsible")[0];
					if($(bockCt).hasClass("closed")){
						$(bockCt).removeClass("closed");
					}else{
						$(bockCt).addClass("closed");
					}
				}, this);
			}
		},
		parseGeneralSettingsParams : function (){
			var settingsDoc = this.getSettingsDoc();
			var mainPanel = settingsDoc.getElementById("smc-main-ct");
			var generalConfigParams = mainPanel.getAttribute("generalConfigParams");
			if (generalConfigParams) {
				generalConfigParams = generalConfigParams.replace(/'/g, '"');
				try {
					this.generalConfigParams = JSON.parse(generalConfigParams);
				} catch (e) {
					console.log(e);
				}
			}
		},
		mobileView: function () {
			var contentPanel = $(".x-autocontainer-outerCt").parent();
			var button = $("#smc-mobile-menu");
			var panel = this.GUI.getGuiObject('smc-sidebar');
			$(".menu-mobile").on("click", function () {
				if (panel.hidden === false) {
					contentPanel.removeClass('background-menu-mobile');
					panel.floatCollapsedPanel();
				} else {
					contentPanel.addClass('background-menu-mobile');
					panel.floatCollapsedPanel();
				}
			})
			$(document).on('click', function (event) {
				if(button.is(':visible')) {
					var container = $(".smc-sidebar");
					if (!container.is(event.target) &&
						container.has(event.target).length === 0 && !button.is(event.target)) {
						contentPanel.removeClass('background-menu-mobile');
					}
				}
			});

		},
		isViewMobile : function () {
			var width = window.screen.width;
			return width <= 575;
		},
		filterSearchByBook : function(container, searchFieldValue ) {
			var combo = document.getElementById("filter-combo-book");
			var instance = this;
			if(combo) {
				combo.addEventListener("change", function(e) {
					container.empty();
					Smc.XSearch.init(container.attr("id"),"Ergebnisse","Nächste Seite","Vorige Seite", searchFieldValue, e.target.value);
					instance.filterSearchByBook(container, searchFieldValue);
				})
			}

		},
		filterSearchByBookLucene : function (searchField, resultCt, extension, filterByBookName, comboBookFilter) {
			var comboBook = comboBookFilter ? comboBookFilter : [];
			if(!comboBookFilter) {
				$(".smc-search-result-title").find(".x-bookName").each(function () {
					var elementID = $(this).attr('id');
					var name = $(this).text();
					comboBook.push({id: elementID, name: name});
				});
			}
			
			if(comboBook.length) {
				var combo = document.createElement("select");
				combo.setAttribute("class", "filter-combo-book");
				combo.setAttribute("id", "filter-combo-book");
				var optionAll = document.createElement("option");
				optionAll.setAttribute("value", "-");
				optionAll.innerHTML = "-";
				combo.appendChild(optionAll);
				var optionCreated = [];
				for (var i = 0; i < comboBook.length; i++) {
					var optionBook = comboBook[i].id;
					if(!optionCreated.includes(optionBook)) {
						var selected = optionBook === filterByBookName ? 'selected' : "";
						var option = document.createElement("option");
						option.setAttribute("value", optionBook);
						option.innerHTML = comboBook[i].name;
						if(selected) {
							option.setAttribute("selected", "selected");
						}
						combo.appendChild(option);
						optionCreated.push(optionBook);
					}
				}
				$(resultCt.body.dom).prepend(combo);
			}
			var instance = this;
			$("#filter-combo-book").on('change', function (e) {
				var filterByBookName = e.target.value;
				instance.doLuceneSearch(searchField, resultCt, extension, filterByBookName, comboBook);
			})
		}
	};
}();
