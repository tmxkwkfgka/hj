const mongoose = require("mongoose")
,Schema = mongoose.Schema

const phantom = require('phantom');
var a = require('debug')('worker:a');
const cheerio = require('cheerio');
const elib = require("./extLib");
var scraper = require('table-scraper');

var rec = null;

var mongoDB = 'mongodb://127.0.0.1/my_database';
mongoose.connect(mongoDB);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("open", ()=>{
  console.log("connected to the mongod server");
})
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//let titleSchema = null;
//let titleModel = null;

let titleSchema = new Schema({
  title: String,
  startDate:  Date,
  endDate: Date,
  classify: String,
  stage: String,
  link: String,
  name: String,
});

let titleModel = mongoose.model("title", titleSchema);
let mapping =  null;


async function sleep(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function asyncLoadFinish(page){
  await new Promise((resolve)=>{
    page.on('onLoadFinished', (status)=>{
      console.log("아싱크 async load finish", status)
      resolve();
      
    })
  })
}

async function waitFor($config)
{
  console.log("wait for.......")
  await new Promise((resolve, reject)=>{

    function doing(resolve){
      $config._start = $config._start || new Date();

      if ($config.timeout && new Date - $config._start > $config.timeout) {
          if ($config.error) $config.error();
          if ($config.debug) console.log('timedout ' + (new Date - $config._start) + 'ms');
          return resolve();
      }
  
      //console.log("config check = ", $config.check())
      $config.check()
      .then(val=>{
        if(val){
          if ($config.debug) console.log('success waitfor' + (new Date - $config._start) + 'ms');
          return resolve();
          
        }else{
          setTimeout(doing, $config.interval || 0, resolve);
        }
      })
      .catch(err=>{
        console.log("err = ", err)
      })

    }

    doing(resolve);
  
    // if ($config.check().then()) {
    //     if ($config.debug) console.log('success waitfor' + (new Date - $config._start) + 'ms');
    //     return resolve($config.success());
    // }

    
  })

}

async function crawlRun(recipe) {

    
    mapping = recipe.mapping;

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
          var child = getAtag(pageChildren[i],0);

          if(!isNaN(child.innerText)){

              console.log(child);
              arrRet.push(toJSON(child));

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

      //await asyncLoadFinish(page);

      let afterScreen = await page.render("gd_" + pageNum.toString()+ ".png");
      //console.log("page = ", page);
      let maxNum = await page.evaluate(function(tableSel){
        return $(tableSel + " > tbody")[0].children.length
      },rec.tableSel);

      //table obj는 제목들만 모아놓은 array
      let tableObj = await page.evaluate(function(tableSel, thead){

        ret = [];
        var theadStr = "";
        if(thead)
          theadStr = " > thead > tr > th"
        else
          theadStr = " > tbody > tr > th"

        var ths = $(tableSel + theadStr);
        
        var voidSchema = {};
        var keys = ths.map(function(i, v){
          voidSchema[v.innerText] = String;
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

      }, rec.tableSel, rec.thead);
      
      console.log("table obj = ", tableObj);
      
      let pushedArr = [];
      for(var g=2; g<=maxNum; g++){

        let gasiURL =  await page.evaluate(clickGasi, rec.rowSel(g));
        
       
        var reTry = 0;
        
        while(gasiURL == "error" && reTry < 3){

          console.log("@@ 다시 evaluate", reTry, g);
          gasiURL = await page.evaluate(clickGasi, rec.rowSel(g));
          reTry++;

        }

        //await asyncLoadFinish(page);
        await waitFor({
          debug: true,  // optional
          interval: 200,  // optional
          timeout: 7000,  // optional
          check: function () {
              return page.evaluate(function(tableSel) {
                console.log("check functin ...", document.querySelectorAll(tableSel).length)
                
                var selLen = document.querySelectorAll(tableSel).length;
                if(selLen ==0)
                  return true;
                else 
                  return false;
                 
              }, rec.tableSel);
          },
          success: function () {
              console.log("im success function!!")
          },
          error: function () {} // optional
        })

     


        //게시물 url
        let currentUrl = await page.property('url');
        console.log("gasi url  =", currentUrl ,g);
      
        let ob = {};
        //console.log("tobj[g] = ", tableObj[g]);
        Object.keys(tableObj[g-1]).forEach((k,ki)=>{
          //맵핑에 있을때
        
          console.log("key and mapping", k, mapping);
          if(mapping[k] != undefined){
            ob[mapping[k]] = tableObj[g-1][k];
          }

          
        })

        //ob.link = 
        tableObj[g-1].URL = currentUrl;
        ob.link = currentUrl;
        pushedArr.push(ob);
        console.log("$$$$pushed arr = ", pushedArr);



        
        await page.render("gasi_" +pageNum.toString()+ "_" + g.toString() + ".png");
        
        let back = await page.goBack();
        
       } // g loop 

       titleModel.insertMany(pushedArr, (err)=>{
        console.log("titles pushed ", err);
      })

       

      console.log("last tableobj ", tableObj);


      
     // return page;
  } //getSectorPage

  //게시물 클릭하는 함수 url 가져오려고
  function clickGasi(findStr){
          

    //var element  = $(findStr)[0];
    var element = document.querySelector(findStr);

    if(!element){
      console.log("@@@@find error", findStr);
      return "error";
    }else{
      console.log("%%클릭게시 element = ", element, findStr, element.parentNode, element.text, element.href);
    }

    
  //   var ev = document.createEvent("MouseEvent");
  //   ev.initMouseEvent(
  //     "click",
  //     true /* bubble */, true /* cancelable */,
  //     window, null,
  //     0, 0, 0, 0, /* coordinates */
  //     false, false, false, false, /* modifier keys */
  //     0 /*left*/, null
  //   );

  // element.dispatchEvent(ev);

  //  console.log("사각형 = ", element.getBoundingClientRect().top, element.getBoundingClientRect().height);
  //  return element.getBoundingClientRect();
  element.click();
  
  }


module.exports = {
  crawlRun: crawlRun
}

