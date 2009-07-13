// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function check(condition, s) {
  if (!condition) {
    if (s instanceof String)
      alert(s);
    else {
      throw 93;
      s();
    }
    throw "you fucked up, jimbo";
  }
}
function notreached(s) {
  check(false, s);
}
function notimplemented() {
  check(false, "Not yet implemented");
}
function invalidargcount() {
  notreached("invalid number of arguments");
}
function checkinheritance(o, type) {
  check(o.instanceOf(type), "Object passed of invalid type");
}

Object.prototype.instanceOf = function Object_instanceOf(ctor) {
  var o = this;
  while (o != null) {
    if (o == ctor.prototype)
      return true;
    o = o.__proto__;
  }
  return false;
}
