/**
 * @constructor
 */
DataLink = function () {
	this.subscriptions = {};
};

DataLink.prototype = {
	subscribe : function (dataLink, funcRef, targetGUIelem, strictScope, subscriberScope) {
		var existingSubsc = this.subscriptions[dataLink];
		if (existingSubsc == null)
			existingSubsc = new Array();
		
		/* Check whether contains already */
		var alreadyDefined = false;
		
		for (var i = 0; i < existingSubsc.length; i++)
		{
			var subscriptionObj = existingSubsc[i];
			var existingFuncRef = subscriptionObj["handler"];
		  	if (existingFuncRef == funcRef && ((!strictScope && !subscriptionObj.strictScope) || subscriberScope === subscriptionObj.subscriberScope))
		  		alreadyDefined = true;
		}

		if (!alreadyDefined)
		{
			var subscriptionObj = new Object();
			subscriptionObj["handler"] = funcRef;
			subscriptionObj["guiElem"] = targetGUIelem;
			if (strictScope === true && subscriberScope)
			{
				subscriptionObj["subscriberScope"] = subscriberScope;
				subscriptionObj["strictScope"] = true;
			}
			existingSubsc.push(subscriptionObj);
			this.subscriptions[dataLink] = existingSubsc;
		}
	},
	unsubscribe : function (dataLink, funcRef, id) {
		var existingSubsc = this.subscriptions[dataLink];
		if (existingSubsc)
		{
			for (var i = 0; i < existingSubsc.length; i++)
			{
				var subscriptionObj = existingSubsc[i];
				var existingFuncRef = subscriptionObj["handler"];
				var elemID = subscriptionObj["guiElem"];
			  	if (existingFuncRef == funcRef && elemID == id)
			  	{
			  		existingSubsc.remove(subscriptionObj);
			  		i--;
			  	}
			}
		}
	},
	fire : function (dataLink, obj, scope, guiInstance) {
		var existingSubsc = this.subscriptions[dataLink];

		if (existingSubsc)
		{
			for (var i = 0, len = existingSubsc.length; i < len; i++)
			{
				var subscriptionObj = existingSubsc[i];
				var funcRef = subscriptionObj["handler"];
				var guiElem = subscriptionObj["guiElem"];
				if (subscriptionObj["strictScope"] === true && (!scope || scope != subscriptionObj["subscriberScope"]))
					continue;
				
				if (scope)
					funcRef.call(scope, obj, guiInstance);
				else
					funcRef(obj, guiElem);
			}
		}
	},	
	destroy : function() {
		delete this.subscriptions;
	}
};