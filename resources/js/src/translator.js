Smc.Translator = function(context, translationDoc) {

    var _tCache = new Object();
    
    this.t = function(id, fixLineEndings) {
        try
        {
            if (!id)
                return "";
            
            var tC = _tCache[id];
            if (tC)
                return tC;
                
            var transNode = Smc.DOM.getSingleNode(translationDoc, "//*[@ID = '" + id + "']");
            if (transNode == null)
                return id;
            var text = Smc.DOM.getText(transNode);
            if (text == null)
                return id;
            
            if (fixLineEndings)
            	text = text.replace(/\\n/g, "\n");
            
            _tCache[id] = text; // store in cache.
            return text;
        }
        catch (e)
        {
            alert("[Translator.t] Error while translating: " + id + "\n" + e.message);
            return "";
        }
    };
};