let items = [];
let widgetType = 0;
let widgetStyle = {};
let emoteContainer = document.getElementById('emote-widget-container');
let emoteWheel = document.getElementById('emoteWheel');
let svgElem = document.createElement("svg");
emoteWheel.appendChild(svgElem);
let emoteGrid = document.getElementById('emoteGrid');
let wheelRadius = 250;
let controllerbind = "";
let keyboardbinds = [];
let initalKeyboardKey = false;
let initalControllerKey = false;
let maxEmoteCount = 20;
let hasGP = false;
var currentPosition = [ 0, 0 ];


function renderWheel(items, radius, iconSize) {
    const innerScale = 2.2;

    let svg = "";
    let slices = items.length;

    if(slices == 1){
        const p1 = {
            x: Math.cos(Math.PI * 2 / 4 * 3 - Math.PI) * radius + radius,
            y: Math.sin(Math.PI * 2 / 4 * 3 - Math.PI) * radius + radius
        };
        const p2 = {
            x: Math.cos(Math.PI * 2 / 4 * (1.9999 + 1) - Math.PI) * radius + radius,
            y: Math.sin(Math.PI * 2 / 4 * (1.9999 + 1) - Math.PI) * radius + radius
        };
        const p4 = {
            x: Math.cos(Math.PI * 2 / 4 * 3 - Math.PI) * (radius / innerScale) + radius,
            y: Math.sin(Math.PI * 2 / 4 * 3 - Math.PI) * (radius / innerScale) + radius
        };
        const p3 = {
            x: Math.cos(Math.PI * 2 / 4 * (1.9999 + 1) - Math.PI) * (radius / innerScale) + radius,
            y: Math.sin(Math.PI * 2 / 4 * (1.9999 + 1) - Math.PI) * (radius / innerScale) + radius
        };
        
        svg += `<path d='M ${p1.x} ${p1.y} A ${radius} ${radius} 0 1 1 ${p2.x} ${p2.y}` +
            `L ${p3.x} ${p3.y} A ${radius / innerScale} ${radius / innerScale} 0 1 0 ${p4.x} ${p4.y} z'` +
            `class='emote-item' data-index="${0}" />`;
            
        const p5 = {
            x: Math.cos(Math.PI * 2 / 2 * 0 - Math.PI + Math.PI / 2) * radius / 1.38 + radius,
            y: Math.sin(Math.PI * 2 / 2 * 0 - Math.PI + Math.PI / 2) * radius / 1.38 + radius
        };
        svg += `
            <g transform = "translate(${-iconSize / 2}, ${-iconSize / 2})">
                <image class="emote-icon" x="${p5.x}" y="${p5.y}" width="${iconSize}" height="${iconSize}"/>
            </g>
        `
    }else {
        for (let i = 0; i < slices; i++) {
            const p1 = {
                x: Math.cos(Math.PI * 2 / slices * i - Math.PI) * radius + radius,
                y: Math.sin(Math.PI * 2 / slices * i - Math.PI) * radius + radius
            };

            const p2 = {
                x: Math.cos(Math.PI * 2 / slices * (i + 1) - Math.PI) * radius + radius,
                y: Math.sin(Math.PI * 2 / slices * (i + 1) - Math.PI) * radius + radius
            };

            const p4 = {
                x: Math.cos(Math.PI * 2 / slices * i - Math.PI) * (radius / innerScale) + radius,
                y: Math.sin(Math.PI * 2 / slices * i - Math.PI) * (radius / innerScale) + radius
            };

            const p3 = {
                x: Math.cos(Math.PI * 2 / slices * (i + 1) - Math.PI) * (radius / innerScale) + radius,
                y: Math.sin(Math.PI * 2 / slices * (i + 1) - Math.PI) * (radius / innerScale) + radius
            };
            
            svg += `<path d='M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 1 ${p2.x} ${p2.y}` +
                `L ${p3.x} ${p3.y} A ${radius / innerScale} ${radius / innerScale} 0 0 0 ${p4.x} ${p4.y} z'` +
                `class='emote-item' data-index="${i}" />`;
        }

        for (var i = 0; i < slices; i++) {
            const p5 = {
                x: Math.cos(Math.PI * 2 / slices * i - Math.PI + Math.PI / slices) * radius / 1.38 + radius,
                y: Math.sin(Math.PI * 2 / slices * i - Math.PI + Math.PI / slices) * radius / 1.38 + radius
            };
            svg += `
                <g transform = "translate(${-iconSize / 2}, ${-iconSize / 2})">
                    <image class="emote-icon" x="${p5.x}" y="${p5.y}" width="${iconSize}" height="${iconSize}"/>
                </g>
            `
        }
    }

	
	svg += `<circle class="emote-wheel-border" cx="50%" cy="50%" r="250" />`; // outer border
	svg += `<circle class="emote-wheel-border" cx="50%" cy="50%" r="113" />`; // inner border
	
    return `<svg x="0px" y="0px" viewBox="0 0 ${radius * 2} ${radius * 2}">${svg}</svg>`;
}

function createGrid(items, cellSize) {
    const itemCount = items.length;
    const { rows, cols } = calculateRowsAndColumns(itemCount);
    
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    gridContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    gridContainer.style.placeItems = 'center';

    const borderSize = 1;
    const totalBorderSize = borderSize
    const cellSizeWithBorder = cellSize - totalBorderSize + (borderSize * 2);

    let itemIndex = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if(itemIndex >= itemCount)
                break
            
            const item = items[itemIndex]
            let title = "";

            let hasName = false;
            if(item !== undefined && item.title !== "")
                hasName = true;
            
            const cell = document.createElement('div');
            cell.style.setProperty('--border-width', borderSize + 'px');
            cell.style.width = `${cellSizeWithBorder}px`;
            cell.style.height = `${cellSizeWithBorder}px`;
            cell.dataset.index = itemIndex;
            cell.dataset.position = `${i}-${j}`;
            cell.className = 'emote-cell';
            const image = document.createElement('img');
            image.className = "emote-icon";
            image.style.width = `${cellSize-(hasName ? 20 : 10)}px`;
            image.style.height = `${cellSize-(hasName ? 20 : 10)}px`;
            image.src = '';
            cell.appendChild(image);
            
            if(hasName){
                const name = document.createElement('span');
                name.className = "emote-name";
                name.innerText = items[itemIndex].title;
                cell.appendChild(name);
            }
            gridContainer.appendChild(cell);
            itemIndex++;
        }
    }

    return gridContainer;
}


function selectEmote(index) {
    if(widgetType == 0){
        var itemElements = emoteWheel.querySelectorAll('.emote-item');
        for (let i = 0; i < itemElements.length; i++) {
            if (itemElements[i].classList.contains('selected'))
                itemElements[i].classList.remove('selected');
        }
    }
    if(widgetType == 1){
        var itemElements = emoteGrid.querySelectorAll('.emote-cell');
        for (let i = 0; i < itemElements.length; i++) {
            if (itemElements[i].classList.contains('selected'))
                itemElements[i].classList.remove('selected');
        }
    }

    dew.command('Player.Emote ' + items[index].index);
    dew.hide();
}
	
dew.on('show', async function (event) {
	if(widgetType == 1)
		currentPosition = [0,0];
    
	dew.command("Settings.gamepad").then(function(response){
		hasGP = response == 1;
	});
	keyboardbinds = [];
	controllerbinds = "";
    dew.command("Input.DumpBindingsJson", {}).then(function(response){
        var bindDump = JSON.parse(response);
        for (i = 0; i < bindDump.length; i++){
			if(bindDump[i].actionName == "Emote")
			{
				controllerbind = bindDump[i].controllerButton;
				keyboardbinds.push(bindDump[i].primaryKey);
				keyboardbinds.push(bindDump[i].secondaryKey);
			}
        }
	});
	
	initalKeyboardKey = true;
	initalControllerKey = true;
	
	items = [];
	widgetType = event.data.widgetType;
	widgetStyle = event.data.style;
	
	event.data.emotes.splice(maxEmoteCount); //Limit the maximum amount of emotes that can be displayed
	
	const emoteIcons = await fetchEmoteIcons(event.data.emotes);

	for(var emote = 0; emote < event.data.emotes.length; emote++){
		let emoteItem = event.data.emotes[emote];
		let url = emoteIcons[emote];
		let imageURL = "dew://assets/emblems/generic.png";
		if(url != "")
			imageURL = url;
		
		let item = {title: emoteItem.title, name: emoteItem.animationName, icon: imageURL, index: emoteItem.emoteIndex};
		items.push(item);
		
		//if the last emote has been set up then draw
		if(items.length >= event.data.emotes.length)
			drawSelector();
		
		if(hasGP && widgetType == 1){
			const emoteItems = document.querySelectorAll(`[data-position="0-0"]`);
			if(emoteItems.length > 0){
				let emoteItem = emoteItems[0];
				emoteItem.classList.add('selected');
			}
		}
	}
	
	// update the styling
	emoteContainer.style.setProperty('--background-color', pixel32ToCSSColor(widgetStyle.backgroundColor));
	emoteContainer.style.setProperty('--highlight-color', pixel32ToCSSColor(widgetStyle.highlightColor));
	emoteContainer.style.setProperty('--border-color', pixel32ToCSSColor(widgetStyle.borderColor));
	emoteContainer.style.setProperty('--text-color', pixel32ToCSSColor(widgetStyle.textColor));
});

function fetchEmoteIcons(emotes) {
	return Promise.all(emotes.map(emoteItem => {
		try {
			return dew.getAssetUrl("assets/emotes/"+emoteItem.iconName, { pak:"game", fileTypes:['jpg','png']});
		}
		catch(err) {
			return "";
		}
	}));
}

function drawSelector(){
	if(widgetType == 0){
		emoteWheel.style.display = "block";
		//draw wheel
		let iconSize = 100;
		if(items.length > 8)
			iconSize -= 4*(items.length - 8);//start scaling icons down if too many emotes
		
		svgElem.innerHTML = renderWheel(items, wheelRadius, iconSize);	
		let iconElements = emoteWheel.querySelectorAll('.emote-icon');
		for(let i = 0; i < items.length; i++)
			iconElements[i].setAttribute("href", items[i].icon);
		emoteWheel.classList.add("scale-up");
	}
	if(widgetType == 1){
        emoteGrid.style.display = "flex";
        //draw grid
        const grid = createGrid(items, 90);
        let iconElements = grid.querySelectorAll('.emote-icon');
		for(let i = 0; i < items.length; i++)
			iconElements[i].setAttribute("src", items[i].icon);
        emoteGrid.innerHTML = grid.outerHTML;
        emoteGrid.classList.add("scale-up");
	}
}

function pixel32ToCSSColor(argb) {
	const alpha = (argb >> 24) & 0xFF;
	const red = (argb >> 16) & 0xFF;
	const green = (argb >> 8) & 0xFF;
	const blue = argb & 0xFF;
	return `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
}

function calculateRowsAndColumns(itemCount) {
    const maxColumns = 5;
    const cols = Math.min(itemCount, maxColumns);
    const rows = Math.ceil(itemCount / cols);
    return { rows, cols };
}

function sanitize(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

dew.on('hide', function () {
    emoteWheel.classList.remove("scale-up");
    emoteWheel.style.transform = "scale(0)";
    
    emoteWheel.style.display = "none";
    emoteGrid.style.display = "none";
});

dew.on('controllerinput', function (e) {
	if(!hasGP)
		return;
	
    const axisThreshold = 8689 / 32767.0;
		
	if(e.data[controllerbind] == 0 && initalControllerKey) // key is up
	{
		initalControllerKey = false;
		let selectedElement = document.querySelector('.emote-item.selected');
		if(selectedElement)
		{
			let index = selectedElement.getAttribute('data-index');
			selectEmote(index);
		}
	}
	
	if(e.data[controllerbind] > 0 && !initalControllerKey) //key is down
	{
		dew.hide();
	}
	
	if(widgetType == 0){
		if (Math.abs(e.data.AxisLeftX) >= axisThreshold || Math.abs(e.data.AxisLeftY) >= axisThreshold) {

			let theta = Math.atan2(e.data.AxisLeftX, e.data.AxisLeftY) + Math.PI / 2;
			if (theta < 0) theta += 2 * Math.PI;
			let index = Math.floor(theta / (Math.PI * 2) * items.length);

			// unselect everything
			var itemElements = emoteWheel.querySelectorAll('.emote-item');
			for (let i = 0; i < itemElements.length; i++) {
				if (itemElements[i].classList.contains('selected'))
					itemElements[i].classList.remove('selected');
			}

			let itemElement = itemElements[index];
			if (itemElement)
				itemElement.classList.add('selected');
		}else
		if (Math.abs(e.data.AxisRightX) >= axisThreshold || Math.abs(e.data.AxisRightY) >= axisThreshold) {

			let theta = Math.atan2(e.data.AxisRightX, e.data.AxisRightY) + Math.PI / 2;
			if (theta < 0) theta += 2 * Math.PI;
			let index = Math.floor(theta / (Math.PI * 2) * items.length);

			// unselect everything
			var itemElements = emoteWheel.querySelectorAll('.emote-item');
			for (let i = 0; i < itemElements.length; i++) {
				if (itemElements[i].classList.contains('selected'))
					itemElements[i].classList.remove('selected');
			}

			let itemElement = itemElements[index];
			if (itemElement)
				itemElement.classList.add('selected');
		}
	}

    if (e.data.B === 1) {
        dew.hide();
    }
    else if (e.data.A === 1) {
        if(widgetType == 0){
            let selectedElement = document.querySelector('.emote-item.selected');
            if (selectedElement) {
                let index = selectedElement.getAttribute('data-index');
                selectEmote(index);
            }
        }
        if(widgetType == 1){
            let selectedElement = document.querySelector('.emote-cell.selected');
            if (selectedElement) {
                let index = selectedElement.getAttribute('data-index');
                selectEmote(index);
            }
        }
    }
});

dew.input.on('scroll', handleVirtualScroll);
dew.input.on('right_scroll', handleVirtualScroll);

function handleVirtualScroll(type, axis, value) {

    const itemCount = items.length;
    const { rows, cols } = calculateRowsAndColumns(itemCount);

    let tmpPosition = currentPosition.slice();
    
    if(axis === 0)
        tmpPosition[1] = currentPosition[1] + value;

    if(axis === 1)
        tmpPosition[0] = currentPosition[0] + value;
    
    let pos = `${tmpPosition[1]}-${tmpPosition[0]}`;
    
    const emoteItems = document.querySelectorAll(`[data-position="${pos}"]`);
    
    if(emoteItems.length > 0){
        let emoteItem = emoteItems[0];
    
        currentPosition = tmpPosition;
        
        // unselect everything
        var itemElements = emoteGrid.querySelectorAll('.emote-cell');
        for (let i = 0; i < itemElements.length; i++) {
            if (itemElements[i].classList.contains('selected'))
                itemElements[i].classList.remove('selected');
        }
        
        if (emoteItem)
            emoteItem.classList.add('selected');
    }
}

window.addEventListener('keydown', e => {
    if (e.key === 'Escape')
        dew.hide();
});

window.addEventListener("mousemove", e => {
	const baseScreen = document.getElementsByClassName('page_content')[0];
	const screenRect = baseScreen.getBoundingClientRect();
	const screenCenterX = screenRect.left + screenRect.width / 2;
	const screenCenterY = screenRect.top + screenRect.height / 2;
	const deltaX = (e.clientX - screenCenterX);
	const deltaY = -(e.clientY - screenCenterY);
	const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	let radius = Math.min(screenRect.width, screenRect.height) * 0.084;

	if(widgetType == 0){
		if (distance >= radius) {
			let theta = Math.atan2(deltaX, deltaY) + Math.PI / 2;
			if (theta < 0) theta += 2 * Math.PI;
			let index = Math.floor(theta / (Math.PI * 2) * items.length);

			// unselect everything
			var itemElements = emoteWheel.querySelectorAll('.emote-item');
			for (let i = 0; i < itemElements.length; i++) {
				if (itemElements[i].classList.contains('selected'))
					itemElements[i].classList.remove('selected');
			}

			let itemElement = itemElements[index];
			if (itemElement)
				itemElement.classList.add('selected');
		}else
		{
			var itemElements = emoteWheel.querySelectorAll('.emote-item');
			for (let i = 0; i < itemElements.length; i++) {
				if (itemElements[i].classList.contains('selected'))
					itemElements[i].classList.remove('selected');
			}
		}
	}
    
	if(widgetType == 1){
		let target = e.target;
		if(target.classList.contains('emote-cell')){
			var itemElements = emoteGrid.querySelectorAll('.emote-cell');
			for (let i = 0; i < itemElements.length; i++) {
				if (itemElements[i].classList.contains('selected'))
				itemElements[i].classList.remove('selected');
			}
			target.classList.add('selected');
		}
	}
});

window.addEventListener('mousedown', e => {
	if(e.button === 0)
	{
		if(widgetType == 0){
			let selectedElement = document.querySelector('.emote-item.selected');
			if (selectedElement) {
				let index = selectedElement.getAttribute('data-index');
				selectEmote(index);
			}
		}
		if(widgetType == 1){
			let selectedElement = document.querySelector('.emote-cell.selected');
			if (selectedElement) {
				let index = selectedElement.getAttribute('data-index');
				selectEmote(index);
			}
		}
	}else
	if(e.button === 2)
	{
		dew.hide();
	}
});

document.addEventListener('keyup', e => {
	if(isKeyboardBind(e.key) && initalKeyboardKey)
	{
		initalKeyboardKey = false;
        
		if(widgetType == 0){
			let selectedElement = document.querySelector('.emote-item.selected');
			if(selectedElement)
			{
				let index = selectedElement.getAttribute('data-index');
				selectEmote(index);
			}
		}
		if(widgetType == 1){
			let selectedElement = document.querySelector('.emote-cell.selected');
			if(selectedElement)
			{
				let index = selectedElement.getAttribute('data-index');
				selectEmote(index);
			}
		}
	}
});

document.addEventListener('keydown', e => {
	if(isKeyboardBind(e.key) && !initalKeyboardKey)
		dew.hide();
	
});

function isKeyboardBind(bind){
	for (let i = 0; i < keyboardbinds.length; i++) {
		if (keyboardbinds[i] === bind) {
			return true;
		}
	}
	return false;
}