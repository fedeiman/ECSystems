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
	var keywords = new Array();
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

	var add = function (link, keywords, description, extraParameters, metadataFields) {
		var al = records.length;
		records[al] = new Smc.trecords();
		records[al].set(link, keywords, description);
		records[al].addExtraParameters(extraParameters, metadataFields)
	};

	var searchAll = function (keyword, filterByBookName, filterQuery) {
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

		for (var nw = 0; nw < keywords.length; nw += 1)
			search(keywords[nw], filterByBookName, filterQuery);

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
		if (SortResults && keywords != '[all]')
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

		var translatorCtrl = Smc.System.getTranslatorCtrl();
		var ariaLabelText = translatorCtrl.t("smc.complete.search.alt");
		//append counter
		searchCt.append('<div class="x-result-counter" tabindex="-1" aria-label="' + sites + ' ' + ariaLabelText + '">' + sites + ' ' + strResults + '</div>');

		if (displast > sites && finds != 0)
			displast = sites + 1;

		if (finds == 0)
			return;

		var q2 = display_start;
		var q3 = displast;
		var keywordsStr = keywords.join(",");
		var comboBooks = [];

		for (var q = display_start; q < q3; q += 1) {

			if (results[q].val > 0) {

				var rcIdx = results[q].rec;
				var recordObj = records[rcIdx];
				var bookName = recordObj.extraParameters ? recordObj.extraParameters.bookName : "";
				if(!comboBooks.includes(bookName)) {
					comboBooks.push(bookName);
				}
				var htmlArr = [];
				htmlArr.push("<div class='x-result'><div class='x-link'><a class='result' href='");
				htmlArr.push(recordObj.link);
				htmlArr.push("'>");
				htmlArr.push(recordObj.description);
				htmlArr.push("</a>");
				if(bookName) {
					htmlArr.push("<p class='x-bookName'>");
					htmlArr.push(bookName);
					htmlArr.push("</p></div>");
				} else {
					htmlArr.push(("</div>"));
				}


				var descriptionHighlighted = highlightInElement(recordObj.keywords, keywords.join("|"), true);

				htmlArr.push('<div class="smc-search-result-item">');
				htmlArr.push( descriptionHighlighted );
				htmlArr.push('</div>');
				
				/* htmlArr.push("<div class='x-desc'>");
				var tempDesc = "";
				for (var i = 0; i < keywords.length; i++) {
					var keyw = keywords[i];
					var r = new RegExp("\\S{0,20}." + keyw + ".\\S{0,20}", "i");
					var res = recordObj.keywords.match(r);
					for (var k = 0; res != null && k < res.length; k++) {
						var tempDescLen = tempDesc.length;
						if (tempDescLen > 300)
							break;
						if (tempDescLen > 0)
							tempDesc += " ";
						var r2 = new RegExp("(" + keyw + ")", "gi");
						tempDesc += res[k].replace(r2, "<span class='highlight'>$1</span>");
					}
					if (tempDesc.length > 300)
						break;
				}

				htmlArr.push(tempDesc);
				htmlArr.push("</div>"); */

				htmlArr.push("</div>");
				searchCt.append(htmlArr.join(""));
				q2++;
			}
		}

		if(comboBooks.length && bookName) {
			var combo = document.createElement("select");
			combo.setAttribute("class", "filter-combo-book");
			combo.setAttribute("id", "filter-combo-book");
			var optionAll = document.createElement("option");
			optionAll.setAttribute("value", "-");
			optionAll.innerHTML = "-";
			combo.appendChild(optionAll);
			for (var i = 0; i < comboBooks.length; i++) {
				if(comboBooks[i] === "") {
					continue;
				}
				var selected = comboBooks[i] === filterByBookName ? 'selected' : "";
				var option = document.createElement("option");
				option.setAttribute("value", comboBooks[i]);
				option.innerHTML = comboBooks[i];
				if(selected) {
					option.setAttribute("selected", "selected");
				}
				combo.appendChild(option);
			}
			searchCt.prepend(combo);
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

	var highlightInElement = function (textToHightlight, searchString) {

		var searchTerms = searchString.split('|');
		var highlightedText = "";
		var trimTextLength = Smc.System.generalConfigParams.ONLINE_HELP_SEARCH_RESULT_TEXT_CHARS || 18;

		if (trimTextLength != 0) {
			for (var t = 0; t < searchTerms.length; t++) {

				var regex = new RegExp('(\\b)?(' + searchTerms[t] + ')(\\b)?', 'gi');
				var matches = [];
				var match = "";

				while ((match = regex.exec(textToHightlight)) !== null) {
					var matchStr =
						{
							index: match.index,
							text: match[0],
							length: match[0].length
						};
					matches.push(matchStr);
				}

				for (var i = 0; i < matches.length && i < 8; i++) {
					var textToAppend = textToHightlight.substring(matches[i].index, (matches[i].index + (matches[i].length + (trimTextLength - matches[i].length))));
					textToAppend = matches[i].index >= matches[i].length
						? "..." + textToAppend.replace(regex, '<b>' + matches[i].text + '</b>') + "... "
						: textToAppend.replace(regex, '<b>' + matches[i].text + '</b>') + "... ";
					highlightedText += textToAppend;
				}

			}

			return highlightedText;
		}
	};

	var stripInput = function (key) {
		while (key.substring(0, 1) == "," || key.substring(0, 1) == " ")
			key = key.substring(1, key.length)
		while (key.substring(key.length - 1, key.length) == "," || key.substring(key.length - 1, key.length) == " ")
			key = key.substring(0, key.length - 1);
		return key
	};

	var parseIt = function (key) {
		
		keywords = new Array();
		
		key = key.replace(/\s/g, " ");
		key = stripInput(key) + " ";
		var y = 0;

		while (key.indexOf(" ") > 0) {
			if (key.substring(0, 1) == '"' && key.indexOf('"', 2) > -1) {
				var pos = key.indexOf('"', 2)
				keywords[y] = key.substring(1, pos);
				keywords[y] = stripInput(keywords[y]);
				y++;
				key = key.substring(pos + 1, key.length);
			} else {
				var pos = key.indexOf(' AND ');
				if ((pos > 0) && (key.indexOf(' ') >= pos)) {
					keywords[y] = key.substring(0, pos);
					keywords[y] = stripInput(keywords[y]);
					y++;
					key = key.substring(pos + 5, key.length);
				} else {
					var pos = key.indexOf(' OR ');
					if ((pos > 0) && (key.indexOf(' ') >= pos)) {
						pos = key.indexOf(' ');
						keywords[y] = key.substring(0, pos);
						keywords[y] = stripInput(keywords[y]);
						if (keywords[y] != keywords[y - 1])
							y++;
						key = key.substring(pos + 1, key.length);
						pos = key.indexOf('OR ');
						key = key.substring(pos + 3, key.length);
						pos = key.indexOf(' ');
						keywords[y] = key.substring(0, pos);
						keywords[y] = stripInput(keywords[y]);
						y++;
						key = key.substring(pos + 1, key.length);
						if (key.substring(0, 3) == 'OR ')
							key = keywords[y - 1] + ' ' + key;
					} else {
						var pos = key.indexOf(" ");
						keywords[y] = key.substring(0, pos);
						keywords[y] = stripInput(keywords[y]);
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

	var search = function (keyword, filterByBookName, filterQuery) {
		var hit = 0;
		var addcomplete = 0;

		for (var q = 0; q < records.length; q++) {

			if(filterQuery) {
				var queries = filterQuery.replace("%7c","|").split("|");
				if(records[q].metadataFields) {
					var search = false;
					var arrMetadataFields = records[q].metadataFields.split("|");
					arrMetadataFields.forEach(function(field) {
						if(queries.includes(field.toLowerCase())) {
							search = true;
						}
					})
					if(!search) {
						continue;
					}
				}
			}

			var bookName = records[q].extraParameters ? records[q].extraParameters.bookName : "";
			if(filterByBookName) {
				if(bookName !== filterByBookName && filterByBookName !== '-') {
					continue;
				}
			}
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
		init: function (pSearchCtId, pStrResults, pStrNextPage, pStrPrevPage, keyword, filterByBookName) {
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

			if (searchwords != '') {
				var url = window.location.href;
				if(url.includes("?filter")) {
					var pattern = "filter=";
					if(!this.filterQuery) {
						this.filterQuery = url.slice(url.indexOf(pattern) + 7, url.length).toLowerCase();
					}
				}
				searchAll(searchwords, filterByBookName, this.filterQuery);
			}
            else
                $(".empty-input", searchCt).show();
		},
		add: function (link, keywords, description , extraParameters, metadataFields) {
			add(link, keywords, description, extraParameters, metadataFields);
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
	addExtraParameters : function(extraParameters, metadataFields) {
		if (extraParameters) {
			if (typeof extraParameters === "object") {
				this.extraParameters = extraParameters;
			} else {
				this.extraParameters = JSON.parse(extraParameters);
			}
		}
		if(metadataFields) {
			this.metadataFields = metadataFields;
		}
	},
	searchstring: function () {
		return this.link + ' ' + this.keywords + ' ' + this.description;
	}
};