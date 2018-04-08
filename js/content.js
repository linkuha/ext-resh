"use strict";

// TODO how inject in local files (html,txt from disk)???

if (typeof chrome == "undefined" || typeof chrome.extension == "undefined")
    window.chrome = window.browser;

var collapseFindFlag = 0;

// DOM TreeWalker ?
var regexpHighlight = function RHL(strRegexp, searchNode) 
{
	var regex = new RegExp(strRegexp, "gim");
	
	var childNodes = (searchNode || document.body).childNodes;
	var cnLength = childNodes.length;
	var excludes = "html,head,style,title,link,script,object,iframe";
	
	while (cnLength--)
	{
		var currentNode = childNodes[cnLength];

		// == ELEMENT_NODE 
		if (currentNode.nodeType === 1 && (excludes + ',').indexOf(currentNode.nodeName.toLowerCase() + ',') === -1) 
		{
			RHL(strRegexp, currentNode);
		}
		// != TEXT_NODE
		if (currentNode.nodeType !== 3 || !regex.test(currentNode.data) ) 
		{
			continue;
		}		

		var parent = currentNode.parentNode;
		
		var matchId = GUID();

		// check all matches find???
		var replaceCode = '<a name='+matchId+' id="'+matchId+'" style="cursor: pointer;"><span class="regexp">'+currentNode.data.match(regex)[0]+'</span></a>';
		var html = currentNode.data.replace(regex, replaceCode);
		
		var frag = (function()
		{
			var wrap = document.createElement("div"),
			frag = document.createDocumentFragment();
			wrap.innerHTML = html;
			while (wrap.firstChild) 
			{
				frag.appendChild(wrap.firstChild);
			}
			return frag;
		})();
		parent.insertBefore(frag, currentNode);
		parent.removeChild(currentNode);

		//var arrayOfMatch = currentNode.data.match(regex);
		//countOfmatches += arrayOfMatch.length;	
		
		/*
		var srtMaxLength = 500;
		if(html.length > srtMaxLength)
		{
			html = html.substr(0,srtMaxLength);
			html += ' [...]';
		}

		createLinksInfo(html, matchId);	
		*/	
	}
}

var replaceCollapseNode = function(node, replaceWith, groupId, regex) 
{
	var parent = node.parentNode;

	var replaceCode = '<span class="collapse-block hidden-'+groupId+'">'+replaceWith+'</span>';
	var html = node.data.replace(regex, replaceCode);
	
	var frag = (function()
	{
		var wrap = document.createElement("div"),
		frag = document.createDocumentFragment();
		wrap.innerHTML = html;
		while (wrap.firstChild) 
		{
			frag.appendChild(wrap.firstChild);
		}
		return frag;
	})();
	parent.insertBefore(frag, node);
	parent.removeChild(node);
}

var collapseText = function CLLPS(startText, endText, replaceWith, searchNode) 
{
	var regex = new RegExp(startText+"((?:.|\n)*?)"+endText, "g");
	var regexS = new RegExp(startText+"((?:.|\n)*?)", "g");
	var regexE = new RegExp(startText+"((?:.|\n)*?)", "g");
	
	var childNodes = (searchNode || document.body).childNodes;
	
	var cnLength = childNodes.length;
	var excludes = "html,head,style,title,link,script,object,iframe";
	
	//console.log(regex.source);
	
	while (cnLength--)
	{
		var currentNode = childNodes[cnLength];

		// == ELEMENT_NODE 
		if (currentNode.nodeType === 1 && (excludes + ',').indexOf(currentNode.nodeName.toLowerCase() + ',') === -1) 
		{
			CLLPS(startText, endText, replaceWith, currentNode);
		}
		// != TEXT_NODE
		if (currentNode.nodeType !== 3) { continue; }

		if (regex.test(currentNode.data)) 
		{
			console.log('es');
			var matchId = GUID();
			
			replaceCollapseNode(currentNode, replaceWith, matchId, regex);
		} /*else {
			if (collapseFindFlag == 0) 
			{
				if (regexS.test(currentNode.data)) 
				{
					collapseFindFlag = GUID();
				
					replaceCollapseNode(currentNode, collapseFindFlag, regexS);
				}
			} 
			else {
				if (regexE.test(currentNode.data)) 
				{
					replaceCollapseNode(currentNode, collapseFindFlag, regexE);
					
					collapseFindFlag = 0;
				}
			}
		}*/
	}
}

var refresh = function(profile) 
{
	if (null !== profile) {
				
		if (null !== profile.collapse) {
			var length = Object.keys(profile.collapse).length;
		
			var collapses = profile.collapse;
			Object.keys(collapses).forEach(function (key) {

				if (0 == parseInt(collapses[key].active)) { return; }
				
				collapseText(collapses[key].start, collapses[key].end, collapses[key].name);
			});
			
		}
		
		if (typeof profile.regexp !== "undefined") {
			
			var length = Object.keys(profile.regexp).length;
		
			var regexps = profile.regexp;
			Object.keys(regexps).forEach(function (key) {

				if (0 == parseInt(regexps[key].active)) { return; }
				
				regexpHighlight(regexps[key].exp);
			});
		}

		if (null !== profile.repeats) {
			var length = Object.keys(profile.repeats).length;
		
			//TODO
		}
	}
}

var getActiveProfile = function(callback) {
	chrome.storage.local.get(["activeProfileID", "profiles"], function(result) {			

		var id = result.activeProfileID;
		var len = Object.keys(result.profiles).length;
		
		Object.keys(result.profiles).forEach(function (key) {
			if (id == result.profiles[key].id) {
				
				callback(result.profiles[key]);
				return;
			}
		});
	});
}

if (!chrome.devtools)
{
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.action == "run") {
			console.log("running... tabid = "+request.tabId);
			
			getActiveProfile(refresh);
			
			sendResponse({status: "ok!"});
		}
	});
}
	
chrome.storage.onChanged.addListener(function(changes, namespace) {
	//console.log(changes);
	for (var item in changes) {
		if (item == "activeProfileID" || item == "active_tabs") { 
			continue;
		} else {
			alert("Profile was changed in options, you must to reload page.");
		}
	}
});

/*
var port = chrome.runtime.connect();

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "FROM_PAGE")) {
    console.log("Content script received: " + event.data.text);
    port.postMessage(event.data.text);
  }
}, false);
*/

function get_random_color() 
{
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

function GUID()
{
    var S4 = function ()
    {
        return Math.floor(
                Math.random() * 0x10000 /* 65536 */
            ).toString(16);
    };
    return (S4() + S4());
}

function GUID2() 
{
    return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	}).toUpperCase();
}