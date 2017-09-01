var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

/*
  things this expects

  - mapzen.whosonfirst.uri
  - mapzen.whosonfirst.brands (for brands)
  - mapzen.whosonfirst.log
  - mapzen.whosonfirst.net
  - mapzen.whosonfirst.php
  - mapzen.whosonfirst.cache

*/

mapzen.whosonfirst.namify = (function() {

    var cache_ttl = 30000;

    var self = {
	
	'init': function(){

	},
	
	'namify_wof': function(){

	    var resolver = mapzen.whosonfirst.uri.id2abspath;

	    var els = document.getElementsByClassName("wof-namify");
	    var count = els.length;

	    for (var i=0; i < count; i++){
		self.namify_el(els[i], resolver);
	    }
	},

	'namify_brands': function(){

	    var resolver = mapzen.whosonfirst.brands.id2abspath;

	    var els = document.getElementsByClassName("wof-namify-brand");
	    var count = els.length;

	    for (var i=0; i < count; i++){

		self.namify_el(els[i], resolver);
	    }
	},

	'namify_el': function(el, resolver){

	    var wofid = el.getAttribute("data-wof-id");

	    if (! wofid){	
		mapzen.whosonfirst.log.info("node is missing data-wof-id attribute");
		return;
	    }

	    if (el.textContent != wofid){
		mapzen.whosonfirst.log.info("node has not-a-wof-id body");
		return;
	    }

	    var url = resolver(wofid);

	    var on_hit = function(feature){
		// console.log("NAMIFY FROM CACHE");
		self.apply_namification(el, feature);
	    };
	    
	    var on_miss = function(){
		// console.log("INVOKING ON MISS FOR " + url);
		self.namify_el_from_source(url, el);
	    };

	    if (! self.cache_get(url, on_hit, on_miss)){
		self.namify_el_from_source(url, el);
	    }

	},

	'namify_el_from_source': function(url, el){

	    var on_fetch = function(feature){

		self.apply_namification(el, feature);
		self.cache_set(url, feature);
	    };

	    var on_fail = function(rsp){
		// console.log("sad face");
	    };
	    
	    mapzen.whosonfirst.net.fetch(url, on_fetch, on_fail);
	},

	'apply_namification': function(el, feature){

		var props = feature['properties'];

		// to account for whosonfirst-brands which needs to be updated
		// to grow a 'properties' hash... (20160319/thisisaaronland)

		if (! props){
		    props = feature;
		}

	        // console.log(props);
	    
		var label = props['wof:label'];

		if ((! label) || (label == '')){

		    var possible = [
			'wof:name',
			'wof:brand_name'
		    ];

		    var count = possible.length;

		    for (var i = 0; i < count; i++) {

			var k = possible[i];

			if (props[k]){
			    label = props[k];
			    break;
			}
		    }
		}

		var enc_label = mapzen.whosonfirst.php.htmlspecialchars(label);
		el.innerHTML = enc_label;
	},

	'cache_get': function(key, on_hit, on_miss){

	    var fq_key = self.cache_prep_key(key);
	    return mapzen.whosonfirst.cache.get(fq_key, on_hit, on_miss);
	},

	'cache_set': function(key, value){

	    var fq_key = self.cache_prep_key(key);
	    return mapzen.whosonfirst.cache.set(fq_key, value);
	},

	'cache_unset': function(key){

	    var fq_key = self.cache_prep_key(key);
	    return mapzen.whosonfirst.cache.unset(fq_key);
	},

	'cache_prep_key': function(key){
	    return key + '#namify';
	}
    };

    return self;

})();
