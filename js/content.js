(function(){
  var listeners = []
  var iframe = document.getElementById('contentIFrame0')
  var intervalCode = 0
  var infos = []
  iframe.addEventListener('load', function(){
    setTimeout(function(){
      for(var i= 0;i<listeners.length;i++){
        listeners.shift()()
      }
    },200)
  })
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    // console.log(sender.tab ?"from a content script:" + sender.tab.url :"from the extension");
    if(request.type == 'start') {
      resetAudio()
      var _document = iframe.contentWindow.document;
      var codeList = request.payload.code.split(',')
      var numberList = request.payload.number.split(',')
      var interval = parseInt(request.payload.interval) || 10
      var i = 0
      clearInterval(intervalCode)
      var cb = function(){
        var _document = document.getElementById('contentIFrame0').contentWindow.document;
        var code = codeList[i]
        var number = 0
        if(i>=numberList.length){
          number = numberList[numberList.length-1]
        }else{
          number = numberList[i]
        }
        number = number || 0
        listeners.push(function(){
          var _document = document.getElementById('contentIFrame0').contentWindow.document;
          var trs = _document.querySelectorAll('#tableList tr')
          Array.prototype.forEach.call(trs, function(tr, index){
            var list = tr.querySelectorAll('td')
            if(list.length < 3){
              return
            }
            var id = list[0].innerText
            var name = list[1].innerText
            var stock = list[list.length-1].innerText
            var info = {id: id, name: name, stock: stock, code: code, number: number, time: getNowTime() }
            if(parseInt(stock) > parseInt(number)){
              playAudio()   
            }
            var index = infos.findIndex(function(item){
              return item.id === info.id
            })
            if(index < 0){
              infos.push(info)
            }else{
              infos[index] = info
            }
          })
          sendMessageToPopup({type:'refresh', payload:infos});
        })
        _document.getElementById('txtProduct').value=codeList[i]
        _document.getElementById('btnSearch').click()
        if(i>=codeList.length-1){
          i=0
        }else{
          i++
        }
      }
      cb()
      intervalCode = setInterval(cb, interval*1000)
    }else if(request.type ==='stop'){
      resetAudio()
      clearInterval(intervalCode)
    }else if(request.type ==='get'){
      sendMessageToPopup({type:'refresh', payload:infos});
    }
  });
  
  function sendMessageToPopup(message){
    chrome.runtime.sendMessage(null, message)
  }
  function getNowTime(){
    var d = new Date()
    return d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()
  }
  var myAudio = new Audio();        // create the audio object
  myAudio.src = chrome.extension.getURL("music/music.mp3"); // assign the audio file to its src
  function playAudio(){
    myAudio.play();
  }
  function resetAudio(){
    myAudio.currentTime = 0
    myAudio.pause();
  }
})()