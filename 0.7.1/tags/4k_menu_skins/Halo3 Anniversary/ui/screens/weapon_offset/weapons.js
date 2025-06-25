var selectedItem;
var itemNumber = 0;
var tabIndex = 0;
var hasGP = false;
var axisThreshold = .5;
var stickTicks = { left: 0, right: 0, up: 0, down: 0 };
var repGP;
var lastHeldUpdated = 0;
var currentWeaponType = "";

$(document).keyup(function (e) {
    if (e.keyCode === 27) {
        closeWindow();
    }
});
$(document).keydown(function (e) {
    if(e.keyCode == 192 || e.keyCode == 112 || e.keyCode == 223){
        dew.show("console");
    }
    if(e.keyCode == 38){ //Up
        e.preventDefault();
        upNav();
    }
    if(e.keyCode == 40){ //Down
        e.preventDefault();
        downNav();
    }
    if(e.keyCode == 37){ //Left
        e.preventDefault();
        leftToggle();
    }
    if(e.keyCode == 39){ //Right
        e.preventDefault();
        rightToggle();
    }
    if (e.keyCode === 9) { //disable tab
        e.preventDefault();
    }
});

function closeWindow() {
	dew.command('Weapon.JSON.Load '+ $('#wOffsetConfigList').val());
    dew.playSound("b_button");
    dew.hide();
}

$(document).ready(function() {
    initGamepad();
        
    $(".item").off('mouseover').on('mouseover', function(){
        itemNumber = $('.item').index($(this));
        updateSelection(itemNumber, false);
    });
    
    $('input[type=range]').on('input', function(){
        var newID = $(this).attr('id') + 'Text';
        $('#'+newID).val($(this).val() * -1);

    });
    $('.tinySetting').on('change', function(){
        var newID = $(this).attr('id');
        if(newID.endsWith('Text')){
            newID = newID.slice(0, -4);
        }
        $('#'+newID).val($(this).val() * -1);
        $('#'+newID).trigger('change');
    });
    $('#newButton').off('click').on('click', function(){
        dew.playSound("a_button");
        dew.dialog('new_weapon_offset').then(function(result){
			if(result != "" && result != "cancel"){
				dew.command("Weapon.Json.New " + result).then(function(saveResult) {
					if(saveResult === "Config Already Exists"){
						dew.dialog('weapon_offset_exists');
					}
					if(saveResult === "Weapons offset config saved successfully."){
						initializeWeaponOffsetList();
					}
				});
			}
		});
    });
	$('#deleteButton').off('click').on('click', function(){
        dew.playSound("x_button");
		dew.dialog('weapon_offset_delete', { body: 'Are you sure you want to delete the weapon offset config named: '+ $('#wOffsetConfigList').val() }).then(result => {
			if(result === "yes"){
				dew.command("Weapon.Json.Delete " + $('#wOffsetConfigList').val()).then(function(deleteResult) {
					if(deleteResult === "Weapons offset deleted successfully."){
						initializeWeaponOffsetList();
					}
					if(deleteResult === "Failed to delete weapon offiset config file.")
					{
						dew.dialog('weapon_offset_delete_error');
					}
				});
			}
		});
    });
    $('#saveButton').off('click').on('click', function(){
        dew.playSound("a_button");
		dew.dialog('confirm_save_weapon_offset').then(function(result){
			if(result == "yes"){
				dew.command('Weapon.JSON.Save');
			}
		});
    });
    $('#resetButton').off('click').on('click', function(){
        dew.playSound("x_button");
		dew.dialog('confirm_reset_weapon_offset').then(function(result){
			if(result == "yes"){
				dew.command('Weapon.Offset.Reset '+currentWeaponType, {}).then(function(){ 
					resetEquipped();
				});
			}
		});
    });
    $('#closeButton').off('click').on('click', function(){
         closeWindow();
    });
    $('#weaponI, #weaponJ, #weaponK').on('input change', function(){
        dew.command('Weapon.Offset ' + currentWeaponType + ' ' +$('#weaponIText').val() + ' ' +$('#weaponJText').val() + ' ' +$('#weaponKText').val());
    });
	
    $('#wOffsetConfigList').on('click', function(e){
        e.preventDefault();
    });
    
	$('#wOffsetConfigList').on('change', function(){
		setInputsDisabled($('#wOffsetConfigList').val() === "default");
        dew.command('Weapon.JSON.Load '+ $('#wOffsetConfigList').val(), {}).then(function(){ 
            displayOffset(currentWeaponType);
            dew.playSound("a_button");
        });
    });
    
    setButtons();
});

function displayOffset(weapon){
    dew.command('Weapon.Offset ' + weapon, {}).then(function(response){
		var weaponInfo = JSON.parse(response);
        var offsets = response.split(currentWeaponType + ', I: ')[1];
        $('#weaponI').val(weaponInfo.FirstPersonWeaponOffset[0] * -1);
        $('#weaponIText').val(parseFloat(weaponInfo.FirstPersonWeaponOffset[0]).toFixed(3));
        $('#weaponJ').val(weaponInfo.FirstPersonWeaponOffset[1] * -1);
        $('#weaponJText').val(parseFloat(weaponInfo.FirstPersonWeaponOffset[1]).toFixed(3));
        $('#weaponK').val(weaponInfo.FirstPersonWeaponOffset[2] * -1);
        $('#weaponKText').val(parseFloat(weaponInfo.FirstPersonWeaponOffset[2]).toFixed(3));
    });   
}

function resetEquipped(){
    dew.command('Weapon.Equipped', {}).then(function(response){
        var weaponInfo = JSON.parse(response);
		currentWeaponType = weaponInfo.Type;
        $('#weaponTypeName').text(weaponInfo.DisplayName);
        $('#weaponI').val(weaponInfo.FirstPersonWeaponOffset[0] * -1);
        $('#weaponIText').val(parseFloat(weaponInfo.FirstPersonWeaponOffset[0]).toFixed(3));
        $('#weaponJ').val(weaponInfo.FirstPersonWeaponOffset[1] * -1);
        $('#weaponJText').val(parseFloat(weaponInfo.FirstPersonWeaponOffset[1]).toFixed(3));
        $('#weaponK').val(weaponInfo.FirstPersonWeaponOffset[2] * -1);
        $('#weaponKText').val(parseFloat(weaponInfo.FirstPersonWeaponOffset[2]).toFixed(3));
    });
}

function initGamepad(){
    dew.command('Settings.Gamepad', {}).then(function(result){
        if(result == 1){
            hasGP = true;
            if(!repGP){
                repGP = window.setInterval(checkGamepad,1000/60);
            }
            onControllerConnect();
        }else{
            onControllerDisconnect();
            hasGP = false;
            if(repGP){
                window.clearInterval(repGP);
                repGP = null;
            }
        }
    });
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
    if(stickTicks.left == 1 || (shouldUpdateHeld && stickTicks.left > 25)){
        leftToggle();
    }
    if(stickTicks.right == 1 || (shouldUpdateHeld && stickTicks.right > 25)){
        rightToggle();
    }
};

function updateSelection(item){
    $('.selectedElement').removeClass("selectedElement");
    $("#weaponOffsets span").eq(item).addClass('selectedElement');
    selectedItem = $('#weaponOffsets span').eq(itemNumber).find('.setting').attr('id');
}

function upNav(){
    if(itemNumber > 0){
        itemNumber--;
        updateSelection(itemNumber);
        dew.playSound("vertical_navigation");
    }
}

function downNav(){
    if(itemNumber < $('#weaponOffsets span').length-1){
        itemNumber++;
        updateSelection(itemNumber);
        dew.playSound("vertical_navigation");    
    }   
}

function leftToggle(){
    if(document.getElementById(selectedItem).computedRole == "combobox"){
        var elementIndex = $('#'+selectedItem+' option:selected').index();
        if(elementIndex > 0){
            var newElement = elementIndex - 1;
            $('#'+selectedItem+' option').eq(newElement).prop('selected', true);
        }
    }
    
    if(document.getElementById(selectedItem).computedRole == "slider"){
        var sliderElement = document.getElementById(selectedItem);
        if (sliderElement.disabled) {
            dew.playSound("error");
            return;
        }
        dew.playSound('a_button');
        sliderElement.stepDown();
        document.querySelector('#'+selectedItem +'Text').value = sliderElement.value * -1;
    }   
    if(document.getElementById(selectedItem).computedRole == "combobox" || document.getElementById(selectedItem).computedRole == "slider"){
        $('#'+selectedItem).trigger('change');
    }    
}

function rightToggle(){
    if(document.getElementById(selectedItem).computedRole == "combobox"){
        var elementIndex = $('#'+selectedItem+' option:selected').index();
        var elementLength = $('#'+selectedItem).children('option').length;
        if(elementIndex < elementLength){
            var newElement = elementIndex + 1;
            $('#'+selectedItem+' option').eq(newElement).prop('selected', true);

        }
    }
    if(document.getElementById(selectedItem).computedRole == "slider"){
        var sliderElement = document.getElementById(selectedItem);
        if (sliderElement.disabled) {
            dew.playSound("error");
            return;
        }
        dew.playSound('a_button');
        sliderElement.stepUp();
        document.querySelector('#'+selectedItem +'Text').value = sliderElement.value * -1;
    }        
    if(document.getElementById(selectedItem).computedRole == "combobox" || document.getElementById(selectedItem).computedRole == "slider"){
        $('#'+selectedItem).trigger('change');
    }
}

function setButtons(){
    $("#newButton img").attr("src","dew://assets/buttons/360_Back.png");
    $("#deleteButton img").attr("src","dew://assets/buttons/360_Y.png");
    $("#resetButton img").attr("src","dew://assets/buttons/360_X.png");
    $("#saveButton img").attr("src","dew://assets/buttons/360_A.png");
    $("#closeButton img").attr("src","dew://assets/buttons/360_B.png");
    $('#buttonBar img').show();
}

function onControllerConnect(){
    updateSelection(itemNumber); 
}

function onControllerDisconnect(){
    $('.selected').removeClass();
} 

function initializeWeaponOffsetList(){
	dew.command('Weapon.JSON.List', {}).then(function(response) {
		var offsetArray = [];
		var offsets = response.split(',');
		for (i = 0; i < offsets.length; i++){
			if(offsets[i].indexOf(" ") == -1){
				offsetArray.push([offsets[i],offsets[i]]);
			}
		}
		setOptionList('wOffsetConfigList', offsetArray);

		dew.command('Weapon.JSON.File', {}).then(function(response){
			setInputsDisabled(response === "default");
			$('#wOffsetConfigList').val(response);
		});
	});

	dew.command('Weapon.Equipped', {}).then(function(response){
		var weaponInfo = JSON.parse(response);
		currentWeaponType = weaponInfo.Type;
		$('#weaponTypeName').text(weaponInfo.DisplayName);
		$('#weaponI').val(weaponInfo.FirstPersonWeaponOffset[0] * -1);
		$('#weaponIText').val(parseFloat(weaponInfo.FirstPersonWeaponOffset[0]).toFixed(3));
		$('#weaponJ').val(weaponInfo.FirstPersonWeaponOffset[1] * -1);
		$('#weaponJText').val(parseFloat(weaponInfo.FirstPersonWeaponOffset[1]).toFixed(3));
		$('#weaponK').val(weaponInfo.FirstPersonWeaponOffset[2] * -1);
		$('#weaponKText').val(parseFloat(weaponInfo.FirstPersonWeaponOffset[2]).toFixed(3));
	});	
}

dew.on("show", async function(e){
	var notSupported = false;
	await dew.command('Weapon.Equipped', {}).then(function(response){
		var weaponInfo = JSON.parse(response);
		if(weaponInfo.Type === ""){
			dew.playSound('error');
			dew.hide();
			notSupported = true;
		}
	});
	if(notSupported)
		return;
	
	initializeWeaponOffsetList();
	
    dew.command('Settings.Gamepad', {}).then(function(result){
        if(result == 1){
            onControllerConnect();
            hasGP = true;
        }else{
            onControllerDisconnect();
            hasGP = false;
        }
    });

	dew.command('Game.unpause');
});

dew.on('controllerinput', function(e){       
    if(hasGP){
		if(e.data.Select == 1){
			$('#newButton').click();
		}
        if(e.data.Y == 1){
            $('#deleteButton').click();
        }
        if(e.data.B == 1){
            closeWindow();  
        }
        if(e.data.X == 1){
            $('#resetButton').click(); 
        }
        if(e.data.A == 1){
            $('#saveButton').click();
        }
        if(e.data.Up == 1){
            upNav();  
        }
        if(e.data.Down == 1){
            downNav();
        }
        if(e.data.Left == 1){
            leftToggle()
        }
        if(e.data.Right == 1){
            rightToggle(); 
        }
       if(e.data.AxisLeftX > axisThreshold){
            stickTicks.right++;
        }else{
            stickTicks.right = 0;
        }
        if(e.data.AxisLeftX < -axisThreshold){
            stickTicks.left++;
        }else{
            stickTicks.left = 0;
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
    }
});

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

function setInputsDisabled(disabled){
	if(disabled){
		$('input').prop('disabled', true).addClass("disabled");
		$("#resetButton").prop('disabled', true).addClass("disabled");
		$("#deleteButton").prop('disabled', true).addClass("disabled");
		$("#saveButton").prop('disabled', true).addClass("disabled");
	}
	else{
		$('input').prop('disabled', false).removeClass("disabled");
		$("#resetButton").prop('disabled', false).removeClass("disabled");
		$("#deleteButton").prop('disabled', false).removeClass("disabled");
		$("#saveButton").prop('disabled', false).removeClass("disabled");
	}
}