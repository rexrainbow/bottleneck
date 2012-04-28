module.exports = {


list_remove : function (_list, _obj)
{
    var i = _list.indexOf(_obj);
    if (i != null)
    {
        if (i == 0)
            _list.shift();
        else
            _list.splice(i, 1);
    }
    return  _list;  
}


};