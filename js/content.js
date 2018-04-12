"use strict";

// TODO how inject in local files (html,txt from disk)???

if (typeof chrome == "undefined" || typeof chrome.extension == "undefined")
    window.chrome = window.browser;

// TODO may be use createTreeWalker() method??
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

// for ECMAScript 6 (ES6) +
var createCollapseBlock = function(name, body, color) {
	var str = `
		<div class="collapsed" style="background-color: $(color)">
			<div class="coll-header"><strong>$(name)</strong></div>
			<div class="coll-body hidden">$(body)</div>
		</div>
	`;
	return str.replace("$(color)", color).replace("$(name)", name).replace("$(body)", body);
}

var collapseFindFlag = 0;

var replaceCollapseNode = function(node, replaceWith, color, regex, tmpContent) 
{
	var parent = node.parentNode;
	
	/*var resultArr;
	while ((resultArr = reregex.exec(source)) !== null) {
		
	}*/

	var html;
	if (tmpContent && typeof tmpContent != "undefined") {
		html = tmpContent.replace(regex, function(match) {
			return createCollapseBlock(replaceWith, match, color);
		});
	} else {
		html = node.data.replace(regex, function(match) {
			return createCollapseBlock(replaceWith, match, color);
		});
	}
	
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
	
	if (tmpContent && typeof tmpContent != "undefined") {
		parent.innerHTML = html;
	} else {
		parent.insertBefore(frag, node);
		parent.removeChild(node);
	}
	// TODO may be use replaceChild() method???
}

var collapseText = function CLLPS(startText, endText, replaceWith, color, searchNode) 
{
	var regex = new RegExp(startText+"((?:.|\n)*?)"+endText, "g");
	var regexS = new RegExp(startText+"((?:.|\n)*?)", "g");
	var regexE = new RegExp("((?:.|\n)*?)"+endText, "g");
	
	var childNodes = (searchNode || document.body).childNodes;
	
	var len = childNodes.length;
	var cnLength = childNodes.length;
	var excludes = "html,head,style,title,link,script,object,iframe";
	
	var tmpContent = "";
	//console.log((searchNode ? searchNode.tagName : "") + "  " + len);
	
	while (len)
	{
		var currentNode = childNodes[cnLength - len];
		len--;
		
		// == ELEMENT_NODE 
		if (currentNode.nodeType === 1 && (excludes + ',').indexOf(currentNode.nodeName.toLowerCase() + ',') === -1) 
		{
			if (currentNode.classList.contains("collapsed")) { continue; }
			CLLPS(startText, endText, replaceWith, color, currentNode);
		}
		// != TEXT_NODE
		if (currentNode.nodeType !== 3) { continue; }
		
		//if (currentNode.nodeName == "#text") {
			//console.log(currentNode.textContent.length > 150 ? currentNode.textContent.substr(0, 150) : currentNode.textContent);
			//console.log(currentNode.data.length)
		//}
		
		if (currentNode.data.length > 64000) {
			tmpContent += currentNode.data;
			if (currentNode.nextSibling.nodeName == "#text") {
				continue;
			}
		} else {
			if (currentNode.previousSibling && currentNode.previousSibling.nodeName == "#text" && currentNode.previousSibling.length > 64000) {
				tmpContent += currentNode.data;
			}
		}
		
		if (regex.test(tmpContent.length > 0 ? tmpContent : currentNode.data)) 
		{
			console.log('es');
			
			if (tmpContent.length > 0) {
				replaceCollapseNode(currentNode, replaceWith, color, regex, tmpContent);
				tmpContent = "";
			} else {
				replaceCollapseNode(currentNode, replaceWith, color, regex);
			}	
		}
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
				
				collapseText(collapses[key].start, collapses[key].end, collapses[key].name, collapses[key].color);
			});
			
		}
		/*
		if (typeof profile.regexp !== "undefined") {
			
			var length = Object.keys(profile.regexp).length;
		
			var regexps = profile.regexp;
			Object.keys(regexps).forEach(function (key) {

				if (0 == parseInt(regexps[key].active)) { return; }
				
				regexpHighlight(regexps[key].exp);
			});
		}*/

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
			
			console.log("task done.");
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

document.body.addEventListener("click", function (event) {
	var target = event.target || event.srcElement;
    var needle = target.parentNode;

	if (needle.tagName == 'DIV' && needle.classList.contains("coll-header")) {
		var innerbody = needle.parentNode.querySelector("div.coll-body");
        if (!innerbody.classList.contains("hidden")) {
			innerbody.classList.add('hidden');
			return;
        } else {
			innerbody.classList.remove('hidden');
		}
    }
});