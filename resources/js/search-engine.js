if (typeof Smc == "undefined")
	window.Smc = {};

function add(){
	Smc.XSearch.add.apply(Smc.XSearch, arguments);
}

Smc.XSearch = function () {

	var searchCt;
	var searchwords = '';
	var origsearchwords;
	var records = new Array();
	var finds = 0;
	var sites = 0;
	var andresult = false;
	var SortResults = true;
	var display_start = 0;
	var resultsPerPage = 10000;
	var displast = resultsPerPage;
	var params;
	this.keywords = new Array();
	var results;
	var strResults = "results";
	var strNextPage = "next page";
	var strPrevPage = "previous page";

	var bsort = function () {
		for (var i = results.length - 1; i >= 0; i--) {
			for (var j = i; j >= 0; j--) {
				if (results[i].val > results[j].val) {
					var s = results[i];
					results[i] = results[j];
					results[j] = s;
				}
			}
		}
	};

	var add = function (link, keywords, description) {
		var al = records.length;
		records[al] = new Smc.trecords();
		records[al].set(link, keywords, description);
	};

	var searchAll = function (keyword) {
		finds = 0;
		sites = 0;

		var x = parseIt(keyword);
		if (x == -1)
			return;
		var total_keywords = x;

		if (keyword.length > 50)
			keyword = keyword.substring(0, 60) + "...";

		results = new Array();
		for (var q = 0; q < records.length; q++) {
			results[q] = new Array();
			results[q].rec = q;
			results[q].val = 0;
		}

		for (var nw = 0; nw < this.keywords.length; nw += 1)
			search(this.keywords[nw]);

		if (andresult) {
			for (var a = 0; a < results.length; a += 1) {
				if (results[a].val > 0) {
					if (results[a].val <= (total_keywords - 1) << 1) {
						results[a].val = 0;
						sites -= 1;
					}
				}
			}
		}
		if (SortResults && this.keywords != '[all]')
			bsort()

		// Now we build the output page
		displast = display_start;
		displast += resultsPerPage;
		if (displast > sites)
			displast = sites;

		var timeB = new Date();

		if (finds == 0) {
			display_start = 0;
			displast = 0;
		}

		//append counter
		searchCt.append('<div class="x-result-counter">' + sites + ' ' + strResults + '</div>');

		if (displast > sites && finds != 0)
			displast = sites + 1;

		if (finds == 0)
			return;

		var q2 = display_start;
		var q3 = displast;
		var keywordsStr = this.keywords.join(",");

		for (var q = display_start; q < q3; q += 1) {

			if (results[q].val > 0) {

				var rcIdx = results[q].rec;
				var recordObj = records[rcIdx];
				var htmlArr = [];
				htmlArr.push("<div class='x-result'><a class='result' href='");
				htmlArr.push(recordObj.link);
				htmlArr.push("?highlight=");
				htmlArr.push(encodeURIComponent(keywordsStr));
				htmlArr.push("'><span class='x-title'>");
				htmlArr.push(recordObj.description);
				htmlArr.push("</span>");
				htmlArr.push("</a>");
				htmlArr.push("<br/>");
				var descriptionHighlighted = highlightInElement(recordObj.keywords, this.keywords.join("|"), true);
				htmlArr.push('<span class="smc-search-result-item">');
				htmlArr.push( descriptionHighlighted );
				htmlArr.push('</span>');

				htmlArr.push("</div>");
				searchCt.append(htmlArr.join(""));
				q2++;
			}
		}

		if (finds > resultsPerPage) {

			var pages = Math.round(finds / resultsPerPage);
			if (finds % resultsPerPage < 6)
				pages++;

			// Create the parameter string
			var paramstring = "?keyword=" + keyword + "&and=" + andresult + "&sort=" + SortResults;

			/* Sanitize Input */
			paramstring = paramstring
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#x27;')
				.replace(/\//g, '&#x2F;')
				.replace(/`/g, '&#x60;')
				.replace(/=/g, '&#x3D;');

			var htmlArr = [];
			htmlArr.push("<div class='x-paging-ct'>");
			if (display_start > 0)
				htmlArr.push("<a class='x-page-prev' href='" + paramstring + "&disp=" + (display_start - resultsPerPage) + "'>" + strPrevPage + "</a>");
			for (i = 1; i <= pages; i += 1) {
				if ((((i - 1) * resultsPerPage) + 1) <= sites)
					htmlArr.push("<a class='x-page-nr' href='" + paramstring + "&disp=" + (((i - 1) * resultsPerPage)) + "'>" + i + "</a>");
			}
			if (displast < sites)
				htmlArr.push("<a class='x-page-next' href='" + paramstring + "&disp=" + (displast) + "'>" + strNextPage + "</a>");
			htmlArr.push("</div>");

			searchCt.append(htmlArr.join(""));
		}
	};

	var highlightInElement = function(textToHightlight, searchString, trimText) {

		var searchTerms = searchString.split('|');
		var highlightedText = "";

		for (var t=0; t < searchTerms.length; t++ )
		{

			var regex = new RegExp('(\\b)?(' + searchTerms[t] + ')(\\b)?','gi');
			var matches = [];

			var match = "";

			while( (match = regex.exec(textToHightlight) ) !== null )
			{
				var matchStr =
					{
						index 	: match.index,
						text 	: match[0],
						length 	: match[0].length
					};
				matches.push(matchStr);
			}
			
			if(matches.length > 0){
				var prefixText = textToHightlight.substring(0, matches[0].index);
				var sufixText = textToHightlight.substring((matches[0].index + matches[0].length));

				if(prefixText.indexOf(".") > -1){
					prefixText = prefixText.substring(prefixText.lastIndexOf(".") + 1);
				}
				if(sufixText.indexOf(".") > -1){
					sufixText = sufixText.substring(0, sufixText.indexOf(".") + 1);
				}
				var textToAppend = prefixText + '<b>'+matches[0].text+'</b>' + sufixText+'</br>';
				highlightedText += textToAppend;
			}


		}

		return highlightedText;
	};

	var stripInput = function (key) {
		while (key.substring(0, 1) == "," || key.substring(0, 1) == " ")
			key = key.substring(1, key.length)
		while (key.substring(key.length - 1, key.length) == "," || key.substring(key.length - 1, key.length) == " ")
			key = key.substring(0, key.length - 1);
		return key
	};

	var parseIt = function (key) {

		this.keywords = new Array();

		key = key.replace(/\s/g, " ");
		key = stripInput(key) + " ";
		var y = 0;

		while (key.indexOf(" ") > 0) {
			if (key.substring(0, 1) == '"' && key.indexOf('"', 2) > -1) {
				var pos = key.indexOf('"', 2);
				this.keywords[y] = key.substring(1, pos);
				this.keywords[y] = stripInput(this.keywords[y]);
				y++;
				key = key.substring(pos + 1, key.length);
			} else {
				var pos = key.indexOf(' AND ');
				if ((pos > 0) && (key.indexOf(' ') >= pos)) {
					this.keywords[y] = key.substring(0, pos);
					this.keywords[y] = stripInput(this.keywords[y]);
					y++;
					key = key.substring(pos + 5, key.length);
				} else {
					var pos = key.indexOf(' OR ');
					if ((pos > 0) && (key.indexOf(' ') >= pos)) {
						pos = key.indexOf(' ');
						this.keywords[y] = key.substring(0, pos);
						this.keywords[y] = stripInput(this.keywords[y]);
						if (this.keywords[y] != this.keywords[y - 1])
							y++;
						key = key.substring(pos + 1, key.length);
						pos = key.indexOf('OR ');
						key = key.substring(pos + 3, key.length);
						pos = key.indexOf(' ');
						this.keywords[y] = key.substring(0, pos);
						this.keywords[y] = stripInput(this.keywords[y]);
						y++;
						key = key.substring(pos + 1, key.length);
						if (key.substring(0, 3) == 'OR ')
							key = this.keywords[y - 1] + ' ' + key;
					} else {
						var pos = key.indexOf(" ");
						this.keywords[y] = key.substring(0, pos);
						this.keywords[y] = stripInput(this.keywords[y]);
						y++;
						if (y > 50)
							return -1;
						key = key.substring(pos + 1, key.length);
					}
				}
			}
		}
		return y - 1;
	};

	var search = function (keyword) {
		var hit = 0;
		var addcomplete = 0;

		for (var q = 0; q < records.length; q++) {
			addcomplete = 0;
			var search_parm = " " + records[q].searchstring() + " ";
			search_parm = search_parm.toLowerCase();

			if (keyword.indexOf(' AND ') > 0) {
				firstword = keyword.substring(0, keyword.indexOf(' ')).toLowerCase();
				lastword = keyword.substring(keyword.indexOf(' AND ') + 5, keyword.length).toLowerCase();
				if ((search_parm.indexOf(" " + firstword + " ") != -1) && (search_parm.indexOf(" " + lastword + " ") != -1)) {
					hit++;
					finds++;
					if (hit < 2) {
						if (results[q].val == 0)
							sites++;
						results[q].val += 2;
					}
				}
			} else {
				keyword = keyword.toLowerCase();
				if ((search_parm.indexOf(" " + keyword + " ") != -1) || (keyword == "[all]")) {
					hit++;
					finds++;
					if (hit < 2) {
						if (results[q].val == 0)
							sites++;
						results[q].val += 2;
					}
				} else {
					// check for a half hit (ie. search:share find:SHAREware)
					if (search_parm.indexOf(keyword) != -1) {
						hit++;
						finds++;
						if (hit < 2) {
							if (results[q].val == 0)
								sites++;
							results[q].val += 1;
							x = search_parm.indexOf(keyword) + keyword.length;
							pos = search_parm.substring(1, x - keyword.length);
							while (pos.indexOf(" ") != -1) {
								y = pos.indexOf(" ");
								pos = pos.substring(y + 1, pos.length);
							}
							if (pos.length <= 2)
								addcomplete++;

							pos = search_parm.substring(x, search_parm.length);
							fullresult = search_parm.substring(x, x + pos.indexOf(" "));

							if (fullresult.length <= 2)
								addcomplete++;
							if (addcomplete > 1)
								results[q].val += 1;
						}
					}
				}
			}
			hit = 0;
		}
	};

	return {
		init: function (pSearchCtId, pStrResults, pStrNextPage, pStrPrevPage, keyword, callback) {
			if (pSearchCtId)
				searchCt = $("#" + pSearchCtId);
			else
				searchCt = $(document.body);

			if (pStrResults)
				strResults = pStrResults;
			if (pStrNextPage)
				strNextPage = pStrNextPage;
			if (pStrPrevPage)
				strPrevPage = pStrPrevPage;

			params = new Smc.tparams();

			if(keyword){
				params.setValue(keyword);
			}

			if (params.getValue('keyword') != '') {
				searchwords = params.getValue('keyword');
				origsearchwords = searchwords;
				while (searchwords.indexOf('+') > -1) {
					pos = searchwords.indexOf('+')
					searchwords = searchwords.substring(0, pos) + ' ' + searchwords.substring(pos + 1)
				}
				$("#keyword").val(searchwords);
			}
			if (params.getValue('sort') != '') {
				if (params.getValue('sort') == '0' || params.getValue('sort') == 'false')
					SortResults = false;
				else
					SortResults = true;
			}
			if (params.getValue('and') != '') {
				if (params.getValue('and') == '0' || params.getValue('and') == 'false')
					andresult = false;
				else
					andresult = true;
			}
			if (params.getValue('disp') != '')
				display_start = parseInt(params.getValue('disp'));

			if (searchwords != '')
				searchAll(searchwords);
			else
				$(".empty-input", searchCt).show();

			if(callback){
				callback();
			}
		},
		add: function (link, keywords, description) {
			add(link, keywords, description);
		}
	};
} ();

/*********** Smc.tparams class ***********/
Smc.tparams = function () {
	var parameters = document.location.search;
	parameters = decodeURI(parameters.substring(1, parameters.length) + '&');

	this.params = new Array();
	var i = 0;
	while (parameters.indexOf('&', 0) != -1) {
		var al = this.params.length;
		this.params[al] = new Array();

		var tmp = parameters.substring(0, parameters.indexOf('&', 0));
		parameters = parameters.substring(parameters.indexOf('&', 0) + 1);

		if (tmp.indexOf('=') != -1) {
			this.params[al].command = tmp.substring(0, tmp.indexOf('='));
			this.params[al].value = tmp.substring(tmp.indexOf('=') + 1);
		} else {
			this.params[al].command = tmp;
			this.params[al].value = '';
		}
	}

	return this
};

Smc.tparams.prototype.getValue = function (param) {
	var value = '';
	param = param.toLowerCase();
	var al = this.params.length;
	for (var i = 0; i < al; i += 1) {
		if (this.params[i].command == param)
			value = this.params[i].value;
	}
	return value;
};

Smc.tparams.prototype.setValue = function(value){

	var sValue = value.toLowerCase();

	var tmp = new Array();
	tmp.command = "keyword";
	tmp.value   = sValue;

	var paramsLn = this.params.length;

	this.params[paramsLn] = tmp;
}


/*********** Smc.trecords class ***********/
Smc.trecords = function () {
	this.index = (Smc.trecords.count++);
	this.link = '';
	this.keywords = '';
	this.description = '';
	return this;
}
Smc.trecords.prototype = {
	count: 0,
	set: function (link, keywords, description) {
		this.link = link;
		this.keywords = keywords;
		this.description = description;
	},
	searchstring: function () {
		return this.link + ' ' + this.keywords + ' ' + this.description;
	}
};