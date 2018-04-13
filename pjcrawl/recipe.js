
var hInfos = [
    {
        hid: 0,
        startPage: 'https://recruit.snuh.org/joining/recruit/list.do',
        tableSel: "#recruitNoticeVo > div.boardTypeTbl > table",
        rowSel: function(n){
            return "#recruitNoticeVo > div.boardTypeTbl > table > tbody > tr:nth-child(" + n.toString() + ") > td.alignL > a"
        },


    },
    {



    }

];

module.exports = {hInfos : hInfos}