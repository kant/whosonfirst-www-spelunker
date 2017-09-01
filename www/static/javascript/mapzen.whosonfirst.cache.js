var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.cache = (function() {

    var default_cache_ttl = 30000; // ms
    var disable_cache = false;

    var self = {

	'get': function(key, on_hit, on_miss, cache_ttl){

	    if (typeof(localforage) != 'object'){
		return false;
	    }
	    
	    localforage.getItem(key, function (err, rsp){
			    
		if ((err) || (! rsp)){
		    on_miss();
		    return;
		}
		
		var data = rsp['data'];
		
		if (! data){
		    on_miss();
		    return;
		}
		
		var dt = new Date();
		var ts = dt.getTime();
		
		var then = rsp['created'];
		var diff = ts - then;
		
		if (diff > cache_ttl){
		    self.unset(key);
		    on_miss();
		    return;
		}
		
		on_hit(data);
	    });
	    
	    return true;
	},

	'set': function(key, data){

	    if (typeof(localforage) != 'object'){
		return false;
	    }
	    
	    if (disable_cache){
		return false;
	    }
	    
	    var dt = new Date();
	    var ts = dt.getTime();
	    
	    var wrapper = {
		'data': value,
		'created': ts
	    };
	    
	    localforage.setItem(key, wrapper).then(function(v){
		// woo woo
	    }).catch(function(err){
		
		// https://github.com/whosonfirst/whosonfirst-www-spelunker/issues/126
		
		if (err['code'] == 4){
		    disable_cache = true;
		}

		console.log("[cache]", "ERR", key, err);
	    });
	    
	    return true;
	},

	'unset': function(key){

	    if (typeof(localforage) != 'object'){
		return false;
	    }
	    
	    localforage.removeItem(key);
	    return true;
	}
	
    };
    
    return self;

})();
