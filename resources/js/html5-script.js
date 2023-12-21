$(document).ready(function () {

	$(this).on("click", ".isSubsection", function () {
		var linkId = this.getAttribute("id");
		linkId = linkId.substring(linkId.indexOf("_") + 1)
		var linkTarget = $("#"+linkId);
		var activeLinks = [];
		if(linkTarget[0]){
			$(this).parents("li").each(function (){
				activeLinks.push($(this).children("a")[0].getAttribute("id"));
				if(!$(this).hasClass("active")){
					$(this).addClass("active");
				}
			});
			$(".navigation li.active").each(function () {
				var currentLinkId = $(this).children("a")[0].getAttribute("id");
				if(!activeLinks.includes(currentLinkId)){
					$(this).removeClass("active");
				}
			});
		}
	});

	var startupHash = window.location.hash;
	if (startupHash && startupHash.indexOf("#") > -1){
		startupHash = startupHash.substring(startupHash.indexOf("#") + 1);
		var navToHash = $("#nav_" + startupHash);
		if(navToHash.length > 0){
			$(navToHash).parents("li").each(function (){
				if(!$(this).hasClass("active")){
					$(this).addClass("active");
				}
			});
		}

	}

});