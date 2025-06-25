var votingType = "voting";
var interval = 0;
var timeRemaining = 0;
var isHost;
var axisThreshold = .5;
var stickTicks = { left: 0, right: 0, up: 0, down: 0 };
var repGP;
var lastHeldUpdated = 0;
var itemNumber = 1;

var settingsArray = { 'Settings.Gamepad': '0'};
var compactMode = false;

dew.on("variable_update", function(e){
    for(i = 0; i < e.data.length; i++){
        if(e.data[i].name in settingsArray){
            settingsArray[e.data[i].name] = e.data[i].value;
        }
    }
});

dew.on("voting_prior_stats", function(e){
    e.data[0] ? $("#scoreboardButton").show() : $("#scoreboardButton").hide()
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
	$('.window-compact').hide();
    $(document).keydown(function(e){
		if (e.keyCode === 27 && document.hasFocus()) {
            hideScreen();
        }
        if(e.keyCode == 192 || e.keyCode == 112 || e.keyCode == 223){
            dew.show('console');
        }
        if(e.keyCode == 38){ //Up
            upNav();
        }
        if(e.keyCode == 40){ //Down
            downNav();
        }
        if(e.keyCode == 13||e.keyCode == 32){ //Enter or Space to vote
            vote(itemNumber);
        }
        if(e.keyCode == 84 || e.keyCode == 89){ //Chat
            var teamChat = false;
            if(e.keyCode == 89){ teamChat = true };
            dew.show("chat", {'captureInput': true, 'teamChat': teamChat});
        }
        if(e.keyCode == 88 && votingType == "veto"){ //X to veto
            veto();
        }
        if(e.keyCode == 36){ //Home
            dew.show('settings');
        }
        if(e.keyCode == 9){ //Tab
            dew.show('scoreboard', {'locked':'true'});
        }
    });
    $('#scoreboardButton').off('click').on('click', function(){
        dew.show('scoreboard', {'locked':'true'});
    });
    $('#settingsButton').off('click').on('click', function(){
        dew.show('settings');
    });
    $('#closeButton').off('click').on('click', function(){
        hideScreen();
    });
    $('#vetoButton').off('click').on('click', function(){
        veto();
    });

    $('#showButton').off('click').on('click', function() {
        dew.playSound('x_button');
        compactMode = false;
        onShow();
        
    });
    loadSettings(0);
});

var isThrottled = false;
var throttleDuration = 1000;
function veto(){
    if (isThrottled) { return; }
    isThrottled = true;
    setTimeout(function () { isThrottled = false; }, throttleDuration);
    vote(1);
}

function hideScreen(){
    if(!compactMode) {
        dew.playSound('b_button');
    }
    compactMode = true;
    onShow();
}

function setTimer(amount, voting){
    clearInterval(interval);
    timeRemaining = amount;
    interval = setInterval(function() {
        var timerElement = document.getElementById(compactMode ? 'timerCompact' : (votingType != "veto" ? (votingType != "ended" ? 'timer' : 'vetoGameTimer') : 'vetoTimer'));
        if(voting){
			if(votingType != "veto"){
				timerElement.innerHTML = " Voting ends in..." + --amount ;
			}else
				timerElement.innerHTML = (compactMode ? " Veto ends in..." + --amount : " " + --amount + " seconds");
			
			if(amount == 0)
				dew.playSound("alt_timer_sound_zero");
			else
			if(amount <= 3 && amount > 0)
				dew.playSound("alt_timer_sound");
			
        }else{
			if(votingType != "ended")
				timerElement.innerHTML = " Game starts in..." + --amount ;
			else
				timerElement.innerHTML = " Game starting in " + --amount + " seconds.";
			
			if(amount == 0)
				dew.playSound("timer_sound_zero");
			else
			if(amount <= 3 && amount > 0)
				dew.playSound("timer_sound");
        }
        if (amount < 0) {
            timerElement.innerHTML = (voting ? "" : "Starting...");
            timeRemaining = amount;
            clearInterval(interval);
        }
        timeRemaining = amount;
    }, 1000);
}

function vote(number) {
    if(number == 0)
        return;
    
    dew.command("server.SubmitVote " + number);
	var WinnerChosen = document.getElementsByClassName('winner');
    if(votingType != "veto"){
        if (WinnerChosen.length <= 0) {
            $('.myVote').removeClass('myVote');
            $('.votingOption').eq(number-1).addClass("myVote");
        }
    }else{
        if($('#vetoText:contains("Map")').length){
            $('#vetoText').html('Voted to veto');
			$('#vetoBox').removeClass("veto-flash");
			$('#vetoedX').css('display','block');
        }else{
			$('#vetoedX').css('display','none');
            $('#vetoText').html('Veto Map and Game'); 
			$('#vetoBox').addClass("veto-flash");
        }
    }
    if (WinnerChosen.length <= 0) {
        dew.playSound('a_button');
    }
}

dew.on("show", function(event) {
    dew.notify("voting_update");
    dew.getSessionInfo().then(function(i){
        isHost = i.isHost;
    });
    
    if(settingsArray['Settings.Gamepad'] == 1)
        itemNumber = 1;
    else
        itemNumber = 0;
    
    initGamepad();

    

    if(event.data.userInvoked && compactMode && !event.data.compact) {
        dew.playSound('x_button');
        compactMode = false;
    }
    onShow();
	
	window.addEventListener('mouseup', handleMouseUp);
});

dew.on("hide", function(event) {
	$('.window-compact').hide();
	window.removeEventListener('mouseup', handleMouseUp);
    if(repGP){
        window.clearInterval(repGP);
        repGP = null;
    }
});

function handleMouseUp(e) {
	if(e.button === 2 && !compactMode){
		hideScreen();
	}
}

dew.on("VoteTimerUpdated", function(event) {
	if(!event.data.shouldUpdateTimer && timeRemaining > 0)
	    return;
	
	if(event.data.timeUntilGameStart != 0)
		setTimer(event.data.timeUntilGameStart, false);  
});

dew.on("Winner", function(event) {
	$('#votingDesc').html('Your game will be starting shortly. <span id="timer"></span>');
	$("#" + event.data.Winner).addClass('winner');
	$(".votingOption").not('.winner').animate({opacity: 0.33}, 1000);
	$(".votingOption").removeClass("selected");
});

dew.on("VetoOptionsUpdated", function(event) {
	$("#votingOptions").children().not(".vetoBox").remove();
	$('#vetoedX').css('display','none');
	$('#vetoText').html('Veto Map and Game'); 
	$('#vetoBox').addClass("veto-flash");
	
	$('#vetoMapInfo').empty();
	$('#vetoMapInfo, #vetoStatus').show();
	$('#votingDesc').hide();
    var voting;
    if(event.data.vetoOption.canveto){
        votingType = "veto";
        voting = true;
        $('#vetoButton, #vetoCount, #vetoCountDown, .vetoCountBox').show();
        $('#vetoCountDown').html('VETO COUNTDOWN: <span id="vetoTimer"></span>');
        $('#vetoStatus').html('A new game and map will be chosen with a majority veto.');
        $('.vetoBox').show();
    }else{
        votingType = "ended";
        voting = false;
        $('.vetoBox').hide();
        $('#vetoButton, #vetoCount').hide();
        $('#vetoStatus').html('');
        $('#vetoCountDown').html('Game accepted. <span id="vetoGameTimer"></span>');
    }
	var modname = (event.data.vetoOption.modname != "" ? "Mod: " + event.data.vetoOption.modname : "");
	
	$("<img class='mapImage' id='vetoPreview'><span class='mapInfo'>"+sanitize(event.data.vetoOption.typename)+ " on "+sanitize(event.data.vetoOption.mapname)+"<span class='modInfo'>"+sanitize(modname)+"</span></span>").appendTo($("#vetoMapInfo"));
	
	getImageUrl($('#vetoPreview'), event.data.vetoOption);

    dew.command('Server.ListPlayersJSON').then(function(res){
        $('#voteCount').html('<span id="1"><span class="selector">0</span> of '+JSON.parse(res).length+'</span> ('+event.data.votesNeededToPass + ' needed)');
    });
	if(event.data.timeRemaining > 0)
		setTimer(event.data.timeRemaining - 1, voting);     
});

dew.on("VotingOptionsUpdated", function(event) {
    votingType = "voting";

    $('#vetoButton, #vetoCount, #vetoMapInfo, #vetoCountDown, .vetoCountBox, #vetoStatus, .vetoBox').hide();
    $('#votingDesc').html('Vote for game and map... <span id="timer"></span>');
    $('#votingDesc').show();
    $("#votingOptions").children().not(".vetoBox").remove();
    event.data.votingOptions.forEach(function(entry, i) {
        if (entry.mapname == "Revote") {
            $("<div>", {
                    "class": "votingOption none",
                    "id": entry.index
                })
                .html('<span class="votebox"></span>None of the above<span class="selector">0</span>')
                .appendTo($("#votingOptions"));
        } else 
		if (entry.mapname == "Rematch") {
            $("<div>", {
                    "class": "votingOption none",
                    "id": entry.index
                })
                .html('<span class="votebox"></span>Rematch<span class="selector">0</span>')
                .appendTo($("#votingOptions"));
        } else if (entry.mapname != '') {
			var modname = (entry.modname != "" ? "Mod: " + entry.modname : "");
			var center = (entry.modname != "" ? "" : "Centered");
			
            $("<div>", {
                    "class": "votingOption",
                    "id": entry.index
                })
                .html('<span class="votebox"></span><img class="mapImage" id="votePreview'+entry.index+'"><span class="gameType'+center+'">'+sanitize(entry.typename)+'</span><span class="mapName'+center+ '">'+sanitize(entry.mapname)+'</span><span class="modName">'+sanitize(modname)+'</span><span class="selector">0</span>')
                .appendTo($("#votingOptions"));
				
			getImageUrl($('#votePreview'+entry.index), entry);
        }
    });

    if(settingsArray['Settings.Gamepad'] == 1)
        itemNumber = 1;
    else
        itemNumber = 0;

    updateSelection(itemNumber, false);
    
    $(".votingOption").off('click').on('click', function() {
        $(".votingOption").removeClass("selected");
		var WinnerChosen = document.getElementsByClassName('winner');
		if (WinnerChosen.length <= 0) {
			$(this).addClass( "selected" );
		}
        vote($(this).attr('id'));
    });    
    
    $("#votingOptions").off("mouseout").on("mouseout", function(){
        $(".votingOption").removeClass("selected");
    })
    
    $(".votingOption").off('mouseover').on('mouseover', function(){
        if (!$('.winner').length) {
            itemNumber = $('.votingOption').index($(this))+1;
            updateSelection(itemNumber, false);
        }
    });
	if(event.data.timeRemaining > 0)
		setTimer(event.data.timeRemaining - 1, true); 
});

function imageExists(image_url){
    var http = new XMLHttpRequest();
    http.open('HEAD', image_url, false);
    http.send();
    return http.status != 404;
}

dew.on("VoteCountsUpdated", function(event) {
	if(votingType == "veto"){
		dew.command('Server.ListPlayersJSON').then(function(res){
			$('#voteCount').html('<span id="1"><span class="selector">'+event.data.voteCounts[0].Count+'</span> of '+JSON.parse(res).length+'</span> ('+event.data.votesNeededToPass + ' needed)');
		});
		return;
	}
    event.data.voteCounts.forEach(function(entry, i) {
        if (entry.Count == 0){
            $('#' + entry.OptionIndex + ' .selector').text(0);
        }else{
            $('#' + entry.OptionIndex + ' .selector').text(entry.Count);
        }
    });
});

dew.on('VoteEnded', function(event) {
    clearInterval(interval);
    compactMode = false;
});

dew.on('controllerinput', function(e){       
    if(settingsArray['Settings.Gamepad'] == 1){
        if(e.data.A == 1){
            vote(itemNumber);
        }
        if(e.data.Start == 1){
            dew.show('settings');
        }
        if(e.data.Select == 1){
            dew.show('scoreboard',{'locked':true});
        }
        if(e.data.Up == 1){
            upNav();
        }
        if(e.data.Down == 1){
            downNav();
        }
        if(e.data.AxisLeftY > axisThreshold){
            stickTicks.up++;
        }else{
            stickTicks.up = 0;
        }
        if(e.data.AxisLeftY < -axisThreshold){
            stickTicks.down++;
        }else{
            stickTicks.down = 0;
        }
        if(e.data.X == 1 && votingType == "veto"){
            veto();
        }            
        if(e.data.B == 1){
            hideScreen();
        }
    }
});

function initGamepad(){
    $("#scoreboardButton img").attr('src','dew://assets/buttons/360_Back.png');  
    $("#settingsButton img").attr('src','dew://assets/buttons/360_Start.png');  
    $("#vetoButton img").attr('src','dew://assets/buttons/360_X.png');
    $("#closeButton img").attr('src','dew://assets/buttons/360_B.png');
    $(".vetoBoxBtn").attr('src','dew://assets/buttons/360_X.png');
    if(settingsArray['Settings.Gamepad'] == 1){
        if(!repGP){
            repGP = window.setInterval(checkGamepad,1000/60);
        }
    }else{
        if(repGP){
            window.clearInterval(repGP);
            repGP = null;
        }
    }
}

function checkGamepad(){
    var shouldUpdateHeld = false;
    if(Date.now() - lastHeldUpdated > 100) {
        shouldUpdateHeld = true;
        lastHeldUpdated = Date.now();
    }
    if(stickTicks.up == 1 || (shouldUpdateHeld && stickTicks.up > 25)){
        upNav();
    }
    if(stickTicks.down == 1 || (shouldUpdateHeld && stickTicks.down > 25)){
        downNav();
    }
};

function updateSelection(item, sound){
    $('.selected').removeClass('selected');
    var WinnerChosen = document.getElementsByClassName('winner');
    if (WinnerChosen.length <= 0) {
        $('#'+item).addClass('selected');
        if(sound){
            dew.playSound('vertical_navigation');
        }
    }
}

function upNav(){
    if(itemNumber > 1){
        itemNumber--;
        updateSelection(itemNumber, true);
    }
}

function downNav(){
    if(itemNumber < $('.votingOption').length){
        itemNumber++;
        updateSelection(itemNumber, true);
    }           
}

function onShow() {
    if(compactMode) {
        $('#window').fadeOut('fast');
        $('.window-compact').fadeIn('fast');
        dew.captureInput(false);
        dew.capturePointer(true);
    } else {
        $('#window').fadeIn('fast');
        $('.window-compact').fadeOut('fast');
        dew.captureInput(true);
        dew.capturePointer(true);
    }
}

function cancelVote() {
    if(isHost) {
        dew.command("Voting.CancelVote");
    }
}

function sanitize(str) {
    let div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function getImageUrl(element, option) {
    if((option.image.startsWith("http://") || option.image.startsWith("https://")) && (option.image.endsWith(".png") || option.image.endsWith(".jpg")))
		element.attr("src", option.image);
    else
		dew.getAssetUrl("assets/maps/small/"+option.image, { pak:option.modhash, fileTypes:['jpg','png'], searchBaseAssets:true}).then(url => {
			let imageURL = "dew://assets/maps/small/placeholder.jpg";
			if(url != "")
				imageURL = url;
			else{ //Try base scnr map name
				dew.getAssetUrl("assets/maps/small/"+option.scnrname, { pak:option.modhash, fileTypes:['jpg','png'], searchBaseAssets:true}).then(urlscnr => {
					if(urlscnr != "")
						imageURL = urlscnr;
					
					element.attr("src", imageURL);
				});
				return;
			}
			element.attr("src", imageURL);
		});
}