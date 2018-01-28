var canvasWidth = 500;
var canvasHeight = 300;

var attackHandle = document.getElementById('attack-handle');
var decayHandle = document.getElementById('decay-handle');
var sustainHandle = document.getElementById('sustain-handle');
var releaseHandle = document.getElementById('release-handle');

$(document).ready(loaded);

var attack = {
  minPos: 0,
  maxPos: 125,
  pos: 50,
  value: 0,
  min: 0,
  max: 1
};
var decay = {
  minPos: 0,
  maxPos: 125,
  pos: 50,
  value: 0,
  min: 0,
  max: 1
};
var sustain = {
  minPos: 0,
  maxPos: canvasHeight,
  pos: canvasHeight / 2,
  value: 0.5,
  min: 0,
  max: 1
};
var release = {
  minPos: 0,
  maxPos: 125,
  pos: 50,
  value: 0,
  min: 0,
  max: 1
};

attack.value =  mapBound(attack.pos, attack.minPos, attack.maxPos, attack.min, attack.max);
decay.value =  mapBound(decay.pos, decay.minPos, decay.maxPos, decay.min, decay.max);
sustain.value =  mapBound(sustain.pos, sustain.minPos, sustain.maxPos, sustain.min, sustain.max, true);
release.value =  mapBound(release.pos, release.minPos, release.maxPos, release.min, release.max);

var c;
var ctx;
var down = false;
var lastPos = {x: 0, y: 0};
var changingAttack = false;
var changingDecay = false;
var changingSustain = false;
var changingRelease = false;
var ampEnv;
var osc;

function loaded() {
  c = document.getElementById('envelope-canvas');
  ctx = c.getContext('2d');
  redraw();
  generateEnvelope();

  var playingNote = false;
  $('body').keypress(function(e) {
    if (e.keyCode === 13) {
      if (!playingNote) {
        ampEnv.triggerAttack();
        playingNote = true;
      }
    }
  });

  $('body').keyup(function(e) {
    if (e.keyCode === 13) {
      ampEnv.triggerRelease();
      playingNote = false;
    }
  });

  $('.attack-handle').mousedown(function(e) {
    changingAttack = true;
    lastPos.x = e.pageX;
    lastPos.y = e.pageY;
  });

  $('.decay-handle').mousedown(function(e) {
    changingDecay = true;
    lastPos.x = e.pageX;
    lastPos.y = e.pageY;
  });

  $('.sustain-handle').mousedown(function(e) {
    changingSustain = true;
    lastPos.x = e.pageX;
    lastPos.y = e.pageY;
  });

  $('.release-handle').mousedown(function(e) {
    changingRelease = true;
    lastPos.x = e.pageX;
    lastPos.y = e.pageY;
  });

  $('body').mouseup(function(e) {
    if (changingAttack || changingDecay || changingSustain || changingRelease) {
      changingAttack = false;
      changingDecay = false;
      changingSustain = false;
      changingRelease = false;
      generateEnvelope();
    }
  });

  $('body').mousemove(function(e) {
    if (changingAttack) {
      var delta = e.pageX - lastPos.x;
      attack.pos = bound(attack.pos + delta, attack.minPos, attack.maxPos);
      attack.value =  mapBound(attack.pos, attack.minPos, attack.maxPos, attack.min, attack.max);
      redraw();
    } else if (changingDecay) {
      var delta = e.pageX - lastPos.x;
      decay.pos = bound(decay.pos + delta, decay.minPos, decay.maxPos);
      decay.value =  mapBound(decay.pos, decay.minPos, decay.maxPos, decay.min, decay.max);
      redraw();
    } else if (changingSustain) {
      var delta = e.pageY - lastPos.y;
      sustain.pos = bound(sustain.pos + delta, sustain.minPos, sustain.maxPos);
      sustain.value =  mapBound(sustain.pos, sustain.minPos, sustain.maxPos, sustain.min, sustain.max, true);
      redraw();
    } else if (changingRelease) {
      var delta = lastPos.x - e.pageX;
      release.pos = bound(release.pos + delta, release.minPos, release.maxPos);
      release.value =  mapBound(release.pos, release.minPos, release.maxPos, release.min, release.max);
      redraw();
    }

    lastPos.x = e.pageX;
    lastPos.y = e.pageY;
  });
}

function redraw() {
  attackHandle.style.height = canvasHeight + 'px';
  decayHandle.style.height = canvasHeight + 'px';
  releaseHandle.style.height = canvasHeight + 'px';
  sustainHandle.style.width = canvasWidth + 'px';

  attackHandle.style.top = 0;
  attackHandle.style.left = attack.pos + 'px';
  decayHandle.style.top = 0;
  decayHandle.style.left = attack.pos + decay.pos + 'px';
  releaseHandle.style.top = 0;
  releaseHandle.style.left = canvasWidth - release.pos + 'px';
  sustainHandle.style.top = sustain.pos + 'px';
  sustainHandle.style.left = 0;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.beginPath();
  ctx.moveTo(0, canvasHeight);
  ctx.lineTo(attack.pos, 0);
  ctx.lineTo(attack.pos + decay.pos, sustain.pos);
  ctx.lineTo(canvasWidth - release.pos, sustain.pos);
  ctx.lineTo(canvasWidth, canvasHeight)
  ctx.stroke();

}

function generateEnvelope() {
  /*attack.value = 0.3;
  decay.value = 0.1;
  sustain.value = 0;
  release.value = 0.5;*/
  if (ampEnv) {
    ampEnv.dispose();
  }
  if (osc) {
    osc.dispose();
  }
  ampEnv = new Tone.AmplitudeEnvelope({
    attack: attack.value,
    decay: decay.value,
    sustain: sustain.value,
    release: release.value
  }).toMaster();

  osc = new Tone.Oscillator().connect(ampEnv).start();
}

function bound(value, min, max) {
  if (min >= max) {
    throw new Error('Min must be less than max');
  }
  if (value < min) {
    value = min;
  } else if (value > max) {
    value = max;
  }
  return value;
}

// find a value between newMin and newMax based on value with respect to min and max
function mapBound(value, min, max, newMin, newMax, invert) {
  if (min >= max || newMin >= newMax) {
    throw new Error('Min must be less than max');
  }
  value -= min;
  range = max - min;
  percentage = value / range;
  newRange = newMax - newMin;
  if (invert) {
    newValue = newMax - newRange * percentage;
  } else {
    newValue = newRange * percentage + newMin;
  }
  return newValue;
}

