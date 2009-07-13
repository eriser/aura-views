// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function EventHandler(name, handler) {
  this.name = name;
  this.handler = handler;
}

function Widget(canvas) {
  this._rootView = new RootView(this);
  this._canvas = null;
  this._hasCapture = false;
  this._isMouseDown = false;
  switch (arguments.length) {
  case 1:
    this.setCanvas(canvas);
    break;
  case 0:
    break;
  default:
    invalidargcount();
    break;
  }
}
Widget.prototype.setContentsView = function Widget_setContentsView(contents_view) {
  this._rootView.layoutManager = new FillLayout;
  if (this._rootView.children.length > 0)
    this._rootView.removeAllChildren(true);
  this._rootView.addChild(contents_view);
  this._rootView.layout();
}
Widget.prototype._callPaintNow = function Widget__callPaintNow(widget) {
  widget.paintNow();
}
Widget.prototype.paintNow = function Widget_paintNow() {
  var cx = this._canvas.getContext("2d");
  
  cx.save();
  
  // Clip painting ot the invalid region, or the bounds of the root view if
  // there is no invalid region.
  var clip_rect = this._rootView.invalidRect;
  if (clip_rect.empty())
    clip_rect = this._rootView.bounds;
  cx.beginPath();
  cx.rect(clip_rect.x, clip_rect.y, clip_rect.width, clip_rect.height);
  cx.clip();
  this._rootView.processPaint(cx);
  cx.restore();
  
  // Validate.
  this._rootView.invalidRect = new Rect;
}
Widget.prototype.setCanvas = function Widget_setCanvas(canvas) {
  this._removeEventHandlers();
  this._canvas = canvas;
  this._addEventHandlers();
  this.resize();
}
Widget.prototype.resize = function Widget_resize() {
  if (!this._rootView.bounds.size.equals(new Size(this._canvas.width,
                                                  this._canvas.height))) {
    this._rootView.setBounds(0, 0, this._canvas.width, this._canvas.height);
    this._rootView.schedulePaint();
  }
}
Widget.prototype._addEventHandlers = function Widget__addEventHandlers() {
  var self = this;
  this._canvas.addEventListener("keydown",
                                function(event) { self.onKeyDown(event); },
                                false);
  this._canvas.addEventListener("keypress",
                                function(event) { self.onKeyDown(event); },
                                false);
  this._canvas.addEventListener("keyup",
                                function(event) { self.onKeyUp(event); },
                                false);
  this._canvas.addEventListener("mousedown",
                                function(event) { self.onMouseDown(event); },
                                false);
  this._canvas.addEventListener("mousemove",
                                function(event) { self.onMouseMove(event); },
                                false);
  this._canvas.addEventListener("mouseup",
                                function(event) { self.onMouseUp(event); },
                                false);
  this._canvas.addEventListener("mouseout",
                                function(event) { self.onMouseOut(event); },
                                false);
  this._canvas.addEventListener("mouseover",
                                function(event) { self.onMouseOver(event); },
                                false);
}
Widget.prototype._removeEventHandlers = function Widget__removeEventHandlers() {
  if (!this._canvas)
    return;
    /*
  for (var i = 0; i < this._eventHandlers.length; ++i) {
    var handler = this._eventHandlers[i];
    this._canvas.removeEventListener(handler.name, handler.handler, false);
  }
  */
}
Widget.prototype.onKeyDown = function Widget_onKeyDown(event) {
}
Widget.prototype.onKeyPress = function Widget_onKeyPress(event) {
}
Widget.prototype.onKeyUp = function Widget_onKeyUp(event) {
}
Widget.prototype.onMouseDown = function Widget_onMouseDown(event) {
  if (this._rootView.onMousePressed(new MouseEvent(event))) {
    // setcapture?!
    this._hasCapture = true;
    this._isMouseDown = true;
  }                      
}
Widget.prototype.onMouseMove = function Widget_onMouseMove(event) {
  if (this._hasCapture && this._isMouseDown) {
    this._rootView.onMouseDragged(new MouseEvent(event));
  } else {
    this._rootView.onMouseMoved(new MouseEvent(event));
  }
}
Widget.prototype.onMouseUp = function Widget_onMouseUp(event) {
  // clean up capture?!
  this._hasCapture = false;
  this._isMouseDown = false;
  this._rootView.onMouseReleased(new MouseEvent(event));
}
Widget.prototype.onMouseOut = function Widget_onMouseOut(event) {
  this._rootView._processMouseExited();
}
Widget.prototype.onMouseOver = function Widget_onMouseOver(event) {
}
