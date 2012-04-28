var event_define = require('./EventDefine');
var event = require( './event' );
var UserKlass = require('./User');
var _channel = null;
var RoomMgrKlas = require('./RoomMgr');
var room_mgr = new RoomMgrKlas();


avaiable_gamerooms = {};
avaiable_chatrooms = {};

var LobbyChannel = function (channel)
{        
    // redefinie event name
    room_mgr.evtName_on_room_avaiable = event_define.on_chatroom_avaiable;
    room_mgr.evtName_on_room_unavaiable = event_define.on_chatroom_unavaiable;
    
    event.on(event_define.on_gameroom_avaiable, on_gameroom_avaiable);
    event.on(event_define.on_gameroom_unavaiable, on_gameroom_unavaiable);
    event.on(event_define.on_chatroom_avaiable, on_chatroom_avaiable);
    event.on(event_define.on_chatroom_unavaiable, on_chatroom_unavaiable); 
    
    channel.on('connection', on_connection); 
    _channel = channel;    
};

var on_connection = function (socket)
{
    socket.on('user.initialize', function (login_info, sendback_fn)
    {
        var room = room_mgr.get_room(login_info.room_name, login_info.room_id);
        if (room.has_space())
        {
            room.properties_set(login_info);
            socket.join(room.key);
            var user = new UserKlass (room, socket);
            user.name = login_info.user_name;
            socket.set('user_obj', user);
            var ret_info = {"pkg_id":room.pkg_id_gen.value,
                            "user_id":user.id,
                            "user_info_list":room.get_user_info_list(),
                            "room_data":room.storage,
                            "avaiable_gamerooms":get_avaiable_rooms_info(avaiable_gamerooms),
                            "avaiable_chatrooms":get_avaiable_rooms_info(avaiable_chatrooms),
                            };                                       
            sendback_fn(ret_info);            
            broadcast_event(room, 'user.joined', user.get_info());            
        }
        else
            socket.disconnect();
    });
    
    socket.on('message', function (msg)    
    {
        socket.get('user_obj', function (err, user_obj)
        {
            broadcast_message(user_obj.room, msg);
        });
    });
    
    socket.on('disconnect', function ()
    {
        socket.get('user_obj', function (err, user_obj)
        {
            if (user_obj == null)
                return;

            broadcast_event(user_obj.room, 'user.left', user_obj.get_info());
            user_obj.left();            
            socket.set('user_obj', null);
        });
    });

    socket.on('room.kick_user', function (user_id)    
    {
        socket.get('user_obj', function (err, user_obj)
        {
            user_obj.kick_user(user_id);
        });
    });
};

var broadcast_message = function (room, msg)
{
    _channel.in(room.key).json.send([room.pkg_id_gen.gen(), msg]);
};

var broadcast_event = function (room, event_name, msg)
{
    _channel.in(room.key).json.emit(event_name, [room.pkg_id_gen.gen(), msg]);
};

var _sort_by_sn = function(info_a, info_b)
{
    var sn_a = info_a["room_sn"];
    var sn_b = info_b["room_sn"];
    if (sn_a > sn_b)
        return 1;
    else if (sn_a > sn_b)
        return (-1);
    else
        return 0;
};

var get_avaiable_rooms_info = function(avaiable_rooms)
{
    var key, room_info;
    var info = [];
    for (key in avaiable_rooms)
    {
        room_info = avaiable_rooms[key].get_room_info();
        if (room_info["is_public"] == 1)
            info.push(room_info);
    }
    info.sort(_sort_by_sn);
    return info
}

var on_gameroom_avaiable = function (room)
{
    avaiable_gamerooms[room.key] = room;
    _channel.json.emit("gameroom.avaiable", room.get_room_info());
};

var on_gameroom_unavaiable = function (room)
{
    delete avaiable_gamerooms[room.key];
    _channel.json.emit("gameroom.unavaiable", [room.name, room.id]);
};

var on_chatroom_avaiable = function (room)
{
    avaiable_chatrooms[room.key] = room;
    _channel.json.emit("chatroom.avaiable", room.get_room_info());
};

var on_chatroom_unavaiable = function (room)
{
    delete avaiable_chatrooms[room.key];
    _channel.json.emit("chatroom.unavaiable", [room.name, room.id]);
};


module.exports = LobbyChannel;