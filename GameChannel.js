var event_define = require('./EventDefine');
var event = require( './event' );
var UserKlass = require('./User');
var _channel = null;
var RoomMgrKlas = require('./RoomMgr');
var room_mgr = new RoomMgrKlas();


var GameChannel = function (channel)
{        
    // redefinie event name
    room_mgr.evtName_on_room_avaiable = event_define.on_gameroom_avaiable;
    room_mgr.evtName_on_room_unavaiable = event_define.on_gameroom_unavaiable;

    channel.on('connection', on_connection); 
    _channel = channel;    
};

var on_connection = function (socket)
{
    socket.on('user.initialize', function (login_info, sendback_fn)
    {
        var room = room_mgr.get_room(login_info);                                     
        if (room.has_space())
        {
            socket.join(room.key);
            var user = new UserKlass (room, socket);
            user.name = login_info.user_name;
            socket.set('user_obj', user);
            var ret_info = {"pkg_id":room.pkg_id_gen.value,
                            "user_id":user.id,
                            "user_info_list":room.get_user_info_list(),
                            "room_data":room.storage};                                       		
            sendback_fn(ret_info);			
            broadcast_event(room, 'user.joined', user.get_info());      
			event.emit(event_define.on_joined_gameroom, room);
        }
        else
        {
            socket.emit("room.unavaliable");
            socket.disconnect();
        }
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

    socket.on('room.set_MAXUSERCNT', function (max_user_cnt)    
    {
        socket.get('user_obj', function (err, user_obj)
        {
            user_obj.set_max_user_cnt(max_user_cnt);
        });
    }); 

    socket.on('room.kick_user', function (user_id)    
    {
        socket.get('user_obj', function (err, user_obj)
        {
            user_obj.kick_user(user_id);
        });
    });
    
    socket.on('room.state.set', function (state)    
    {
        socket.get('user_obj', function (err, user_obj)
        {
            user_obj.room.state_set(state);
        });
    });    

    socket.on('room.storage.set', function (key, data)    
    {
        socket.get('user_obj', function (err, user_obj)
        {
            user_obj.room.storage[key] = data;
        });
    }); 

    socket.on('room.syncStart', function ()    
    {
        socket.get('user_obj', function (err, user_obj)
        {
            if (user_obj.is_sync_start())
                broadcast_event(user_obj.room, 'room.syncStart');
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

module.exports = GameChannel;