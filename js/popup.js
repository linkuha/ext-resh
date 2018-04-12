"use strict";

var activeProfileID;

var isSetArraySyncStorage = function(key, value, callback) {
	chrome.storage.local.get([key], function(result) {
		if (!chrome.runtime.error) {
			var array = result[key] ? result[key] : [];
			var res = false;
			array.forEach(function(item, idx, array) {
				if (value == item) {
					res = true;
				}
			});
			if (typeof callback === "function") { callback(res); }
		}
	});
}

var addArraySyncStorage = function(key, value) {
	chrome.storage.local.get([key], function(result) {
		var array = result[key] ? result[key] : [];
		array.forEach(function(item, idx, array) {
			if (value == item) {
				return;
			}
		});
		array.unshift(value);
		chrome.storage.local.set({[key]: array}, function() {
			if (chrome.runtime.error) {
				console.log("Not save. Runtime error.");
			}
			console.log("Saved a new array item");
		});
	});
}

var delArraySyncStorage = function(key, value) {
	chrome.storage.local.get([key], function(result) {
		var array = result[key] ? result[key] : [];
		array.forEach(function(item, idx, array) {
			if (value == item) {
				array.splice(idx, 1);
				chrome.storage.local.set({[key]: array}, function() {
					if (chrome.runtime.error) {
						console.log("Not del. Runtime error.");
					}
					console.log("Deleted array item");
				});
				return;
			}
		});
	});
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


window.onload = function(){
	
	var btnActivator = document.getElementById("btn-activator");
	var btnRefresh = document.getElementById("btn-refresh");
	var btnOptions = document.getElementById("params");
	var activeTabsKey = "active_tabs";
	
	var selCurrentProfile = document.getElementById("current-profile");
	selCurrentProfile.onchange = function(event) {
		if(!event.target.value) { alert("no one profile selected"); }
		else {
			var profId = event.target.value;
			activeProfileID = profId;
			
			chrome.storage.local.set({"activeProfileID": activeProfileID}, function() {
				console.log("Profile changed.");
				getActiveProfile(function(profile) {
					chrome.browserAction.setBadgeText({text: (profile.code).toString() });
				});
			});
		}
	};
	
	/**
		Reload functions
	*/
	var reloadSelects = function(element, values) {
		var len = Object.keys(values).length;
		element.innerHTML = "";
		
		var html = "";
		Object.keys(values).forEach(function (key) {
			html += "<option " + (activeProfileID == values[key].id ? "selected " : "") + " value=\"" + values[key].id + "\">" + values[key].name + "</option>";
			if (activeProfileID == values[key].id) { chrome.browserAction.setBadgeText({text: (values[key].code).toString() }); }
		});
		element.innerHTML = html;
	}

	var loadProfiles = function(callback) {
		chrome.storage.local.get(["activeProfileID", "profiles"], function(result) {
				
			var id = result.activeProfileID;
			var len = Object.keys(result.profiles).length;
			
			Object.keys(result.profiles).forEach(function (key) {
				if (id == result.profiles[key].id) {
					activeProfileID = id;
					//currentProfile = result.profiles[key];
					if (typeof callback === "function") { callback(result.profiles); }
					return;
				}
			});
		});
	}
	loadProfiles(function(profiles) {
		reloadSelects(selCurrentProfile, profiles);
	});
	
	var tabId;
	var tabUrl;
	// can check all tabs - for what? TODO
	chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
		tabId = tabs[0].id;
		tabUrl = tabs[0].url;
		
		console.log(tabUrl);
		chrome.runtime.sendMessage({action: "popupOpened", tabId: [tabId]}, function(response) {
			console.log(response);
		});
		
		isSetArraySyncStorage(activeTabsKey, tabId, function(res) {
			if (res) 
			{
				btnActivator.style.background = "green";
				btnRefresh.removeAttribute("disabled");
				btnActivator.removeAttribute("disabled");
				console.log("tab is active.");
			}
			getActiveProfile(function(profile) {
				var flag = false;

				if (profile.url_matches != "undefined" && profile.url_matches.length > 0) 
				{
					Object.keys(profile.url_matches).forEach(function (key)
					{
						if (RegExp(profile.url_matches[key].exp, "g").test(tabUrl)) {
							flag = true;
						}
					});
				}
				if (flag) {
					addArraySyncStorage(activeTabsKey, tabId);
					
					btnActivator.style.background = "green";
					btnActivator.style.color = "white";
					btnRefresh.removeAttribute("disabled");
					btnActivator.setAttribute("disabled", "disabled");
					btnActivator.value = "Active (see options)";
				} else {
					if (!res) {
						btnActivator.style.background = "red";
						btnActivator.removeAttribute("disabled");
						btnRefresh.setAttribute("disabled", "disabled");
					}
				}
			});
		});
		
		// while without a profile check
		btnActivator.addEventListener("click", function (event) {
			if (this.style.background == "red") {
				this.style.background = "green";
				btnRefresh.removeAttribute("disabled");
				addArraySyncStorage(activeTabsKey, tabId);
			} else {
				this.style.background = "red";
				btnRefresh.setAttribute("disabled", "disabled");
				delArraySyncStorage(activeTabsKey, tabId);
			}
		});
		
		var isActiveTab = function(tabID, callback) {
			return isSetArraySyncStorage(activeTabsKey, tabID, callback);
		}
		
		btnRefresh.addEventListener("click", function (event) {
			isActiveTab(tabId, function(res) {
				if (!res) {
					console.log("no no no");
					event.preventDefault();
					return;
				} else {
					chrome.tabs.sendMessage(tabs[0].id, {action: "run", tabId: [tabId]}, function(response){
						console.log("Refresh message sended and will run.");
					});
				}
			});
		});
		
		btnOptions.addEventListener("click", function (event) {
			chrome.runtime.openOptionsPage();
		});
	});

}
