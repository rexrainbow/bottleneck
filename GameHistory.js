var GameHistory = function (record_max)
{     
    this._record_max = record_max;
    this._name2url = {};
    this._record_fifo = [];
    this.report = [];
};

var GameHistoryProto = GameHistory.prototype;

GameHistoryProto.get_report = function ()
{
    return this.report;
};
GameHistoryProto._get_report_JSON = function ()
{
    return JSON.stringify(this.report);
};

GameHistoryProto.add_item = function (name, url)
{
    //if (url.substring(0,4) == "file")
	//    return null;
    if (this._record_fifo.length >= this._record_max)
        delete this._name2url[this._record_fifo.shift()];
        
    var report_save = this._get_report_JSON();
    this._record_fifo.push(name);
    this._name2url[name] = url;	
    var report = this._update_report();	
	return (this._get_report_JSON() != report_save)? report:null;
};

var SORTBYCNT = function(item_A, item_B)
{
    var cnt_A = item_A[1];
    var cnt_B = item_B[1];
    if (cnt_A > cnt_B)
        return 1;
    else if (cnt_A == cnt_B)
        return 0;
    else
        return (-1);
};

GameHistoryProto._update_report = function ()
{
    var name2cnt = {};
    var i, name, item;
    var cnt = this._record_fifo.length;
    for (i=0; i<cnt; i++)
    {
        name = this._record_fifo[i];
        if (name in name2cnt)
            name2cnt[name]++;
        else
            name2cnt[name] = 1;            
    }
    this.report.length = 0;
    for (name in name2cnt)
        this.report.push([name, name2cnt[name]]);
        
    this.report.sort(SORTBYCNT);
    cnt = this.report.length;
    for (i=0; i<cnt; i++)
    {
        item = this.report[i];
        item.push(this._name2url[item[0]]);
    }
	return this.report;  // [name, cnt, url]
};

module.exports = GameHistory;