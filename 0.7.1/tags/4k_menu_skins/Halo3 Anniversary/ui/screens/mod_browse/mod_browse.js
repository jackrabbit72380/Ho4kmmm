let _allMods = [];
let _displayedMods = [];
let _lobbyType = -1;
let _filterIndex = 0;
let _selectBlocked = false;
let _displayFilterIndex = -1;
let _requiresRefresh = true;
let _previousSearch = "";

const _displayFilters = ['all', 'last used', 'latest'];

const _filters = [
    {
        displayText: 'Mainmenu',
        canSelect: () => _lobbyType === -1,
        modFilter: mod => mod.mainmenuType,
        defaultCommand:'Game.MainMenuMod'
    },
    {
        displayText: 'Character',
        alternateDisplayText: 'Mainmenu',
        canSelect: () => _lobbyType === -1,
        modFilter: mod => mod.characterType,
        defaultCommand: 'Game.MainMenuMod'
    },
    {
        displayText: 'Campaign',
        canSelect: () => _lobbyType === 0,
        modFilter: mod => mod.campaignType,
        defaultCommand: 'Game.CampaignMod'
    },
    {
        displayText: 'Multiplayer',
        canSelect: () => _lobbyType === 2 || _lobbyType === 3,
        modFilter: mod => mod.multiplayerType,
        defaultCommand: 'Game.MultiplayerMod'
    },
    {
        displayText: 'Firefight',
        canSelect: () => _lobbyType === 5,
        modFilter: mod => mod.firefightType,
        defaultCommand: 'Game.FirefightMod'
    },
];

const searchbox = document.getElementById('searchbox');
const listelem = document.querySelector('#mod_selection_list');
const listController = new CInteractableListController(listelem);
listController.setWrapAround(true);
listController.on('selectedIndexChanged', handleSelectedIndexChanged);
dew.input.on('scroll', handleVirtualScroll);
dew.input.on('action', handleAction);

dew.on('show', async function (e) {
    dew.GameBlur("modbrowser", true);
    $('#overlay').animate({opacity: "1"},150)
    $('#screen_widget').animate({opacity: "1"},150);
    
    lobbyType = parseInt(await dew.command('Server.LobbyType'));
    const lobbyChanged = lobbyType !== _lobbyType;
    _lobbyType = lobbyType;

	if (_requiresRefresh || lobbyChanged) {
	_requiresRefresh = false;

        if (lobbyType === 2 || lobbyType === 3)
            setFilter(3);
        else if (lobbyType === 0)
            setFilter(2);
        else if (lobbyType === 5)
            setFilter(4);
        else
            setFilter(0);

        if (_displayFilterIndex === -1)
            setDisplayFilter(2);

        await fetchAndDisplayMods();
    }
	
    var gamepad = await dew.command('Settings.gamepad');
    if (gamepad == 1) {
        document.getElementById("mod_filter").classList.add("ctrlr");
        document.getElementById("mod_filter").classList.remove("kbm");
    } else {
        document.getElementById("mod_filter").classList.add("kbm");
        document.getElementById("mod_filter").classList.remove("ctrlr");
    }

    window.addEventListener('mousemove', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

});

function hideScreen() {
    dew.GameBlur("modbrowser", false);
    $('#overlay').animate({opacity: "0"},150)
    $('#screen_widget').animate({opacity: "0"},150, function(){
        dew.hide();
    });
}

dew.on('hide', function () {
    window.removeEventListener('mousemove', handleMouseOver);
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('keydown', handleKeyDown);
});

dew.on('modsEnumerated', async function () {
    _requiresRefresh = true;
});


$("#mod_website").on("click", function (e) {
    e.preventDefault();
    
    if(this.href.startsWith("dew://"))
        return;
    
    var item = this;
    dew.dialog("confirm_link",{
        body: "This link goes to " + this.href + " Are you sure you want to open this?",
    }).then(result => {
        if (result === 'yes') {
            window.open(item.href, '_blank');
        }
    });
});

document.addEventListener('keydown', function(e) {
    // when a key is pressed and isn't one of the ignoreKeys focus the search
    const ignoreKeys = [' ', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'Delete', 'Enter', 'Escape', 'PageDown', 'PageUp', 'x'];
    if(!ignoreKeys.includes(e.key)) {
        searchbox.focus();
    }
});


function handleSelect(index) {	
	if(_selectBlocked) {
		handleOptions(index);
		return;
	}	
	
    dew.playSound('a_button');
    if (index === -1)
        index = listController.getSelectedIndex();

    if (index !== -1) {
        let mod = _displayedMods[index];
		if(_filterIndex == 0 || _filterIndex == 1){
			dew.command(`Game.MainMenuMod "${mod.filename}"`);
			dew.command("WriteConfig");
		}else
			dew.command(`Server.Mod "${mod.filename}"`);
        hideScreen();
    }
}

function handleBack() {
    dew.playSound('b_button');
    hideScreen();
}

function handleMouseDown(e) {
    if (e.button === 0) {
        let index = listController.getMouseOverItem(e.target);
        if (index !== -1)
            handleSelect(index);
    }
}

function handleMouseUp(e) {
	if(e.button === 2){
		let index = listController.getMouseOverItem(e.target);
		if(index !== -1)
			handleOptions(index);
		else
			handleBack();
	}
}

function handleOptions(index){
	let mod = _displayedMods[index];
	if(mod === undefined)
		return;
	
	dew.playSound('x_button');
    // HACK: there's a bug with the screen layer where the keyup event doesn't get fired
	dew.input.reset();
	if(mod.hash == ""){
		dew.dialog('mod_options', {
			body: "You can remove the default mod package.",
			options: [
				{ label: 'Remove ' + (_filters[_filterIndex].alternateDisplayText ? _filters[_filterIndex].alternateDisplayText : _filters[_filterIndex].displayText) + ' Default', value: 'default', default: true }
			]
		}).then(function(result){
			if (result == "default") {
				dew.command(_filters[_filterIndex].defaultCommand + " none");
				dew.command("WriteConfig");
			}
		});
	}else{
		dew.command(_filters[_filterIndex].defaultCommand).then(function(response){
			let modIsDefault = false;
			let defaultString = 'Set as ' + (_filters[_filterIndex].alternateDisplayText ? _filters[_filterIndex].alternateDisplayText : _filters[_filterIndex].displayText) + ' Default';
			if(response == mod.filename){
				modIsDefault = true;
				defaultString = 'Remove ' + (_filters[_filterIndex].alternateDisplayText ? _filters[_filterIndex].alternateDisplayText : _filters[_filterIndex].displayText) + ' Default';
			}
		
			
			dew.dialog('mod_options', {
				body: "You can set this mod package as default or delete it from your PC.",
				options: [
					{ label: defaultString, value: 'default', default: true },
					{ label: 'View Mod Info', value: 'modinfo'},
					{ label: 'Delete ' + mod.name, value: 'delete'}
				]
			}).then(function(result){
				if(result == "delete"){
					dew.dialog('confirm_mod_delete', {
						body: `Are you sure you want to delete "${mod.name}"?`
					}).then(async function(result){
						if(result == "yes"){
							await dew.command(`Server.DeleteMod "${mod.filename}"`);
							await fetchAndDisplayMods();
							if(modIsDefault){
								dew.command(_filters[_filterIndex].defaultCommand + " none");
								dew.command("WriteConfig");
							}
						}
					});
				}
				if (result == "default") {
					if(modIsDefault){
						dew.command(_filters[_filterIndex].defaultCommand + " none");
						dew.command("WriteConfig");
					}else{
						dew.command(_filters[_filterIndex].defaultCommand + ` "${mod.filename}"`);
						dew.command("WriteConfig");
					}
				}
				if (result == "modinfo") {
					tempHideScreen();
					dew.show("mod_info", { hash: mod.hash });
				}
			});	
		
		});
	}
}

function handleAction(e) {
    switch (e.action) {
        case dew.input.Actions.A:
			//if still in search prevent inputs from carrying over
			if(document.activeElement !== searchbox)
                handleSelect(-1);
            break;
        case dew.input.Actions.B:
            if(document.activeElement === searchbox) {
                searchbox.blur();
            }	
            else {
                handleBack();
            }        
            break;
        case dew.input.Actions.X:
            if(document.activeElement !== searchbox)
                handleOptions(listController.getSelectedIndex());
            break;
		case dew.input.Actions.Left: //Left Arrow Key
		case dew.input.Actions.LeftBumper:
            if(document.activeElement !== searchbox)
                rotateModFilter(-1);
			break;
		case dew.input.Actions.Right: //Right Arrow Key
		case dew.input.Actions.RightBumper:
            if(document.activeElement !== searchbox)
                rotateModFilter(1);
            break;
        case dew.input.Actions.Y:
            if(document.activeElement !== searchbox)
                rotateDisplayFilter();
            break;
    }	
}

function handleVirtualScroll(type, axis, value) {
	let modList = document.getElementById("mod_selection_list").getElementsByTagName('li');
	if(modList.length == 0)
		return;
	
    const sounds = ['vertical_navigation', 'horizontal_navigation', 'left_bumper', 'right_bumper'];
    if (type === 2){
        dew.playSound(sounds[type + axis]);
    }else{
		if(axis != 1)
			dew.playSound(sounds[axis]);
	}

	if(document.activeElement === searchbox);
		document.activeElement.blur();
	
    if (axis === 0) {
        let step = ((type === 2) ? 4 : 1) * value;
        listController.navigateList(step);
        listController.scrollIntoView();
    }
}

function handleMouseOver(e) {
    listController.handleMouseOver(e);
}

function handleKeyDown(e) {
    // prevent the arrow keys from scrolling
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown')
        e.preventDefault();
    // prevent page keys from scrolling
    if (e.key === 'PageUp' || e.key === 'PageDown')
        e.preventDefault();
}

function handleSelectedIndexChanged(e) {
    _initialSelectedIndex = e.index;
    showModDetails(e.index);
}

function formatSize(size) {
    if (size === 0)
        return '0 bytes';
    var i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

function showModDetails(index) {
    var previewImgElem = document.querySelector('#mod_preview_img');
    
    let mod = _displayedMods[index];
    if (mod.hash) {
        document.querySelector('#mod_name').innerText = mod.name;
        document.querySelector('#mod_description').innerText = mod.description;
        document.querySelector('#mod_author').innerText = mod.author;
        document.querySelector('#mod_version').innerText = mod.version;
        document.querySelector('#mod_lastuseddate').innerText = convertTimestampToDisplay(mod.lastUsedDate);
		var websiteLink = document.querySelector('#mod_website');
		if(!mod.website) {
			websiteLink.innerHTML = "N/A";
			websiteLink.href = "";
		}else{
			websiteLink.innerText = mod.website;
			websiteLink.href = mod.website;
		}
        document.querySelector('#mod_filesize').innerText = formatSize(mod.filesize);
        let modSource = (mod.source ? mod.source : "User Downloaded");
        document.querySelector('#mod_source').innerText = modSource;
        document.querySelector('#mod_dowloaddate').innerText = mod.downloadDate;

		if(mod.preview){
			previewImgElem.src = mod.preview;
		}else
			dew.getAssetUrl("preview", { pak:mod.hash, fileTypes:['jpg','png'], searchBaseAssets:false }).then(url => {
				if(url != ""){
					previewImgElem.src = url;
				}else
					previewImgElem.src = "dew://assets/maps/small/placeholder.jpg";
				mod.preview = previewImgElem.src;
			});
    }
    else {
        document.querySelector('#mod_name').innerText = '';
        document.querySelector('#mod_description').innerText = '';
        document.querySelector('#mod_author').innerText = '';
        document.querySelector('#mod_version').innerText = '';
        document.querySelector('#mod_website').innerText = '';
        document.querySelector('#mod_filesize').innerText = '';
        document.querySelector('#mod_source').innerText = '';
        document.querySelector('#mod_dowloaddate').innerText = '';
        document.querySelector('#mod_lastuseddate').innerText = '';
        
        previewImgElem.src = "dew://assets/maps/small/placeholder.jpg";
    }
}


async function fetchAndDisplayMods() {
    _allMods = await fetchMods()
    populateMods();
}

async function fetchMods() {
    return JSON.parse(await dew.command('Server.ListMods'));
}

function populateMods() {
	let none = {
		name: 'NONE',
		description: '',
		version: '',
		website: '',
		author: '',
		hash: '',
		filename: '',
		filesize: 0,
		mainmenuType: true,
		multiplayerType: true,
		campaignType: true,
		firefightType: true
	};

    let filter = _filters[_filterIndex];
    let filtered = _allMods.filter(filter.modFilter);
	
	let searchInput = searchbox.value.toUpperCase();
	if(searchInput != '')
		filtered = filtered.filter(mod => mod.name.toUpperCase().indexOf(searchInput) > -1);
	_previousSearch = searchInput;

    if (filter.canSelect())
		_displayedMods = [none].concat(filtered);
	else
        _displayedMods = filtered;

    if (_displayFilters[_displayFilterIndex] === 'latest') {
        _displayedMods = Object.values(groupBy(_displayedMods, x => `${x.name}${x.authorUid}`)).map(x => x.reduce((a, b) => compareVersion(a.version, b.version) == 1 ? a : b));
    }
	
    if (_displayFilters[_displayFilterIndex] === 'last used') {
        _displayedMods.sort((a, b) => compareTime(a.lastUsedDate, b.lastUsedDate));
    }
	
    renderModList(_displayedMods);
}

function compareVersion(a, b) {
    if (a === b) {
       return 0;
    }

    var a_versions = a.split(".");
    var b_versions = b.split(".");

    var len = Math.min(a_versions.length, b_versions.length);

    for (var i = 0; i < len; i++) {
        if (parseInt(a_versions[i]) > parseInt(b_versions[i])) {
            return 1;
        }

        if (parseInt(a_versions[i]) < parseInt(b_versions[i])) {
            return -1;
        }
    }

    if (a_versions.length > b_versions.length) {
        return 1;
    }

    if (a_versions.length < b_versions.length) {
        return -1;
    }

    return 0;
}

function compareTime(a, b) {
	if (Number(a) > Number(b)) {
		return -1; // First value is more recent
	} else if (Number(a) < Number(b)) {
		return 1; // Second value is more recent
	} else {
		return 0; // Both values are equal
	}
}

function renderModList(mods) {
    listController.beginUpdate();
    listelem.innerHTML = '';
    for (let mod of mods) {
        let li = document.createElement('li');
     
        let nameSpan = document.createElement('span');
        nameSpan.innerText = mod.name;
        li.appendChild(nameSpan);

        if (mod.hash) {
            let versionSpan = document.createElement('span');
            versionSpan.innerText = `v${mod.version}`;
            li.appendChild(versionSpan);
        }
        listelem.appendChild(li);
    }
    listController.endUpdate();
    if(mods.length > 0)
        listController.setSelectedIndex(0);
	listController.scrollIntoView();
}

function rotateModFilter(direction) {
	dew.playSound('left_bumper');
	let index = (_filterIndex + direction) % _filters.length;
    if (index < 0) index = _filters.length - 1;
    setFilter(index);
    populateMods()
}

function rotateDisplayFilter() {
    dew.playSound('a_button');
    let index = (_displayFilterIndex + 1) % _displayFilters.length;
    if (index < 0) index = _displayFilters.length - 1;
    setDisplayFilter(index);
    populateMods();
}

function setFilter(index) {
    _filterIndex = index;
    document.querySelector('#screen_widget_mod_type').innerText = _filters[index].displayText;

    if (_filters[index].canSelect()) {
        document.getElementById('button_key_select').style.display = '';
        _selectBlocked = false;
    }
    else {
        document.getElementById('button_key_select').style.display = 'none';
        _selectBlocked = true;
    }
}

function setDisplayFilter(index) {
    _displayFilterIndex = index;
    document.querySelector('#current_display_filter').innerText = `[${_displayFilters[(index + 1) % _displayFilters.length]}]`;
}

function groupBy(arr, key) {
    return arr.reduce(function (acc, x) {
        let k = key(x);
        (acc[k] = acc[k] || []).push(x);
        return acc;
    }, {});
};

function setSearchFilter() {
	let searchInput = searchbox.value.toUpperCase();
	if(searchInput != _previousSearch)
		populateMods();
}


$(searchbox).on('input', function(e) {
	if('' == this.value) {
		setSearchFilter();
	}
});

dew.on('mod_changed', ({data}) => {
	_requiresRefresh = true;
});

function convertTimestampToDisplay(timestamp) {
	if(timestamp == 0)
		return 'Never';
	
	const date = new Date(timestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const year = date.getFullYear();
	let hours = date.getHours();
	const minutes = date.getMinutes();
	const ampm = hours >= 12 ? 'pm' : 'am';

	// Convert to 12-hour format
	hours %= 12;
	hours = hours || 12;

	const formattedTime = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0') + ' ' + ampm;
	const formattedDate = month + '/' + day + '/' + year;

	return formattedDate + ' ' + formattedTime;
}

function tempHideScreen() {
    dew.GameBlur("modbrowser", false);
	dew.captureInput(false);
    $('#overlay').animate({opacity: "0"},150)
    $('#screen_widget').animate({opacity: "0"},150);
}

function restoreScreen() {
	dew.captureInput(true);
    dew.GameBlur("modbrowser", true);
    $('#overlay').animate({opacity: "1"},150)
    $('#screen_widget').animate({opacity: "1"},150);
}

dew.on("mod_browser_restore", function() {
	restoreScreen();
});