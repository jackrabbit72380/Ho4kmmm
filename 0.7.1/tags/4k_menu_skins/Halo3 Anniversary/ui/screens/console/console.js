var inputHistory = [];
var selectedHistoryIndex = 0;
var commandList = {};
var suggestions = {};
var suggestionIndex = 0;

var eAutoCompleteMode = {
    Prefix : 1,
    Substring : 2,
    Fuzzy : 3
};

var consoleSize = 2;
var consoleDock = 1;
var consoleInvert = 1;
var consoleTransparency = 75;
var consoleOpacity = 100;
var consoleAutoCompleteMode = eAutoCompleteMode.Fuzzy;
var memoryUsageInterval = null;
var suggestionMaxCount = 100;
var maxConsoleHistory = 250;
var maxConsoleInputHistory = 25;

function isset(val) {
     return !!val;
}

function ifset(val, other) {
    return isset(val) ? val : other;
}

function htmlEncode(value) {
  return $('<div>').text(value).html();
}

function findPartialsMatch(matchArray) {
    var firstString = matchArray[0];
    if (matchArray.length > 1) {
        var partialString = "";
        var match = true;
        for (var i = 0, length = firstString.length; i < length; i++) {
            $.each(matchArray, function (key, value) {
                if (value.toLowerCase().indexOf(partialString.toLowerCase()) != 0) {
                    match = false;
                }
            });
            if (!match) {
                return partialString.slice(0, -1);
            }
            partialString += firstString[i];
        }
    }
    else {
        return firstString;
    }
}

function focusInput() {
    $("#command").focus();
}

function setInput(command) {
    $("#command").val(command);
    focusInput();
}

function clearInput() {
    $("#command").val("");
    focusInput();
}

function clearConsole() {
    $("#output-box").empty();
}

function resetConsole() {
    sizeConsole(2, true);
    dockConsole(1, true);
    invertConsole(1, true)
    transparencyConsole(85, true);
    opacityConsole(100, true);
    autoCompleteModeConsole(eAutoCompleteMode.Substring, true);
    clearConsole();
    clearInput();
}

function persistInputHistory() {
    localStorage.setItem("console.history", JSON.stringify(inputHistory));
}

function fetchInputHistory() {
    var historyJson = localStorage.getItem("console.history");
    if (historyJson) return JSON.parse(historyJson);
    else return [];
}


function pushInputHistory(command) {
    if (command != inputHistory[inputHistory.length - 1]) {

        while (inputHistory.length >= maxConsoleInputHistory)
            inputHistory.shift();

        inputHistory.push(command);
        persistInputHistory();
    }
}

function getInputHistory() {
    appendLine("debug-line", "History: {" + inputHistory + "}");
    appendLine("debug-line", "Count: " + inputHistory.length);
}

function selectInputHistoryIndex(direction) {
    if (selectedHistoryIndex + direction <= inputHistory.length && selectedHistoryIndex + direction >= 0) {
        selectedHistoryIndex = selectedHistoryIndex + direction;
        $("#command").val(inputHistory[selectedHistoryIndex]);
    }
}

function resetInputHistoryIndex() {
    selectedHistoryIndex = inputHistory.length;
}

function getConsoleHelp() {
    commands = [
        {
            "module": "",
            "name": "Variables",
            "shortName": "variables",
            "description": "Display all game variables with current values and a description",
            "defaultValue": null,
            "hidden": false,
            "arguments": []
        },
        {
            "module": "Console",
            "name": "Console.AutoCompleteMode",
            "shortName": "console_autocompletemode",
            "description": "Toggle between the Console auto complete modes. Options: 0, 1, 2, Prefix, or Substring. Setting it to 0 will toggle between Prefix and Substring modes",
            "value": consoleAutoCompleteMode,
            "defaultValue": eAutoCompleteMode.Substring,
            "hidden": false,
            "arguments": [
                "autocompletemode(int) Options: 0, 1, 2, prefix, substring. 1 = prefix, 2 = substring, 0 toggles between 1 and 2."
            ]
        },
        {
            "module": "Console",
            "name": "Clear",
            "shortName": "console_clear",
            "description": "Clear the Console's input and output areas",
            "defaultValue": null,
            "hidden": false,
            "arguments": []
        },
        {
            "module": "Console",
            "name": "Console.Dock",
            "shortName": "console_dock",
            "description": "Toggle Console docking, allows you to drag and resize the console if undocked. Options: 0, 1 or 2. Setting it to 0 will do the same as the Dock button",
            "value": consoleDock,
            "defaultValue": 1,
            "hidden": false,
            "arguments": [
                "dockmode(int) Options: 0, 1 or 2. 1 = docked, 2 = undocked, 0 toggles between 1 and 2."
            ]
        },
        {
            "module": "Console",
            "name": "Console.History",
            "shortName": "console_history",
            "description": "Display the commands in the Console's command history, you can navigate the command history using the arrow up/down keys",
            "defaultValue": null,
            "hidden": false,
            "arguments": []
        },
        {
            "module": "Console",
            "name": "Console.Invert",
            "shortName": "console_invert",
            "description": "Inverts the Console input box and drag handle",
            "value": consoleInvert,
            "defaultValue": 1,
            "hidden": false,
            "arguments": [
                "inverted(int) Options: 0, 1 or 2. 1 = not inverted, 2 = inverted, 0 toggles between 1 and 2."
            ]
        },
        {
            "module": "Console",
            "name": "Console.Opacity",
            "shortName": "console_opacity",
            "description": "Set the Console's overall opacity. Range: 0 - 100. Do not set below 40",
            "value": consoleOpacity,
            "defaultValue": 100,
            "hidden": false,
            "arguments": [
                "opacityPercentage(int) Range: 0 - 100"
            ]
        },
        {
            "module": "Console",
            "name": "Console.Reset",
            "shortName": "console_reset",
            "description": "Reset the Console, useful if something goes wrong and you can no longer properly use the console",
            "defaultValue": null,
            "hidden": false,
            "arguments": []
        },
        {
            "module": "Console",
            "name": "Console.Size",
            "shortName": "console_size",
            "description": "Set the Console's output box size manually. Options: 1, 2, 3 or 4. Setting it to 0 will do the same as Console.ToggleSize",
            "value": consoleSize,
            "defaultValue": 2,
            "hidden": false,
            "arguments": [
                "sizeIndex(int) Options: 0, 1, 2, 3 or 4. 1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%, 0 toggles 1, 2, 3 and 4."
            ]
        },
        {
            "module": "Console",
            "name": "Console.Transparency",
            "shortName": "console_transparency",
            "description": "Set the Console's background transparency. Range: 0 - 100",
            "value": consoleTransparency,
            "defaultValue": 75,
            "hidden": false,
            "arguments": [
                "transparencyPercentage(int) Range: 0 - 100"
            ]
        },
        {
            "module": "Console",
            "name": "Console.MaxHistory",
            "shortName": "console_maxhistory",
            "description": "Set the Console's maximum history",
            "value": maxConsoleHistory,
            "defaultValue": 250,
            "hidden": false,
            "arguments": [
                "maxHistory(int) Range: 0 - 1000"
            ]
        }
    ]
    return commands;
}

function showHelp(command) {
    var commands = commandList;
    if (!isset(command)) {
        commands = commands.sort(function(a, b) {
            if (a.module < b.module) {
                return -1;
            } else if (a.module > b.module) {
                return 1;
            } else {
                if (a.name < b.name) {
                    return -1
                } else if (a.name > b.name) {
                    return 1;
                } else {
                    return 0;
            }
            }
        });
        appendLine("", "Left click on a command to set it in the input box, right click for help related to the command and ctrl + click to directly execute command.");
        $.each(commands, function (key, value) {
            if (!value.hidden && !value.hideValue && !value.internal) {
                appendHTMLLine("", "<span class=\"command\"><b>$1</b></span>  -  <span class=\"description\">$2</span>", [value.name, value.description]);
            }
        });
    }
    else {
        commandItem = $.grep(commands, function(item) {
            return item.name.toLowerCase() == command.toLowerCase();
        });
        commandItem = commandItem[0];
        if (isset(commandItem) && !commandItem.hidden && !commandItem.hideValue && !commandItem.internal) {
            var name = commandItem.name;
            var usage = "";
            var parameters = [];
            $.each(commandItem.arguments, function (key, value) {
                argument = value.split(" ");
                description = value.replace(argument[0] + " ", "");
                usage += "<" + argument[0] + "> ";
                parameters.push({"name": argument[0], "description": description});
            });
            appendHTMLLine("", "<span class=\"command\"><b>$1</b></span>  -  <span class=\"description\">$2</span>", [name, commandItem.description]);
            if (isset(commandItem.defaultValue)) {
                appendLine("", "Default: " + commandItem.defaultValue);
                if (!isset(usage)) {
                    usage = commandItem.defaultValue;
                }
            }
            if (isset(commandItem.value) && commandItem.value != commandItem.defaultValue) {
                appendLine("", "Current value: " + commandItem.value);
            }
            appendLine("", "Usage: " + name + " " + usage);
            $.each(parameters, function (key, value) {
                appendHTMLLine("", "       <i>$1</i>: <span class=\"description\">$2</span>", [value.name, value.description]);
            });
        }
        else {
            appendLine("error-line", "Command/Variable '" + command + "' not found");
        }
    }
}

function showVariables() {
    var commands = commandList;
    commands = commands.sort(function(a, b) {
        if (a.module < b.module) {
            return -1;
        } else if (a.module > b.module) {
            return 1;
        } else {
            if (a.name < b.name) {
                return -1
            } else if (a.name > b.name) {
                return 1;
            } else {
                return 0;
        }
        }
    });
    $.each(commands, function (key, value) {
        if ((isset(value.value) || isset(value.defaultValue)) && !value.hidden && !value.hideValue && !value.internal) {
            var varValue = value.value;
            if (value.name == "Player.PrivKey") {
                varValue = "Enter the variable manually to check this value";
            }
            appendHTMLLine("", "<span class=\"command\"><b>$1</b></span> = $2    <span class=\"description\">$3</span>", [value.name, varValue, value.description]);
        }
    });
}

function getSuggestedCommands(partial) {
    suggestions = [];
    suggestionIndex = -1;
    var commands = [];
    commands = commandList.concat(getConsoleHelp());
    $(".suggestion").remove();

    if (!isset(partial))
        return;

    for(let item of commands)
    {
        if (item.hidden || item.internal)
            continue;

        let pos = item.name.toLowerCase().indexOf(partial.toLowerCase());
        if ((consoleAutoCompleteMode == eAutoCompleteMode.Prefix && pos != 0) || pos >= 0)
            suggestions.push(item.name);
    }

    if (suggestions.length > suggestionMaxCount)
        suggestions.splice(suggestionMaxCount, suggestions.length - suggestionMaxCount);

    if (suggestions.length > 0) {
        var suggestionsString = "";
        for(let suggestion of suggestions) {
            suggestionsString += htmlEncode(suggestion) + "</span>       <span class=\"command\"><b>";
        }
        appendHTMLLine("debug-line suggestion", "<span class=\"command\"><b>" + suggestionsString + "</b></span>", []);
    }
}

function advanceSuggestionIndex(amount) {
    if (suggestions.length) {
        if (suggestionIndex + amount < 0)
            suggestionIndex = 0;
        else
            suggestionIndex = (suggestionIndex + amount) % suggestions.length;

        var suggestion = suggestions[suggestionIndex];
        if (isset(suggestion)) {
            setInput(suggestion);
        }
    }
}

function sizeConsole(size, silent) {
    ifset(silent, false);
    if (isNaN(parseInt(size))) {
        if (!isset(toggle)) {
            appendLine("", consoleSize);
        }
        else {
            appendLine("error-line", "Parameter is not an integer! Options: 0, 1, 2, 3 or 4");
        }
        return;
    }
    else if (size != 0 && size != 1 && size != 2 && size != 3 && size != 4) {
        appendLine("error-line", "Parameter is invalid! Options: 0, 1, 2, 3 or 4");
    }
    if (size === 0) {
        size = (consoleSize % 4) + 1;
    }
    if (!silent) {
        appendLine("", consoleSize + " -> " + size);
    }
    consoleSize = size;
    $(".console").css({ "height": consoleSize * 25 + "%" });
}

function dockConsole(toggle, silent) {
    ifset(silent, false);
    if (isNaN(parseInt(toggle))) {
        if (!isset(toggle)) {
            appendLine("", consoleDock);
        }
        else {
            appendLine("error-line", "Parameter is not an integer! Options: 0, 1 or 2");
        }
        return;
    }
    else if (toggle != 0 && toggle != 1 && toggle != 2) {
        appendLine("error-line", "Parameter is invalid! Options: 0, 1 or 2");
        return;
    }
    switch(toggle) {
        case 1:
            $('.console').attr('data-docked','');
            sizeConsole(consoleSize, silent);
            $(".console").css({left: "0px", top: "0px", width: "100%"});
            if (!silent) {
                appendLine("", consoleDock + " -> " + 1);
            }
            consoleDock = 1;
           
            break;
        case 2:
            $('.console').removeAttr('data-docked');
            $(".console").css({left: "15px", top: "15px", width: "calc(100% - 30px)"});
            if (!silent) {
                appendLine("", consoleDock + " -> " + 2);
            }
            consoleDock = 2;
            break;
        default:
            if (consoleDock == 1) {
                dockConsole(2, silent);
            }
            else {
                dockConsole(1, silent);
            }
            break;
    }
}

function invertConsole(toggle, silent) {
    ifset(silent, false);
    if (isNaN(parseInt(toggle))) {
        if (!isset(toggle)) {
            appendLine("", consoleInvert);
        }
        else {
            appendLine("error-line", "Parameter is not an integer! Options: 0, 1 or 2");
        }
        return;
    }
    else if (toggle != 0 && toggle != 1 && toggle != 2) {
        appendLine("error-line", "Parameter is invalid! Options: 0, 1 or 2");
        return;
    }
    switch(toggle) {
        case 1:
            $(".console").prepend($(".console .box.titlebar"));
            $(".console .box.output").after($(".console .box.input"));
            if (!silent) {
                appendLine("", consoleInvert + " -> " + 1);
            }
            consoleInvert = 1;
            break;
        case 2:
            $(".console").prepend($(".console .box.input"));
            $(".console .box.output").after($(".console .box.titlebar"));
            if (!silent) {
                appendLine("", consoleInvert + " -> " + 2);
            }
            consoleInvert = 2;
            break;
        default:
            if (consoleInvert == 1) {
                dockConsole(2, silent);
            }
            else {
                dockConsole(1, silent);
            }
            break;
    }
}

function transparencyConsole(percentage, silent) {
    ifset(silent, false);
    if (isNaN(parseInt(percentage))) {
        if (!isset(percentage)) {
            appendLine("", consoleTransparency);
        }
        else {
            appendLine("error-line", "Parameter is not an integer! Range 0 - 100");
        }
        return;
    }
    else if (percentage < 0 || percentage > 100) {
        appendLine("error-line", "Parameter is out of range! Range 0 - 100");
        return;
    }
    if (!silent) {
        appendLine("", consoleTransparency + " -> " + percentage);
    }
    consoleTransparency = percentage;
    percentage = percentage / 100;
    $(".console").css({"background-color": "rgba(20, 31, 55, " + percentage + ")"});
}

function opacityConsole(percentage, silent) {
    ifset(silent, false);
    if (isNaN(parseInt(percentage))) {
        if (!isset(percentage)) {
            appendLine("", consoleOpacity);
        }
        else {
            appendLine("error-line", "Parameter is not an integer! Range 0 - 100");
        }
        return;
    }
    else if (percentage < 0 || percentage > 100) {
        appendLine("error-line", "Parameter is out of range! Range 0 - 100");
        return;
    }
    if (!silent) {
        appendLine("", consoleOpacity + " -> " + percentage);
    }
    consoleOpacity = percentage;
    percentage = percentage / 100;
    $("body").css({"opacity": percentage});
}

function isScrolledToBottom(e) {
    return (e.prop("scrollHeight") - e.scrollTop() - e.outerHeight() < 1);
}

function autoCompleteModeConsole(toggle, silent) {
    if (toggle.toString().toLowerCase() == "prefix") {
        toggle = 1;
    }
    else if (toggle.toString().toLowerCase() == "substring") {
        toggle = 2;
    }
    toggle = parseInt(toggle);
    ifset(silent, false);
    if (isNaN(parseInt(toggle))) {
        if (!isset(toggle)) {
            appendLine("", "[" + consoleAutoCompleteMode + "] " + autoCompleteModeToString());
        }
        else {
            appendLine("error-line", "Parameter is not an integer! Options: 0, 1 or 2");
        }
        return;
    }
    else if (toggle != 0 && toggle != eAutoCompleteMode.Prefix && toggle != eAutoCompleteMode.Substring) {
        appendLine("error-line", "Parameter is invalid! Options: 0, 1 or 2");
        return;
    }
    switch(toggle) {
        case eAutoCompleteMode.Prefix:
            if (!silent) {
                appendLine("", consoleAutoCompleteMode + " -> [" + eAutoCompleteMode.Prefix + "] " + autoCompleteModeToString(eAutoCompleteMode.Prefix));
            }
            consoleAutoCompleteMode = eAutoCompleteMode.Prefix;
            break;
        case eAutoCompleteMode.Substring:
            if (!silent) {
                appendLine("", consoleAutoCompleteMode + " -> [" + eAutoCompleteMode.Substring + "] " + autoCompleteModeToString(eAutoCompleteMode.Substring));
            }
            consoleAutoCompleteMode = eAutoCompleteMode.Substring;
            break;
        default:
            if (consoleAutoCompleteMode == eAutoCompleteMode.Prefix) {
                autoCompleteModeConsole(eAutoCompleteMode.Substring, silent);
            }
            else {
                autoCompleteModeConsole(eAutoCompleteMode.Prefix, silent);
            }
            break;
    }
}

function autoCompleteModeToString(mode) {
    if (isNaN(parseInt(mode))) {
        mode = consoleAutoCompleteMode;
    }
    mode = parseInt(mode);

    switch(mode) {
        case eAutoCompleteMode.Prefix:
            return "Prefix";
        case eAutoCompleteMode.Substring:
            return "Substring";
        default:
            return "Error";
    }
}

function scrollToBottom() {
    var box = $("#output-box");
    box.scrollTop(box.prop("scrollHeight"));
}

function appendLine(cssClass, line) {
    var atBottom = isScrolledToBottom($("#output-box"));
    $("<pre></pre>", {
        "class": cssClass
    })
    .text(line)
    .appendTo($("#output-box"));
    if (atBottom) {
        scrollToBottom();
    }
    limitConsoleHistory();
}

function appendHTMLLine(cssClass, html, contents) {
    if ($.isArray(contents)) {
        var atBottom = isScrolledToBottom($("#output-box"))

        $.each(contents, function (key, value) {
            html = html.replace("$" + (key + 1), htmlEncode(value));
        });

        $("<pre></pre>", {
            "class": cssClass
        })
        .html(html)
        .appendTo($("#output-box"));
        if (atBottom) {
            scrollToBottom();
        }
        limitConsoleHistory();
    }
}

function limitConsoleHistory(){
    var outputBoxLines = $("#output-box pre");
    if(outputBoxLines.length > maxConsoleHistory){
        let numToRemove = outputBoxLines.length - maxConsoleHistory;
        outputBoxLines.slice(0, numToRemove).each(function(){
            $(this).remove();
        });
    }
}

function runCommand(command) {
    if (isset(command.trim())) {
        switch (command.toLowerCase()) {
            case "clear":
                clearConsole();
                break;
            case "console.reset":
                resetConsole();
                break;
            case "console.history":
                appendLine("command-line", "> " + command);
                getInputHistory();
                break;
            case "variables":
                appendLine("command-line", "> " + command);
                showVariables();
                break;
            default:
                if (command.toLowerCase().indexOf('console.size') == 0) {
                    appendLine("command-line", "> " + command);
                    var commandValue = command.split(' ');
                    sizeConsole(commandValue[1]);
                    break;
                }
                else if (command.toLowerCase().indexOf('console.dock') == 0) {
                    appendLine("command-line", "> " + command);
                    var commandValue = command.split(' ');
                    dockConsole(commandValue[1]);
                    break;
                }
                else if (command.toLowerCase().indexOf('console.invert') == 0) {
                    appendLine("command-line", "> " + command);
                    var commandValue = command.split(' ');
                    invertConsole(commandValue[1]);
                    break;
                }
                else if (command.toLowerCase().indexOf('console.transparency') == 0) {
                    appendLine("command-line", "> " + command);
                    var commandValue = command.split(' ');
                    transparencyConsole(commandValue[1]);
                    break;
                }
                else if (command.toLowerCase().indexOf('console.opacity') == 0) {
                    appendLine("command-line", "> " + command);
                    var commandValue = command.split(' ');
                    opacityConsole(commandValue[1]);
                    break;
                }
                else if (command.toLowerCase().indexOf('console.autocompletemode') == 0) {
                    appendLine("command-line", "> " + command);
                    var commandValue = command.split(' ');
                    autoCompleteModeConsole(commandValue[1]);
                    break;
                }
                else if (command.toLowerCase().indexOf('help') == 0) {
                    appendLine("command-line", "> " + command);
                    var commandValue = command.split(' ');
                    showHelp(commandValue[1]);
                    break;
                }
                else if (command.toLowerCase().indexOf('console.maxhistory') == 0){
                    appendLine("command-line", "> " + command);
                    var commandValue = command.split(' ');
                    if(commandValue.length == 1){
                        appendLine("command-line", maxConsoleHistory);
                        break;
                    }
                    var value = parseInt(commandValue[1]);
                    if(!isNaN(value) && value >= 0){
                        maxConsoleHistory = value;
                        limitConsoleHistory();
                    }
                    else{
                        appendLine("error-line", "Argument was not of type integer");
                    }
                    break;
                }
                dew.command(command).then(function (output) {
                    appendLine("command-line", "> " + command);
                    if (output !== "") {
                        appendLine("", output);
                    }
                    scrollToBottom();
                }).catch(function (error) {
                    appendLine("command-line", "> " + command);
                    appendLine("error-line", error.message);
                });
                break;
        }
        scrollToBottom();
        clearInput();
        pushInputHistory(command);
        resetInputHistoryIndex();
        $(".suggestion").remove();
    }
}

$(window).load(function () {
    dew.getVersion().then(function (version) {
        $("#version").text(version);
    });

    dew.getCommands().then(function (commands) {
        commandList = commands.concat(getConsoleHelp());
    }).catch(function () {
        appendLine("error-line", "Could not retrieve list of commands!");
    });

    focusInput();

    $("html").on("click", "#input-box", function () {
        focusInput();
    });

    initDraggable();

    dockConsole(1, true); // HACK: Fix default positioning of the console

    $(document).keyup(function (e) {
        if (e.keyCode === 27) {
            // Hide when escape is released (keeps from triggering pause menu)
            dew.hide();
        }
        if (e.keyCode == 44) {
            dew.command('Game.TakeScreenshot');  
        }
    });
    $(document).keydown(function (e) {
        if(e.keyCode == 192 || e.keyCode == 112 || e.keyCode == 223){
            // Hide when tilde is pressed (and text is empty)
            if($('#command').val().length === 0){
                dew.hide();
            }
        }
    });

    $("html").on("keyup", "#command", function (e) {
        if (e.keyCode === 13) {
            // Run the command when enter is pressed
            runCommand($("#command").val());
            clearInput();
        }
        else if (e.keyCode === 38) {
            // Run the command when up is pressed
            selectInputHistoryIndex(-1);
            e.preventDefault();
        }
        else if (e.keyCode === 40) {
            // Run the command when down is pressed
            selectInputHistoryIndex(1);
        }
        else if (e.keyCode >= 48 && e.keyCode <= 90 || e.keyCode === 8 || e.keyCode === 46) {
            // Run the command when user is typing
            getSuggestedCommands($("#command").val());
        }
    });

    $("html").on("keydown", "#command", function (e) {
        if (e.keyCode === 9) {
            e.preventDefault();
            // if shift is held, go backwards
            advanceSuggestionIndex(e.shiftKey ? -1 : 1);
        }
    });

    dew.on("show", function (e) {
        focusInput();
    
        if(!memoryUsageInterval)
            memoryUsageInterval = setInterval(showMemoryUsage, 1000);
    });

    dew.on("hide", function (e) {
        clearInput();
        scrollToBottom();

        if(memoryUsageInterval) {
            clearInterval(memoryUsageInterval);
            memoryUsageInterval = null;
        }
            
    });

    dew.on("console", function (e) {
        appendLine("", e.data.line);
    });

    $("html").on("click", ".command", function (e) {
        if (e.ctrlKey) {
            runCommand($(this).text());
        }
        else {
            setInput($(this).text());
        }
        focusInput();
    });

    $("html").on("contextmenu", ".command", function () {
        setInput("help " + $(this).text());
        focusInput();
    });

    $("html").on("click", "#button-help", function () {
        runCommand("Help");
        focusInput();
    });

    $("html").on("click", "#button-clear", function () {
        clearConsole();
        clearInput();
        focusInput();
    });

    $("html").on("click", "#button-reset", function () {
        resetConsole();
    });

    $("html").on("click", "#button-size", function () {
        sizeConsole(0, true);
        focusInput();
    });

    $("html").on("click", "#button-dock", function () {
        dockConsole(0, true);
        focusInput();
    });

    $("html").on("click", "#button-hide", function () {
        dew.hide();
    });

    sizeConsole(consoleSize, true);

    inputHistory = fetchInputHistory();
    resetInputHistoryIndex();
});

function formatBytes(bytes,decimals) {
    if(bytes == 0) return '0 Bytes';
    var k = 1000,
        dm = decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function showMemoryUsage() {
    $("#memory-usage").text(formatBytes(performance.memory.usedJSHeapSize));
}

function initDraggable() {
    const console =  document.querySelector('.console');
    console.addEventListener('mousedown', (e) => {
        if(consoleDock !== 2) {
            return;
        }
        if(e.target.closest('.resize-handle')) {
            const { left: offsetX, top: offsetY } = console.getBoundingClientRect();
            function dragHandler(e) {
                if(e.buttons == 0) {
                    window.removeEventListener('mousemove', dragHandler);
                    window.removeEventListener('mouseup', dragHandler);
                    return;
                }
                console.style.width = `${e.clientX - offsetX}px`;
                console.style.height = `${e.clientY - offsetY}px`;
            }
            window.addEventListener('mousemove', dragHandler);
            window.addEventListener('mouseup', dragHandler);
        }
        if(e.target.closest('.titlebar')) {  
            const  { offsetX, offsetY } = e;
            function dragHandler(e) {
                if(e.buttons == 0) {
                    window.removeEventListener('mousemove', dragHandler);
                    window.removeEventListener('mouseup', dragHandler);
                    return;
                }
                console.style.left = `${e.clientX - offsetX}px`;
                console.style.top = `${e.clientY - offsetY}px`;
            }
            window.addEventListener('mousemove', dragHandler);
            window.addEventListener('mouseup', dragHandler);
        }
    });
}

showMemoryUsage();
