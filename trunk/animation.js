// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function AnimationDelegate() {
}
AnimationDelegate.prototype.animationStarted =
    function AnimationDelegate_animationStarted(animation) {
}
AnimationDelegate.prototype.animationEnded =
    function AnimationDelegate_animationEnded(animation) {
}
AnimationDelegate.prototype.animationCanceled =
    function AnimationDelegate_animationCanceled(animation) {
}
AnimationDelegate.prototype.animationProgressed =
    function AnimationDelegate_animationProgressed(animation) {
}

function Animation() {
  this.animating = false;
  this._iterationCount = 0;
  this._currentIteration = 0;
  this._state = 0.0;
  switch (arguments.length) {
  case 3:
    this.setDuration(arguments[0]);
    this._frameRate = arguments[1];
    this._delegate = arguments[2];
    break;
  case 2:
    this.setDuration(0);
    this._frameRate = arguments[0];
    this._delegate = arguments[1];
    break;
  case 0:
    // Prototype initialization.
    break;
  default:
    invalidargcount();
  }
  this._timerInterval = this._calculateInterval(this._frameRate);
  this._timer = new RepeatingTimer;
}
Animation.prototype.reset = function Animation_reset() {
  this._currentIteration = 0;
}
Animation.prototype.getCurrentValue = function Animation_getCurrentValue() {
  return this._state;
}
Animation.prototype.start = function Animation_start() {
  if (!this.animating) {
    this._timer.start(this._timerInterval, this.tick, this);
    this.animating = true;
    if ("animationStarted" in this._delegate)
      this._delegate.animationStarted(this);
  }
}
Animation.prototype.stop = function Animation_stop() {
  if (this.animating) {
    this._timer.stop();
    
    this.animating = false;
    if (this._state >= 1.0) {
      if ("animationEnded" in this._delegate)
        this._delegate.animationEnded(this);
    } else {
      if ("animationCanceled" in this._delegate)
        this._delegate.animationCanceled(this);
    }
  }
}
Animation.prototype.end = function Animation_end() {
  if (this.animating) {
    this._timer.stop();
    this.animating = false;
    this.animateToState(1.0);
    if ("animationEnded" in this._delegate)
      this._delegate.animationEnded(this);
  }
}
Animation.prototype.setDuration = function Animation_setDuration(duration) {
  this._duration = duration;
  if (this._duration < this._timerInterval)
    this._duration = this._timerInterval;
  this._iterationCount = this._duration / this._timerInterval;
  this._currentIteration = 0;
}
Animation.prototype.tick = function Animation_tick() {
  this._state = ++this._currentIteration / this._iterationCount;
  if (this._state >= 1.0)
    this._state = 1.0;
  this.animateToState(this._state);
  if ("animationProgressed" in this._delegate)
    this._delegate.animationProgressed(this);
  if (this._state == 1.0)
    this.stop();
}
Animation.prototype._calculateInterval =
    function Animate__calculateInterval(frame_rate) {
  return Math.max(1000 / frame_rate, 10);
}

function SlideAnimation(delegate) {
  Animation.call(this, this.DEFAULT_FRAMERATE, delegate);
  this.tweenType = this.TT_EASE_OUT;
  this.showing = false;
  this._valueStart = 0;
  this._valueEnd = 0;
  this._valueCurrent = 0;
  this.slideDuration = this.DEFAULT_DURATION;
}
SlideAnimation.prototype = new Animation;
SlideAnimation.prototype.DEFAULT_FRAMERATE = 50;
SlideAnimation.prototype.DEFAULT_DURATION = 120;
SlideAnimation.prototype.TT_NONE = 0;
SlideAnimation.prototype.TT_EASE_OUT = 1;
SlideAnimation.prototype.TT_EASE_IN = 2;
SlideAnimation.prototype.TT_EASE_IN_OUT = 3;
SlideAnimation.prototype.TT_FAST_IN_OUT = 4;
SlideAnimation.prototype.TT_EASE_OUT_SNAP = 5;
SlideAnimation.prototype.isClosing = function SlideAnimation_isClosing() {
  return this._valueEnd < this._valueCurrent;
}
SlideAnimation.prototype.reset = function SlideAnimation_reset() {
  switch (arguments.length) {
  case 1:
    this.stop();
    this.showing = arguments[0] == 1;
    this._valueCurrent_valu = arguments[0];
    break;
  case 0:
    this.reset(0);
    break;
  default:
    invalidargcount();
  }
}
SlideAnimation.prototype.show = function SlideAnimation_show() {
  if (this.showing)
    return;
  
  this.showing = true;
  this._valueStart = this._valueCurrent;
  this._valueEnd = 1.0;
  if (this.slideDuration == 0) {
    this.animateToState(1.0);
    return;
  } else if (this._valueCurrent == this._valueEnd) {
    return;
  }
  
  this.setDuration(this.slideDuration * (1 - this._valueCurrent));
  this.start();
}
SlideAnimation.prototype.hide = function Animation_hide() {
  if (!this.showing)
    return;
  
  this.showing = false;
  this._valueStart = this._valueCurrent;
  this._valueEnd = 0.0;
  if (this.slideDuration == 0) {
    this.animateToState(0.0);
    return;
  } else if (this._valueCurrent == this._valueEnd) {
    return;
  }
  this.setDuration(this.slideDuration * this._valueCurrent);
  this.start();
}
SlideAnimation.prototype.animateToState =
    function SlideAnimation_animateToState(state) {
  if (state > 1.0)
    state = 1.0;
  switch (this.tweenType) {
  case this.TT_EASE_IN:
    state = Math.pow(state, 2);
    break;
  case this.TT_EASE_IN_OUT:
    if (state < 0.5)
      state = Math.pow(state * 2, 2) / 2.0;
    else
      state = 1.0 - (Math.pow((state - 1.0) * 2, 2) / 2.0);
    break;
  case this.TT_FAST_IN_OUT:
    state = (Math.pow(state - 1.0) * 2, 2) / 2.0;
    break;
  case this.TT_NONE:
    // state remains linear
    break;
  case this.TT_EASE_OUT_SNAP:
    state = 0.95 * (1.0 - Math.pow(1.0 - state, 2));
    break;
  case this.TT_EASE_OUT:
    state = 1.0 - Math.pow(1.0 - state, 2);
    break;
  default:
    notreached();
  }
  
  this._valueCurrent =
      this._valueStart + (this._valueEnd - this._valueStart) * state;
  if ((this.tweenType == this.TT_EASE_OUT_SNAP) &&
      (Math.abs(this._valueCurrent - this._valueEnd) <= 0.06)) {
    this._valueCurrent = this._valueEnd;    
  }
  if ((this._valueEnd >= this._valueStart && this._valueCurrent > this._valueEnd) ||
      (this._valueEnd < this._valueStart && this._valueCurrent < this._valueEnd)) {
    this._valueCurrent = this._valueEnd;
  }
}

