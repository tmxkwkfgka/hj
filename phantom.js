const phantom = require('phantom');
var a = require('debug')('worker:a');
const cheerio = require('cheerio');

//let [foo, bar] = await Promise.all([getFoo(), getBar()]);

function click(el){
  
  
}


(async function() {
    const instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no', '--proxy-type=none']);
    const page = await instance.createPage();
    page.on('onResourceRequested', function(requestData) {
      console.info('Requesting', requestData.url);
    });
  
    page.on('onConsoleMessage', function(msg){
      console.log("onconsole message = ", msg);
    })
    const status = await page.open('https://recruit.snuh.org/joining/recruit/list.do');
    const content = await page.property('content');
    //console.log(content);
    let pagi = getPagination(toCheerio(content));
   
 var gdgd= "Gdgdg";
    let afterClick = await page.evaluate(function(){
      
      console.log("##clicked el = ");

      var paginationExtract = $(".pagination");
      var leftArrowElement = paginationExtract.find(".prevBtn");
      var rightArrowElement =  paginationExtract.find(".nextBtn");
      
      var numPages = [];
      var number = 1;
			for(var i=0; i<paginationExtract.children().length; i++){
        //	a(paginationExtract.children()[i].children[0].data);
          if(paginationExtract.children()[i] && $.isNumeric(paginationExtract.children()[i].text * 1)){
            numPages.push(paginationExtract.children()[i]);
           
            
          }
        }
      
        return numPages.length;
        //클릭이벤트 먹힘
      // var ev = document.createEvent("MouseEvent");
      // ev.initMouseEvent(
      //     "click",
      //     true /* bubble */, true /* cancelable */,
      //     window, null,
      //     0, 0, 0, 0, /* coordinates */
      //     false, false, false, false, /* modifier keys */
      //     0 /*left*/, null
      // );
      // numPages[2].dispatchEvent(ev);

    });

    a("##afterclick return = ", afterClick);

    for(var i =1; i<afterClick+1; i++){
      a("page num = ", i);
      openPage('https://recruit.snuh.org/joining/recruit/list.do', i);
    }
    let clickContent = await page.property('content');

    //a("click Content = ", clickContent);
  
    await instance.exit();
  })();



  async function openPage(url, num){

    const instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no', '--proxy-type=none']);
    const page = await instance.createPage();
    //page.setting("loadImages", false)  ;
    page.on('onResourceRequested', function(requestData) {
      console.info('Requesting', requestData.url);
    });
  
    page.on('onConsoleMessage', function(msg){
      console.log("onconsole message = ", msg);
    })
    const status = await page.open(url);
    const content = await page.property('content');

    let afterClick = await page.evaluate(function(num){
      console.log("##in openpage func num", num);

      var paginationExtract = $(".pagination");
      var leftArrowElement = paginationExtract.find(".prevBtn");
      var rightArrowElement =  paginationExtract.find(".nextBtn");
      
      var numPages = [];
			for(var i=0; i<paginationExtract.children().length; i++){
        //	a(paginationExtract.children()[i].children[0].data);
          if(paginationExtract.children()[i] && $.isNumeric(paginationExtract.children()[i].text * 1)){
            numPages.push(paginationExtract.children()[i]);
          
          }
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
      numPages[num].dispatchEvent(ev);

    }, num)

    a("##afterclick return = ");
    let clickContent = await page.property('content');

    a("@@click Content = ", clickContent);
  
    await instance.exit();


      
  }
  function getPagination($){

    let paginationExtract = $(".pagination");
		let leftArrowElement = paginationExtract.find($(".prevBtn"));
		let rightArrowElement =  paginationExtract.find($(".nextBtn"));
		
			let numPages = [];
			for(var i=0; i<paginationExtract.children().length; i++){
			//	a(paginationExtract.children()[i].children[0].data);
				if(paginationExtract.children()[i].children[0].data && Number.isInteger(paginationExtract.children()[i].children[0].data * 1)){
					numPages.push(paginationExtract.children()[i].children[0]);
				}
			}
				
		return  {
				prev : leftArrowElement,
				next: rightArrowElement,
				numPages: numPages
			};

  }

  function toCheerio(htmlpage){
		return cheerio.load(htmlpage, {
			decodeEntities: false});
  }
  
  