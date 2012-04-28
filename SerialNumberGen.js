var SerialNumberGen = function (start, step)
{
    if (start == null)
        start = 0;        
    if (step == null)
        step = 1;
    this.value = start - step;
    this._step = step; 
};

var SerialNumberGenProto = SerialNumberGen.prototype;

SerialNumberGenProto.gen = function ()
{
    this.value += this._step;
    return this.value;
};

module.exports = SerialNumberGen;