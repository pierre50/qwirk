/*---------------------------------------------------------
.______    __   _______ .______      .______       _______ 
|   _  \  |  | |   ____||   _  \     |   _  \     |   ____|
|  |_)  | |  | |  |__   |  |_)  |    |  |_)  |    |  |__   
|   ___/  |  | |   __|  |      /     |      /     |   __|  
|  |      |  | |  |____ |  |\  \----.|  |\  \----.|  |____ 
| _|      |__| |_______|| _| `._____|| _| `._____||_______|
----------------------------------------------------------*/                                                         


var emoji = [ 
    {txt:':@',img:'angry'},
    {txt:':)',img:'blush'},
    {txt:':/ ',img:'confused'},
    {txt:":'(",img:'cry'},
    {txt:':(',img:'disappointed'},
    {txt:':D',img:'grinning'},
    {txt:'*-*',img:'heart_eyes'},
    {txt:'O:)',img:'innocent'},
    {txt:":')",img:'joy'},
    {txt:':|',img:'neutral_face'},
    {txt:':O',img:'open_mouth'},
    {txt:'u_u',img:'pensive'},
    {txt:':P',img:'stuck_out_tongue'},
    {txt:';P',img:'stuck_out_tongue_winking_eye'},
    {txt:'8)',img:'sunglasses'},
    {txt:';)',img:'wink'}
]


function toEmoji(element) {

    for (var j = 0; j < emoji.length; j++) {
        var someText = emoji[j].txt,
            index, child, img;
        for (var i = 0, il = element.childNodes.length; i < il; i++) {
            child = element.childNodes[i];
            if (child.nodeType == 1) {
                toEmoji(child);
            } else if (child.nodeType == 3) {
                index = child.data.indexOf(someText);
                if (index >= 0) {
                    var img = document.createElement('img'),
                        sel, rng;
                    img.className = "emoji-small";
                    img.src = "/img/emoji/"+emoji[j].img+".png";
                    child.splitText(index);
                    child.nextSibling.splitText(someText.length);
                    child.parentNode.replaceChild(img, child.nextSibling);
                    if (document.createRange) {
                        rng = document.createRange();
                        rng.selectNodeContents(element);
                        rng.collapse(false);
                        sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(rng);
                    } else if (document.selection) {
                        rng = document.body.createTextRange();
                        rng.moveToElementText(element);
                        rng.collapse(false);
                        rng.select();
                    }
                }
            }
        }
    }
}

function raw(text){
    text=text.replaceAll("&amp;","&");
    text=text.replaceAll("&amp;","&");
    text=text.replaceAll("&lt;","<");
    text=text.replaceAll("&gt;",">");
    return text;
}

function toEmoji2(text) {
    for (var j = 0; j < emoji.length; j++) {
        text=text.replaceAll(emoji[j].txt,'<img class="emoji-small" src="/img/emoji/'+emoji[j].img+'.png">');
    }
    return text;
}

function unEmoji(text){
    for (var j = 0; j < emoji.length; j++) {
        text=text.replaceAll('<img class="emoji-small" src="/img/emoji/'+emoji[j].img+'.png">',emoji[j].txt);
    }
    return text;
}

String.prototype.replaceAll = function(str1, str2, ignore) 
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
};

function isValid(str){
 return !/[@~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
}

function ImageExist(url) 
{
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status != 404;
}

function isImg(str) {
    if ( /\.(jpe?g|png|gif|bmp)$/i.test(str))
        return true;
    else
        return false;
}

function isURL(str) {
    var regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/g;
    var url = new RegExp(regex, 'i');
    return url.test(str);
}

function getURL(str) {
    var regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/g;
    var url = new RegExp(regex, 'i');
    var tab = str.split(regex);
    for (var i = 0 ; i < tab.length ; i++){
        if (url.test(tab[i]) == true) {
            console.log(tab[i]);
            if(isHTTP(tab[i]) == true)
                tab[i] = '<a target="_blank" href="http://'+tab[i]+'">'+tab[i]+'</a>';
            else
                tab[i] = '<a target="_blank" href="'+tab[i]+'">'+tab[i]+'</a>';
        }
    }
    return tab.join("");
}

function isHTTP(str) {
    var regex = new RegExp("^(http|https|ftp)://", "i");
    if (regex.test(str))
        return false;
    else
        return true;
}

function guid() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function getCaret(el) { 
    if (el.selectionStart) { 
        return el.selectionStart; 
    } else if (document.selection) { 
        el.focus(); 
        var r = document.selection.createRange(); 
        if (r == null) { 
            return 0; 
        } 
        var re = el.createTextRange(), 
            rc = re.duplicate(); 
        re.moveToBookmark(r.getBookmark()); 
        rc.setEndPoint('EndToStart', re); 
        return rc.text.length; 
    }  
    return 0; 
}

