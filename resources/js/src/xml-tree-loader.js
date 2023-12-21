Ext.define('Smc.Reader.Json', {
    extend : 'Ext.data.reader.Json',

    constructor : function(config) {
        Smc.Reader.Json.superclass.constructor.call(this, config);
    },
    getResponseData : function(response){
        try {
            var respXML = response.responseXML;
			if (!respXML.documentElement) {
				respXML = Smc.DOM.parse(response.responseText);
			}
            var node = response.request.operation.node;

            var childNodes = (node.data.xmlElem)? node.data.xmlElem.childNodes : respXML.documentElement.childNodes;

            var proxy = this.getModel().getProxy();
            return proxy.getJSObjectsFromXML(childNodes);
        } catch(message) {
            console.log(message);
        }
    }
});

Ext.define('Smc.BrokerTree.Proxy', {
    extend: 'Ext.data.proxy.Ajax',

    constructor: function (config) {
        if (!config)
            config = {};
        config.reader = Ext.create("Smc.Reader.Json", config);

        Smc.BrokerTree.Proxy.superclass.constructor.call(this, config);
    },
    getJSObjectsFromXML: function(childNodes) {
    	if (childNodes) {
            var nArr = [];

            for (var i = 0; i < childNodes.length; i++) {
                var node = childNodes[i];
                if (node.nodeName != "P" && node.nodeName != "S"){
                    continue;
                }

                var isLeaf = node.nodeName == "P";
                var iconCls = isLeaf ? "smc-node-leaf" : "smc-node-folder";

                if (node.getAttribute("is") === "book") {
                    iconCls = "smc-node-book";
                }

                if (node.getAttribute("hideIcon") === "true") {
                    iconCls = "hide-icon";
                }
                
                var path = node.getAttribute("p");
                if (path === null){
                    path = node.firstChild ? node.firstChild.getAttribute("p") : null;
                };



                var treeNodeId = Smc.System.getNodeIdWithPath(path, true);
                var nodeConfig = {
                    leaf: isLeaf,
                    text: node.getAttribute("t"),
                    path: path,
                    id: treeNodeId,
					iconCls: iconCls,
                    xmlElem: node
                };

                if (node.getAttribute("id"))
                    nodeConfig.nodeId = node.getAttribute("id");

				if (this.preloadAll && node.hasChildNodes()) {
					nodeConfig.children = this.getJSObjectsFromXML(node.childNodes);
				}

                var clsArr = [];

                if (node.getAttribute("ChangedState"))
                    clsArr.push("smc-diff-" + node.getAttribute("ChangedState").toLowerCase());

                if (node.getAttribute("descendantChanges") == "true")
                    clsArr.push("smc-diff-descendant-changes");

                if (clsArr.length > 0)
                    nodeConfig.cls = clsArr.join(" ");

                nArr.push(nodeConfig);
            }
            return nArr;
        }
    },
    sendRequest: function(request){
        var config = request.getCurrentConfig();
        if(config.action !== "read"){
            return Smc.BrokerTree.Proxy.superclass.sendRequest.call(this, request);
        }
        var idx = config.url.indexOf('?');
        if(idx >= 0){
            config.url = config.url.slice(0, idx);
        }
        Smc.System.getContentDoc(config.url, function(response){
            var node = config.operation.node;
            var childNodes = (node.data.xmlElem)? node.data.xmlElem.childNodes : response.documentElement.childNodes;

            config.callback.call(this, null, true, {
                status: 200,
                success: true,
                children: this.getJSObjectsFromXML(childNodes)
            })
        }, this);
        
        this.lastRequest = request;
        return request;
    }
    
});