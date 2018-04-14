"use strict";

// use for check storage in dev tools
// chrome.storage.local.get(null, (data) => { console.log(data) })

if (typeof chrome == "undefined" || typeof chrome.extension == "undefined")
    window.chrome = window.browser;

var activeProfileID = 0;

var getDefaultProfile = function(filename, callback) {
	var txt = '';
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
		if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
			txt = xmlhttp.responseText;
			callback(JSON.parse(txt));
		}
	};
	xmlhttp.open("GET", [filename], true);
	xmlhttp.setRequestHeader("Cache-Control", "no-cache");
	xmlhttp.send();
}


chrome.storage.local.set({"active_tabs": []}, function() {
	console.log("Active tabs collector created.");
});

var loadActiveProfile = function() {
	chrome.storage.local.get(["activeProfileID", "profiles"], function(result) {
		if (result.activeProfileID || result.profiles) {
			activeProfileID = result.activeProfileID;
		} else {
			getDefaultProfile("default_profile.json", function(objDefProf) {
				var profiles = [];
				profiles.push(objDefProf);
				chrome.browserAction.setBadgeText({text: (objDefProf.code).toString() });
				chrome.storage.local.set({"activeProfileID": 0, "profiles": profiles}, function() {
				
				});
			});
			
		}
	});
}
loadActiveProfile();

chrome.runtime.onMessage.addListener (function(request, sender, sendResponse) {
	if (request.action == "popupOpened") {
		console.log("popupOpened, tab id = " + request.tabId);
		sendResponse({status: "ok!"});
	}

	if (request.action == "getTabId") {
		sendResponse({tabId: sender.tab.id});
	}
});




















