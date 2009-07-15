// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function LayoutManager() {
}
LayoutManager.prototype.layout = function LayoutManager_layout(view) {
}
LayoutManager.prototype.getPreferredSize =
    function LayoutManager_getPreferredSize(view) {
  return new Size;
}

function FillLayout() {
}
FillLayout.prototype = new LayoutManager;
FillLayout.prototype.layout = function FillLayout_layout(view) {
  check(view.children.length == 1,
        "FillLayout can only be used on views with one child");
  view.children[0].setBounds(0, 0, view.width, view.height);  
}

function View() {
  this.bounds = new Rect;
  this.visible = true;
  this.parent = null;
  this.children = new Array;
  this.parentOwned = true;
  this.layoutManager = null;
}
View.prototype.setBounds = function View_setBounds() {
  switch (arguments.length) {
  case 4:
    this.setBounds(new Rect(arguments[0], arguments[1], arguments[2],
                            arguments[3]));
    break;
  case 1:
    if (this.bounds.equals(arguments[0]))
      break;
    var old_bounds = this.bounds;
    this.bounds = arguments[0];
    this.didChangeBounds(old_bounds, this.bounds);
    break;
  default:
    invalidargcount();
  }
}
View.prototype.setX = function View_setX(x) {
  this.setBounds(x, this.y, this.width, this.height);
}
View.prototype.setY = function View_setY(y) {
  this.setBounds(this.x, y, this.width, this.height);
}
View.prototype.didChangeBounds = function View_didChangeBounds(old_bounds,
                                                               new_bounds) {
  this.layout();
}
View.prototype.layout = function View_layout() {
  if (this.layoutManager) {
    this.layoutManager.layout(this);
  } else {
    for (var i = 0; i < this.children.length; ++i)
      this.children[i].layout();
  }
  this.schedulePaint();
}
View.prototype.__defineGetter__(
    "x",
    function View_x() { return this.bounds.x; });
View.prototype.__defineGetter__(
    "y",
    function View_y() { return this.bounds.y; });
View.prototype.__defineGetter__(
    "width",
    function View_width() { return this.bounds.width; });
View.prototype.__defineGetter__(
    "height",
    function View_height() { return this.bounds.height; });
View.prototype.getBounds = function View_getBounds() {
  // TODO(beng): RTL
  return this.bounds;
}
View.prototype.getLocalBounds = function View_getLocalBounds(include_border) {
  return new Rect(0, 0, this.width, this.height);
}
View.prototype.getPosition = function View_getPosition() {
  // TODO(beng): RTL.
  return this.bounds.origin;
}
View.prototype.__defineGetter__(
    "size",
    function View__get_size() { return this.bounds.size; });
View.prototype.getPreferredSize = function View_getPreferredSize() {
  if (this.layoutManager)
    return this.layoutManager.getPreferredSize();
  return new Size;
}
View.prototype.convertPointToView = function View_convertPointToView() {
  var try_other_direction = true;
  if (arguments.length == 4)
    try_other_direction = arguments[3];
  else
    check(arguments.length == 3, invalidargcount);
    
  var src = arguments[0];
  var dst = arguments[1];
  var point = arguments[2];
    
  var offset = new Point;
  for (var view = dst; view && view != src; view = view.parent)
    offset.setPoint(offset.y + view.x, offset.x + view.y);

  if (src && !view && try_other_direction) {
    var temp = this.convertPointToView(dst, src, new Point, false);
    return new Point(point.x - temp.x, point.y - temp.y);
  }
  return new Point(point.x - offset.x, point.y - offset.y);
}
View.prototype.convertPointToWidget =
    function View_convertPointToWidget(src, point) {
  check(arguments.length == 2, invalidargcount);
  
  var offset = new Point;
  for (var view = src; view; view = view.parent) {
    offset.x += view.x;
    offset.y += view.y;
  }
  return new Point(point.x + offset.x, point.y + offset.y);
}
View.prototype.convertPointFromWidget =
    function View_convertPointFromWidget(dst, point) {
  var temp = this.convertPointToWidget(dst, point);
  return new Point(point.x - temp.x, point.y - temp.y);
}
View.prototype.hitTest = function View_hitTest(point) {
  var r = this.getLocalBounds(true);
  var contains = r.contains(point);
  return contains;
  // todo(beng): hittestmasks
}
View.prototype.getViewForPoint = function View_getViewForPoint(point) {
  for (var i = 0; i < this.children.length; ++i) {
    var child = this.children[i];
    if (!child.visible)
      continue;
    var point_in_child_coords = this.convertPointToView(this, child, point);
    var htr = child.hitTest(point_in_child_coords);
    if (htr)
      return child.getViewForPoint(point_in_child_coords);
  }
  return this;
}
View.prototype.schedulePaint = function View_schedulePaint() {
  switch (arguments.length) {
    case 1:
      if (!this.visible)
        break;
      if (this.parent) {
        var paint_rect = arguments[0];
        paint_rect.offset(this.getPosition());
        this.parent.schedulePaint(paint_rect);
      }
      break;
    case 0:
      this.schedulePaint(this.getLocalBounds(true));
      break;
    default:
      invalidargcount();
  }
}
View.prototype.paint = function View_paint(cx) {
}
View.prototype.paintChildren = function View_paintChildren(cx) {
  for (var i = 0; i < this.children.length; ++i)
    this.children[i].processPaint(cx);
}
View.prototype.processPaint = function View_processPaint(cx) {
  if (!this.visible)
    return;
  cx.save();
  
  // Clip to bounds.
  cx.beginPath();
  cx.rect(this.x, this.y, this.width, this.height);
  cx.clip();
  
  // Translate.
  cx.translate(this.x, this.y);
  
  cx.save();
  this.paint(cx);
  cx.restore();
  
  this.paintChildren(cx);
  
  cx.restore();
}
View.prototype.addChild = function View_addChildView(child) {
  if (child.parent)
    child.parent.removeChild(child);
  this.children.push(child);
  child.parent = this;
  for (var view = this; view; view = view.parent)
    view.hierarchyChanged(true, this, child);
  this._propagateAddNotifications(this, child);
}
View.prototype.removeChild = function View_removeChildView(child) {
  if (!child || child.parent != this)
    return;
  child.parent = null;
  var child_index = this.children.indexOf(child);
  if (child_index >= 0)
    this.children.splice(child_index, 1);
}
View.prototype.removeAllChildren =
    function View_removeAllChildren(delete_views) {
  for (var i = 0; i < this.children.length; ++i) {
    var child = this.children[i];
    this.removeChild(child);
    if (delete_views && child.parentOwned)
      delete child;
  }
}
View.prototype.hierarchyChanged =
    function View_hierarchyChanged(is_add, parent, child) {
}
View.prototype._propagateAddNotifications =
    function View_propagateAddNotifications(parent, child) {
  for (var i = 0; i < this.children.length; ++i)
    this.children[i]._propagateAddNotifications(parent, child);
  this.hierarchyChanged(true, parent, child);
}
View.prototype.getWidget = function View_getWidget() {
  return this.parent ? this.parent.getWidget() : NULL;
}
View.prototype.getRootView = function View_getRootView() {
  return this.parent ? this.parent.getRootView() : NULL;
}
View.prototype.onMousePressed = function View_onMousePressed(e) {
  return false;
}
View.prototype.onMouseDragged = function View_onMouseDragged(e) {
  return false;
}
View.prototype.onMouseReleased = function View_onMouseReleased(e) {
}
View.prototype.onMouseMoved = function View_onMouseMoved(e) {
}
View.prototype.onMouseEntered = function View_onMouseEntered(e) {
}
View.prototype.onMouseExited = function View_onMouseExited(e) {
}
View.prototype._processMousePressed = function View__processMousePressed(e) {
  return this.onMousePressed(e);
}
View.prototype._processMouseDragged = function View__processMouseDragged(e) {
  if (this.onMouseDragged(e))
    return true;
  return false;
}
View.prototype._processMouseReleased = function View__processMouseReleased(e) {
  this.onMouseReleased(e);
}
View.prototype.setVisible = function View_setVisible(visible) {
  if (visible == this.visible)
    return;
  
  if (this.visible)
    this.schedulePaint();
  this.visible = visible;
  if (this.visible)
    this.schedulePaint();
}