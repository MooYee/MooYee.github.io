function sha1_value(s){
    var shaObj = new jsSHA("SHA-1", "TEXT");
    shaObj.update(s);
    var hash = shaObj.getHash("HEX");
    return hash;
}


if (typeof String.prototype.endsWith != 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

function csrf_cookie_header(){
	function trim(s){
		return s.replace(/(^\s*)|(\s*$)/g, "");
	}

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
        (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
        // or any other URL that isn't scheme relative or absolute i.e relative.
        !(/^(\/\/|http:|https:).*/.test(url));
    }
    
    return {'X-CSRFToken':getCookie('csrftoken')}
}

function dsdebug(){
    var i = 0;
    var s = "";
    for(i = 0; i < arguments.length; i++){
         s += arguments[i] + ' ';
    } 
    console.debug(s);
}

function getGridOptionsByData(data){ 
    ds("getGridOptionsByData:", data);
    var columnDefs = [];
    var rowData = [];
    angular.forEach(data.columns, function(col){
        columnDefs.push({
            headerName: col,
            field: col,
        });
    });
    rowData = data.data;
    ds(columnDefs);
    ds(rowData);
    return {
        columnDefs: columnDefs,
        rowData: rowData,
 
        enableColResize: true, 
        colWidth: 75,
    };
}