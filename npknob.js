/*
 ________   ________  ___  __    ________   ________  ________     
|\   ___  \|\   __  \|\  \|\  \ |\   ___  \|\   __  \|\   __  \    
\ \  \\ \  \ \  \|\  \ \  \/  /|\ \  \\ \  \ \  \|\  \ \  \|\ /_   
 \ \  \\ \  \ \   ____\ \   ___  \ \  \\ \  \ \  \\\  \ \   __  \  
  \ \  \\ \  \ \  \___|\ \  \\ \  \ \  \\ \  \ \  \\\  \ \  \|\  \ 
   \ \__\\ \__\ \__\    \ \__\\ \__\ \__\\ \__\ \_______\ \_______\
    \|__| \|__|\|__|     \|__| \|__|\|__| \|__|\|_______|\|_______|
                                                                   
 Version: 1.0.0
  Author: Erwin Goossen
 Website: http://navelpluisje.nl
    Docs: https://bitbucket.org/Navelpluisje/npknob
    Repo: https://bitbucket.org/Navelpluisje/npknob
  Issues: https://bitbucket.org/Navelpluisje/npknob/issues
 */

var NpKnob = function (id, options) {
    'use strict';

	(function () {

	  if ( typeof window.CustomEvent === "function" ) return false;

	  function CustomEvent ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	   }

	  CustomEvent.prototype = window.Event.prototype;

	  window.CustomEvent = CustomEvent;
	})();
	
    var prev,
        customEvt,
        knob,
        the_body,
        startY,
        min = 0,
        max = 1,
        val = 0.5,
        click = true;

    /**
     * Create and fire the rotate event.
     */
    function createEvent() {
		if (CustomEvent){
			customEvt = new CustomEvent('knob-rotate', { 'detail': {'value': getValue()} });
		}else{
			var evt = document.createEvent("CustomEvent");
			evt.initCustomEvent('knob-rotate', false, false, { 'detail': {'value': getValue()} });
		}
        knob.dispatchEvent(customEvt);
    }

    /**
     * Do some rotating. Calculate the Y position and set the values.
     * Set click to false so the click event will not be handled.
     * After that create the Event
     * @private
     */
    function _rotate() {
        var next = ((event.screenY - startY) - prev);
        click = false;
        knob.style.transform= 'rotate(' + -1 * next + 'deg)';
        knob.dataset.value = getValue();
        createEvent();
    }

    /**
     * Handle the mousedown event. Reset click to true, because this one is fired before the click and move events.
     * We get the Y position of the mouse, add the active class to the knob and add the mousemove event listener.
     * This way _rotate will be triggered if the mouse is moved.
     * @private
     */
    function _handleMouseDown() {
        /**
         * Reset the click boolean. At this point we do not know if we are clicking or moving
         */
        click = true;
        startY = event.screenY;
        knob.classList.add('active');
        prev = parseFloat(knob.style.transform.substring(7)) || 0;
        the_body.addEventListener('mousemove', _rotate, false);
    }

    /**
     * Finished the move. So we remove the active class and the mousemove event listener
     * @private
     */
    function _handleMouseUp() {
        knob.classList.remove('active');
        the_body.removeEventListener('mousemove', _rotate, false);
		clearSelection();
		document.selection.empty();
    }
	
	function clearSelection() {
		var sel;
		if(document.selection && document.selection.empty){
			document.selection.empty() ;
		} else if(window.getSelection) {
			sel = window.getSelection();
			if(sel && sel.removeAllRanges)
			sel.collapse(the_body);
		}
	}

    /**
     * When clicked on the  knob this is what happens. The corner will be calculated with som basic math.
     * Some checks are performed and the values will be set.
     * @param event The event og the cick
     * @private
     */
    function _handleClick(event) {
        var corner,
            width = knob.offsetWidth / 2,
            height = knob.offsetHeight / 2,
            adjacent = Math.abs(width - event.layerX),
            opposite = Math.abs(height - event.layerY),
            hypotenuse = Math.sqrt(Math.pow(adjacent, 2) + Math.pow(opposite, 2));

        if (click) {
            if (event.layerY > height) {
                corner = 90 + (360 / (Math.PI * 2)) * Math.acos(adjacent / hypotenuse);
            } else {
                corner = (360 / (Math.PI * 2)) * Math.asin(adjacent / hypotenuse);
            }

            if (event.layerX < width) {
                corner *= -1;
            }

            _setInitialValue(corner);
            createEvent();
        }
    }

    /**
     * Set the initial and overall bindings
     * @private
     */
    function _setEventBindings() {
        knob.addEventListener('mousedown', _handleMouseDown, false);
		knob.addEventListener('dblclick', function(){_setInitialValue(0);createEvent();}, false);
        the_body.addEventListener('mouseup', _handleMouseUp, false);
		knob.addEventListener('mouseleave', _handleMouseUp, false);
        knob.addEventListener('click', _handleClick);
    }

    /**
     * Set the initial values.
     * @param corner the corner top set. This is optional
     * @private
     */
    function _setInitialValue(corner) {
        corner = corner || 0;
        knob.style.transform= 'rotate('+ corner + 'deg)';
        knob.dataset.value = getValue(corner);
    }

    /**
     * Set the value and call the initial value
     * @param value
     */
    function setValue(value) {
        if (value > max) {
            val = max;
        } else {
            val = value;
        }
        _setInitialValue();
    }

    /**
     * Get the current value of the knob by the angle
     * @param corner The angel to calculate the value with. This on is optional.
     * @returns {number}
     */
    function getValue(corner) {
        corner = corner || parseFloat(knob.style.transform.substring(7)) || 0;
        return +min + ((corner) / 360 * (max - min));
    }

    function _setDefaults(options) {
        if (!options) {
            min = knob.dataset.min || 0;
            max = knob.dataset.max || 1;
            val = knob.dataset.value || 0;
        } else {
            min = options.min || 0;
            max = options.max || 359;
            val = options.value || 0;
        }
    }

    /**
     * Initialize the Knob. Set the defaults and the bindings
     * @param id The id of the DOM-element
     * @private
     */
    function _init(id, options) {
        options = options || false;
        the_body = document.body;
        knob = document.getElementById(id);
        _setDefaults(options);
        _setEventBindings();
        _setInitialValue();
    }

    _init(id, options);

    /**
     * Return all the public stuff here
     */
    return {
        obj: knob,
        trigger: createEvent,
        setValue: setValue,
        getValue: getValue
    }
};