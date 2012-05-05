var event = require( './event' );
var RoomKlas = require('./Room');
var SerialNumberGenKlass = require("./SerialNumberGen");

var RoomMgr = function ()
{
    this.room_sn_gen = new SerialNumberGenKlass(1);    
    this.rooms = {};
    this.evtName_on_room_avaiable = "on_room_avaiable";
    this.evtName_on_room_unavaiable = "on_room_unavaiable";
};

var RoomMgrProto = RoomMgr.prototype;

RoomMgrProto.get_room_key = function (name, id)
{
    return name+":"+id;
};

RoomMgrProto.get_room = function (info)
{
    var key = this.get_room_key(info.room_name, info.room_id);
    var room = this.rooms[key];
    if (room == null)
    {
        // create a new room
		info.key = key;
        room = new RoomKlas(this, info);
        room._sn = this.room_sn_gen.gen();
        this.rooms[key] = room;
    }
    else
    {
        // join a existed room
    }
       
    return room;
};

RoomMgrProto.remove_empty_room = function (room)
{ 
    if (room.is_empty())
    {
        delete this.rooms[room.key];
    }
};

module.exports = RoomMgr;