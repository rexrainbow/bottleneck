var User = function (room, conn)
{    
    this.name = "";
    this.id = 0;
    this.conn = conn;    
    this.room = room;
    room.user_joined(this);
};

var UserProto = User.prototype;

UserProto.left = function ()
{  
    this.room.user_left(this);
};

UserProto.get_info = function ()
{  
    return [this.id, this.name];
};

UserProto.is_moderator = function ()
{  
    return this.room.is_moderator(this);
};

UserProto.set_max_user_cnt = function (cnt)
{
    if (this.is_moderator())
        this.room.max_user_cnt = cnt;
};

UserProto.kick_user = function (user_id)
{
    if ((user_id != this.id) && this.is_moderator())
        this.room.kick_user(user_id);
};

UserProto.is_sync_start = function ()
{
    return this.room.is_sync_start(this);
};

module.exports = User;