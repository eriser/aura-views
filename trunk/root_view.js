// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function RootView(widget) {
  this.widget = widget;
  this._mouseCaptureView = null;
  this._mouseMoveView = null;
  this.invalidRect = new Rect;
}
RootView.prototype = new View;
RootView.prototype.schedulePaint = function RootView_schedulePaint() {
  switch (arguments.length) {
    case 1:
      if (!this.visible)
        break;
      this.invalidRect = this.invalidRect.union(arguments[0]);
      setTimeout(Widget.prototype._callPaintNow, 0, this.widget); 
      break;
    case 0:
      this.schedulePaint(this.getLocalBounds(true));
      break;
    default:
      invalidargcount();
  }
}
RootView.prototype.getWidget = function RootView_getWidget() {
  return this.widget;
}
RootView.prototype.getRootView = function RootView_getRootView() {
  return this;
}
RootView.prototype.onMousePressed = function RootView_onMousePressed(e) {
  for (this._mouseCaptureView = this.getViewForPoint(e.location);
       this._mouseCaptureView && this._mouseCaptureView != this;
       this._mouseCaptureView = this._mouseCaptureView.parent) {
    if (this._mouseCaptureView._processMousePressed(
            new MouseEvent(e, this, this._mouseCaptureView))) {
      return true;
    }
  }
  return false;
}
RootView.prototype.onMouseDragged = function RootView_onMouseDragged(e) {
  if (this._mouseCaptureView) {
    var point_in_target_coords =
        this.convertPointToView(this, this._mouseCaptureView, point);
    return this._mouseCaptureView._processMouseDragged(
        new MouseEvent(point_in_target_coords, e.type, e.flags));
  }
  return false;
}
RootView.prototype.onMouseReleased = function RootView_onMouseReleased(e) {
  if (this._mouseCaptureView) {
    var point_in_target_coords =
        this.convertPointToView(this, this._mouseCaptureView, e.location);
    var view = this._mouseCaptureView;
    this._mouseCaptureView = null;
    view._processMouseReleased(
        new MouseEvent(point_in_target_coords, e.type, e.flags));
  }
}
RootView.prototype.onMouseMoved = function RootView_onMouseMoved(e) {
  var view = this.getViewForPoint(e.location);
  // TODO(beng): walk up to find first enabled view.
  if (view && view != this) {
    if (view != this._mouseMoveView) {
      this._processMouseExited();
      this._mouseMoveView = view;
      this._mouseMoveView.onMouseEntered(
            new MouseEvent(Event.prototype.ET_MOUSE_ENTERED, this,
                           this._mouseMoveView, e.location, 0));
    }
    this._mouseMoveView.onMouseMoved(
        new MouseEvent(Event.prototype.ET_MOUSE_MOVED, this,
                       this._mouseMoveView, e.location, 0));
  } else {
    this._processMouseExited();
  }
}
RootView.prototype._processMouseExited =
    function RootView__processMouseExited(e) {
  if (this._mouseMoveView) {
    this._mouseMoveView.onMouseExited(
        new MouseEvent(new Point, Event.prototype.ET_MOUSE_EXITED, 0));
  }
}
RootView.prototype.paint = function RootView_paint(cx) {
  cx.fillStyle = "rgb(130, 130, 130)";
  cx.fillRect(this.x, this.y, this.width, this.height);
}
