var mapName = "";
var gameModes = ["slayer","ctf","slayer","oddball","koth","forge","vip","juggernaut","territories","assault","infection"];
var safeDomains = ["discord.gg"];
var firstRun = true;

$("html").on("keydown", function(e) {
    if(e.which == 84 || e.which == 89){
        var teamChat = false;
        if(e.which == 89){ teamChat = true };
        dew.show("chat", {'captureInput': true, 'teamChat': teamChat});
    }
    if(e.which == 192 || e.which == 112){
        dew.show("console");
    }
});

function textWithNewLines(text) {
    var htmls = [];
    var lines = text.split("\\n");
    var tmpDiv = jQuery(document.createElement('div'));
    for (var i = 0 ; i < lines.length ; i++) {
        htmls.push(tmpDiv.text(lines[i].trim()).html());
    }
    return htmls.join("<br>");
}

function aWrap(link) {
    link = unescapeHtml(link);
   if(/\b[^-A-Za-z0-9+&@#/%?=~_|!:,.;\(\)]+/ig.test(link))
        return '';
    var e = document.createElement('a');
    e.setAttribute('href', link);
    e.setAttribute('target', '_blank');
    e.setAttribute('style', 'color:dodgerblue');
    e.textContent = link;
    return e.outerHTML;
};

function updateProgress(progress) {
    $("#progressbar").attr('value', progress);
    $(".loading").css({"-webkit-clip-path": "inset(" + progress + "% 0 0 0)"});
}

function loadMap(info) {
	var hasMod = (!(typeof info.modHash === 'undefined') && info.modHash.length > 0);
	$('#blackLayer').hide();
	$(".genericLoader").hide();

	var mapImage = $('#mapImage');
	mapImage.attr('id','mapImage');
	mapImage.attr('data-pak', 'game');
	mapImage.attr('data-url', 'assets/maps/large/' + info.map);
	mapImage.attr('data-fallback','dew://assets/maps/large/unknown.jpg');
	mapImage.appendTo($('.mapLoader'));
	pakAwareContext.invalidateElement(mapImage[0]);

	$('#blackLayer').fadeIn(100, function() {
		$(".mapLoader").show();

		setTimeout(function() {
			$('#blackLayer').fadeOut(600);
		}, 200);
	});

	
	document.getElementById("title").classList.add('title');
	document.getElementById("title").classList.remove('titleMod');
	document.getElementById("author").classList.add('mapauthor');
	document.getElementById("author").classList.remove('mapauthorMod');

    $("#title").text(info.mapName);
    $("#desc").text(info.mapDescription);
    
	if(info.gameMode == 1){
		if(info.insertionPointDescription.localeCompare(info.mapDescription) == 0){
			$("#desc").text("");
		}
		$("#pointdesc").text(info.insertionPointDescription);
		$("#point").text(info.insertionPointName);

		let skullparent = document.getElementById('skulls');//clear out div on load
		while ( skullparent.firstChild ) skullparent.removeChild( skullparent.firstChild );

		let skulldiv = document.getElementById('skulls');
		for(var i = 0; i < info.skulls.length; i++){
			var str = "<img id=\"skull"+i+"\" class='skulls' data-pak=\"game\" data-url=\"assets/skulls/"+info.skulls[i]+"\" data-fallback=\"dew://assets/skulls/blank.png\">";
			
			skulldiv.insertAdjacentHTML( 'afterbegin', str );
			pakAwareContext.invalidateElement($('#skull'+i)[0]);
		}
		
		let difficultyElement = $('#difficulty');
		difficultyElement.attr('data-pak', 'mainmenu');
		difficultyElement.attr('data-url', 'assets/difficulty/' + info.difficulty);
		difficultyElement.attr('data-fallback','dew://assets/difficulty/easy.png');
		pakAwareContext.invalidateElement(difficultyElement[0]);

		$("#pointdesc").show();
		$("#point").show();
		$("#skulls").show();
		$(".gamerounds").hide();
		$(".gamescore").hide();
		$(".timelimit").hide();
		$(".serverName").hide();
		$("#gametype").hide();
		$("#gametypeicon").hide();
		$(".serverMessage").hide();
		$("#difficulty").show();
		$(".modname").hide();
		$(".modauthor").hide();
		$("#author").hide();
	}else{
		$("#difficulty").hide();
		$(".gamerounds").show();
		$(".gamescore").show();
		$(".timelimit").show();
		$(".serverName").show();
		$("#skulls").hide();
		$("#pointdesc").hide();
		$("#point").hide();
		$("#gametype").show();
		$("#gametypeicon").show();
		$("#author").show();
		
		if(info.mapAuthor.length > 0){
			document.querySelector('#mapauthor').innerText = info.mapAuthor;
		}else{
			document.querySelector('#mapauthor').innerText = "None";
		}
		
		if(hasMod){
			document.getElementById("title").classList.add('titleMod');
			document.getElementById("title").classList.remove('title');
			document.getElementById("author").classList.add('mapauthorMod');
			document.getElementById("author").classList.remove('mapauthor');
				
			document.querySelector('#modname').innerText = info.modName + " " + info.modVersion;
			document.querySelector('#modauthor').innerText = info.modAuthor;
			$(".modname").show();
			$(".modauthor").show();
		}else{
			$(".modname").hide();
			$(".modauthor").hide();
		}
			
		var gametypeElement = $("#gametypeicon");
		gametypeElement.attr('data-pak', 'game');
		gametypeElement.attr('data-url', 'assets/gametypes/' + gameModes[info.mode]);
		gametypeElement.attr('data-fallback','dew://assets/gametypes/slayer.png');
		pakAwareContext.invalidateElement(gametypeElement[0]);
		
		$("#gametype").text(info.gameType);  
		if(info.rounds > 0){
			$("#gamerounds").text(info.rounds);  
		} else {
			$("#gamerounds").text("Unlimited"); 
		}
		if(info.scoreToWin > -1){
			$("#gamescore").text(info.scoreToWin);   
		} else {
			$("#gamescore").text("Unlimited");  
		}
		if(info.timeLimit > 0){
			$("#timelimit").text(info.timeLimit+":00"); 
		} else {
			$("#timelimit").text("Unlimited");  
		}         
			
		$(".serverName").text(info.serverName);
		
		var message = info.serverMessage;
		if(message.length > 0){
			message = message.substr(0, 512);
			$(".serverMessage").html(textWithNewLines(escapeHtml(message)).replace(/\bhttps?:\/\/[^ ]+/ig, aWrap)).show();
		} else {
			$(".serverMessage").hide();
		}
	}
}

function loadGeneric() {
	if(firstRun){
		$(".genericLoader").fadeIn(1000);
		firstRun = false;
	}else
		$(".genericLoader").fadeIn(200);
	$('#blackLayer').hide();
    $(".mapLoader").hide();
}

function resetLoader() {
	$('#blackLayer').hide();
    $(".genericLoader, .mapLoader").hide();
    $("#gametype, #gamerounds, #gamescore, #timelimit, .serverName, .serverMessage, .title, .desc").text("");
    $("#gametypeicon").attr("src", "");
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function unescapeHtml(str) {
    var e = document.createElement('div');
    e.innerHTML = str;
    return e.childNodes.str === 0 ? "" : e.childNodes[0].nodeValue;
}

dew.on("show", function (event) {
    mapName = event.data.map || "";
    if (mapName != "mainmenu" && mapName != "") {
        loadMap(event.data);
        dew.captureInput(true);
    } else {
        loadGeneric();
        dew.captureInput(false);
    }
    updateProgress(0);
});

dew.on("hide", function (e) {
    resetLoader();
});

dew.on("loadprogress", function (event) {
    var progress = event.data.currentBytes / event.data.totalBytes * 100;
    updateProgress(progress);
});