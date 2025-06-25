var settingsArray = { 'Settings.Gamepad': '0' };

let packageListJson = '';

var startTime,endTime,previousSize = 0;

var isDetailsCollapsed = true;

var packageCount = 0;
var packageIndex = 0;

var compactMode = false;
var mouseCaptured = false;
var readyToJoin = false;

dew.on("variable_update", function(e){
    for(i = 0; i < e.data.length; i++){
        if(e.data[i].name in settingsArray){
            settingsArray[e.data[i].name] = e.data[i].value;
        }
    }
});

function loadSettings(i){
	if (i != Object.keys(settingsArray).length) {
		dew.command(Object.keys(settingsArray)[i], {}).then(function(response) {
			settingsArray[Object.keys(settingsArray)[i]] = response;
			i++;
			loadSettings(i);
		});
	}
}

$(document).ready(function(){
        loadSettings(0);
});

let screenManager = ScreenManager();
screenManager.registerScreen('awaiting_confirmation', ScreenAwaitingConfirmation());
screenManager.registerScreen('downloading', ScreenDownloading());
screenManager.registerScreen('download_failed', ScreenDownloadFailed());
screenManager.registerScreen('download_cancelling', ScreenDownloadCancelling());
screenManager.registerScreen('download_finished', ScreenDownloadFinished());
screenManager.registerScreen('download_finalizing', ScreenDownloadFinalizing());

function onShow() {
    const dialog = document.querySelector('#dialog');
    if(compactMode) {
        dew.GameBlur("moddownloader", false, 15);
        $('.dialog_container').fadeOut('fast');
        $('.window-compact').fadeIn('fast');
        $('.backdrop').animate({opacity: "0"},250);
        dialog.classList.toggle('show', false);
        dialog.classList.toggle('hide', true);
        dew.captureInput(false);
		mouseCaptured = false;
    } else {
        dew.GameBlur("moddownloader", true);
        $('.dialog_container').fadeIn('fast');
        $('.window-compact').fadeOut('fast');
        dialog.classList.toggle('show', true);
        dialog.classList.toggle('hide', false);
        $('.backdrop').animate({opacity: "1"},250);
        dew.captureInput(true);
		mouseCaptured = true;
    }
}

function maximize(){
	dew.playSound('x_button');
	compactMode = false;
	onShow();
}

function minimize(){
	dew.playSound('x_button');
	compactMode = true;
	onShow();
}

dew.on('show', function(e) {
	readyToJoin = false;
	compactMode = false;
	onShow();
	previousSize = 0;
    packageList = e.data;
	packageCount = Object.keys(packageList).length;
    document.querySelector('#total_size').textContent = GetTotalPackageSize();
    ResetDialogSize();
	
    $('.button').show();    
});

$( document ).ready(function() {
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
});

dew.on('hide_moddownloader', function() {
	HideScreen();
})

function HideScreen(){
	const dialog = document.querySelector('#dialog');
	dialog.classList.toggle('show', false);
	dialog.classList.toggle('hide', true);
	$('.backdrop').animate({opacity: "0"},400)
	setTimeout(() => {
		dew.hide();
	}, 500);
}

dew.on('hide', function() {
    dew.GameBlur("moddownloader", false, 15);
    packageListJson = '';
    ResetDialogSize();
    dialog.classList.toggle('show', true);
    dialog.classList.toggle('hide', false);
});

dew.on('modDownloadStatus', function(e) {
    if(e.data.total > 0 && e.data.current < e.data.total) {
		if(previousSize != e.data.total) {
			startTime = (new Date()).getTime();
			previousSize = e.data.total;
		}
		var duration = ((new Date()).getTime() - startTime) / 1000;
        var speedBps = e.data.speed;
		var speedKBps = (speedBps != 0 ? (speedBps / 1024).toFixed(0) : 0);
        var speedMBps = (speedKBps != 0 ? (speedKBps / 1024).toFixed(0) : 0);
        var estimatedTime = (speedBps != 0 ? ((e.data.total - e.data.current) / speedBps).toFixed(0) : 0);
		var ending = (estimatedTime != 0 ? (estimatedTime/60 > 1 ? " min" : " s") : " s");

		if(estimatedTime/60 > 1) estimatedTime = (estimatedTime/60).toFixed(0);
		
		var Speed;
		if(speedMBps <= 0){
			var Speed = speedKBps + " KB/s";
		}else
		if(speedKBps <= 0){
			Speed = speedBps + " B/s";
		}else
			var Speed = speedMBps + " MB/s";
		
        updateProgress(e.data.index, `${e.data.name}`, e.data.current, e.data.total, Speed, speedBps > 0 ? estimatedTime + ending : '', e.data.version, e.data.website);
    }
});

dew.on('modDownloadFailed', function (e) {
    var elem = document.getElementById('download_error_reason');
	previousSize = 0;
    switch (e.data.reason) {
        case "Cancelled":
            elem.textContent = "Download cancelled";
            break;
        case "NotEnoughDiskSpace":
            elem.textContent = "Not enough disk space";
            break;
        case "BadResponse":
            elem.textContent = "Server returned bad response";
            break;
        case "RequestError":
            elem.textContent = "Server request error";
            break;
        case "FileError":
            elem.textContent = "Error writing to file";
            break;
        case "NetworkError":
            elem.textContent = "Network error";
            break;
        default:
            elem.textContent = "Unknown error";
            break;
    }
});

dew.on('mouseCapture', function (e) {
    if (compactMode) {
		mouseCaptured = e.data.blocked;
		if(!e.data.blocked)
			$('.window-compact').css({opacity: "0.5"});
		else
			$('.window-compact').css({opacity: "0.8"});
		
        dew.capturePointer(e.data.blocked);
        $('.window-compact').toggleClass('active', e.data.blocked);
    }
        
});

dew.on('modDownloadStateChange', function(e) {
    screenManager.transitionTo(e.data.toState);
});

dew.on('singleModDownloadStateChange', ({data}) => {
    if(data.state == 'downloading') {
        screenManager.transitionTo('downloading');
        setProgressStatus('Preparing to download...', 0);
        dew.show();
    } else if(data.state == 'cancelling') {
        setProgressStatus('Cancelling...', 0);
    }
    else if(data.state == 'completed' || data.state == 'none') {
        HideScreen();
    }
});

dew.on('singleModDownloadProgress', ({data}) => {
    if(data.total > 0 && data.current < data.total) {
		if(previousSize != data.total) {
			startTime = (new Date()).getTime();
			previousSize = data.total;
		}
		var duration = ((new Date()).getTime() - startTime) / 1000;
        var speedBps = data.speed;
		var speedKBps = (speedBps != 0 ? (speedBps / 1024).toFixed(0) : 0);
        var speedMBps = (speedKBps != 0 ? (speedKBps / 1024).toFixed(0) : 0);
        var estimatedTime = (speedBps != 0 ? ((data.total - data.current) / speedBps).toFixed(0) : 0);
		var ending = (estimatedTime != 0 ?(estimatedTime/60 > 1 ? " min" : " s") : "0 s");

		if(estimatedTime/60 > 1) estimatedTime = (estimatedTime/60).toFixed(0);
		
		var Speed;
		if(speedMBps <= 0){
			var Speed = speedKBps + " KB/s";
		}else
		if(speedKBps <= 0){
			Speed = speedBps + " B/s";
		}else
			var Speed = speedMBps + " MB/s";
		
		updateProgress(data.index, `${data.name}`, data.current, data.total, speedMBps, estimatedTime + ending, data.desc, data.website);
    }
});


dew.on('modDownloadFinished', ({data}) => {
    var modsCompleted = packageCount + (packageCount == 1 ? " Mod" : " Mods");
	document.querySelector('#finished_description').textContent = modsCompleted + " has been downloaded successfully. Ready to join Server: \r\n" + "Name: " + data.serverName + "\r\n"+"Host: " + data.serverHost; 
});

dew.on('menuMaximizedByController', ({data}) => {
	if(compactMode && mouseCaptured)
		maximize();	
});

function submitAction(action, data) {
    dew.callMethod('modDownloadAction', { action:action, data:data });
}

function rejectDownload() { dew.playSound('b_button'); submitAction('reject'); }
function confirmDownload() { 
	dew.playSound('a_button');
    setProgressStatus('Preparing to download...', 0);
    submitAction('confirm'); 
}
function retryDownload() { 
	dew.playSound('a_button');
	submitAction('retry'); 
 }
function cancelDownload() { dew.playSound('b_button'); submitAction('reject'); }

function confirmJoin() {dew.playSound('a_button'); submitAction('joinServer'); }

function detail() {
	dew.playSound('a_button');
    var elem = document.querySelector('#detail');
    elem.innerText = PrettyPrintPackages();
    elem.classList.toggle('collapsed');
	
	isDetailsCollapsed = !isDetailsCollapsed;

    if (elem.classList.contains('collapsed')) {
        document.querySelector('.dialog-body').style.height = '25.972vh';
        document.querySelector('#dialog').style.height = '33.33vh';
    }
    else {
        document.querySelector('.dialog-body').style.height = '44.33vh';
        document.querySelector('#dialog').style.height = '44.33vh';
    }
}

function setProgress(text, percent, version, website, name, shortName, speedMBps, secondsRemaining) {
	document.querySelector('#download_name').innerText = 'Mod: ' + name;
	document.querySelector('#download_desc').innerText = 'Version: ' + version;
	var websiteUrl = document.querySelector('#mod_website');
	websiteUrl.innerText = (website == "" ? "N/A" : website);
	websiteUrl.href = website;
	document.querySelector('#download_count').innerText = '' + (packageIndex+1) + '/' + packageCount;
	setProgressStatus(text, percent);
	document.querySelector('#compact_download_count').innerText = '' + (packageIndex+1) + '/' + packageCount;
	document.querySelector('#compact_download_name').innerText = 'Mod: ' + shortName + ' @ ' + speedMBps + " - " + secondsRemaining;
}

function setProgressStatus(text, percent) {
	document.querySelector('#download_status').innerText = text;
	document.querySelector('#progress').style.width=`${percent}%`;
	document.querySelector('#compact_progress').style.width=`${percent}%`;
}

function updateProgress(index, name, current, total, speedMBps, secondsRemaining, description, website) {
    let percent = current / total * 100;
    packageIndex = index;
    var remaining = secondsRemaining.length > 0 ? ` - ${secondsRemaining} remaining` : '';
    setProgress(`Downloading ${bytesToSize(current)}/${bytesToSize(total)} @ ${speedMBps}${remaining}`, percent, description.substr(0,127), website, name.substr(0,32), name.substr(0,15), speedMBps, secondsRemaining)
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
 };

function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay; 
}

function sanitize(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function ScreenManager() {
    let _screens = {};
    let _current_screen = '';

    return {
        registerScreen: function(name, screen) {
            _screens[name] = screen;
            screen.name = name;
            screen.manager = this;
        },
        transitionTo: function (name) {
            ResetDialogSize();

            let fromScreen = _screens[_current_screen];
            let toScreen = _screens[name];

            if(fromScreen) {
                fromScreen.active = false;
                if(fromScreen.exit)
                    fromScreen.exit();
            }

            if(toScreen) {
                toScreen.active = true;
                if(toScreen.enter)
                    toScreen.enter();  
            }
            _current_screen = name;
        }
    }
}

function SimpleScreen(screenDomId) {
    return (function() {
        return {
            enter: () => document.getElementById(screenDomId).classList.add('active'),
            exit:() => document.getElementById(screenDomId).classList.remove('active')
        }
    })()
}

function ResetDialogSize() {
    var elem = document.querySelector('#detail');
    elem.scrollTop = 0;
    document.querySelector('.dialog-body').style.height = '25.972vh';
    document.querySelector('#dialog').style.height = '33.33vh';
    if (!elem.classList.contains('collapsed')) {
        elem.classList.add('collapsed');
    }
}

function PrettyPrintPackages() {
    var detail_builder = "";
    for (var key in packageList) {
        detail_builder += packageList[key].mod_name + "\n";
        detail_builder += "- Hash: " + packageList[key].hash + "\n";
        detail_builder += "- Author: " + packageList[key].mod_author + "\n";
		detail_builder += "- Version: " + packageList[key].mod_version + "\n";
		detail_builder += "- Size: " + bytesToSize(packageList[key].package_size) + "\n";
		detail_builder += "- Website: " + (packageList[key].mod_website == "" ? "N/A" : packageList[key].mod_website) + "\n";
        detail_builder += "- " + packageList[key].mod_description + "\n\n";
    }
    return detail_builder.trim("\n");
}

function GetTotalPackageSize() {
    var total_size = 0;
    for (var key in packageList) {
        total_size += packageList[key].package_size;
    }
    return bytesToSize(total_size);
}

dew.on('controllerinput', function(e){       
    if(settingsArray['Settings.Gamepad'] == 1){
        if(e.data.A == 1 && document.getElementById("screen_awaiting_confirmation").classList.contains('active')){
            confirmDownload();
        }
		if(e.data.Down == 1 && document.getElementById("screen_awaiting_confirmation").classList.contains('active') && !isDetailsCollapsed){
            document.getElementById("detail").scrollBy(0,20);
        }
		if(e.data.Up == 1 && document.getElementById("screen_awaiting_confirmation").classList.contains('active') && !isDetailsCollapsed){
            document.getElementById("detail").scrollBy(0,-20);
        }
		if(e.data.Down == 1 && document.getElementById("screen_awaiting_confirmation").classList.contains('active') && !isDetailsCollapsed){
            document.getElementById("detail").scrollBy(0,20);
        }
		
		if(e.data.A == 1 && document.getElementById("screen_download_failed").classList.contains('active')){
            retryDownload();
        }
		
		if(e.data.A == 1 && document.getElementById("screen_download_finished").classList.contains('active')){
            confirmJoin();
        }
		
		if(e.data.B == 1 && document.getElementById("screen_download_finished").classList.contains('active')){
            rejectDownload();
        }
		
		if(e.data.Y == 1 && (document.getElementById("screen_downloading").classList.contains('active') || document.getElementById("screen_download_finished").classList.contains('active'))){
            //minimize();
        }
		
		if(e.data.B == 1 && (document.getElementById("screen_downloading").classList.contains('active') || document.getElementById("screen_download_failed").classList.contains('active'))){
            cancelDownload();
        }
		
        if(e.data.B == 1 && document.getElementById("screen_awaiting_confirmation").classList.contains('active')){
            rejectDownload();
        }
		if(e.data.Y == 1 && document.getElementById("screen_awaiting_confirmation").classList.contains('active')){
            detail();
        }
    }
});


function ScreenAwaitingConfirmation() {
    return (function() {
        return {
            enter() {
                document.getElementById('dialog-title').innerText = "THIS SERVER HAS MODS";
                document.getElementById('screen_awaiting_confirmation').classList.add('active')
                document.querySelector('#confirm_dialog').style.display = "block";
            },
            exit() {
                document.getElementById('screen_awaiting_confirmation').classList.remove('active')
                document.querySelector('#confirm_dialog').style.display = "none";
            }
        }
    })()
}

function ScreenDownloading() {
    return (function() {
        return {
            enter() {
                document.getElementById('dialog-title').innerText = "DOWNLOADING MODS";
                document.getElementById('screen_downloading').classList.add('active')
                document.querySelector('#download_progress').style.display = "block";
            },
            exit() {
                document.getElementById('screen_downloading').classList.remove('active')
                document.querySelector('#download_progress').style.display = "none";
            }
        }
    })()
}

function ScreenDownloadFailed() {
    return (function() {
        return {
            enter() {
                document.getElementById('dialog-title').innerText = "DOWNLOAD FAILED";
                document.getElementById('screen_download_failed').classList.add('active')
                document.querySelector('#download_failed').style.display = "block";
            },
            exit() {
                document.getElementById('screen_download_failed').classList.remove('active')
                document.querySelector('#download_failed').style.display = "none";
            }
        }
    })()
}

function ScreenDownloadCancelling() {
    return (function() {
        return {
            enter() {
                document.getElementById('dialog-title').innerText = "DOWNLOAD CANCELLED";
                document.getElementById('screen_download_cancelling').classList.add('active')
            },
            exit() {
                document.getElementById('screen_download_cancelling').classList.remove('active')
            }
        }
    })()
}

function ScreenDownloadFinished() {
    return (function() {
        return {
            enter() {
				document.getElementById('dialog-title').innerText = "DOWNLOAD FINISHED";
				document.querySelector('#compact_progress').style.width=`100%`;
				document.querySelector('#compact_download_name').textContent = 'Download Completed. Click to Join';

				if(compactMode){
					document.getElementById('screen_download_finished').classList.add('active')
					document.querySelector('#download_finished').style.display = "block";
					readyToJoin = true;
				}else{
					confirmJoin();
				}
                
            },
            exit() {
                document.getElementById('screen_download_finished').classList.remove('active')
				document.querySelector('#download_finished').style.display = "none";
            }
        }
    })()
}
function ScreenDownloadFinalizing() {
    return (function () {
        return {
            enter() {
                document.getElementById('dialog-title').innerText = "DOWNLOAD FINALIZING";
                document.getElementById('screen_download_finalizing').classList.add('active')
                document.querySelector('#compact_progress').style.width = `100%`;
                document.querySelector('#compact_download_name').textContent = 'Preparing files...';
                document.querySelector('#download_progress').style.display = 'block';
                document.querySelector('#compact_download_count').style.display = 'none';            
            },
            exit() {
                document.getElementById('screen_download_finalizing').classList.remove('active')
                document.querySelector('#download_progress').style.display = 'none';
            }
        }
    })()
}