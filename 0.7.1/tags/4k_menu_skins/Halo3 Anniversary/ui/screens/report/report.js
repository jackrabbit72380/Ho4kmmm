let _reportInfo = {};
let captchaToken = null;
let reportWindow = document.querySelector('.report_window');
let previousState = null;
let reportAPIUrl = "";
let recaptchaLoaded  = false;

let REPORT_STATES = {
    none: 'report_state_none',
    submitting: 'report_state_submitting'
};

document.addEventListener('keydown', function (e) {
    if (e.keyCode == 27) {
        e.preventDefault();

        dew.playSound('b_button');
        hide();
    }
})

var onloadCallback = function() {
    dew.command("server.getendpoint playerReport").then(resp => {
        reportAPIUrl = resp;
        dew.command("server.getendpoint playerReportSiteKey").then(siteKey => {
            grecaptcha.render('recaptcha', {
                'sitekey' : siteKey,
                'callback' : recaptchaCallback
            });
        });
    });
}

function loadRecaptcha() {
    if(recaptchaLoaded) {
        return;
    }
    const script = document.createElement("script");
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    recaptchaLoaded = true;
}


dew.on('show', function (e) {
    captchaToken = null;
    _reportInfo = {};

    loadRecaptcha();

    setReportState(REPORT_STATES.none);

    dew.playSound('a_button');
    setErrorStatus('');
    playerIndex = e.data.playerIndex;
    playerName = e.data.playerName;

    setTitle(`REPORT PLAYER: ${playerName}`);

    Promise.all([
        dew.callMethod("playerReportInfo", {
            playerIndex: playerIndex
        }),
        dew.getSessionInfo(),
        dew.getStats(playerName),
        dew.command('Player.PubKey'),
        dew.getMapVariantInfo(),
        dew.getGameVariantInfo()
    ])
        .then(([reportInfo, sessionInfo, stats, publicKey, mapVariantInfo, gameVariantInfo]) => {
            _reportInfo = Object.assign({}, JSON.parse(reportInfo), {
                map: mapVariantInfo.name,
                mapFile: sessionInfo.mapFile,
                mapName: sessionInfo.mapName,
                variant: gameVariantInfo.name,
                offenderStats: stats,
                publicKey: publicKey
            });
        });
    
    dew.GameBlur("report", true);
    document.getElementById('reportContainer').classList.add('report_container_visible');
});

dew.on('hide', function (e) {
        dew.GameBlur("report", false);
});

window.recaptchaCallback = function recaptchaCallback(response) {
    captchaToken = response;
}

function hide() {
    return new Promise((resolve) => {

        document.getElementById('reportContainer').classList.remove('report_container_visible');
        setTimeout(function () {
            dew.hide();
            resolve();
            resetForm();
        }, 500);
    });
}

function setErrorStatus(text) {
    let e = document.getElementById('reportErrorStatus');
    if (text.length == 0) {
        e.style.display = 'none';
    } else {
        e.textContent = text;
        e.style.display = 'block';
    }
}

function setTitle(text) {
    let e = document.getElementById('reportTitle');
    e.textContent = text;
}

function gotoFailState(message) {
    setReportState(REPORT_STATES.none);
    reportWindow.classList.add('shake');
    setErrorStatus(message);
    dew.playSound('error');
}

document.getElementById('reportCancel').addEventListener('click', function () {
    dew.playSound('b_button');
    _reportInfo = {};
    captchaToken = null;
    hide();
});

reportWindow.addEventListener("animationend", () => {
    reportWindow.classList.remove('shake');
}, false);


function setReportState(state) {
    if (previousState)
        reportWindow.classList.remove(previousState);
    reportWindow.classList.add(state);
    previousState = state;
}

function validate(payload) {
    return new Promise((resolve, reject) => {
        if (!payload.reason || payload.reason.length === 0) {
            reject('please give a reason');
        }
        if (payload.reason == 'other' && (!payload.detail || payload.detail.length === 0)) {
            reject('please enter details');
        }
        if (payload.detail.length > 140) {
            reject('report detail can be no more than 140 characters');
        }
        if (payload.contact.method !== 'none' && payload.contact.info.length === 0) {
            reject('please enter contact info');
        }
        resolve(payload);
    });
}

function resetForm() {
    grecaptcha.reset();
    document.getElementById('reportReason').value = 'cheating';
    document.getElementById('reportDetail').value = '';
    document.getElementById('reportContactType').value = 'email'
    document.getElementById('reportContactInfo').value = '';
}

function submitReport(endpoint, payload) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    let response = JSON.parse(xhr.responseText);
                    let hasMessage = response && response.message && response.message.length !== 0;
                    reject(`Submission Failed: ${hasMessage ? response.message : xhr.statusText}`);
                }
            }
        };
        xhr.onerror = () => reject('Submission Failed: Are you online?');
        xhr.send(JSON.stringify(payload));
    });
}

document.getElementById('reportSubmit').addEventListener('click', function () {
    dew.playSound('a_button');
    setReportState(REPORT_STATES.submitting);

    let reportDetails = {
        'gRecaptchaResponse': captchaToken,
        reason: document.getElementById('reportReason').value,
        detail: document.getElementById('reportDetail').value,
        contact: {
            method: document.getElementById('reportContactType').value,
            info: document.getElementById('reportContactInfo').value
        },
    };
	
	dew.command('Player.EncryptGmtTimestamp').then(function(resp){
		Object.assign(_reportInfo, {encryptedTimestamp: resp});
		let payload = Object.assign({}, reportDetails, _reportInfo);
		Promise.all([
			validate(payload),
			submitReport(reportAPIUrl, payload)
		])
			.then(function (response) {
				let token = response[1];
				dew.sendChat(`!report ${token}`, false);

				hide().then(function () {
					dew.toast({ body: 'Report Submitted' });
					setReportState(REPORT_STATES.none);
				});
			})
			.catch(gotoFailState);
	});
});