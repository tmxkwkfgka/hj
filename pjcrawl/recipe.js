
var hInfos = [
    {
        hid: 0,
        name: "snu",
        startPage: 'https://recruit.snuh.org/joining/recruit/list.do',
        tableSel: "#recruitNoticeVo > div.boardTypeTbl > table",
        rowSel: function(n){
            return "#recruitNoticeVo > div.boardTypeTbl > table > tbody > tr:nth-child(" + n.toString() + ") > td.alignL > a"
        },
        mapping: {
            "제목": "title",
            "시작":  "startDate",
            "끝": "endDate",
            "구분": "classify",
            "진행상황": "stage",
          }


    },
    {
        hid: 1,
        name: "cju",
        startPage:'https://www.jejunuh.co.kr/news/recruit/_/list.do',
        tableSel: '#boardSearchForm > div > div:nth-child(2) > table',
        rowSel: function(n){
            return "#boardSearchForm > div > div:nth-child(2) > table > tbody > tr:nth-child(" + n.toString() + ") > td:nth-child(2) > a"

        },
        mapping: {
            "제목": "title",
            "등록일":  "startDate",
            
          }



    }

];

module.exports = {hInfos : hInfos}