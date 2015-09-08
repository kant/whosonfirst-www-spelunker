var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.spelunker = (function(){

	var self = {
		
		'toggle_data_endpoint': function(placetype){

			// mapzen.whosonfirst.data.endpoint('https://s3.amazonaws.com/whosonfirst.mapzen.com/data/');

			var host = location.host;
			var root = "https://" + host + "/";

			if (placetype == 'venue'){
				mapzen.whosonfirst.data.endpoint(root + 'venues/');
			}

			else {
				mapzen.whosonfirst.data.endpoint(root + 'data/');
			}
		},

		'draw_list': function(classname){

			var locs = document.getElementsByClassName(classname);
			var count = locs.length;
			
			var swlat = undefined;
			var swlon = undefined;
			var nelat = undefined;
			var nelon = undefined;
			
			var features = [];
			
			for (var i=0; i < count; i++){
				
				var loc = locs[i];
				var lat = loc.getAttribute("data-latitude");
				var lon = loc.getAttribute("data-longitude");
				
				var anchor = loc.getElementsByTagName("a");
				anchor = anchor[0];			  
				var name = anchor.textContent;
				
				if ((! swlat) || (lat < swlat)){
					swlat = lat;
				}					

				if ((! swlon) || (lat < swlon)){
					swlon = lon;
				}					

				if ((! nelat) || (lat > nelat)){
					nelat = lat;
				}					

				if ((! nelon) || (lat < nelon)){
					nelon = lon;
				}					

				var geom = { 'type': 'Point', 'coordinates': [ lon, lat ] };
				var props = { 'lflt:label_text': name };
				
				var feature = {'type': 'Feature', 'geometry': geom, 'properties': props };					
				features.push(feature);		
			}

			var geojson = { 'type': 'FeatureCollection', 'features': features };

			var map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map', swlat, swlon, nelat, nelon);
			
			var style = mapzen.whosonfirst.leaflet.styles.search_centroid();
			var handler = mapzen.whosonfirst.leaflet.handlers.point(style);

			var layer = L.geoJson(geojson, {
				'style': style,
				'pointToLayer': handler,
			});
			
			layer.addTo(map);
		},

		'draw_names': function(cls){

			var locs = document.getElementsByClassName(cls);  
			var count = locs.length;
			
			for (var i=0; i < count; i++){
				var loc = locs[i];
				var id = loc.getAttribute("data-value");
				
				if (! id){
					continue;
				}
				
				var url = mapzen.whosonfirst.data.id2abspath(id);
				console.log(url);
				
				var cb = function(feature){
					var props = feature['properties'];
					var name = props['wof:name'];
					var id = props['wof:id'];
					
					var _id = cls + "_" + id;
					console.log("set name for " + _id + " to " + name);
					var el = document.getElementById(_id);
					el.innerHTML = name;		    
				};		       
				
				mapzen.whosonfirst.net.fetch(url, cb);		    
			}
		},

		'render_properties': function(props){

			var render = function(d, ctx){

				if (Array.isArray(d)){
					return render_list(d, ctx);
				}

				else if (typeof(d) == "object"){
					return render_dict(d, ctx);
				}

				else {

					var possible_wof = [
						'belongsto',
						'parent_id',
						// TO DO : please to write js-whosonfirst-placetypes...
						'continent_id', 'country_id', 'region_id', 'locality_id', 'neighbourhood_id'
					];

					if ((ctx) && (d)){

						if (in_array(ctx, possible_wof)){
							var link = "/id/" + encodeURIComponent(d) + "/";
							return render_link(link, d, ctx);
							
							// TO DO: attach callbacks to set name here
						}

						else if (ctx == 'placetype'){

							var link = "/placetypes/" + encodeURIComponent(d) + "/";
							return render_link(link, d, ctx);
						}

						else {
							return render_text(d, ctx);
						}
					  }

					  else {
						return render_text(d, ctx);
					}
				}
			};

			var render_dict = function(d, ctx){

				var table = document.createElement("table");

				for (k in d){
					var row = document.createElement("tr");
					
					var header = document.createElement("th");
					var label = document.createTextNode(k);
					header.appendChild(label);

					var content = document.createElement("td");
					var body = render(d[k], k);

					content.appendChild(body);

					row.appendChild(header);
					row.appendChild(content);

					table.appendChild(row);
				}

				return table;
			};

			var render_list = function(d, ctx){

				var count = d.length;

				if (count == 0){
					return render_text("–", ctx);
				}

				if (count <= 1){
					return render(d[0], ctx);
				}

				var list = document.createElement("ul");
				
				for (var i=0; i < count; i++){
					
					var item = document.createElement("li");
					var body = render(d[i], ctx);

					item.appendChild(body);
					list.appendChild(item);
				}

				return list;
			};

			var render_editable = function(d){
				// please write me
			};

			var render_text = function(d, ctx){

				var text = htmlspecialchars(d);

				var span = document.createElement("span");
				span.setAttribute("class", "props-uoc");
				var el = document.createTextNode(text);
				span.appendChild(el);
				return span;
			};

			var render_link = function(link, text, ctx){

				var anchor = document.createElement("a");
				anchor.setAttribute("href", link);

				var body = render_text(text);
				anchor.appendChild(body);
				return anchor;
			}

			var bucket_props = function(props){

				buckets = {};

				for (k in props){
					parts = k.split(":");
					ns = parts[0];
					pred = parts[1];

					if (parts.length != 2){
						ns = "misc";
						pred = k;
					}

					if (! buckets[ns]){
						buckets[ns] = {};					
					}
					
					buckets[ns][pred] = props[k];
				}
				
				return buckets;
			};

			var sort_bucket = function(bucket){

				var sorted = {};

				var keys = Object.keys(bucket);
				keys = keys.sort();

				var count_keys = keys.length;

				for (var j=0; j < count_keys; j++){
					var k = keys[j];
					sorted[k] = bucket[k];
				}

				return sorted;
			};

			var render_bucket = function(ns, bucket){

				var wrapper = document.createElement("div");

				var header = document.createElement("h3");
				var content = document.createTextNode(ns);
				header.appendChild(content);
			
				var sorted = sort_bucket(bucket);
				var body = render(sorted);
				
				wrapper.appendChild(header);
				wrapper.appendChild(body);

				return wrapper;
			};

			var pretty = document.createElement("div");
			pretty.setAttribute("id", "props-pretty");
			
			buckets = bucket_props(props);

			// these two go first

			wof_bucket = render_bucket('wof', buckets['wof'])
			pretty.appendChild(wof_bucket);
			
			name_bucket = render_bucket('name', buckets['name'])
			pretty.appendChild(name_bucket);

			delete buckets['wof']
			delete buckets['name']

			// now render the rest of them

			var namespaces = Object.keys(buckets);
			namespaces = namespaces.sort();

			var count_ns = namespaces.length;

			for (var i=0; i < count_ns; i++){

				var ns = namespaces[i]
				var dom = render_bucket(ns, buckets[ns]);
				pretty.appendChild(dom);
			}

			return pretty;
		}
	};

	return self;
})();
