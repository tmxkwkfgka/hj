const phantom = require('phantom');
var a = require('debug')('worker:a');
const cheerio = require('cheerio');
const elib = require("./extLib");
var scraper = require('table-scraper');
const mongoose = require("mongoose");
var rec = null;

var mongoDB = 'mongodb://127.0.0.1/my_database';
mongoose.connect(mongoDB);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

async function crawlRun(recipe) {


   rec = recipe;

    const instance = await phantom.create(['--ignore-ssl-errors=true', '--load-images=no', '--proxy-type=none']);
    const page = await instance.createPage();

    page.on('onResourceRequested', function(requestData) {
      console.info('Requesting', requestData.url);
    });
  
    page.on('onConsoleMessage', function(msg){
      console.log("onconsole message = ", msg);
    })
    const status = await page.open(rec.startPage);
    const content = await page.render('fdffdfd.png');
    await page.injectJs("dom-to-json.js");
    var retNumEles = await page.evaluate(getPageNumElement);
    


    let pages = [];
    for(var i =0; i<retNumEles.length; i++){
    
      let sectorPage = await getSectorPage(retNumEles[i], i);
     
      
    }

   
    await instance.exit();
    
  }

  function getNumOfTrs(tbodySelector){
    console.log(tbodySelector);

  }

  function getPageNumElement(){
      var pagination  = document.getElementsByClassName("pagination")[0];
      var pageChildren = pagination.children;
      var arrRet = [];
      
      for(var i=0; i<pageChildren.length; i++){

          if(!isNaN(pageChildren[i].innerText)){

              console.log(pageChildren[i]);
            arrRet.push(toJSON(pageChildren[i]));

          }
            
      }

      return arrRet;

  }

  async function getSectorPage(numEle, pageNum){
    
    
      let ins = await phantom.create(['--ignore-ssl-errors=true', '--load-images=no', '--proxy-type=none']);
      let page = await ins.createPage();
      //page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36';
      let st = await page.open(rec.startPage);
      await page.injectJs("dom-to-json.js");
      await page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js");

      page.on('onResourceError', function(resourceError){
        console.log("onresourceError = ", resourceError);

      });

      page.on('onConsoleMessage', function(msg){
          console.log("onconsole message = ", msg);
        })

      let after =await page.evaluate(function(numEle){
          console.log("numele= ", numEle);
          
          var ev = document.createEvent("MouseEvent");
          ev.initMouseEvent(
              "click",
              true /* bubble */, true /* cancelable */,
              window, null,
              0, 0, 0, 0, /* coordinates */
              false, false, false, false, /* modifier keys */
              0 /*left*/, null
          );
//.pagination > a:nth-child(4)
          toDOM(numEle).dispatchEvent(ev);


      },numEle);

      let afterScreen = await page.render("gd_" + pageNum.toString()+ ".png");
      //console.log("page = ", page);
      let maxNum = await page.evaluate(function(tableSel){
        return $(tableSel + " > tbody")[0].children.length
      },rec.tableSel);

      let tableObj = await page.evaluate(function(tableSel){

        ret = [];
        var ths = $(tableSel + " > thead > tr > th");
        var keys = ths.map(function(i, v){
          return v.innerText;
        });

        var trs = $(tableSel + " > tbody > tr");
        for(var a=0; a<trs.length; a++){

          
          var tds = trs[a].children;
          var tmpobj = {};
          for(var b=0; b<tds.length; b++){
            tmpobj[keys[b]] = tds[b].innerText;
          }

          ret.push(tmpobj);

        }
        return ret;

      }, rec.tableSel);
      
   

      for(var g=1; g<=maxNum; g++){

        let gasiURL =  await page.evaluate(clickGasi, rec.rowSel(g));
        page.on("onLoadFinished", function(status){
          console.log("@@@@gasi url onload finished  = ", status);
        });
       
        var reTry = 0;
        while(gasiURL == "error" && reTry < 3){

          console.log("@@ 다시 evaluate", reTry, g);
          gasiURL = await page.evaluate(clickGasi, rec.rowSel(g));
          reTry++;

        }

        let currentUrl = await page.property('url');
        console.log("gasi url  =", currentUrl);
        tableObj[g-1].URL = currentUrl;
        await page.render("gasi_" +pageNum.toString()+ "_" + g.toString() + ".png");
        await page.goBack();

       }

      console.log("last tableobj ", tableObj);


      
     // return page;
  }

  function clickGasi(findStr){
          

    var element  = $(findStr)[0];

    if(!element){
      console.log("@@@@find error", findStr);
      return "error";
    }

    var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(
      "click",
      true /* bubble */, true /* cancelable */,
      window, null,
      0, 0, 0, 0, /* coordinates */
      false, false, false, false, /* modifier keys */
      0 /*left*/, null
    );
//.pagination > a:nth-child(4)
  element.dispatchEvent(ev);
  
  

  }


module.exports = {
  crawlRun: crawlRun
}

