var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.boundaryissues = (function(){

    var cookie_name = "boundaryissues";
    var cookie_jar = {};

    var cookie = document.cookie;
    var cookies = cookie.split(";");
    
    var count_cookies = cookies.length;
    
    for (var i=0; i < count_cookies; i++){

	var str_cookie = cookies[i];
	str_cookie = str_cookie.trim();

	var pair = str_cookie.split("=");

	cookie_jar[pair[0]] = pair[1];
    }

    var self = {
	
	'can_edit': function(){
	    return (cookie_jar[ cookie_name ]) ? true : false;
	},

	'editify': function(class_name){

	    if (! self.can_edit()){
		return false;
	    }

	    if (! class_name){
		class_name = "editify";
	    }
	    
	    var els = document.getElementsByClassName(class_name);
	    var count_els = els.length;

	    for (var i=0; i < count_els; i++){

		var el = els[i];
		var wofid = el.getAttribute("data-wof-id");

		if (! wofid){
		    continue;
		}
		
		var edit_url = "https://whosonfirst.mapzen.com/boundaryissues/id/" + wofid;

		var wrapper = document.createElement("span");
		wrapper.setAttribute("class", "edit-boundary-issues");

		var link = document.createElement("a");
		link.setAttribute("href", edit_url);
		link.setAttribute("title", "Edit this place in Boundary Issues");

		link.appendChild(document.createTextNode("✍"));
		wrapper.appendChild(link);

		el.appendChild(wrapper);
	    }
	}

    };
    
    return self;

})();
