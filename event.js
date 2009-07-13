// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function Event() {
  switch (arguments.length) {
  case 2:
    // Event::Event(EventType type, int flags);
    this.type = arguments[0];
    this.flags = arguments[1];
    break;
  case 1:
    // Event::Event(const Event& other);
    this.type = arguments[0].type;
    this.flags = arguments[0].flags;
    break;
  case 0:
    // Event::Event();
    this.type = Event.prototype.ET_NONE;
    this.flags = 0;
    break;
  default:
    invalidargcount();
    break;
  }
}

Event.prototype.ET_NONE = 0;
Event.prototype.ET_MOUSE_PRESSED = 1;
Event.prototype.ET_MOUSE_DRAGGED = 2;
Event.prototype.ET_MOUSE_RELEASED = 3;
Event.prototype.ET_MOUSE_MOVED = 4;
Event.prototype.ET_MOUSE_ENTERED = 5;
Event.prototype.ET_MOUSE_EXITED = 6;
Event.prototype.ET_KEY_PRESSED = 7;
Event.prototype.ET_KEY_RELEASED = 8;
Event.prototype.ET_MOUSEWHEEL = 9;

Event.prototype.EF_SHIFT_DOWN = 1 << 0;
Event.prototype.EF_CONTROL_DOWN = 1 << 1;
Event.prototype.EF_ALT_DOWN = 1 << 2;
Event.prototype.EF_LEFT_BUTTON_DOWN = 1 << 3;
Event.prototype.EF_MIDDLE_BUTTON_DOWN = 1 << 4;
Event.prototype.EF_RIGHT_BUTTON_DOWN = 1 << 5;

Event.prototype.isShiftDown = function Event_isShiftDown() {
  return this.flags & this.EF_SHIFT_DOWN;
}
Event.prototype.isControlDown = function Event_isControlDown() {
  return this.flags & this.EF_CONTROL_DOWN;
}
Event.prototype.isAltDown = function Event_isAltDown() {
  return this.flags & this.EF_ALT_DOWN;
}

function LocatedEvent() {
  switch (arguments.length) {
  case 3:
    if (arguments[0].instanceOf(LocatedEvent)) {
      // LocatedEvent::LocatedEvent(const LocatedEvent& other, View from, View to);
      var located_event = arguments[0];
      Event.call(this, located_event);
      this.location = View.prototype.convertPointToView(arguments[1],
                                                        arguments[2],
                                                        located_event.location);
    } else {
      // LocatedEvetn::LocatedEvent(Point location, EventType type, int flags);
      this.location = arguments[0];
      Event.call(this, arguments[1], arguments[2]);
    }
    break;
  case 0:
    // prototype setup.
    break;
  default:
    invalidargcount();
  }
}
LocatedEvent.prototype = new Event;
LocatedEvent.prototype.__defineGetter__("x", function() { return this.location.x; });
LocatedEvent.prototype.__defineGetter__("y", function() { return this.location.y; });

function MouseEvent() {
  switch (arguments.length) {
  case 5:
    // MouseEvent::MouseEvent(Point point, View from, View to, EventType type, int flags);
    var other = new LocatedEvent(arguments[0], arguments[3], arguments[4]);
    LocatedEvent.call(this, other, arguments[1], arguments[2]);
    break;
  case 3:
    // MouseEvent::MouseEvent(Point point, EventType type, int flags);
    if (arguments[0].instanceOf(Point)) {
      LocatedEvent.call(this, arguments[0], arguments[1], arguments[2]);
    } else if (arguments[0].instanceOf(MouseEvent)) {
      // MouseEvent::MouseEvent(MouseEvent other, View from, View to);
      LocatedEvent.call(this, arguments[0], arguments[1], arguments[2]);
    }    
    break;
  case 1:
    var event = arguments[0];
    LocatedEvent.call(this, new Point(event.offsetX, event.offsetY),
                      this._getEventTypeFromDOMEvent(event),
                      this._getEventFlagsFromDOMEvent(event));    
    break;
  default:
    invalidargcount();
  }
}
MouseEvent.prototype = new LocatedEvent;
MouseEvent.prototype.EF_IS_DOUBLE_CLICK = 1 << 16;
MouseEvent.prototype.isOnlyLeftMouseButtonDown =
    function MouseEvent_isOnlyLeftMouseButtonDown() {
  return this.isLeftButtonDown() &&
         !(this.flags & (this.EF_MIDDLE_BUTTON_DOWN | this.EF_RIGHT_BUTTON_DOWN));
}
MouseEvent.prototype.isLeftButtonDown = function MouseEvent_isLeftButtonDown() {
  return this.flags & this.EF_LEFT_BUTTON_DOWN;
}
MouseEvent.prototype.isOnlyMiddleMouseButtonDown =
    function MouseEvent_isOnlyMiddleMouseButtonDown() {
  return this.isMiddleButtonDown() &&
         !(flags & (this.EF_LEFT_BUTTON_DOWN | this.EF_RIGHT_BUTTON_DOWN));
}
MouseEvent.prototype.isMiddleButtonDown = function MouseEvent_isMiddleButtonDown() {
  return this.flags & this.EF_MIDDLE_BUTTON_DOWN;
}
MouseEvent.prototype.isOnlyRightMouseButtonDown =
    function MouseEvent_isOnlyRightMouseButtonDown() {
  return this.isRightButtonDown() &&
         !(flags & (this.EF_LEFT_BUTTON_DOWN | this.EF_MIDDLE_BUTTON_DOWN));
}
MouseEvent.prototype.isRightButtonDown = function MouseEvent_isRightButtonDown() {
  return this.flags & this.EF_RIGHT_BUTTON_DOWN;
}
MouseEvent.prototype._getEventTypeFromDOMEvent =
    function MouseEvent__getEventTypeFromDOMEvent(event) {
  switch (event.type) {
  case "mousedown":
    return this.ET_MOUSE_PRESSED;
  case "mouseup":
    return this.ET_MOUSE_RELEASED;
  case "mouseover":
    return this.ET_MOUSE_MOVED;
  case "mousemove":
    return this.ET_MOUSE_ENTERED;
  case "mouseexit":
    return this.ET_MOUSE_EXITED;
  }
  notreached();
  return this.ET_NONE;
}
MouseEvent.prototype._getEventFlagsFromDOMEvent =
    function MouseEvent__getEventTypeFromDOMEvent(event) {
  var flags = 0;
  if (event.shiftKey)
    flags |= this.EF_SHIFT_DOWN;
  if (event.ctrlKey)
    flags |= this.EF_CONTROL_DOWN;
  if (event.altKey)
    flags |= this.EF_ALT_DOWN;
  switch (event.button) {
  case 0:
    flags |= this.EF_LEFT_BUTTON_DOWN;
    break;
  case 1:
    flags |= this.EF_MIDDLE_BUTTON_DOWN;
    break;
  case 2:
    flags |= this.EF_RIGHT_BUTTON_DOWN;
    break;
  default:
    notreached();
    break;
  }
  return flags;  
}
