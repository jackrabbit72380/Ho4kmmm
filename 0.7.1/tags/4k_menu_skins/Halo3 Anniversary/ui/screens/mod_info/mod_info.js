let currentModHash = "";
let locked = false;

dew.input.on('action', handleAction);

dew.on('show', async function (e) {
    locked = false;
    
    if(e.data.hash) {
        locked = true;
        await updateCurrentMod(e.data.hash);
    }
    else{
        await updateCurrentMod();
        if(currentModHash === ""){// no mod loaded
            dew.hide();
            return;
        }
        dew.playSound("a_button");
    }
    
    dew.GameBlur("modinfo", true);
    $('#overlay').animate({opacity: "1"},150)
    $('#screen_widget').animate({opacity: "1"},150);
    
    window.addEventListener('mouseup', handleMouseUp);
});

function hideScreen() {
    if(locked){
        dew.notify("mod_browser_restore");
        locked = false;
    }
    dew.GameBlur("modinfo", false);
    $('#overlay').animate({opacity: "0"},150)
    $('#screen_widget').animate({opacity: "0"},150, function(){
        dew.hide();
    });
}

dew.on('hide', function () {
    window.removeEventListener('mouseup', handleMouseUp);
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

function handleBack() {
    dew.playSound('b_button');
    hideScreen();
}

function handleMouseUp(e) {
    if(e.button === 2){
        handleBack();
    }
}

function handleAction(e) {
    switch (e.action) {
        case dew.input.Actions.B:
            handleBack();
            break;
    }
}

const deadzone = 0.3;
dew.on('controllerinput', function(e){
    if(e.data.AxisLeftY > deadzone || e.data.AxisLeftY < -deadzone)
        scrollDescription(e.data.AxisLeftY);
    else
        if(e.data.AxisRightY > deadzone || e.data.AxisRightY < -deadzone)
            scrollDescription(e.data.AxisRightY);
});

function scrollDescription(amt){
    let amount = amt.toFixed(2)*7;
    var description = document.getElementById("description_section");
    description.scrollBy(0, -amount);
}

function formatSize(size) {
    if (size === 0)
        return '0 bytes';
    var i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

function showModDetails(mod) {
    var previewImgElem = document.querySelector('#mod_preview_img');
    
    if (mod.hash) {
        document.querySelector('#mod_name').innerText = mod.name.toUpperCase();
        document.querySelector('#mod_description').innerText = mod.description;
        document.querySelector('#mod_author').innerText = mod.author;
        document.querySelector('#mod_version').innerText = mod.version;
        document.querySelector('#mod_types').innerText = (mod.mainmenuType ? "Mainmenu " : "") + (mod.characterType ? "Character " : "") + (mod.multiplayerType ? "Multiplayer " : "") + (mod.campaignType ? "Campaign " : "") + (mod.firefightType ? "Firefight" : "");
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
        document.querySelector('#mod_types').innerText = '';
        document.querySelector('#mod_website').innerText = '';
        document.querySelector('#mod_filesize').innerText = '';
        document.querySelector('#mod_source').innerText = '';
        document.querySelector('#mod_dowloaddate').innerText = '';
        document.querySelector('#mod_lastuseddate').innerText = '';
        
        previewImgElem.src = "dew://assets/maps/small/placeholder.jpg";
    }
}

async function fetchModInfo(hash) {
    let modInfo = await dew.command('Server.ListModInfo' + (hash !== "" ? " "+hash : ""));
    if(modInfo !== "")
        return JSON.parse(modInfo);
    
    return "";
}

async function updateCurrentMod(hash = "") {
    let mod = await fetchModInfo(hash);
    if(mod === "")
        currentModHash = "";
    else
        currentModHash = mod.hash;
    
    showModDetails(mod);
    
    if(currentModHash === "")
        return;
    
    await dew.getAssetUrl("readme", { pak:mod.hash, fileTypes:['md'], searchBaseAssets:false }).then(readmePath => {
        if(readmePath != ""){
            fetch(readmePath)
                .then(response => {
                    // Check if the request was successful
                    if (!response.ok) {
                        console.error('response was not ok');
                        return "";
                    }
                    
                    // Parse the response body as text
                    return response.text();
                })
                .then(text => {
                    // Print the text content
                    renderMarkdown(text);
                })
                .catch(error => {
                    console.error('There was a problem fetching the mod readme:', error);
                });
        }
    });
}

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

function escapeHtml(html) {
    return html.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

function renderMarkdown(markdown) {
    
    // Escape HTML characters
    markdown = escapeHtml(markdown);
    
    // Replace common markdown symbols with HTML tags
    markdown = markdown.replace(/\n/g, '<br>')
        .replace(/#### (.+)/g, '<h4>$1</h4>')
        .replace(/### (.+)/g, '<h3>$1</h3>')
        .replace(/## (.+)/g, '<h2>$1</h2>')
        .replace(/# (.+)/g, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/(<br>-)/g, '<br>&#x2022;')
    
    dew.command("Input.DumpBindingsJson").then(function(response){
        var bindDump = JSON.parse(response);
        dew.command("Settings.Gamepad").then(function(gamepad){
            let replaceMap = new Map();
            
            bindDump.forEach(function(jsonObject) {
                let actionName = jsonObject.actionName;
                let bindKey = (gamepad === "1" ? jsonObject.controllerButton : jsonObject.primaryKey);
                let regex = new RegExp('&lt;' + actionName + '&gt;', 'g');
                if(regex.test(markdown)){
                    replaceMap.set('&lt;' + actionName + '&gt;', '&lt;'+bindKey+"&gt;");
                }
            });
            if(replaceMap.size > 0){
                let regex = new RegExp(Array.from(replaceMap.keys()).join('|'), 'g');
                markdown = markdown.replace(regex, function(matched){
                    return replaceMap.get(matched);
                });
            }
            document.querySelector('#mod_description').innerHTML = markdown;
        });
    });
}
