// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function Timer() {
  this._callback = null;
  this._o = null;
  this._delay = 0;
  this._timerID = -1;
}
Timer.prototype.start = function Timer_start(delay, callback, o) {
  this._delay = delay;
  this._callback = callback;
  this._o = o;
  this._runTimer();
}
Timer.prototype.stop = function Timer_stop() {
  this._clearTimer();
  this._timerID = -1;
}
Timer.prototype._runTimer = function Timer__runTimer() {
  notreached();
}
Timer.prototype._clearTimer = function Timer__clearTimer() {
  notreached();
}

function OneShotTimer() {
  Timer.call(this);
}
OneShotTimer.prototype = new Timer;
OneShotTimer.prototype._runTimer = function OneShotTimer__runTimer() {
  var callback = this._callback;
  var o = this._o;
  function callbackRunner() {
    callback.call(o);
  }
  this._timerID = setTimeout(callbackRunner, this._delay);
}
OneShotTimer.prototype._clearTimer = function OneShotTimer__clearTimer() {
  clearTimeout(this._timerID);
}

function RepeatingTimer() {
  Timer.call(this);
}
RepeatingTimer.prototype = new Timer;
RepeatingTimer.prototype._runTimer = function RepeatingTimer__runTimer() {
  var callback = this._callback;
  var o = this._o;
  function callbackRunner() {
    callback.call(o);
  }
  this._timerID = setInterval(callbackRunner, this._delay);
}
RepeatingTimer.prototype._clearTimer = function RepeatingTimer__clearTimer() {
  clearInterval(this._timerID);
}
