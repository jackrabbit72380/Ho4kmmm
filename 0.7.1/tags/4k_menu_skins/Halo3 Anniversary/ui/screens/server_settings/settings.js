var activePage = "#page1";
var selectedItem;
var itemNumber = 0;
var tabIndex = 0;
var commandValues = [];
var vetoEnabled;
var unlimitedSprint;
var hasGP = false;
var lastMousePosition = { x: 0, y: 0 };
var hiding = false;

var settingsToLoad = [
    ['sName', 'Server.Name'],
    ['sMatchCountdown', 'Server.CountdownLobby'], 
    ['sCountdown', 'Server.Countdown'], 
    ['sMaxPlayers', 'Server.MaxPlayers'], 
    ['sNumberTeams', 'Server.NumberOfTeams'], 
    ['sShouldAnnounce', 'Server.ShouldAnnounce'],
    ['sShouldSubmitStats', 'Server.ShouldSubmitStats'],
    ['sDualWieldEnabled', 'Server.DualWieldEnabled'], 
    ['sAssassinationEnabled', 'Server.AssassinationEnabled'], 
    ['sPass', 'Server.Password'], 
    ['sMessage', 'Server.Message'],  
    ['sTeamShufflingEnabled','Server.TeamShuffleEnabled'],
    ['sMapVotingTime','Voting.VoteTime'],
    ['sNumOfRevotes','Voting.MaxRevoteCount'],
    ['sNumOfRematches','Voting.MaxRematchCount'],
    ['sNumberOfVotingOptions','Voting.VoteOptionCount'],
    ['sVotingDuplicationLevel','Voting.DuplicationLevel'],
    ['sTimeBetweenVoteEndAndGameStart','Voting.VoteGameStartCountdown'],
    ['sNumOfVetoes','Voting.MaxVetoCount'],
    ['sVetoVoteTime','Voting.VoteTime'],
    ['sVetoWinningShowTime','Voting.VetoWinnerShowTime'],
    ['sVetoPassPercentage','Voting.VetoPassPercentage'],
    ['sVetoSystemSelectionType','Voting.VetoSelectionType'],
    ['sUPNP','UPnP.Enabled'],
    ['sNetworkMode', ''],
    ['sTagMod', ''],
    ['sVotingStyle', ''],
    ['sEmotesEnabled','Server.EmotesEnabled'],
    ['sKillCommandEnabled','Server.KillCommandEnabled'],
    ['sEndGameCommandEnabled','Server.ChatCommandEndGameEnabled'],
    ['sEndRoundCommandEnabled','Server.ChatCommandEndRoundEnabled'],
    ['sSprint', 'Server.Sprint'],
    ['sSprintUnlimited', 'Server.UnlimitedSprint'],
    ['sHitmarkersEnabled', 'Server.HitMarkersEnabled'],
    ['sWaypointType', 'Server.HUDWaypointStyle'],
    ['sDisconnectedPlayers', 'Server.ShowDisconnectedPlayers'],
    ['sPodiumEnabled', 'Server.PodiumEnabled'],
    ['sCampaignRepresentation', 'Campaign.PlayerRepresentationEnabled'],
    ['sFirefightRepresentation', 'Campaign.PlayerRepresentationEnabled'],
    ['sCampaignSprint', 'Campaign.SprintEnabled'],
    ['sFirefightSprint', 'Campaign.SprintEnabled'],
];

$(document).ready(function(){
    $(document).keyup(function (e) {
        if (e.keyCode === 27) {
            closeButton();
        }
        if (e.keyCode == 44) {
            dew.command('Game.TakeScreenshot');  
        }
    });
    $(document).keydown(function(e){
        if(e.keyCode == 192 || e.keyCode == 223){
            dew.show('console');
        }
        else if(e.keyCode == 37 && !$(event.target).is("input[type='text']") && !$(event.target).is("textarea[type='text']")) { // left
            e.preventDefault();
        }else if(e.keyCode == 39 && !$(event.target).is("input[type='text']") && !$(event.target).is("textarea[type='text']")) { // right
            e.preventDefault();
        }else if(e.keyCode == 38) { // up
            e.preventDefault();
        } else if(e.keyCode == 40) { // down
            e.preventDefault();
        } else if(e.keyCode == 32 && !$(event.target).is("input[type='text']") && !$(event.target).is("textarea[type='text']")) { // space
			e.preventDefault();
        }
    });
	$(document).mouseup(function(e){
		if(e.button == 2)
			closeButton();
    })
    location.hash = activePage;
    $('.tinySetting').on('change', function(){
        var newID = $(this).attr('id');
        if(newID.endsWith('Text')){
            newID = newID.slice(0, -4);
        }
        $('#'+newID).val($(this).val());
    });
    $('input[type=range]').on('input', function(){
        var newID = $(this).attr('id') + 'Text';
        $('#'+newID).val($(this).val());
    });
    $('#settingsWindow input:not(#lookSensitivity,#lookSensitivityText), #settingsWindow select,#settingsWindow textarea').on('change', function(e){
        var elementID = e.target.id;
        if($('#'+elementID).hasClass('tinySetting') && e.target.id.endsWith('Text')){
            elementID = elementID.slice(0, -4);
        }
        var newValue = e.target.value;
        if(e.target.computedRole == 'checkbox'){
            if($('#'+elementID).is(':checked')){
                newValue = '1';
            }else{
                newValue = '0';
            }
        }
        $.grep(settingsToLoad, function(result){
            if(result[0] == elementID){
                if(result[1].length){
                    dew.command(result[1]+' "'+newValue+'"');
                }
            };
        });
        if(!hiding)
            dew.playSound('a_button');
    });
    $('#closeButton').on('click', function(e){
        closeButton();
    });
    $('#sVotingStyle').on('change', function(){
        updateVotingStyle(this.value);
        if(hasGP){
            if(itemNumber > $(activePage + ' label:visible').length-1){
                itemNumber = $(activePage + ' label:visible').length-1;
            }
            updateSelection(itemNumber, true, true, true);
        }
    });

    $('#sCampaignSprint, #sFirefightSprint').on('change', function(e){
        if(this.checked)
            dew.dialog("coop_sprint");
    });
    
    $('#sCampaignScoring').on('change', function(){
        dew.command('Campaign.MetagameScoring ' + this.value);
    });
    setControlValues();
    
	dew.command('Voting.SystemType', {}).then(function(type){
		if(type == '2'){
			$('#sVotingStyle').val('2');
			$('.VoteType').hide();
			$('.VetoType').show();
		}else if(type == '1'){
			$('#sVotingStyle').val('1');
			$('.VoteType').show();
			$('.VetoType').hide();
		}else{
			$('#sVotingStyle').val('0');
			$('.VoteType, .VetoType').hide();
		}     
    });
    
      dew.input.on('action', function(evt){
        switch(evt.action){
            case dew.input.Actions.X:
                if($('#'+selectedItem).prev()[0].computedRole == 'button'){
                    $('#'+selectedItem).prev().click();
                }
                break;
            case dew.input.Actions.A:
                selectButton();
                break;
            case dew.input.Actions.B:
                if(evt.inputType != 'keyboard')
                    closeButton();
                break; 
        }
    });
    
    dew.input.on('scroll', function(type, axis, direction){
        if(type === 0 || type == 1){//dpad/joystick
            //up/down
            if(axis === 0){
                if(direction == -1)
                    upNav();
                if(direction == 1)
                    downNav();
            }
            //left/right
            if(axis === 1){
                if(direction == -1)
                    leftToggle();
                if(direction == 1)
                    rightToggle();
            }
        }
        
        if(type == 2){
            //left/right trigger
            if(axis === 0){
                if(direction == -1){
                    if(itemNumber > 0){
                        itemNumber = 0;
                        updateSelection(itemNumber, true, true, true);
                    }
                }
                if(direction == 1){
                    if(itemNumber < $(activePage + ' label:visible').length-1){
                        itemNumber = $(activePage + ' label:visible').length-1;
                        updateSelection(itemNumber, true, true, true);
                    }
                }
            }
        }
    });
    
    $(document).on('mousemove', function(event) {
       lastMousePosition = { x: event.screenX, y: event.screenY };
    });

    $('span').has('.setting').off('mouseover').on('mouseover', function(){
        //prevent mouse setting off scroll events if it hasnt moved since the last event
        var currentMousePosition = { x: event.screenX, y: event.screenY };
        if (currentMousePosition.x === lastMousePosition.x && currentMousePosition.y === lastMousePosition.y){
            return;
        }
        
        $('.selectedElement').removeClass('selectedElement');
        $(this).addClass('selectedElement');
        itemNumber = $(activePage+' span').has('.setting').index($(this));
        if(itemNumber > -1){
            updateSelection(itemNumber, false, false, false); 
        }
    });
    
    $('#sNetworkMode').on('change', function(){
        dew.command('Server.Mode '+$(this).val());
        dew.command(`Server.Mod "${$('#sTagMod').val()}"`);
    });
    $('#sTagMod').on('change', function(){
        dew.command(`Server.Mod "${$(this).val()}"`);
    });
    
    $('#sCampaignRallyPoint').on('change', function(){
        dew.command(`Campaign.InsertionPoint ${$(this).val()}`);
    });
    
    setButtons();
	
    const passwordInput = document.getElementById('sPass');
    const showPasswordBtn = document.getElementById('showPasswordBtn');

    showPasswordBtn.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            showPasswordBtn.textContent = 'HIDE';
        } else {
            passwordInput.type = 'password';
            showPasswordBtn.textContent = 'SHOW';
        }
    });
});

function setButtons(){
    $('#closeButton img').attr('src','dew://assets/buttons/360_B.png');
}

dew.on('show', function(e){
    hiding = false;
    dew.GameBlur("serversettings", true);
    $('#overlay').animate({opacity: "1"},150)
    $('#settingsWindow').animate({opacity: "1"},150);
    initActive();
    initGamepad();

    setControlValues();
	dew.command('Voting.SystemType', {}).then(function(votetype){
		dew.command('Server.lobbyType', {}).then(function(lobbytype){
			if(votetype == '2'){
				$('#sVotingStyle').val('2');
				$('.VoteType').hide();
				$('.VetoType').show();
			}else if(votetype == '1'){
				$('#sVotingStyle').val('1');
				$('.VoteType').show();
				$('.VetoType').hide();
			}else{
				$('#sVotingStyle').val('0');
				$('.VoteType, .VetoType').hide();
			}
			if(lobbytype != 2)
			{
				$('.VoteType').hide();
				$('.VetoType').hide();
				$('#votingHeader').hide();
				$('#votingMode').hide();
			}
		});    
    });
	
    dew.command('Server.lobbyType', {}).then(function(lobbytype){        
        //Campaign
        if(lobbytype == 0){
            dew.command('Campaign.MetagameScoring', {}).then(function(response){
                $('#sCampaignScoring').val(response);
            });
            $('#campaignHeader').show();
            $('.CampaignType').show();
        }else{
            $('#campaignHeader').hide();
            $('.CampaignType').hide();
        }
        if(lobbytype == 5){
            $('#firefightHeader').show();
            $('.FirefightType').show();
        }else{
            $('#firefightHeader').hide();
            $('.FirefightType').hide();
        }
        //customs
        if(lobbytype == 2){
            $('.VoteType').show();
            $('.VetoType').show();
            $('#votingHeader').show();
            $('#votingMode').show();

            $('#NumberTeamsOption').show();
            $('#TeamShuffleOption').show();
            $('#RoundStartOption').show();
            $('#AssassinationsOption').show();
            $('#EmotesOption').show();
            $('#KillCommandOption').show();
            $('#EndgameOption').show();
            $('#EndRoundOption').show();
            $('#DisconnectedPlayersOption').show();
            $('#PodiumOption').show();
            $('.MultiplayerType').show();
        }else{
            $('.VoteType').hide();
            $('.VetoType').hide();
            $('#votingHeader').hide();
            $('#votingMode').hide();
        }
        //forge
        if(lobbytype == 3){
            $('#NumberTeamsOption').show();
            $('#TeamShuffleOption').show();
            $('#RoundStartOption').show();
            $('#AssassinationsOption').show();
            $('#EmotesOption').show();
            $('#KillCommandOption').show();
            $('#EndgameOption').show();
            $('#EndRoundOption').show();
            $('#DisconnectedPlayersOption').show();
            $('#PodiumOption').show();
            $('.MultiplayerType').show();
        }
        
        if(lobbytype != 2 && lobbytype != 3){
            $('#NumberTeamsOption').hide();
            $('#TeamShuffleOption').hide();
            $('#RoundStartOption').hide();
            $('#AssassinationsOption').hide();
            $('#EmotesOption').hide();
            $('#KillCommandOption').hide();
            $('#EndgameOption').hide();
            $('#EndRoundOption').hide();
            $('#DisconnectedPlayersOption').hide();
            $('#PodiumOption').hide();
            $('.MultiplayerType').hide();
        }
        
    });
    
    dew.command('Server.Mode', {}).then(function(response){
        $('#sNetworkMode').val(response);
    });

    dew.command('Server.ListMods', {}).then(function(response) {
        var mods = JSON.parse(response);
        $('#sTagMod').html('<option value="">None</option>');
        for(let mod of mods) {
			if(mod.multiplayerType || mod.campaignType || mod.firefightType){
				$('#sTagMod').append($('<option/>', { 
					value: mod.filename,
					text: mod.name + " " + mod.version
				}));
			}
        }

        dew.command('Server.Mod', {}).then(function(response){
            $('#sTagMod').val(response);
        });
    });
    
    dew.command('Campaign.GetRallyPoints', {}).then(function(response){
        var rallyPoints = JSON.parse(response);
        $('#sCampaignRallyPoint').html('');
        var pointIndex = 0;
        if(rallyPoints.points){
            for(let point of rallyPoints.points) {
                $('#sCampaignRallyPoint').append($('<option/>', {
                    value: pointIndex++,
                    text: point
                }));
            }
            dew.command('Campaign.InsertionPoint', {}).then(function(response){
                $('#sCampaignRallyPoint').val(response);
            });
        }
    })
});

function initGamepad(){
    dew.command('Settings.Gamepad', {}).then(function(result){
        if(result == 1){
            hasGP = true;
            onControllerConnect();
        }else{
            onControllerDisconnect();
            hasGP = false;
        }
    });
}

function hideScreen(){
    hiding = true;
    dew.GameBlur("serversettings", false);
    $('#overlay').animate({opacity: "0"},150)
    $('#settingsWindow').animate({opacity: "0"},150, function() {
        dew.hide();
    });
}

dew.on('hide', function(e){ 
});

function initActive(){
    updateSelection(0, false, true, true);
}

function setControlValues(){
    commandValues = [];
    dew.getCommands().then(function (commands){
        for(i = 0; i < commands.length; i++){
            var setValue = commands[i].value;
            $.grep(settingsToLoad, function(result){
                if(result[1] == commands[i].name){
                    commandValues.push([result[0],commands[i].name,commands[i].value]);
                        if($('#'+result[0]).is(':checkbox')){
                            if(setValue == '1'){
                                $('#'+result[0]).prop('checked', true);
                            }else{
                                $('#'+result[0]).prop('checked', false);                               
                            }
                        }else{
                            if($('#'+result[0]).hasClass('tinySetting')){
                                setValue = parseFloat(setValue);
                            }
                            $('#'+result[0]).val(setValue);
                        }
                        $('#'+result[0]).val(setValue);
                        if($('#'+result[0]).hasClass('hasTiny')){
                            $('#'+result[0]+'Text').val(setValue);
                        }

                };
            });
        }
    })
}

function closeButton(){
    dew.playSound('b_button');
    hideScreen();
    dew.command('writeconfig');
}

function setOptionList(ElementID, ArrayVar){
    var sel = document.getElementById(ElementID);
    for(var i = 0; i < ArrayVar.length; i++){
        var opt = document.createElement('option');
        opt.textContent = ArrayVar[i][0];
        opt.value = ArrayVar[i][1];
        sel.appendChild(opt);
    }
}

function updateVotingStyle(value){
	if(value == "0"){
        dew.command('Voting.SystemType 0');
        $('.VoteType, .VetoType').hide();
    }else if(value == "1"){
        dew.command('Voting.SystemType 1');
        $('.VetoType').hide();
        $('.VoteType').show();
    }else{
        dew.command('Voting.SystemType 2');
        $('.VoteType').hide();
        $('.VetoType').show();
    }
}

function updateSprint(value){
    if(value == "0"){
        dew.command('Server.SprintEnabled 0');
        dew.command('Server.UnlimitedSprint 0');
    }else if(value == "1"){
        dew.command('Server.SprintEnabled 1');
        dew.command('Server.UnlimitedSprint 0');
    }else{
        dew.command('Server.SprintEnabled 1');
        dew.command('Server.UnlimitedSprint 1');
    }
}

function updateSelection(item, sound, move, controller){
    if(controller){
        $('.selectedElement').removeClass('selectedElement');
        $(activePage + ' label:visible').eq(item).parent().addClass('selectedElement');
    }
    
    if (itemNumber < 0 || itemNumber >= $(activePage + ' .setting:visible').not('span').length)
        itemNumber = 0;

    selectedItem = $(activePage + ' .setting:visible').not('span').eq(itemNumber).attr('id');
    
    if(move){
        
        let containerBounds = $('#'+selectedItem).closest('span').parent()[0].getBoundingClientRect();
        let nodeBounds = $('#'+selectedItem).parent()[0].getBoundingClientRect();

        if (nodeBounds.bottom >= containerBounds.bottom)
            $('#'+selectedItem).parent()[0].scrollIntoView(false);
        else if (nodeBounds.top < containerBounds.top)
            $('#'+selectedItem).parent()[0].scrollIntoView(true);
        
    }
    if(sound){
        dew.playSound('vertical_navigation');
    }
}

function upNav(){
    if(itemNumber > 0){
        itemNumber--;
        updateSelection(itemNumber, true, true, true);
    }
}

function downNav(){
    if(itemNumber < $(activePage + ' label:visible').length-1){
        itemNumber++;
        updateSelection(itemNumber, true, true, true);
    }           
}

function onControllerConnect(){
    updateSelection(itemNumber, false, true, true);
}

function onControllerDisconnect(){
    $('.selectedItem').removeClass(); 
}

function leftToggle(){
    if(document.getElementById(selectedItem).computedRole == "combobox"){
        var elementIndex = $('#'+selectedItem+' option:selected').index();
        if(elementIndex > 0){
            var newElement = elementIndex - 1;
            $('#'+selectedItem+' option').eq(newElement).prop('selected', true);
            $('#'+selectedItem).trigger('change');
        }
    }
    if(document.getElementById(selectedItem).computedRole == "slider"){
        if(parseInt(document.getElementById(selectedItem).value) > parseInt(document.getElementById(selectedItem).min)){
            document.getElementById(selectedItem).stepDown();
            document.querySelector('#'+selectedItem +'Text').value = document.getElementById(selectedItem).value; 
            $('#'+selectedItem).trigger('change');
        }
    }
}

function rightToggle(){
    if(document.getElementById(selectedItem).computedRole == "combobox"){
        var elementIndex = $('#'+selectedItem+' option:selected').index();
        var elementLength = $('#'+selectedItem).children('option').length;
        if(elementIndex < elementLength - 1){
            var newElement = elementIndex + 1;
            $('#'+selectedItem+' option').eq(newElement).prop('selected', true);
            $('#'+selectedItem).trigger('change');
        } 
    }
    if(document.getElementById(selectedItem).computedRole == "slider"){
        if(parseInt(document.getElementById(selectedItem).value) < parseInt(document.getElementById(selectedItem).max)){
            document.getElementById(selectedItem).stepUp();
            document.querySelector('#'+selectedItem +'Text').value = document.getElementById(selectedItem).value;   
            $('#'+selectedItem).trigger('change');
        }
    }
}

function toggleSetting(){
    if(document.getElementById(selectedItem).computedRole == "checkbox"){
        if(document.getElementById(selectedItem).checked){
            document.getElementById(selectedItem).checked = false;
        }else{
            document.getElementById(selectedItem).checked = true;
        }
        $('#'+selectedItem).trigger('change'); 
    }       
}

function selectButton() {
    if($('#'+selectedItem).prev()[0].computedRole == 'button'){
        $('#'+selectedItem).prev().click();
    }else{
        toggleSetting();
    }
}
