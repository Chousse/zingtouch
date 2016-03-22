/**
 * @file State.js
 */

import Gesture from './../../gestures/Gesture.js';
import Expand from './../../gestures/Expand.js';
import Pan from './../../gestures/Pan.js';
import Pinch from './../../gestures/Pinch.js';
import Rotate from './../../gestures/Rotate.js';
import Swipe from './../../gestures/Swipe.js';
import Tap from './../../gestures/Tap.js';

import Binding from './Binding.js';
import Input from './Input.js';
import util from './../util.js';

/**
 * Creates an object related to a Region's state, and contains helper methods to update and clean up different
 * states.
 */
class State {

  /**
   * Constructor for the State class.
   */
  constructor() {

    /**
     * An array of current and recently inactive Input objects related to a gesture.
     * @type {Input}
     */
    this.inputs = [];

    /**
     * An array of Binding objects; relations between elements, their gestures, and the handlers.
     * @type {Binding}
     */
    this.bindings = [];

    /**
     * The number of gestures registered to this Region
     * @type {Number}
     */
    this.numRegisteredGestures = 0;

    /**
     * A key/value map all the registered gestures for the listener. Note: Can only have one gesture registered to one key.
     * @type {Object}
     */
    this.registeredGestures = {
      expand: new Expand(),
      pan: new Pan(),
      pinch: new Pinch(),
      rotate: new Rotate(),
      swipe: new Swipe(),
      tap: new Tap()
    };
  }

  /**
   * Creates a new binding with the given element and gesture object.
   * If the gesture object provided is unregistered, it's reference will be saved in as a binding to
   * be later referenced.
   * @param  {Element} element - The element the gesture is bound to.
   * @param {String|Object} gesture  - Either a name of a registered gesture, or an unregistered
   *  Gesture object.
   * @param {Function} handler - The function handler to be called when the event is emitted.
   * Used to bind/unbind.
   * @param {Boolean} capture - Whether the gesture is to be detected in the capture of bubble
   * phase. Used to bind/unbind.
   * @param {Boolean} bindOnce - Option to bind once and only emit the event once.
   * @returns {null|Binding} - null if the gesture could not be found, the new Binding otherwise
   */
  addBinding(element, gesture, handler, capture, bindOnce) {
    if (typeof gesture === 'string') {
      gesture = this.registeredGestures[gesture];
      if (typeof gesture === 'undefined') {
        return null;
      }
    } else if (!(gesture instanceof Gesture)) {
      return null;
    } else {
      gesture.setId(this.numRegisteredGestures++);
    }

    if (gesture instanceof Gesture) {
      var binding = new Binding(element, gesture, handler, capture, bindOnce);
      this.bindings.push(binding);
      element.addEventListener(gesture.getId(), handler, capture);
      return binding;
    }
  }
  /*addBinding*/

  /**
   * Retrieves the Binding by which an element is associated to.
   * @param {Element} element - The element to find bindings to.
   * @returns {Array} - An array of Bindings to which that element is bound
   */
  retrieveBindings(element) {
    var matches = [];
    for (var i = 0; i < this.bindings.length; i++) {
      if (this.bindings[i].element === element) {
        matches.push(this.bindings[i]);
      }
    }

    return matches;
  }
  /*retrieveBindings*/

  /**
   * Updates the inputs with new information based upon a new event being fired.
   * @param {Event} event - The event being captured
   * @returns {boolean} - returns true for a successful update, false if the event is invalid.
   */
  updateInputs(event) {
    //Return if all gestures did not originate from the same target
    console.log(event.touches);
    console.log(event.targetTouches.length);

    //TODO: Need to make sure the touches are within the same Region, rather than just the same element.
    //if (event.touches && event.touches.length !== event.targetTouches.length) {
    //  state.resetInputs();
    //  return false;
    //}

    if (event.touches) {
      for (var index in event.changedTouches) {
        if (event.changedTouches.hasOwnProperty(index) && util.isInteger((parseInt(index)))) {
          var identifier = event.changedTouches[index].identifier;
          if (util.normalizeEvent(event.type) === 'start') {
            if (findInputById(this.inputs, identifier)) {
              //This should restart the inputs and cancel out any gesture.
              this.resetInputs();
              return false;
            } else {
              this.inputs.push(new Input(event, identifier));
            }
          } else {
            var input = findInputById(this.inputs, identifier);
            if (input) {
              input.update(event, identifier);
            }
          }
        }
      }
    } else {
      if (util.normalizeEvent(event.type) === 'start') {
        this.inputs.push(new Input(event));
      } else {
        this.inputs[0].update(event);
      }
    }

    return true;
  }
  /*updateInputs*/

  /**
   * Removes all inputs from the state, allowing for a new gesture.
   */
  resetInputs() {
    this.inputs = [];
  }
  /*resetInputs*/

  /**
   * Counts the number of active inputs at any given time.
   * @returns {Number} - The number of active inputs.
   */
  numActiveInputs() {
    var count = 0;
    for (var i = 0; i < this.inputs.length; i++) {
      if (this.inputs[i].current.type !== 'end') {
        count++;
      }
    }

    return count;
  }
  /*numActiveInputs*/

}
/**
 * Searches through each input, comparing the browser's identifier key for touches, to the stored one
 * in each input
 * @param {Array} inputs - The array of inputs in state.
 * @param {String} identifier - The identifier the browser has assigned.
 * @returns {Input} - The input object with the corresponding identifier, null if it did not find any.
 */
function findInputById(inputs, identifier) {
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].identifier === identifier) {
      return inputs[i];
    }
  }

  return null;
}
/*findInputById*/

export default State;
