var activePage;
var selectedItem;
var itemNumber = 0;
var tabIndex = 0;
var changeArray = [];
var commandValues = [];
var vetoEnabled;
var unlimitedSprint;
var hasGP = false;
var playSound = true;
var preventCancel = false;
var lodWarned = false;
var lastMousePosition = { x: 0, y: 0 };
var rightclickKeybind = false;
var hiding = false;

var settingsToLoad = [
    ['sControlsMethod','Settings.Gamepad'],
    ['sInfantryMouseSensV','Settings.MouseSensitivityVertical'],
    ['sInfantryMouseSensH','Settings.MouseSensitivityHorizontal'],
    ['sVehicleMouseSensV','Settings.MouseSensitivityVehicleVertical'],
    ['sVehicleMouseSensH','Settings.MouseSensitivityVehicleHorizontal'],
    ['sMouseAcceleration','Settings.MouseAcceleration'],
    ['sMouseFilter','Settings.MouseFilter'],
    ['sInvertMouse','Settings.InvertMouse'],
    ['sToggleCrouch','Settings.ToggleCrouch'],
    ['sScreenResolution','Settings.ScreenResolution'],
    ['sBrightness','Settings.Brightness'],
    ['sFullscreen','Settings.Fullscreen'],
    ['sVsync','Settings.VSync'],
    ['sAntiAliasing','Settings.Antialiasing'],
    ['sAnisotropicFiltering','Settings.AnisotropicFiltering'],
    ['sTextureResolution','Settings.TextureResolution'],
    ['sTextureFiltering','Settings.TextureFilteringQuality'],
    ['sLightningQuality','Settings.LightingQuality'],
    ['sEffectsQuality','Settings.EffectsQuality'],
    ['sShadowQuality','Settings.ShadowQuality'],
    ['sShadowResolution','Settings.ShadowResolution'],
    ['sDetailsLevel','Settings.DetailsQuality'],
    ['sPostprocessing','Settings.PostprocessingQuality'],
    ['sMotionBlur','Settings.MotionBlur'],
    ['sReflections','Graphics.ReflectionsEnabled'],
    ['sMasterVolume','Settings.MasterVolume'],
    ['sSFXVolume','Settings.SfxVolume'],
    ['sMusicVolume','Settings.InGameMusicVolume'],
    ['sMainMenuMusicVolume','Settings.MainMenuMusicVolume'],
    ['sHudShake','Settings.HUDShake'],
    ['sPlayerMarkerColors','Settings.PlayerMarkerColors'],
    ['sCameraFOV','Camera.FOV'],
    ['cCenteredCrosshairFirst','Camera.CenteredCrosshairFirst'], 
    ['cCenteredCrosshairThird','Camera.CenteredCrosshairThird'], 
    ['cHideHUD','Camera.HideHUD'], 
    ['inputRaw','Input.RawInput'],  
    ['lookSensitivity','Input.ControllerSensitivityY'], 
    ['controllerPort','Input.ControllerPort'], 
    ['gExpandScoreboard','Game.ExpandedScoreboard'], 
    ['invertLook','Input.ControllerInvertY'], 
    ['gHideChat','Game.HideChat'], 
    ['gSuppressJuggling','Game.SuppressJuggling'], 
    ['wOffsetConfig','Weapon.JSON.File'],
    ['iSpectateSens','Input.SpectateSensitivity'],
    ['iDisableSprint','Input.ToggleSprint'],
    ['vEnabled','VoIP.Enabled'],
    ['vMicrophoneID','VoIP.MicrophoneID'],
    ['vPTTEnable','VoIP.PTT_Enabled'],
    ['vAGC','VoIP.AGC'],
    ['vNoiseSupress','VoIP.NoiseSupress'],
    ['vEchoCancelation','VoIP.EchoCancelation'],
    ['vPTTSound','VoIP.PTTSoundEnabled'],
    ['vIncomingVolume','VoIP.IncomingVolume'],
    ['vOutgoingVolume','VoIP.OutgoingVolume'],
    ['vMaximumBitrate', 'VoIP.MaximumBitrate'],
    ['tDisableFog','Tweaks.DisableReactorFog'], 
    ['tDisableWeapOutline','Tweaks.DisableWeaponOutline'], 
    ['tDisableHitmarkers','Tweaks.DisableHitMarkers'], 
    ['tGruntBirthdayParty','Tweaks.GruntBirthdayParty'],
    ['tReachFrags','Tweaks.ReachStyleFrags'],
    ['tExposureCpu','Settings.ExposureCpu'],
    ['sAudioDevice','Settings.AudioOutputDevice'],
    ['sContrast','Settings.Contrast'],
    ['controllerVibration','Input.ControllerVibrationIntensity'],
    ['stickLayout', 'Input.ControllerStickLayout'],
    ['xSens','Input.ControllerSensitivityX'],
    ['ySens','Input.ControllerSensitivityY'],
    ['sQualityPreset', '',],
    ['presetMenu',''],
    ['gdEnabled','Game.Discord.Enable'],
    ['gdAutoAccept','Game.Discord.AutoAccept'],
    ['sMainmenuMod','Game.MainMenuMod'],
    ['sCampaignMod','Game.CampaignMod'],
    ['sFirefightMod','Game.FirefightMod'],
    ['sMultiplayerMod','Game.MultiplayerMod'],
    ['sGamma','Graphics.Gamma'],
    ['sMotionBlurStrength','Settings.MotionBlurStrength'],
    ['sMotionBlurAlways','Settings.MotionBlurAlways'],
    ['sCenteredHudScaling','Graphics.CenteredHUD'],
    ['sSkipTitleSplash','Game.SkipTitleSplash'],
    ['sCefGpuAccel','Game.CEFGpuEnable'],
    ['sSSAOEnabled','Settings.SSAO'],
    ['sDecoratorDistance',"Settings.DecoratorDistance"],
    ['sLODDistance',"Settings.LODDistance"],
    ['sChatMessageLimit',"Game.ChatMessageLimit"],
    ['sSubtitlesDisplay',"Settings.Subtitles"],
    ['sHoFpAnimations',"Settings.FirstPersonJumpAndLand"],
];
var binds = [
    ['Sprint','Sprint','Infantry'],
    ['Jump','Jump','Infantry'],
    ['Crouch','Crouch','Infantry'],
    ['Use','Use','Infantry'],
    ['DualWield','Dual Wield','Infantry'],
    ['Fire','Fire','Infantry'],
    ['FireLeft','Fire Dual','Infantry'],
    ['Reload','Reload','Infantry'],
    ['ReloadLeft','Reload Dual','Infantry'],
    ['Zoom','Zoom','Infantry'],
    ['SwitchWeapons','Switch Weapons','Infantry'],
    ['Melee','Melee','Infantry'],
    ['Grenade','Grenade','Infantry'],
    ['SwitchGrenades','Switch Grenades','Infantry'],
    ['VehicleAccelerate','Vehicle Accelerate','Vehicle'],
    ['VehicleBrake','Vehicle Brake','Vehicle'],
    ['VehicleBoost','Vehicle Boost','Vehicle'],
    ['VehicleRaise','Vehicle Raise','Vehicle'],
    ['VehicleDive','Vehicle Dive','Vehicle'],
    ['VehicleFire','Vehicle Fire','Vehicle'],
    ['VehicleAltFire','Vehicle Alt Fire','Vehicle'],
    ['BansheeBomb','Banshee Bomb','Vehicle'],
    ['Menu','Menu','UI'],
    ['Scoreboard', 'Scoreboard', 'UI'],
    ['Chat','Chat','UI'],
    ['TeamChat', 'Team Chat', 'UI'],
    ['Emote', 'Emote', 'UI'],
    ['UseEquipment','Use Equipment','Infantry'],
    ['VoiceChat','Voice Chat PTT','UI'],
    ['Flashlight','Toggle Flashlight','Infantry'],
    ['Forward','Forward','Infantry'],
    ['Back','Back','Infantry'],
    ['Left','Left','Infantry'],
    ['Right','Right','Infantry'],
    ['NextPlayer','Spectate Next Player','UI'],
    ['PrevPlayer','Spectate Prev Player','UI'],
    ['UiLeftBumper','UiLeftBumper','UI'],
    ['UiRightBumper','UiRightBumper','UI']
];

var buttons = ["","A","B","X","Y","RB","LB","LT","RT","Start","Back","LS","RS","Left","Right","Up","Down"];

var controllerPresets = [
    ["Halo Online Default","LS,A,X,RB,LB,RT,LT,RB,LB,RS,Y,B,LT,Right,,,A,A,X,RT,LT,B,Start,Back,,,Left,Down,Up,Up"],
    ["Halo 3 Default","Right,A,LS,RB,LB,RT,LT,RB,LB,RS,Y,B,LT,LB,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,X,Up,Up"],
    ["Halo 3 Southpaw","Right,A,LS,RB,LB,LT,RT,RB,LB,RS,Y,B,RT,LB,,,RT,A,LS,LT,RT,B,Start,Back,,,Left,X,Up,Up"],
    ["Halo 3 Boxer","Right,A,LS,RB,LB,RT,LT,RB,LB,RS,Y,LT,B,LB,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,X,Up,Up"],
    ["Halo 3 Green Thumb","Right,A,LS,RB,LB,RT,LT,RB,LB,B,Y,RS,LT,LB,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,X,Up,Up"],
    ["Halo 3 Bumper Jumper","Right,LB,LS,B,A,RT,LT,B,A,RS,Y,RB,LT,A,,,LT,LB,LS,RT,LT,RB,Start,Back,,,Left,X,Up,Up"],
    ["Halo 3 Walkie Talkie","Right,A,LS,B,X,RT,LT,B,X,RS,Y,RB,LT,X,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,Up,LB,Down"],
    ["Halo Reach Default","LB,A,LS,X,B,RT,LT,X,LB,RS,Y,RB,LT,B,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,Down,Up,Up"],
    ["Halo Reach Southpaw","RB,A,LS,X,B,LT,RT,X,RB,RS,Y,LB,RT,B,,,RT,A,LS,LT,RT,B,Start,Back,,,Left,Down,Up,Up"],
    ["Halo Reach Boxer","LB,A,LS,X,B,RT,LT,X,LB,RS,Y,LT,RB,B,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,Down,Up,Up"],
    ["Halo Reach Green Thumb","LB,A,LS,X,B,RT,LT,X,LB,RB,Y,RS,LT,B,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,Down,Up,Up"],
    ["Halo Reach Bumper Jumper","X,LB,LS,B,A,RT,LT,B,A,RS,Y,RB,LT,A,,,LT,LB,LS,RT,LT,RB,Start,Back,,,Left,Down,Up,Up"],
    ["Halo Reach Recon","LB,A,LS,RB,X,RT,LT,RB,LB,RS,Y,B,LT,X,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,Down,Up,Up"],
    ["Halo 4 Default","LS,A,B,X,LB,RT,LT,X,LB,RS,Y,RB,LT,Right,,,LT,A,B,RT,LT,RB,Start,Back,,,Left,Down,Up,Up"],
    ["Halo 4 Southpaw","LS,A,B,X,RB,LT,RT,X,RB,RS,Y,LB,RT,Right,,,RT,A,B,LT,RT,LB,Start,Back,,,Left,Down,Up,Up"],
    ["Halo 4 Boxer","B,A,LS,X,LB,RT,LT,X,LB,RS,Y,LT,RB,Right,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,Down,Up,Up"],
    ["Halo 4 Green Thumb","LS,A,B,X,LB,RT,LT,X,LB,RB,Y,RS,LT,Right,,,LT,A,B,RT,LT,RB,Start,Back,,,Left,Down,Up,Up"],
    ["Halo 4 Bumper Jumper","A,LB,LS,B,X,RT,LT,B,X,RS,Y,RB,LT,Right,,,LT,LB,LS,RT,LT,RB,Start,Back,,,Left,Down,Up,Up"],
    ["Halo 4 Recon","X,A,LS,RB,LB,RT,LT,RB,LB,RS,Y,B,LT,Right,,,LT,A,LS,RT,LT,B,Start,Back,,,Left,Down,Up,Up"],
    ["Halo 4 Fishstick","LS,A,B,X,LB,RT,LT,X,LB,LT,Y,RS,RB,Right,,,LT,A,B,RT,LT,RS,Start,Back,,,Left,Down,Up,Up"]
];
var bindChangeArray = [];
var subPages = ['#page4','#page5','#page8','#page9','#page11'];

$(document).ready(function(){
    $(document).keyup(function (e) {
        if (e.keyCode === 27) {
			if(preventCancel){
				preventCancel = false;
				return;
			}
            cancelButton();
        }
        if (e.keyCode == 44) {
            dew.command('Game.TakeScreenshot');  
        }
    });
    $(document).keydown(function(e){
        if(e.keyCode == 192 || e.keyCode == 223){
            dew.show('console');
        }
        if(window.location.hash != '#page5'){
            if(e.keyCode == 81){//Q
                e.preventDefault();
            }
            else if(e.keyCode == 69){//E
                e.preventDefault();
            }
            else if(e.keyCode == 37 && !$(event.target).is("input[type='text']") && !$(event.target).is("textarea[type='text']")) { // left
                e.preventDefault();
            }
            else if(e.keyCode == 39 && !$(event.target).is("input[type='text']") && !$(event.target).is("textarea[type='text']")) { // right
                e.preventDefault();
            }
            else if(e.keyCode == 38) { // up
                e.preventDefault();
            }
            else if(e.keyCode == 40) { // down
                e.preventDefault();
            }
            else if(e.keyCode == 32 && !$(event.target).is("input[type='text']") && !$(event.target).is("textarea[type='text']")) { // space
                e.preventDefault();
            }
        }
    });    
    setButtonLists();
    setOptionList('presetMenu', controllerPresets);

    dew.command('Weapon.JSON.List', {}).then(function(response) {
        var offsetArray = [];
        var offsets = response.split(',');
        for (i = 0; i < offsets.length; i++){
            if(offsets[i].indexOf(" ") == -1){
                offsetArray.push([offsets[i],offsets[i]]);
            }
        }
        setOptionList('wOffsetConfig', offsetArray);
    });
    $('.tabs li a').off('click').on('click',function(e){
        $('.tabs li').removeClass('selected');
        $(this).parent().addClass('selected');
        window.location.href = e.target.href;
        activePage = e.target.hash;
        itemNumber = 0;
        $(e).ready(function(){
            updateSelection(0, false, true, true);
            tabIndex = $('.tabs li:visible a').index($("a[href='"+activePage+"']"));
        });
        dew.playSound('horizontal_navigation');
    });
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
    var lastSoundPlayedTime = Date.now();
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
                queueChange([result[1], newValue]);
            };
        });
        if(playSound && !hiding){
            var currentTime = Date.now();
            if((currentTime - lastSoundPlayedTime) > 100) {
                lastSoundPlayedTime = currentTime;
                dew.playSound('a_button');
            }
        }
    });
    $('#lookSensitivity, #lookSensitivityText').on('change', function(e){
        var yVal = 30 + (e.target.value * 10);
        var xVal = yVal * 2;
        queueChange(['Input.ControllerSensitivityX', xVal]);
        queueChange(['Input.ControllerSensitivityY', yVal]);
    });
    $('#controllerVibration, #controllerVibrationText').on('change', function(e){
        dew.command('Input.ControllerVibrationIntensity ' + $(this).val(), {}).then(function(x){
            dew.command('Input.ControllerVibrationTest');
        });
    });
    dew.command('Graphics.SupportedResolutions', {}).then(function(response){
        var supportedArray = JSON.parse(response);
        var resolutionArray = [['Default','default']];
        for(i = 0; i < supportedArray.length; i++){
            resolutionArray.push([supportedArray[i],supportedArray[i]]);
        }
        setOptionList('sScreenResolution', resolutionArray);
    });
    $('#applyButton').off('click').on('click', function(e){
        applyButton();
    });
    $('#resetButton').off('click').on('click', function(e){
        resetButton();
    });
    $('#cancelButton').off('click').on('click', function(e){
        cancelButton();
    });
    $('#sTextureResolution, #sTextureFiltering, #sLightningQuality, #sEffectsQuality, #sShadowQuality, #sDetailsLevel, #sPostprocessing').on('change', function(e){
        if($('#sTextureResolution').val() == e.target.value && $('#sTextureFiltering').val() == e.target.value && $('#sLightningQuality').val() == e.target.value && $('#sEffectsQuality').val() == e.target.value && $('#sDetailsLevel').val() == e.target.value && $('#sPostprocessing').val() == e.target.value){
            $('#sQualityPreset').val(e.target.value);
        }else{
            $('#sQualityPreset').val('custom');
        }
    });
    $('#sQualityPreset').on('change', function(e){
        if(e.target.value != 'custom'){
            $('#sTextureResolution').val(e.target.value);
            $('#sTextureFiltering').val(e.target.value);
            $('#sLightningQuality').val(e.target.value);
            $('#sEffectsQuality').val(e.target.value);
            $('#sDetailsLevel').val(e.target.value);
            $('#sPostprocessing').val(e.target.value);
            $('#sShadowQuality').val(e.target.value);
            if(e.target.value == 'high'){
                $('#sMotionBlur').prop('checked', true);
                $('#sSSAOEnabled').prop('checked', true);
                $('#sLODDistance').val(10);
                $('#sDecoratorDistance').val(1);
                $('#sShadowResolution').val('4096');
            }else{
                $('#sMotionBlur').prop('checked', false);
                $('#sLODDistance').val(2);
                $('#sDecoratorDistance').val(1);
                $('#sShadowResolution').val('2048');
            }
            if(e.target.value == 'low'){
                $('#sSSAOEnabled').prop('checked', false);
                $('#sLODDistance').val(1);
                $('#sDecoratorDistance').val(0);
                $('#sShadowResolution').val('1024');
            }
            playSound = false;
            $('.video').trigger('change');
            playSound = true;
        }
    });
    $('#presetMenu').on('change', function(){
        applyBindString(this.value);
    });
    $('#wOffsetConfig').on('change', function(){
        changeArray.push(['Weapon.JSON.Load', '']);
    });    
    navigator.mediaDevices.enumerateDevices().then(function(devices){
        var deviceArray = [['Default','']];
        for (i = 0; i < devices.length; i++){
            if(devices[i].kind == "audioinput" && devices[i].label && devices[i].deviceId != 'communications' && devices[i].deviceId != 'default'){
                deviceArray.push([devices[i].label,devices[i].label]);
            }
        }
        setOptionList('vMicrophoneID', deviceArray);
    });
    setControlValues();
    initializeBindings();
    $('.bind').on('change', function(){
        queueBindChange([this.id, this.value]);
        updateBindLabels();
    });
    
    dew.input.on('action', function(evt){
        switch(evt.action){
            case dew.input.Actions.LeftBumper:
                prevPage();
                break;
            case dew.input.Actions.RightBumper:
                nextPage();
                break;
            case dew.input.Actions.Y:
                resetButton();
                break;
            case dew.input.Actions.Start:
                applyButton();
                break;
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
                    cancelButton();
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
    
	$(document).mouseup(function(e){
		if(e.button == 2){
			if(rightclickKeybind){
				rightclickKeybind = false;
				return;
			}
			if(!(window.location.hash == '#page5' && $('.keybind').is(":focus")))
				cancelButton();
		}
    })
    
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
    $('#sCefGpuAccel').on('change', function(){
        dew.dialog("requires_restart")
    });
	
    $('#sLODDistance').on('change', function(){
        if(lodWarned)
            return;
        
        dew.dialog("strain_system");
        lodWarned = true;
    });
    
    $('#vListenToMicrophone').on('change', function(e){
        dew.command('VoIP.ListenToMicrophone ' + (this.checked ? '1' : '0'));
    });
    
    $('.rangeSetting .tinySetting').on('input', function() {
        var inputValue = $(this).val();
        // Allow only numbers and decimal points
        var sanitizedValue = inputValue.replace(/[^0-9.]/g, '');
        $(this).val(sanitizedValue);
        
        var parsedValue = parseFloat($(this).val());
        var rangeInput = $(this).siblings('input[type="range"]');
        var minRange = parseFloat(rangeInput.attr('min'));
        var maxRange = parseFloat(rangeInput.attr('max'));
        
        // Check if input value is within the range
        if (parsedValue < minRange) {
            $(this).val(minRange);
        } else if (parsedValue > maxRange) {
            $(this).val(maxRange);
        }
    });
    
    setButtons();
});

function setButtons(){
    $('#resetButton img').attr('src','dew://assets/buttons/360_Y.png');
    $('#applyButton img').attr('src','dew://assets/buttons/360_Start.png');
    $('#cancelButton img').attr('src','dew://assets/buttons/360_B.png');
    $('.tabs img').eq(0).attr('src','dew://assets/buttons/360_LB.png');
    $('.tabs img').eq(1).attr('src','dew://assets/buttons/360_RB.png');
}

var mapName = "mainmenu";
dew.on('show', function(e){
    hiding = false;
    if(!jQuery.isEmptyObject(e.data)){
        switch(e.data){
            case "game": 
                tabIndex = 0;
            break;
            case "controls": 
                tabIndex = 1;
            break;
            case "video": 
                tabIndex = 2;
            break;
            case "sound": 
                tabIndex = 3;
            break;
            default:
        }
    }else{
        tabIndex = 0;
    };
    
    dew.getSessionInfo().then(function(i){
        mapName = i.mapName;
        
        dew.GameBlur("settings", true);
        $('#overlay').animate({opacity: "1"},150)
        $('#settingsWindow').animate({opacity: "1"},150);
        initActive();
        initGamepad();
    });
	
	dew.command('Weapon.JSON.List', {}).then(function(response) {
        var offsetArray = [];
        var offsets = response.split(',');
        for (i = 0; i < offsets.length; i++){
            if(offsets[i].indexOf(" ") == -1){
                offsetArray.push([offsets[i],offsets[i]]);
            }
        }
        setOptionList('wOffsetConfig', offsetArray);
    });
	
	setControlValues();

    dew.command('Server.ListMods', {}).then(function(response) {
        var mods = JSON.parse(response);
        $('#sMainmenuMod').html('<option value="">None</option>');
		$('#sMultiplayerMod').html('<option value="">None</option>');
		$('#sCampaignMod').html('<option value="">None</option>');
		$('#sFirefightMod').html('<option value="">None</option>');
		
        for(let mod of mods) {
			if(mod.mainmenuType){
				$('#sMainmenuMod').append($('<option/>', { 
					value: mod.filename,
					text: mod.name + " " + mod.version
				}));
			}
			
			if(mod.multiplayerType){
				$('#sMultiplayerMod').append($('<option/>', { 
					value: mod.filename,
					text: mod.name + " " + mod.version
				}));
			}
			
			if(mod.campaignType){
				$('#sCampaignMod').append($('<option/>', { 
					value: mod.filename,
					text: mod.name + " " + mod.version
				}));
			}
			
			if(mod.firefightType){
				$('#sFirefightMod').append($('<option/>', { 
					value: mod.filename,
					text: mod.name + " " + mod.version
				}));
			}
        }

        dew.command('Game.MainMenuMod', {}).then(function(response){
            if($('#sMainmenuMod option[value="'+response+'"]').length>0){
				$('#sMainmenuMod option[value="'+response+'"]').prop('selected', true);
			}else{
				$('#sMainmenuMod option[value="None"]').prop('selected', true);
			}
        });
		dew.command('Game.CampaignMod', {}).then(function(response){
			if($('#sCampaignMod option[value="'+response+'"]').length>0){
				$('#sCampaignMod option[value="'+response+'"]').prop('selected', true);
			}else{
				$('#sCampaignMod option[value="None"]').prop('selected', true);
			}
        });
		dew.command('Game.FirefightMod', {}).then(function(response){
			if($('#sFirefightMod option[value="'+response+'"]').length>0){
				$('#sFirefightMod option[value="'+response+'"]').prop('selected', true);
			}else{
				$('#sFirefightMod option[value="None"]').prop('selected', true);
			}
        });
		dew.command('Game.MultiplayerMod', {}).then(function(response){
			if($('#sMultiplayerMod option[value="'+response+'"]').length>0){
				$('#sMultiplayerMod option[value="'+response+'"]').prop('selected', true);
			}else{
				$('#sMultiplayerMod option[value="None"]').prop('selected', true);
			}
        });
        dew.command('Settings.AudioOutputDeviceList', {}).then(function (response) {
            var audioDevArray = [];
            var devs = JSON.parse(response);
            for (i = 0; i < devs.length; i++) {
                audioDevArray.push([devs[i], i]);
            }
            setOptionList('sAudioDevice', audioDevArray);
        });
    });
});

function showWeaponOffsets(){
    if(mapName != "mainmenu"){
		 dew.command('Weapon.Equipped', {}).then(function(response){
			var weaponInfo = JSON.parse(response);
			if(weaponInfo.Type === ""){
                dew.playSound("a_button");
                dew.dialog("weapon_offsets_not_supported");
			}else
			{
				hideScreen();
				dew.show('weapon_offset');
			}
		 });
    }else{
        dew.playSound("a_button");
        dew.dialog("weapon_offsets_in_game_warning");
    }
}

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
    //only want to listen while in settings
    $('#vListenToMicrophone').prop('checked', false).trigger('change');
    
    dew.GameBlur("settings", false);
    $('#overlay').animate({opacity: "0"},150)
    $('#settingsWindow').animate({opacity: "0"},150, function(){
        dew.hide();
    });
}

dew.on('hide', function(e){    
});

function initActive(){
    $('.selected').removeClass('selected');
    $('.tabs li:visible').eq(tabIndex).addClass('selected');
    location.hash = $('.selected a')[0].hash;
    activePage = window.location.hash;
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
                    if(result[1].startsWith('Input.ControllerSensitivityY')){
                        $('#ySens, #ySensText').val(setValue);
                        var h3Val = (setValue-30)/10;
                        $('#lookSensitivity, #lookSensitivityText').val(h3Val);
                    }else if(result[1].startsWith('Settings.PostprocessingQuality')){
                        $('#'+result[0]).val(setValue);
                        if($('#sTextureResolution').val() == setValue && $('#sTextureFiltering').val() == setValue && $('#sLightningQuality').val() == setValue && $('#sEffectsQuality').val() == setValue && $('#sShadowQuality').val() == setValue && $('#sDetailsLevel').val() == setValue && $('#sPostprocessing').val() == setValue){
                            $('#sQualityPreset').val(setValue);
                        }else{
                            $('#sQualityPreset').val('custom');
                        }
                    }else{
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
                        if($('#'+result[0]).hasClass('hasTiny') || $('#'+result[0]).hasClass('hasEdit')){
                            if(setValue.isFloat){
                                $('#'+result[0]+'Text').val(parseFloat(setValue.toFixed(3)));
                            }else{                            
                                $('#'+result[0]+'Text').val(setValue);
                            }
                        }
                    }
                };
            });
        }
    })
}

function switchPage(pageHash, isCancel = false){
    if(!isCancel)
        dew.playSound("x_button");
    
    itemNumber = 0;
    location.href=pageHash;
    activePage=pageHash;    
    if(hasGP){
        updateSelection(0, true, true, true);
    }
    if(subPages.indexOf(pageHash) != -1){
        $('#cancelButtonText').text('Back');
    }else{
        if(changeArray.length || bindChangeArray.length){
            $('#cancelButtonText').text('Cancel');
        }else{
            $('#cancelButtonText').text('Close');
        }
    }
    initGamepad();
}

function editControls(which){
    if(which == 0){
        switchPage('#page5');
    }else{
        switchPage('#page8');
    }
}

function applySettings(){
	var mainmenuChanged = false;
	let voipReload = false;
	for(var i = 0; i < changeArray.length; i++){
		if(changeArray[i][0] == "Game.MainMenuMod")
			mainmenuChanged = true;
		
        if(changeArray[i][0] == "VoIP.MicrophoneID" ||
            changeArray[i][0] == "VoIP.AGC" ||
            changeArray[i][0] == "VoIP.NoiseSupress" ||
            changeArray[i][0] == "VoIP.EchoCancelation"){
            voipReload = true;
        }
        
		dew.command(changeArray[i][0] + ' "' + changeArray[i][1] + '"', {}).then(function(){
        }).catch(function (error){
            console.error(error);
        });
	}

	dew.notify("settings-update", changeArray);
	changeArray = [];
	dew.command('writeconfig');
	dew.command('VoIP.Update').then(function(){
		if(voipReload)
			dew.notify('voip-reload');
	});
	if(subPages.indexOf(activePage) != -1){
		$('#cancelButtonText').text('Back');
	}else{
		$('#cancelButtonText').text('Close');
	}
	$('#applyButton').hide();
	initGamepad();
	
	if(mainmenuChanged)
		cancelButton();
}

function applyBindChanges(i){
    if(i != bindChangeArray.length){    
        if (bindChangeArray[i][1] == "Back") { bindChangeArray[i][1] = "Select"; }
        if (bindChangeArray[i][1]) { bindChangeArray[i][1] = "\"" + bindChangeArray[i][1] + "\""; }
        dew.command("Input.ControllerAction \"" + bindChangeArray[i][0] + "\" " + bindChangeArray[i][1], {}).then(function(){
            i++;
            applyBindChanges(i);            
        }).catch(function (error){
            console.error(error);
            i++;
            applyBindChanges(i);  
        });
    }else{
        bindChangeArray = [];
        dew.command('writeconfig');
        if(subPages.indexOf(activePage) != -1){
            $('#cancelButtonText').text('Back');
        }else{
            $('#cancelButtonText').text('Close');
        }
        initGamepad();
    }
}

function applyButton(){
    dew.playSound("a_button");
    if(window.location.hash == '#page5'){
        applyBinds();
        switchPage('#page2', true); 
        if(!changeArray.length && !bindChangeArray.length){
            $('#applyButton').hide();
        }
    }else if(window.location.hash == '#page4'){
        applySettings();
        switchPage('#page3', true);     
    }else if(window.location.hash == '#page11'){ 
        switchPage('#page8', true);        
    }else{
        if(changeArray.length || bindChangeArray.length){
            applySettings(); 
            applyBindChanges(0);              
        }else{
            effectReset();
        }
    }
}

function resetButton(){
	if(window.location.hash == '#page5' || window.location.hash == '#page8' || window.location.hash == '#page9')
	{
        dew.playSound("x_button");
		dew.dialog('confirm_reset_bindings').then(function(result){
			if(result == "yes"){
				dew.command('Input.ResetBindings').then(function(){
					initializeBindings(); 
				});
			}
		});
	}
	else
	{
        dew.playSound("x_button");
		dew.dialog('confirm_reset').then(function(result){
			if(result == "yes"){
				dew.command('Settings.Reset').then(function(){
					setControlValues();
					initGamepad();
				});
			}
		});
	}
}

function cancelButton(){
    if(window.location.hash == '#page5'){
        initializeBindings(); 
        dew.playSound("b_button");
        switchPage('#page2', true); 
        $('#cancelButtonText').text('Close');
        if(!changeArray.length){
            $('#applyButton').hide();
        }
    }else if(window.location.hash == '#page4'){
        setControlValues();      
        dew.playSound("b_button");
        switchPage('#page3', true);
    }else if(window.location.hash == '#page9'){
        dew.playSound("b_button");
        switchPage('#page8', true);
    }else if(window.location.hash == '#page8'){
        dew.playSound("b_button");
        switchPage('#page2', true);
    }else if(window.location.hash == '#page11'){
        dew.playSound("b_button");
        switchPage('#page8', true);
    }else if(changeArray.length || bindChangeArray.length){
        dew.playSound("a_button");
        dew.dialog("unapplied_settings").then(result => {
            if (result === 'ok') {
                dismissButton();
            }
        });
    }else{
        itemNumber = 0;
        effectReset();
    }
}

function dismissButton(){
    itemNumber = 0;
    hideScreen();
    setControlValues();
    changeArray = [];
    if(bindChangeArray.length){
        initializeBindings();
        bindChangeArray = [];
    }
    $('#applyButton').hide();
}

function selectButton() {
    if($('#'+selectedItem)[0].computedRole === 'slider'){
        $('#'+selectedItem).parent().prev().click();
    }else
    if($('#'+selectedItem).prev()[0].computedRole === 'button'){
        $('#'+selectedItem).prev().click();
    }else{
        toggleSetting();
    }
}


function effectReset(){
    playSound = false;
    dew.playSound('b_button');
    hideScreen();
    playSound = true;
}

function applyBinds(){
    for(i=0; i<$('#bindBox tbody tr').length; i++){
        var attr = $('#bindBox tbody tr').eq(i).attr('data-action');
        if (typeof attr !== typeof undefined){
            var action = $('#bindBox tbody tr').eq(i).attr('data-action');
            var primaryKey = $('#bindBox tbody tr').eq(i).find('input').eq(0).val();
            var secondaryKey = $('#bindBox tbody tr').eq(i).find('input').eq(1).val();
            dew.command('Input.KeyboardAction ' + action + ' ' + primaryKey + ' ' + secondaryKey);
        }
    }
    dew.command('writeconfig');
}

function setOptionList(ElementID, ArrayVar){
    var sel = document.getElementById(ElementID);
    sel.innerHTML = '';
    for(var i = 0; i < ArrayVar.length; i++){
        var opt = document.createElement('option');
        opt.textContent = ArrayVar[i][0];
        opt.value = ArrayVar[i][1];
        sel.appendChild(opt);
    }
}

function applyBindString(bindString){
    var bindArray = new Array(bindString.split(','));
    for (i = 0; i < bindArray[0].length; i++) { 
        $('#'+binds[i][0]).val(bindArray[0][i]);
        queueBindChange([binds[i][0],bindArray[0][i]])
    }
    updateBindLabels();
}

function initializeBindings(){
    dew.command("Input.DumpBindingsJson", {}).then(function(response){
        $('#bindBox tbody').empty();
        $('#bindBox tbody').each(function(i, e){
            if(i > 0)
                $(this).append('<tr style="height: 2.5vh"><th colspan="3"></th></tr>');
        });
        var bindDump = JSON.parse(response);
        for (i = 0; i < bindDump.length; i++){
            if(bindDump[i].controllerButton=="Select"){
                bindDump[i].controllerButton="Back";
            }
            $('#'+bindDump[i].actionName).val(bindDump[i].controllerButton);
            $.grep(binds, function(result, index){   
                if(result){
                if(result[0] == bindDump[i].actionName){            
                    var primaryBind = bindDump[i].primaryKey;
                    if(bindDump[i].primaryMouseButton != 'none'){
                        primaryBind = bindDump[i].primaryMouseButton;
                    }
                    var secondaryBind = bindDump[i].secondaryKey;
                    if(bindDump[i].secondaryMouseButton != 'none'){
                        secondaryBind = bindDump[i].secondaryMouseButton;
                    }
                    $('#bindBox .'+result[2]).append($('<tr data-action="'+result[0]+'"><td>'+result[1]+'</td><td><input class="keybind" value='+primaryBind+' data-initialvalue='+primaryBind+'></td><td><input class="keybind" value='+secondaryBind+' data-initialvalue='+secondaryBind+'></td></tr>'))
                }
                }
            })
        }
        
        updateBindLabels();
        getCurrentBindString();

        $('.keybind').attr('spellcheck', 'false');
        $('.keybind').attr('tabIndex', -1);
		
        dew.on('mouse-xbutton-event', function(m){
            if(!document.activeElement.classList.contains('keybind'))
                return;

            if(m.data.xbutton == 1){
                document.activeElement.value = 'Mouse4';
            }else{
                document.activeElement.value = 'Mouse5';
            }; 
            document.activeElement.blur();
        });

        $('.keybind').on('focus blur', function(e){
            var this_ = $(this);

            function keyHandler(e){
                e.preventDefault();
                e.stopPropagation();

                // not escape
                if(e.keyCode == 27){
					preventCancel = true;
                    if(this_.data('initialvalue') ){
                        if(this_.data('initialvalue')  == this_.val()){
                            this_.val('none');
                        }else{
                            this_.val(this_.data('initialvalue') );
                        }
                    }
                    this_.blur();
                    return;
                }

                // A-Z, 0-9
                if((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 48 && e.keyCode < 58))
                    this_.val( String.fromCharCode(e.keyCode));

                if(e.keyCode >= 96 && e.keyCode <=105)
                    this_.val('Numpad'+String(parseInt(e.keyCode)-96))
                
                switch(e.keyCode){
                    case 8: 
                        this_.val('Back'); 
                    break;
                    case 9: 
                        this_.val('Tab'); 
                    break;
                    case 13:
                        if(e.originalEvent.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD){
                            this_.val('NumpadEnter');
                        }else{
                            this_.val('Enter');
                        }
                    break;
                    case 16: 
                        if(e.originalEvent.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT){
                           this_.val('LShift'); 
                        }else{
                           this_.val('RShift'); 
                        }   
                    break
                    case 17:
                        if(e.originalEvent.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT){
                           this_.val('LControl'); 
                        }else{
                           this_.val('RControl'); 
                        }   
                    break;
                    case 18:
                        if(e.originalEvent.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT){
                           this_.val('LAlt'); 
                        }else{
                           this_.val('RAlt'); 
                        }  
                    break;
                    case 20: 
                        this_.val('CapsLock'); 
                    break;
                    case 32: 
                        this_.val('Space'); 
                    break;
                    case 37: 
                        this_.val('Left'); 
                    break;
                    case 38: 
                        this_.val('Up'); 
                    break;
                    case 39: 
                        this_.val('Right'); 
                    break;
                    case 40: 
                        this_.val('Down'); 
                    break;
                    case 46: 
                        this_.val('Delete'); 
                    break;
                    case 106: 
                        this_.val('Multiply'); 
                    break;
                    case 107: 
                        this_.val('Add'); 
                    break;
                    case 109: 
                        this_.val('Subtract'); 
                    break;
                    case 110: 
                        this_.val('Decimal'); 
                    break;
                    case 111: 
                        this_.val('Divide'); 
                    break;
                    case 186: 
                        this_.val('Colon'); 
                    break;
                    case 187: 
                        this_.val('Plus'); 
                    break;
                    case 188: 
                        this_.val('Comma'); 
                    break;
                    case 189: 
                        this_.val('Minus'); 
                    break;
                    case 190: 
                        this_.val('Period'); 
                    break;
                    case 191: 
                        this_.val('Question'); 
                    break;
                    case 219: 
                        this_.val('LBracket'); 
                    break;
                    case 220: 
                        this_.val('Pipe'); 
                    break;
                    case 221: 
                        this_.val('RBracket'); 
                    break;
                    case 222: 
                        this_.val('Quote'); 
                    break;
                    default:
                        //console.log(e.keyCode);
                }
                this_.blur();
            };

            function mouseHandler(e){
                e.preventDefault();
                e.stopPropagation();
                if(e.type == 'mousewheel'){
                    
                    if(e.originalEvent.wheelDelta > 0){
                        this_.val('MouseWheelUp');
                    }else{
                        this_.val('MouseWheelDown');
                    }
                }
                else if(e.type == 'mousedown'){
                    switch(e.which){
                        case 1:
                            this_.val('MouseLeft');
                        break;
                        case 2:
                            this_.val('MouseMiddle');
                        break;
                        case 3:
                            this_.val('MouseRight');
                            rightclickKeybind = true;
                        break;
                        default:
                            this_.val('Mouse' + e.which);
                    }
                }
                this_.blur();

                return false;
            };

            var $doc = $(document);
            if(e.type == 'focus'){
                $doc.on('mousedown.rebind', mouseHandler);
                $doc.on('mousewheel.rebind', mouseHandler);
                $doc.on('keydown.rebind', keyHandler);
            }else{
                $doc.off('keydown.rebind');
                $doc.off('mousedown.rebind');
                $doc.off('mousewheel.rebind');
            }
        });
        $('.keybind').on('blur', function(e){
            $('#cancelButtonText').text('Cancel');
            $('#applyButton').show();
        });
    });
}

function updateBindLabels(){
    $('#controllerGraphic').children('div').empty();
    for (i = 0; i < binds.length-8; i++) { 
        var bind = document.getElementById(binds[i][0]).value;
        var action = binds[i][1];
        if(document.getElementById(bind)){
            var actionString = action;
            if(document.getElementById(bind).innerHTML.length > 0){
                actionString = ", " + action;
            }
            $("#" + bind).append(actionString);
        }
    }
}

function getCurrentBindString(){
    var currentBinds = "";
    for(var i = 0; i < binds.length-8; i++) {
        if($('#'+binds[i][0]).val()){
            currentBinds += $('#'+binds[i][0]).val() + ",";
        }else{
            currentBinds += ",";
        }
    }
    //console.log(currentBinds.slice(0, -1));
    $("#presetMenu").val(currentBinds.slice(0, -1));
}

function setButtonLists(){
    for(var i = 0; i < binds.length-8; i++) {
        var sel = document.getElementById(binds[i][0]);
        for(var x = 0; x < buttons.length; x++) {
            var opt = document.createElement('option');
            opt.textContent = buttons[x];
            opt.value = buttons[x];
            sel.appendChild(opt);
        }
    }
}

function updateSelection(item, sound, move, controller){
    if(controller){
        $('.selectedElement').removeClass('selectedElement');
        $(activePage + ' label:visible').eq(item).parent().addClass('selectedElement');
    }
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

function prevPage(){
    if(tabIndex > 0){
        $('.tabs li:visible a').eq(tabIndex-1).click();
    }        
}

function nextPage(){
    var tabLength = $('.tabs li').length-1;
    if(tabIndex < tabLength){
        $('.tabs li:visible a').eq(tabIndex+1).click();
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
        if(parseFloat(document.getElementById(selectedItem).value) > document.getElementById(selectedItem).min){
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
        if(parseFloat(document.getElementById(selectedItem).value) < document.getElementById(selectedItem).max){
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

function queueChange(changeBlock){
    $('#cancelButtonText').text("Cancel");
    $('#applyButton').show();
    $.grep(changeArray, function(result, index){
        if(result){
            if(result[0] == changeBlock[0]){
                changeArray.splice(index,1);
            };
        }
    });
    changeArray.push(changeBlock);
}

function queueBindChange(changeBlock){
    $('#cancelButtonText').text("Cancel");
    $('#applyButton').show();
    $.grep(bindChangeArray, function(result, index){
        if(result){
            if(result[0] == changeBlock[0]){
                bindChangeArray.splice(index,1);
            };
        }
    });
    bindChangeArray.push(changeBlock);
}

Number.prototype.isFloat = function() {
    return (this % 1 != 0);
}
