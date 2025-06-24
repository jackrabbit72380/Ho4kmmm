dew.input = (function () {
    const HOLD_DELAY = 0.9;
    const HELD_SCROLL_SPEED = .11;
    const SINGLE_SCROLL_SPEED = .325;
    const CONTROLLER_AXIS_THRESHOLD = .5;
    const UiAction = {
        LeftTrigger: 0,
        RightTrigger: 1,
        Up: 2,
        Down: 3,
        Left: 4,
        Right: 5,
        Start: 6,
        Select: 7,
        LeftStick: 8,
        RightStick: 9,
        A: 10,
        B: 11,
        X: 12,
        Y: 13,
        LeftBumper: 14,
        RightBumper: 15
    };
    const UiSound = {
        Error: 0,
        VerticalNavigation: 1,
        HorizontalNavigation: 2,
        A: 3,
        B: 4,
        X: 5,
        Start: 7,
        Back: 8,
        LeftBumper: 9,
        RightBumper: 10,
        LeftTrigger: 11,
        RightTrigger: 12
    };

    var _callbacks = {};
    var _leftStickTicks = { left: 0, right: 0, up: 0, down: 0 }
    var _rightStickTicks = { left: 0, right: 0, up: 0, down: 0 }
    var _lastScrollHeldUpdate = 0;
    var _lastRightStickHeldUpdate = 0;
    var _lastScrollTime = 0;
    var _lastRightScrollTime = 0;
    var _keyStates = {};
    var _keyTicks = {};

    init();

    return {
        on: function (event, callback) {
            (_callbacks[event] || (_callbacks[event] = [])).push(callback);
        },
        playSound(index) {
            dew.command('Game.PlayUiSound ' + index.toString(10));
        },
        removeListener: function(event, callback){
            let index = _callbacks[event].indexOf(callback);
            if(index >= 0)
                _callbacks[event].splice(_callbacks[event].indexOf(callback), 1);
        },
        reset: reset,

        Actions: UiAction,
        Sounds: UiSound,
    }


    function init() {
        dew.on('controllerinput', tick);
        dew.on('hide', reset);
        window.addEventListener('keydown', function (e) { _keyStates[e.keyCode] = true }, false);
        window.addEventListener('keyup', function (e) { delete _keyStates[e.keyCode] }, false);
    }

    function reset() {
        _keyStates = {};
        _keyTicks = {};
        _leftStickTicks = {};
        _rightStickTicks = {};
        _lastScrollHeldUpdate = 0;
        _lastRightStickHeldUpdate = 0;
        _lastScrollTime = 0;
        _lastRightScrollTime = 0;
    }

    function emit(event) {
        var eventCallbacks = _callbacks[event];
        if (eventCallbacks) {
            var args = Array.prototype.splice.call(arguments, 1);
            for (var i = 0; i < eventCallbacks.length; i++) {
                eventCallbacks[i].apply(null, args);
            }
        }
    }


    function tick(e) {
        var controller = e.data,
            secondsPerTick = e.data.secondsPerTick,
            gameTicks = e.data.gameTicks;
		if(gameTicks == 0) _lastScrollTime = gameTicks;
		if(gameTicks == 0) _lastRightScrollTime = gameTicks;
		
        emit('tick');

        if (_keyStates[40]) _keyTicks[UiAction.Down]++; else _keyTicks[UiAction.Down] = 0;
        if (_keyStates[38]) _keyTicks[UiAction.Up]++; else _keyTicks[UiAction.Up] = 0;
        if (_keyStates[37]) _keyTicks[UiAction.Left]++; else _keyTicks[UiAction.Left] = 0;
        if (_keyStates[39]) _keyTicks[UiAction.Right]++; else _keyTicks[UiAction.Right] = 0;
        if (_keyStates[32] || _keyStates[13]) _keyTicks[UiAction.A]++; else _keyTicks[UiAction.A] = 0;
        if (_keyStates[27]) _keyTicks[UiAction.B]++; else _keyTicks[UiAction.B] = 0;
        if (_keyStates[33]) _keyTicks[UiAction.LeftTrigger]++; else _keyTicks[UiAction.LeftTrigger] = 0;
        if (_keyStates[34]) _keyTicks[UiAction.RightTrigger]++; else _keyTicks[UiAction.RightTrigger] = 0;
        if (_keyStates[46]) _keyTicks[UiAction.Y]++; else _keyTicks[UiAction.Y] = 0;
        if (_keyStates[88]) _keyTicks[UiAction.X]++; else _keyTicks[UiAction.X] = 0;
        if (_keyStates[81]) _keyTicks[UiAction.LeftBumper]++; else _keyTicks[UiAction.LeftBumper] = 0;
        if (_keyStates[69]) _keyTicks[UiAction.RightBumper]++; else _keyTicks[UiAction.RightBumper] = 0;

        if (_leftStickTicks.right > 255) _leftStickTicks.right = 255;
        if (_leftStickTicks.left > 255) _leftStickTicks.left = 255;
        if (_leftStickTicks.up > 255) _leftStickTicks.up = 255;
        if (_leftStickTicks.down > 255) _leftStickTicks.down = 255;
        
        if (_rightStickTicks.right > 255) _rightStickTicks.right = 255;
        if (_rightStickTicks.left > 255) _rightStickTicks.left = 255;
        if (_rightStickTicks.up > 255) _rightStickTicks.up = 255;
        if (_rightStickTicks.down > 255) _rightStickTicks.down = 255;

        if (e.data.AxisLeftX > CONTROLLER_AXIS_THRESHOLD) _leftStickTicks.right++; else _leftStickTicks.right = 0;
        if (e.data.AxisLeftX < -CONTROLLER_AXIS_THRESHOLD) _leftStickTicks.left++; else _leftStickTicks.left = 0;
        if (e.data.AxisLeftY > CONTROLLER_AXIS_THRESHOLD) _leftStickTicks.up++; else _leftStickTicks.up = 0;
        if (e.data.AxisLeftY < -CONTROLLER_AXIS_THRESHOLD) _leftStickTicks.down++; else _leftStickTicks.down = 0;

        if (e.data.AxisRightX > CONTROLLER_AXIS_THRESHOLD) _rightStickTicks.right++; else _rightStickTicks.right = 0;
        if (e.data.AxisRightX < -CONTROLLER_AXIS_THRESHOLD) _rightStickTicks.left++; else _rightStickTicks.left = 0;
        if (e.data.AxisRightY > CONTROLLER_AXIS_THRESHOLD) _rightStickTicks.up++; else _rightStickTicks.up = 0;
        if (e.data.AxisRightY < -CONTROLLER_AXIS_THRESHOLD) _rightStickTicks.down++; else _rightStickTicks.down = 0;

        if (controller.LeftTrigger == 1 || _keyTicks[UiAction.LeftTrigger] == 1) {
            emit('scroll', 2, 0, -1);
        }
        if (controller.RightTrigger == 1 || _keyTicks[UiAction.RightTrigger] == 1) {
            emit('scroll', 2, 0, 1);
        }
        
        if ((gameTicks - _lastScrollHeldUpdate) * secondsPerTick > HELD_SCROLL_SPEED) {
            if (((_leftStickTicks.up > 1 && _leftStickTicks.down == 0) && (_leftStickTicks.up * secondsPerTick) > HOLD_DELAY) ||
                ((controller.Up > 1 && controller.Down == 0) && (controller.Up * secondsPerTick) > HOLD_DELAY) ||
                ((_keyTicks[UiAction.Up] > 1 && _keyTicks[UiAction.Down] == 0) && (_keyTicks[UiAction.Up] * secondsPerTick) > HOLD_DELAY)) {
                _lastScrollHeldUpdate = gameTicks;
                emit('scroll', 1, 0, -1);
            }
            if (((_leftStickTicks.down > 1 && _leftStickTicks.up == 0) && (_leftStickTicks.down * secondsPerTick) > HOLD_DELAY) ||
                ((controller.Down > 1 && controller.Up == 0) && (controller.Down * secondsPerTick) > HOLD_DELAY) ||
                ((_keyTicks[UiAction.Down] > 1 && _keyTicks[UiAction.Up] == 0) && (_keyTicks[UiAction.Down] * secondsPerTick) > HOLD_DELAY)) {
                _lastScrollHeldUpdate = gameTicks;
                emit('scroll', 1, 0, 1);
            }
            if (((_leftStickTicks.right > 1 && _leftStickTicks.left == 0) && (_leftStickTicks.right * secondsPerTick) > HOLD_DELAY) ||
                ((controller.Right > 1 && controller.Left == 0) && (controller.Right * secondsPerTick) > HOLD_DELAY) ||
                ((_keyTicks[UiAction.Right] > 1 && _keyTicks[UiAction.Left] == 0) && (_keyTicks[UiAction.Right] * secondsPerTick) > HOLD_DELAY)) {
                _lastScrollHeldUpdate = gameTicks;
                emit('scroll', 1, 1, 1);
            }
            if (((_leftStickTicks.left > 1 && _leftStickTicks.right == 0) && (_leftStickTicks.left * secondsPerTick) > HOLD_DELAY) ||
                ((controller.Left > 1 && controller.Right == 0) && (controller.Left * secondsPerTick) > HOLD_DELAY) ||
                ((_keyTicks[UiAction.Left] > 1 && _keyTicks[UiAction.Right] == 0) && (_keyTicks[UiAction.Left] * secondsPerTick) > HOLD_DELAY)) {
                _lastScrollHeldUpdate = gameTicks;
                emit('scroll', 1, 1, -1);
            }
        }
        
        if ((gameTicks - _lastRightStickHeldUpdate) * secondsPerTick > HELD_SCROLL_SPEED) {
            if ((_rightStickTicks.up > 1 && _rightStickTicks.down == 0) && (_rightStickTicks.up * secondsPerTick) > HOLD_DELAY) {
                _lastRightStickHeldUpdate = gameTicks;
                emit('right_scroll', 1, 0, -1);
            }
            if ((_rightStickTicks.down > 1 && _rightStickTicks.up == 0) && (_rightStickTicks.down * secondsPerTick) > HOLD_DELAY) {
                _lastRightStickHeldUpdate = gameTicks;
                emit('right_scroll', 1, 0, 1);
            }
            if ((_rightStickTicks.right > 1 && _rightStickTicks.left == 0) && (_rightStickTicks.right * secondsPerTick) > HOLD_DELAY) {
                _lastRightStickHeldUpdate = gameTicks;
                emit('right_scroll', 1, 1, 1);
            }
            if ((_rightStickTicks.left > 1 && _rightStickTicks.right == 0) && (_rightStickTicks.left * secondsPerTick) > HOLD_DELAY) {
                _lastRightStickHeldUpdate = gameTicks;
                emit('right_scroll', 1, 1, -1);
            }
        }
        
        
        if ((gameTicks - _lastScrollTime) * secondsPerTick > SINGLE_SCROLL_SPEED) {
            if (((_leftStickTicks.up > 1 && _leftStickTicks.down == 0) && (_leftStickTicks.up * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) ||
                ((controller.Up > 1 && controller.Down == 0) && (controller.Up * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) ||
                ((_keyTicks[UiAction.Up] > 1 && _keyTicks[UiAction.Down] == 0) && (_keyTicks[UiAction.Up] * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED)) {
                _lastScrollTime = gameTicks;
                emit('scroll', 1, 0, -1);
            }
            if (((_leftStickTicks.down > 1 && _leftStickTicks.up == 0) && (_leftStickTicks.down * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) ||
                ((controller.Down > 1 && controller.Up == 0) && (controller.Down * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) ||
                ((_keyTicks[UiAction.Down] > 1 && _keyTicks[UiAction.Up] == 0) && (_keyTicks[UiAction.Down] * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED)) {
                _lastScrollTime = gameTicks;
                emit('scroll', 1, 0, 1);
            }
            if (((_leftStickTicks.right > 1 && _leftStickTicks.left == 0) && (_leftStickTicks.right * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) ||
                ((controller.Right > 1 && controller.Left == 0) && (controller.Right * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) ||
                ((_keyTicks[UiAction.Right] > 1 && _keyTicks[UiAction.Left] == 0) && (_keyTicks[UiAction.Right] * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED)) {
                _lastScrollTime = gameTicks;
                emit('scroll', 1, 1, 1);
            }
            if (((_leftStickTicks.left > 1 && _leftStickTicks.right == 0) && (_leftStickTicks.left * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) ||
                ((controller.Left > 1 && controller.Right == 0) && (controller.Left * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) ||
                ((_keyTicks[UiAction.Left] > 1 && _keyTicks[UiAction.Right] == 0) && (_keyTicks[UiAction.Left] * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED)) {
                _lastScrollTime = gameTicks;
                emit('scroll', 1, 1, -1);
            }
        }
        
        if ((gameTicks - _lastRightScrollTime) * secondsPerTick > SINGLE_SCROLL_SPEED) {
            if ((_rightStickTicks.up > 1 && _rightStickTicks.down == 0) && (_rightStickTicks.up * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) {
                _lastRightScrollTime = gameTicks;
                emit('right_scroll', 1, 0, -1);
            }
            if ((_rightStickTicks.down > 1 && _rightStickTicks.up == 0) && (_rightStickTicks.down * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) {
                _lastRightScrollTime = gameTicks;
                emit('right_scroll', 1, 0, 1);
            }
            if ((_rightStickTicks.right > 1 && _rightStickTicks.left == 0) && (_rightStickTicks.right * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) {
                _lastRightScrollTime = gameTicks;
                emit('right_scroll', 1, 1, 1);
            }
            if ((_rightStickTicks.left > 1 && _rightStickTicks.right == 0) && (_rightStickTicks.left * secondsPerTick) < HOLD_DELAY-HELD_SCROLL_SPEED) {
                _lastRightScrollTime = gameTicks;
                emit('right_scroll', 1, 1, -1);
            }
        }
        

        if ((gameTicks - _lastScrollTime) * secondsPerTick > SINGLE_SCROLL_SPEED) {            
            if ((_leftStickTicks.up == 1 && _leftStickTicks.down == 0) ||
                (controller.Up == 1 && controller.Down == 0) ||
                (_keyTicks[UiAction.Up] == 1 && _keyTicks[UiAction.Down] == 0)) {
                _lastScrollTime = gameTicks;
                emit('scroll', 0, 0, -1);
            }
            if ((_leftStickTicks.down == 1 && _leftStickTicks.up == 0) ||
                (controller.Down == 1 && controller.Up == 0) ||
                (_keyTicks[UiAction.Down] == 1 && _keyTicks[UiAction.Up] == 0)) {
                _lastScrollTime = gameTicks;
                emit('scroll', 0, 0, 1);
            }
            if ((_leftStickTicks.right == 1 && _leftStickTicks.left == 0) ||
                (controller.Right == 1 && controller.Left == 0) ||
                (_keyTicks[UiAction.Right] == 1 && _keyTicks[UiAction.Left] == 0)) {
                _lastScrollTime = gameTicks;
                emit('scroll', 0, 1, 1);
            }
            if ((_leftStickTicks.left == 1 && _leftStickTicks.right == 0) ||
                (controller.Left == 1 && controller.Right == 0) ||
                (_keyTicks[UiAction.Left] == 1 && _keyTicks[UiAction.Right] == 0)) {
                _lastScrollTime = gameTicks;
                emit('scroll', 0, 1, -1);
            }
        }
        
        if ((gameTicks - _lastRightScrollTime) * secondsPerTick > SINGLE_SCROLL_SPEED) {            
            if (_rightStickTicks.up == 1 && _rightStickTicks.down == 0) {
                _lastRightScrollTime = gameTicks;
                emit('right_scroll', 0, 0, -1);
            }
            if (_rightStickTicks.down == 1 && _rightStickTicks.up == 0) {
                _lastRightScrollTime = gameTicks;
                emit('right_scroll', 0, 0, 1);
            }
            if (_rightStickTicks.right == 1 && _rightStickTicks.left == 0) {
                _lastRightScrollTime = gameTicks;
                emit('right_scroll', 0, 1, 1);
            }
            if (_rightStickTicks.left == 1 && _rightStickTicks.right == 0) {
                _lastRightScrollTime = gameTicks;
                emit('right_scroll', 0, 1, -1);
            }
        }
        
        
        if (_lastScrollTime != 0 && ((_leftStickTicks.up == 0 && _leftStickTicks.down == 0 && _leftStickTicks.left == 0 && _leftStickTicks.right == 0) &&
            (controller.Up == 0 && controller.Down == 0 && controller.Left == 0 && controller.Right == 0) &&
            (_keyTicks[UiAction.Up] == 0 && _keyTicks[UiAction.Down] == 0 && _keyTicks[UiAction.Left] == 0 && _keyTicks[UiAction.Right] == 0))) {
            _lastScrollTime = 0;
        }

        if (_lastRightScrollTime != 0 && (_rightStickTicks.up == 0 && _rightStickTicks.down == 0 && _rightStickTicks.left == 0 && _rightStickTicks.right == 0)) {
            _lastRightScrollTime = 0;
        }

        if (controller.A == 1) emit('action', { inputType: 'controller', action: UiAction.A });
        if (controller.B == 1) emit('action', { inputType: 'controller', action: UiAction.B });
        if (controller.X == 1) emit('action', { inputType: 'controller', action: UiAction.X });
        if (controller.Y == 1) emit('action', { inputType: 'controller', action: UiAction.Y });
        if (controller.Start == 1) emit('action', { inputType: 'controller', action: UiAction.Start });
        if (controller.Select == 1) emit('action', { inputType: 'controller', action: UiAction.Select });
        if (controller.LeftBumper == 1) emit('action', { inputType: 'controller', action: UiAction.LeftBumper });
        if (controller.RightBumper == 1) emit('action', { inputType: 'controller', action: UiAction.RightBumper });
		
        for (var i = 0; i < 16; i++) {
            if (_keyTicks[i] == 1) {
                emit('action', { inputType: 'keyboard', action: i });
            }
        }
    }
})();