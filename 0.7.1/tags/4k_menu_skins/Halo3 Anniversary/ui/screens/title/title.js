var announcementShown = false;
var isVisible = false;
var inputReady = false;

$("html").on("mouseup", function(e) {
	if(!inputReady)
		return;
	
	if(!announcementShown)
		hideScreen();
});

$("html").on("keydown", function(e) {
	if(!inputReady)
		return;
	
    if(e.keyCode == 192 || e.keyCode == 112 || e.keyCode == 223){
		hideScreen();
        dew.show("console");
    }else{
		if(e.keyCode == 32 || e.keyCode == 13 || e.keyCode == 27){//space, enter, esc
			if(!announcementShown)
				hideScreen();
			else
				closeAnnounce();
		}
	}
});

dew.on("hide", function(e){
	dew.GameBlur("title", false);
	dew.command("game.hideh3ui 0");
});

dew.on("show", function(e){
	isVisible = true;
	
	$("body").show();
	if(e.data.firstBoot === undefined){
		inputReady = true;
		dew.captureInput(true);
	}else
		dew.captureInput(false);

	dew.command("Game.SkipTitleSplash").then(skipTitleSplash => {
		if(skipTitleSplash == 1){
			dew.hide();
		}else{
			dew.GameBlur("title", true);
			dew.command("game.hideh3ui 1");
			dew.command("server.getendpoint announcements").then(annoucementUrl => {
				$.getJSON(annoucementUrl, function(data) {
					dew.command("Game.AnnoucementViewed").then(annoucementViewed => {
						let shouldShow = false;
						if(data.announcements.length){
							for(var i = 0; i < data.announcements.length; i++){
								if(isNewerDate(data.announcements[i].date, annoucementViewed)){
									shouldShow = true;
									$('#announcementBox').prepend(
										$('<div>',{
											class: 'announcement',
											"css" : {
												"background-image" : "url('"+data.announcements[i].background+"')"
											},
											'data-date': data.announcements[i].date,
										}).append($('<p>',{
											class: 'announceTitle',
											text: data.announcements[i].title
										}).append($('<p>',{
											class: 'announcesubTitle',
											text: data.announcements[i].subtitle
										})).append($('<p>',{
											class: 'announceContent',
											html: data.announcements[i].content
										}))));
								}
							}
							if(shouldShow){
								announcementShown = true;
								$('#announcementBox').show();
								$('#announcementBG').show();
							}
						}
					});
				});
			});
			
			dew.command("Settings.Gamepad").then(gamepadEnabled => {
				if(gamepadEnabled == 1){
					document.querySelector('.instructionText').textContent = 'Press any button to continue';
					$('#dpad').attr('src','dew://assets/buttons/360_Dpad.png');
					$("#dpad").show();
					$( "#up, #down, #left, #right" ).hide();
					$(".instructionText img").attr("src","dew://assets/buttons/360_Start.png");
					$("#esc").attr("src","dew://assets/buttons/360_B.png");
					$("#enter").attr("src","dew://assets/buttons/360_A.png");
					$("#mouse").hide();
				}else{
					document.querySelector('.instructionText').textContent = 'Press any key to continue';
					$("#mouse").show();
					$("#dpad").hide();
					$( "#up, #down, #left, #right" ).show();
					$(".instructionText img").attr("src","dew://assets/buttons/Keyboard_White_Enter.png");
					$("#esc").attr("src","dew://assets/buttons/Keyboard_White_Esc.png");
					$("#enter").attr("src","dew://assets/buttons/Keyboard_White_Enter.png");
				}
			});
		}
	});
});

dew.on('serverconnect', function(e){
    hideScreen();
});

dew.on('controllerinput', function (e) {
	if(!isVisible)
		return;
	
	if(!inputReady)
		return;
	
    if (announcementShown) {
        if (e.data.A == 1) {
            closeAnnounce();
        }
    } else {
        if (e.data.Start == 1 || e.data.Select == 1 || e.data.A == 1 || e.data.B == 1 || e.data.X == 1 || e.data.Y == 1 || e.data.LeftBumper == 1 || e.data.RightBumper == 1 || e.data.Up == 1 || e.data.Down == 1 || e.data.Left == 1 || e.data.Right == 1) {
            hideScreen();
        }
    }
});

function hideScreen(){
	if(isVisible){
		isVisible = false;
		dew.GameBlur("title", false);
		dew.command("game.hideh3ui 0");
		$( "body" ).fadeOut( 500, function() {
			dew.hide();
		});
		dew.playSound('a_button');
	}
}

function closeAnnounce(){
	if(!inputReady)
		return;
	
    const lastdate = $('.announcement').last().data('date');
	if (typeof lastdate !== 'undefined') {
		dew.command("Game.AnnoucementViewed \"" + lastdate + "\"");
	}
	
    $('.announcement').last().remove();
    if(!$('.announcement:visible').length){
        $('#announcementBox').hide();
        $('#announcementBG').hide();
        announcementShown = false;
        dew.command('Game.FirstRun 0', {}).then(function(){
            dew.command('writeconfig');
        });
    }
	dew.playSound('a_button');
}

function parseVersion(str) { 
    var result = 0;
    var suffixPos = str.indexOf('-');
    if(suffixPos != -1)
        str = str.substr(0, suffixPos);
    
    var parts = str.split('.');
    for(var i = 0; i < parts.length && i < 4; i++) {
        result |= (parseInt(parts[i]) << (24-(i*8)));
    }  
    return result;
}

function isNewerDate(date1, date2) {
	const ddate = new Date("03.01.2015");
	const isValidDate = (date) => !isNaN(date.getTime());
	const pDate1 = date1 && isValidDate(new Date(date1)) ? new Date(date1) : ddate;
	const pDate2 = date2 && isValidDate(new Date(date2)) ? new Date(date2) : ddate;
	return pDate1 > pDate2;
}

dew.on("loadingFinished", function(e){
	if(isVisible){
		setTimeout(() => {
			inputReady = true;
		}, 1000)
		dew.captureInput(true);
	}
});