// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function Size() {
  switch (arguments.length) {
  case 2:  // Size::Size(int width, int height);
    this.width = arguments[0];
    this.height = arguments[1];
    break;
  case 1:  // Size::Size(const Size& other);
    this.width = arguments[0].width;
    this.height = arguments[0].height;
    break;
  case 0:  // Size::Size();
    this.width = this.height = 0;
    break;
  default:
    invalidargcount();
  }
}
Size.prototype.setSize = function Size_setSize(width, height) {
  this.width = width;
  this.height = height;
}
Size.prototype.enlarge = function Size_enlarge(dw, dh) {
  this.width += dw;
  this.height += dh;
}
Size.prototype.equals = function Size_equals(other_size) {
  return this.width == other_size.width && this.height == other_size.height;
}
Size.prototype.empty = function Size_empty() {
  return this.width == 0 && this.height == 0;
}
Size.prototype.toString = function Size_toString() {
  return this.width + "x" + this.height;
}

function Point() {
  switch (arguments.length) {
  case 2:  // Point::Point(int x, int y);
    this.x = arguments[0];
    this.y = arguments[1];
    break;
  case 1:  // Point::Point(const Point& other);
    this.x = arguments[0].x;
    this.y = arguments[0].y;
    break;
  case 0:  // Point::Point();
    this.x = this.y = 0;
    break;  
  default:
    invalidargcount();
  }
}
Point.prototype.setPoint = function Point_setPoint(x, y) {
  this.x = x;
  this.y = y;
}
Point.prototype.offset = function Point_offset(dx, dy) {
  switch (arguments.length) {
  case 2:
    this.x += arguments[0];
    this.y += arguments[1];
    break;
  case 1:
    this.x += arguments[0].x;
    this.y += arguments[0].y;
    break;
  default:
    invalidargcount();
  }
}
Point.prototype.equals = function Point_equals(other_point) {
  return this.x == other_point.x && this.y == other_point.y;
}
Point.prototype.toString = function Point_toString() {
  return this.x + "," + this.y;
}

function Rect() {
  switch (arguments.length) {
  case 4:  // Rect::Rect(int x, int y, int width, int height);
    this.origin = new Point(arguments[0], arguments[1]);
    this.size = new Size(arguments[2], arguments[3]);
    break;
  case 2:
    if (arguments[0].instanceOf(Point) && arguments[1].instanceOf(Size)) {
      // Rect::Rect(Point origin, Size size);
      this.origin = new Point(arguments[0]);
      this.size = new Size(arguments[1]);
    } else {
      // Rect::Rect(int width, int height);
      this.origin = new Point;
      this.size = new Size(arguments[0], arguments[1]);
    }
    break;
  case 1:  // Rect::Rect(const Rect& other);
    this.origin = new Point(arguments[0].origin);
    this.size = new Size(arguments[0].size);
    break;
  case 0:  // Rect::Rect();
    this.origin = new Point;
    this.size = new Size;
    break;
  default:
    invalidargcount();
  }
}
Rect.prototype.__defineGetter__(
    "x",
    function Rect_get_x() { return this.origin.x; });
Rect.prototype.__defineSetter__(
    "x",
    function Rect_set_x(x) { return this.origin.x = x; });
Rect.prototype.__defineGetter__(
    "y",
    function Rect_get_y() { return this.origin.y; });
Rect.prototype.__defineSetter__(
    "y",
    function Rect_set_y(y) { return this.origin.y = y; });
Rect.prototype.__defineGetter__(
    "width",
    function Rect_get_width() { return this.size.width; });
Rect.prototype.__defineSetter__(
    "width",
    function Rect_set_width(width) { return this.size.width = width; });
Rect.prototype.__defineGetter__(
    "height",
    function Rect_get_height() { return this.size.height; });
Rect.prototype.__defineSetter__(
    "height",
    function Rect_set_height(height) { return this.size.height = height; });
Rect.prototype.__defineGetter__(
    "right",
    function Rect_right() { return this.x + this.width; });
Rect.prototype.__defineGetter__(
    "bottom",
    function Rect_bottom() { return this.y + this.height; });
Rect.prototype.setRect = function Rect_setRect(x, y, w, h) {
  this.origin.setPoint(x, y);
  this.size.setSize(w, h);
}
Rect.prototype.inset = function Rect_inset() {
  switch (arguments.length) {
  case 4:
    this.origin.x += arguments[0];
    this.origin.y += arguments[1];
    this.size.width -= arguments[0] + arguments[2];
    this.size.height -= arguments[1] + arguments[3];
    break;
  case 2:
    this.inset(arguments[0], arguments[1], arguments[0], arguments[1]);
    break;
  default:
    invalidargcount();
  }  
}
Rect.prototype.offset = function Rect_offset() {
  switch (arguments.length) {
  case 2:  // Rect::offset(int x, int y);
    this.origin.offset(arguments[0], arguments[1]);
    break;
  case 1:  // Rect::offset(const Point& point);
    this.origin.offset(arguments[0]);
    break;
  default:
    invalidargcount();
  }
}
Rect.prototype.empty = function Rect_empty() {
  return this.size.empty();
}
Rect.prototype.equals = function Rect_equals(other_rect) {
  return this.origin.equals(other_rect.origin) &&
         this.size.equals(other_rect.size);
}
Rect.prototype.contains = function Rect_contains() {
  // x, y; point; rect;
  switch (arguments.length) {
  case 2:
    return arguments[0] >= this.x && arguments[0] < this.right &&
           arguments[1] >= this.y && arguments[1] < this.bottom;
  case 1:
    if (arguments[0].instanceOf(Point)) {
      return this.contains(arguments[0].x, arguments[0].y);
    } else if (arguments[0].instanceOf(Rect)) {
      var r = arguments[0];
      return r.x >= this.x && r.y >= this.y &&
             r.right < this.right && r.bottom < this.bottom;
    } else {
      notreached();
    }
    break;
  default:
    invalidargcount();
  }
  return false;
}
Rect.prototype.intersects = function Rect_intersects(other_rect) {
  return !(other_rect.x >= this.right || other_rect.right <= this.x ||
           other_rect.y >= this.bottom || other_rect.bottom <= this.y);
}
Rect.prototype.intersect = function Rect_intersect(other_rect) {
  var rx = Math.max(this.x, other_rect.x);
  var ry = Math.max(this.y, other_rect.y);
  var rr = Math.min(this.right, other_rect.right);
  var rb = Math.min(this.bottom, other_rect.bottom);
  
  if (rx >= rr || ry >= rb)
    rx = ry = rr = rb = 0; // non-intersecting.
  return new Rect(rx, ry, rr - rx, rb - ry);
}
Rect.prototype.union = function Rect_union(other_rect) {
  if (this.empty())
    return other_rect;
  if (other_rect.empty())
    return this;
  var rx = Math.min(this.x, other_rect.x);
  var ry = Math.min(this.y, other_rect.y);
  var rr = Math.max(this.right, other_rect.right);
  var rb = Math.max(this.bottom, other_rect.bottom);
  return new Rect(rx, ry, rr - rx, rb - ry);
}
Rect.prototype.subtract = function Rect_subtract(other_rect) {
  notimplemented();
}
Rect.prototype.adjustToFit = function Rect_adjustToFit(other_rect) {
  notimplemented();
}
Rect.prototype.centerPoint = function Rect_centerPoint() {
  return new Point(this.x + this.width / 2, this.y + this.height / 2)
}
Rect.prototype.toString = function Rect_toString() {
  return this.origin.toString() + " " + this.size.toString();
}
Rect.prototype.isRect = function Rect_isRect(o) {
  return o.prototype == Rect.prototype;
}
