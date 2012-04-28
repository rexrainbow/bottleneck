var event = require( './event' );
var SerialNumberGenKlass = require("./SerialNumberGen");
var util = require("./util");

var Room = function (room_mgr, key, name, id)
{     
    this._room_mgr = room_mgr;
    this._sn = 0;
    this.key = key;
    this.name = name;    
    this.id = id;
    this.max_user_cnt = 0;    
    this.pkg_id_gen = new SerialNumberGenKlass(1);
    this._user_id_gen = new SerialNumberGenKlass(1);
    this._users = [];
    this._is_avaiable = false;
    this.properties = {};
    this.storage = {};
    this._sync_list = [];
    this._is_open = true;

};

var RoomProto = Room.prototype;

RoomProto.properties_set = function (properties)
{
    this.properties["src"] = properties["src"];    
    this.properties["description"] = properties["description"];
    this.properties["is_public"] = properties["is_public"];    
};

RoomProto.state_set = function (state)
{
    if (state==2)   
        this._is_open = !this._is_open;
    else
        this._is_open = (state==1)? true:false;
    this._avaiable_update();
};

RoomProto.get_room_info = function ()
{   
    return {"src":this.properties["src"],
            "room_sn":this._sn,
            "room_name":this.name,
            "room_id":this.id,
            "room_description":this.properties["description"],
            "is_public":this.properties["is_public"],
            };
};

RoomProto.is_empty = function ()
{
    return (this._users.length==0);
};

RoomProto.has_space = function ()
{
    var has_space;
    if (this._is_open)
    {
        if (this.max_user_cnt==0)
            has_space = true;
        else
            has_space = (this.max_user_cnt < this._users.length);
    }
    else
        has_space = false;
        
    return has_space;
};

RoomProto.is_moderator = function (user)
{
    return (this._users[0] == user);
};

RoomProto._sync_list_remove = function (_user)
{
    var i = this._users.indexOf(_user);
    if (i != null)
    {
        if (i == 0)
            this._users.shift();
        else
            this._users.splice(i, 1);
    }
};

RoomProto._avaiable_update = function ()
{
    var is_avaiable_save = this._is_avaiable;
    if (this._is_open)
    {
        if (this.is_empty())
            this._is_avaiable = false;
        else if (this.has_space())
            this._is_avaiable = true;
    }
    else
        this._is_avaiable = false;
    if (is_avaiable_save != this._is_avaiable)
    {
        var evtName = (this._is_avaiable)? 
                      this._room_mgr.evtName_on_room_avaiable:
                      this._room_mgr.evtName_on_room_unavaiable;
        event.emit(evtName, this);
    }
};

RoomProto.user_joined = function (_user)
{
    _user.id = this._user_id_gen.gen();
    this._users.push(_user);
    this._avaiable_update();
};

RoomProto.user_left = function (_user)
{
    this._users = util.list_remove(this._users, _user);
    this._sync_list = util.list_remove(this._sync_list, _user); 
    this._avaiable_update();   
    this._room_mgr.remove_empty_room(this);
};

RoomProto.get_user_id_list = function ()
{
    var user_id_list = [];
    var i, user_cnt=this._users.length;
    for (i=0; i<user_cnt; i++)    
        user_id_list.push(this._users[i].id);
    return user_id_list;
};

RoomProto.get_user_info_list = function ()
{
    var user_info_list = [];
    var i, user_cnt=this._users.length;
    for (i=0; i<user_cnt; i++)    
        user_info_list.push(this._users[i].get_info());
    return user_info_list;
};

RoomProto.kick_user = function (user_id)
{
    var i, _user, user_cnt= this._users.length;
    var is_success = false;
    for (i=0; i<user_cnt; i++)
    {
        _user = this._users[i];
        if (_user.id == user_id)
        {
            is_success = true;
            break;
        };
    }
    if (is_success)
        this.user_left(_user);
    return is_success;
};

RoomProto.is_sync_start = function (_user)
{
    if (this._sync_list.length == 0)
        this._sync_list = this._users.slice();
    this._sync_list = util.list_remove(this._sync_list, _user);       
    return (this._sync_list.length == 0);
};

module.exports = Room;