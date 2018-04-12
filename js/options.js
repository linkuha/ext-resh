"use strict";

if (typeof chrome == "undefined" || typeof chrome.extension == "undefined")
    window.chrome = window.browser;

var activeProfileID;
var currentProfile = {};
var changesNotSave = 0;


var tipMessage = function(text, type) {
	var color;
	var msgBlock = document.getElementById("td-messages");

	switch(type) {
		case "success":
			color = "green";
			break;
		case "error":
			color = "red";
			break;
		case "warning":
			color = "orange";
			break;
	}
	
	msgBlock.style.color = color;
	msgBlock.innerHTML = text;
	setTimeout(function() {
		msgBlock.innerHTML = "Options";
		msgBlock.style.color = "#000";
	}, 4000);
}

/**
	Export / Import profiles functions
*/
var importProfiles = function(filename) {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
	  // Great success! All the File APIs are supported.
	} else {
	  alert("The File APIs are not fully supported in this browser.");
	}

	var reader = new FileReader();
	reader.onerror = function(e) {
		console.error("File can't be read! Code " + e.target.error.code);
		tipMessage("File can't be read!", "error");
	};
    reader.onloadend = function(e) {
		var profiles;
		if (e.target.result) {
			try {
				profiles = JSON.parse(e.target.result);
				
				chrome.storage.local.set({"activeProfileID": 0, "profiles": profiles}, function() {
					console.log("Profiles loaded.");
					tipMessage("Profiles loaded.", "success");
				});
			} catch(e) {
				alert("File isn't correct.");
			}
		}
    };
    reader.readAsText(filename, "UTF-8");
}

var exportProfiles = function() {
	loadProfiles(function(profiles) {

		var content = JSON.stringify(profiles);
		
		var file = new Blob([content], {type: "application/json"});
		var url = URL.createObjectURL(file);
	
		if( "download" in document.createElement("a") ){

			var a = document.createElement("a");
			a.setAttribute("href", url);
			a.setAttribute("download", "rh_exported_profiles.json");

			// Create Click event
			var clickEvent = document.createEvent("MouseEvent");
			clickEvent.initMouseEvent("click", true, true, window, 0, 
				clickEvent.screenX, clickEvent.screenY, clickEvent.clientX, clickEvent.clientY, 
				clickEvent.ctrlKey, clickEvent.altKey, clickEvent.shiftKey, clickEvent.metaKey, 
				0, null);

			// dispatch click event to simulate download
			a.dispatchEvent(clickEvent);
		}
		else{
			// fallover, open resource in new tab.
			window.open(url, "_blank", "");
		}
		setTimeout(function() {
            window.URL.revokeObjectURL(url);  
        }, 0); 
	});
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
		importProfiles(f);
    }
}

/**
	Reload functions
*/
var reloadSelects = function(element, values) {
	var len = Object.keys(values).length;
	element.innerHTML = '';
	
	var html = '';
	Object.keys(values).forEach(function (key) {
		html += '<option ' + (currentProfile.id == values[key].id ? 'selected ' : '') + ' value="' + values[key].id + '">' + values[key].name + '</option>';
	});
	element.innerHTML = html;
}

var loadProfiles = function(callback) {
	chrome.storage.local.get(['activeProfileID', 'profiles'], function(result) {
			
		var id = result.activeProfileID;
		var len = Object.keys(result.profiles).length;
		
		Object.keys(result.profiles).forEach(function (key) {
			if (id == result.profiles[key].id) {
				activeProfileID = id;
				currentProfile = result.profiles[key];
				if (typeof callback === 'function') { callback(result.profiles); }
				return;
			}
		});
	});
}

var currRegexp = document.getElementById('current-regexp');
var currCollapse = document.getElementById('current-collapse');
var currRepeats = document.getElementById('current-repeats');
var currMatches = document.getElementById('current-matches');

var deleteItem = function(element) {
	var needle = element.parentNode.parentNode;
	
	if (needle.tagName == 'TR') {
		needle.parentNode.removeChild(needle);
	};
}

var reloadRegexp = function(regexps) {
	var html = '';
	
	var len = Object.keys(regexps).length;
	Object.keys(regexps).forEach(function (key) {
		var inputText = '<input type="text" value="' + regexps[key].exp + '"/>';
		var checkbox = '<input type="checkbox" ' + (regexps[key].active == 1 ? 'checked' : '') + ' />';
		var delHref = '<a href="#" class="delete-link" title="Delete this item">&laquo; del</a>';
		html += '<tr><td>' + inputText + '</td><td>' + checkbox + delHref + '</td></tr>';
	});
	
	currRegexp.tBodies.item(0).innerHTML = html;
}
var readRegexp = function() {
	var entries = currRegexp.tBodies.item(0).childNodes;
	var values = [];
	
	for (var i = 0; i < entries.length; i++) {
		var tmpObj = {
			"exp": entries[i].querySelector('input[type=text]').value,
			"active": (entries[i].querySelector('input[type=checkbox]').checked ? 1 : 0)
		};
		values.push(tmpObj);
	}
	
	return values;
}

var reloadCollapse = function(collapses) {
	var html = '';
	
	var len = Object.keys(collapses).length;
	Object.keys(collapses).forEach(function (key) {
		var inputName = '<input type="text" class="input-short-name" value="' + collapses[key].name + '"/>';
		var inputStart = '<input type="text" class="input-start" value="' + collapses[key].start + '"/>';
		var inputEnd = '<input type="text" class="input-end" value="' + collapses[key].end + '"/>';
		var color = '<input type="color" value="' + collapses[key].color + '"/>';
		var checkbox = '<input type="checkbox" ' + (collapses[key].active == 1 ? 'checked' : '') + ' />';
		var delHref = '<a href="#" class="delete-link" title="Delete this item">&laquo; del</a>';
		html += '<tr><td>' + inputName + '</td><td>' + inputStart + '</td><td>' + inputEnd + '</td><td>' + color + '</td><td>' + checkbox + delHref + '</td></tr>';
	});
	
	currCollapse.tBodies.item(0).innerHTML = html;
}
var readCollapse = function() {
	var entries = currCollapse.tBodies.item(0).childNodes;
	var values = [];
	
	for (var i = 0; i < entries.length; i++) {
		var tmpObj = {
			"name": entries[i].querySelector('input.input-short-name').value,
			"start": entries[i].querySelector('input.input-start').value,
			"end": entries[i].querySelector('input.input-end').value,
			"color": entries[i].querySelector('input[type=color]').value,
			"active": (entries[i].querySelector('input[type=checkbox]').checked ? 1 : 0)
		};
		values.push(tmpObj);
	}
	
	return values;
}

var reloadRepeats = function(regexps) {
	
}
var readRepeats = function() {

}

var reloadMatches = function(matches) {
	var html = '';
	
	var len = Object.keys(matches).length;
	Object.keys(matches).forEach(function (key) {
		var inputText = '<input type="text" value="' + matches[key].exp + '"/>';
		var checkbox = '<input type="checkbox" ' + (matches[key].active == 1 ? 'checked' : '') + ' />';
		var delHref = '<a href="#" class="delete-link" title="Delete this item">&laquo; del</a>';
		html += '<tr><td>' + inputText + '</td><td>' + checkbox + delHref + '</td></tr>';
	});
	
	currMatches.tBodies.item(0).innerHTML = html;
}
var readMatches = function() {
	var entries = currMatches.tBodies.item(0).childNodes;
	var values = [];
	
	for (var i = 0; i < entries.length; i++) {
		var tmpObj = {
			"exp": entries[i].querySelector('input[type=text]').value,
			"active": (entries[i].querySelector('input[type=checkbox]').checked ? 1 : 0)
		};
		values.push(tmpObj);
	}
	
	return values;
}

/**
	DOM Loaded events and other
*/
document.addEventListener('DOMContentLoaded', function() {
	
	var selCurrentProfile = document.getElementById('current-profile');
	
	var reloadForm = function() {
		reloadRegexp(currentProfile.regexp);
		reloadCollapse(currentProfile.collapse);
		reloadMatches(currentProfile.url_matches);
	}
	
	loadProfiles(function(profiles) {
		reloadSelects(selCurrentProfile, profiles);
		
		reloadForm();
	});
	
	selCurrentProfile.onchange = function(event) {
		if(!event.target.value) { alert('no one profile selected'); }
		else {
			var profId = event.target.value;
			
			chrome.storage.local.get(["profiles"], function(result) {
				if (!chrome.runtime.error) {

					Object.keys(result.profiles).forEach(function (key) {
						if (profId == result.profiles[key].id) {
							currentProfile = result.profiles[key];
						}
					});
					
					reloadForm();
				}
			});
		}
	};
	
	
	var btnAddRegexp = document.getElementById('btn-add-regexp');
	var btnAddCollapse = document.getElementById('btn-add-collapse');
	var btnAddRepeats = document.getElementById('btn-add-repeats');
	var btnAddMatches = document.getElementById('btn-add-matches');

	var bNewRegexp = document.getElementById('b-new-regexp');
	var bNewCollapse = document.getElementById('b-new-collapse');
	var bNewRepeats = document.getElementById('b-new-repeats');
	var bNewMatches = document.getElementById('b-new-matches');
	var bNewProfile = document.getElementById('b-new-profile');
	
	var btnNewProfile = document.getElementById('btn-add-profile');
	var btnDelProfile = document.getElementById('btn-del-profile');
	var btnSaveProfile = document.getElementById('btn-save-profile');
	
	btnAddRegexp.addEventListener('click', function (event) {
		bNewRegexp.style.display = 'block';
	  
	});

	btnAddCollapse.addEventListener('click', function (event) {
		bNewCollapse.style.display = 'block';
	  
	});

	btnAddRepeats.addEventListener('click', function (event) {
		bNewRepeats.style.display = 'block';
	  
	});

	btnAddMatches.addEventListener('click', function (event) {
		bNewMatches.style.display = 'block';
	  
	});
	

	document.body.addEventListener('click', function (event) {
		var target = event.target || event.srcElement;

		// TODO need to lowercase?? for other browsers
		if (target.tagName == 'INPUT' && target.type == 'submit') {
			var needle = target.parentNode;
			needle.style.display = 'none';
		
			var inputs = needle.querySelectorAll('input[type=text]');
			Object.keys(inputs).forEach(function(key) {
				inputs[key].value = "";
			});
		}
		
		if (target.tagName == 'A' && target.classList[0] == 'delete-link') {
			deleteItem(target);
		}
		
	});

	bNewRegexp.querySelector('input[type=submit]').addEventListener('click', function (event) {
		var exp = bNewRegexp.querySelector('input[type=text]');

		if (exp.value == null || exp.value == "") {
			alert("Please fill inputs for adding regexp item.");
			event.preventDefault();
			return;
		}
		
		var html = '';
		var inputText = '<input type="text" value="' + exp.value + '"/>';
		var checkbox = '<input type="checkbox" checked />';
		var delHref = '<a href="#" class="delete-link" title="Delete this item">&laquo; del</a>';
		html += '<tr><td>' + inputText + '</td><td>' + checkbox + delHref + '</td></tr>';
		
		currRegexp.tBodies.item(0).innerHTML += html;
	});

	bNewCollapse.querySelector('input[type=submit]').addEventListener('click', function (event) {
		var name = bNewCollapse.querySelector('input[name=new-short-name]');
		var start = bNewCollapse.querySelector('input[name=new-start]');
		var end = bNewCollapse.querySelector('input[name=new-end]');
		
		if (
			start.value == null || start.value == "" || 
			end.value == null || end.value == "" || 
			name.value == null || name.value == ""
		) {
			alert("Please fill inputs for adding collapse item.");
			event.preventDefault();
			return;
		}
		
		var html = '';
		var inputName = '<input type="text" class="input-short-name" value="' + name.value + '"/>';
		var inputStart = '<input type="text" class="input-start" value="' + start.value + '"/>';
		var inputEnd = '<input type="text" class="input-end" value="' + end.value + '"/>';
		var checkbox = '<input type="checkbox" checked />';
		var delHref = '<a href="#" class="delete-link" title="Delete this item">&laquo; del</a>';
		html += '<tr><td>' + inputName + '</td><td>' + inputStart + '</td><td>' + inputEnd + '</td><td><input type="color"/></td><td>' + checkbox + delHref + '</td></tr>';
		
		currCollapse.tBodies.item(0).innerHTML += html;
	});

	bNewRepeats.querySelector('input[type=submit]').addEventListener('click', function (event) {
		
	  
	});

	bNewMatches.querySelector('input[type=submit]').addEventListener('click', function (event) {
		var exp = bNewRegexp.querySelector('input[type=text]');

		if (exp.value == null || exp.value == "") {
			alert("Please fill inputs for adding regexp item.");
			event.preventDefault();
			return;
		}
		
		var html = '';
		var inputText = '<input type="text" value="' + exp.value + '"/>';
		var checkbox = '<input type="checkbox" checked />';
		var delHref = '<a href="#" class="delete-link" title="Delete this item">&laquo; del</a>';
		html += '<tr><td>' + inputText + '</td><td>' + checkbox + delHref + '</td></tr>';
		
		currMatches.tBodies.item(0).innerHTML += html;
	});
	
	/**
		Profile CRUD (Create = add, Read, Update = save, Delete)
	*/
	
	var getProfileByID = function(id, callback) {
		chrome.storage.local.get(["profiles"], function(result) {
			if (!chrome.runtime.error) {
				Object.keys(result.profiles).forEach(function (key) {
					if (id == result.profiles[key].id) {
						if (typeof callback === 'function') { callback(result.profiles[key]); }
					}
				});
			}
		});
	}
	
	var addProfile = function(newProfile) {
		chrome.storage.local.get(["profiles"], function(result) {
			if (!chrome.runtime.error) {
				var maxId = 0;
				Object.keys(result.profiles).forEach(function (key) {
					if (maxId < result.profiles[key].id) {
						maxId = result.profiles[key].id;
					}
				});
				newProfile.id = (maxId + 1);
				
				result.profiles.push(newProfile)
				chrome.storage.local.set({"profiles": result.profiles}, function() {
					console.log("Profile added.");
					tipMessage("Profile added.", "success");
					
					currentProfile = newProfile;
						
					reloadSelects(selCurrentProfile, result.profiles);
					reloadForm();
				});
			}
		});
	}	
	
	bNewProfile.querySelector('input[type=submit]').addEventListener('click', function (event) {
		var name = bNewProfile.querySelector('input[name=profile-name]');
		var code = bNewProfile.querySelector('input[name=profile-code]');
	  
		currentProfile = {
			"name": name.value,
			"code": parseInt(code.value),
			"regexp": [],
			"collapse": [],
			"repeats": [],
			"matches": []
		};
		
		addProfile(currentProfile);
	});
		
	btnNewProfile.addEventListener('click', function (event) {
		if (!confirm("Will created new profile. You must configure it in fields below.")) {
			event.preventDefault();
			return;
		}		
		bNewProfile.style.display = 'block';
		
		currRegexp.tBodies.item(0).innerHTML = '';
		currCollapse.tBodies.item(0).innerHTML = '';
		currRepeats.tBodies.item(0).innerHTML = '';
		currMatches.tBodies.item(0).innerHTML = '';
	});
	
	var deleteProfile = function(id) {
		chrome.storage.local.get(["profiles"], function(result) {
			if (!chrome.runtime.error) {
				var newProfiles = [];
				Object.keys(result.profiles).forEach(function (key) {
					if (id == result.profiles[key].id) {
						return;
					} else {
						newProfiles.push(result.profiles[key]);
					}
				});
				chrome.storage.local.set({"profiles": newProfiles}, function() {
					console.log("Profile deleted.");
					tipMessage("Profile deleted.", "success");
					
					getProfileByID(0, function(profile) {
						currentProfile = profile;
						
						reloadSelects(selCurrentProfile, newProfiles);
						reloadForm();
					});
				});
			}
		});
	}
	
	btnDelProfile.addEventListener('click', function (event) {
		if (currentProfile.id == 0) {
			alert("You can't delete default profile");
			event.preventDefault();
			return;
		}
		if (!confirm("Sure you want to delete this profile?")) {
			event.preventDefault();
			return;
		}
		deleteProfile(currentProfile.id);
	});
	
	var saveProfile = function(profile) {
		chrome.storage.local.get(["profiles"], function(result) {
			if (!chrome.runtime.error) {
				var newProfiles = [];
				Object.keys(result.profiles).forEach(function (key) {
					if (profile.id == result.profiles[key].id) {
						result.profiles[key] = profile;
					}
					newProfiles.push(result.profiles[key]);
				});
				chrome.storage.local.set({"profiles": newProfiles}, function() {
					console.log("Profile saved.");
					tipMessage("Profile saved.", "success");
				});
			}
		});
	}
	
	btnSaveProfile.addEventListener('click', function (event) {
		
		currentProfile.regexp = readRegexp();
		currentProfile.collapse = readCollapse();
		
		saveProfile(currentProfile);
	});
	
	document.getElementById('import-profiles').addEventListener('change', handleFileSelect, false);
	document.getElementById('export-profiles').addEventListener('click', function(e) {
		exportProfiles();
	}, false);
});
