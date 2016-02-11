var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

/*

To do:

- tab/keyboard controls
- flags/callback functions to render certains values as something other than text (a link, as code, etc.)

Open questions:

- to sort or not 
- to bucket (by prefix) or not
- update existing assertions or alert or just allow multiple (conflicting?) assertions for the same path

 */


mapzen.whosonfirst.yesnofix = (function(){

    var fix = -1;
    var no = 0;
    var yes = 1;

    var _custom_renderers = {
	'dict': function(d, ctx){ return null; },
	'text': function(d, ctx){ return null; },
    };

    var assertions = [];
    
    var self = {

	'set_custom_renderers': function(t, r){

	    if (! _custom_renderers[t]){
		return;
	    }

	    if (! r){
		return;
	    }

	    _custom_renderers[t] = r;
	},

	'get_custom_renderer': function(t, d, ctx){

	    if (! _custom_renderers[t]){
		return null;
	    }

	    var custom = _custom_renderers[t];
	    return custom(d, ctx);
	},
	
	// please do not call these 'engage' or 'makeitso' ...
	
	'makeitso': function(data, target){
	    
	    var el = document.getElementById(target);
	    
	    if (! el){
		return false;
	    }
	    
	    var pretty = self.engage(data);
	    el.appendChild(pretty);
	    
	    return true;
	},
	
	'engage': function(props){
	    
	    var pretty = document.createElement("div");
	    pretty.setAttribute("id", "props-pretty");
	    
	    buckets = self.bucket_props(props);
	    
	    var namespaces = Object.keys(buckets);
	    namespaces = namespaces.sort();
	    
	    var count_ns = namespaces.length;
	    
	    for (var i=0; i < count_ns; i++){
		var ns = namespaces[i];
		var dom = self.render_bucket(ns, buckets[ns]);
		pretty.appendChild(dom);
	    }
	    
	    return pretty;				
	},
	
	'render_bucket': function(ns, bucket){
	    
	    var wrapper = document.createElement("div");
	    
	    var header = document.createElement("h3");
	    var content = document.createTextNode(ns);
	    header.appendChild(content);
	    
	    var sorted = self.sort_bucket(bucket);
	    var body = self.render(sorted, ns);
	    
	    wrapper.appendChild(header);
	    wrapper.appendChild(body);
	    
	    return wrapper;
	},
	
	'render': function(d, ctx){
	    
	    // console.log("render context is " + ctx);
	    // console.log(d);
	    
	    if (Array.isArray(d)){
		// console.log("render list for " + ctx);
		return self.render_list(d, ctx);
	    }
	    
	    else if (typeof(d) == "object"){
		// console.log("render dict for " + ctx);
		return self.render_dict(d, ctx);
	    }
	    
	    else {
		// console.log("render text for " + ctx);

		var wrapper = document.createElement("span");
		wrapper.setAttribute("class", "props-content");

		var content;

		var renderer = self.get_custom_renderer('text', d, ctx);
		
		if (renderer){
		    try {
			content = renderer(d, ctx);
		    } catch (e) {
			console.log("UNABLE TO RENDER " + ctx + " BECAUSE " + e);
		    }
		}

		content = self.render_text(d, ctx);
		wrapper.appendChild(content);

		var trigger = self.render_trigger(ctx);
		wrapper.appendChild(trigger);

		return wrapper;
	    }
	},
	
	'render_dict': function(d, ctx){
	    
	    var table = document.createElement("table");
	    table.setAttribute("class", "table");
	    
	    for (k in d){
		
		var row = document.createElement("tr");
		var label_text = k;

		// TO DO: check for custom label text in custom_renderers...
		
		var header = document.createElement("th");
		var label = document.createTextNode(mapzen.whosonfirst.php.htmlspecialchars(label_text));
		header.appendChild(label);
		
		var _ctx = (ctx) ? ctx + "." + k : k;
		
		var content = document.createElement("td");

		var body = self.render(d[k], _ctx);		
		content.appendChild(body);

		row.appendChild(header);
		row.appendChild(content);
		
		table.appendChild(row);
	    }
	    
	    return table;
	},
	
	'render_list': function(d, ctx){
	    
	    var count = d.length;
	    
	    if (count == 0){
		return self.render_text("–", ctx);
	    }
	    
	    if (count <= 1){
		return self.render(d[0], ctx);
	    }
	    
	    var list = document.createElement("ul");
	    
	    for (var i=0; i < count; i++){
		
		var item = document.createElement("li");
		var body = self.render(d[i], ctx + "#" + i);
		
		item.appendChild(body);
		list.appendChild(item);
	    }
	    
	    return list;
	},
	
	'render_editable': function(d){
	    // please write me
	},
	
	'render_text': function(d, ctx){
	    
	    var text = mapzen.whosonfirst.php.htmlspecialchars(d);
	    
	    var span = document.createElement("span");
	    span.setAttribute("id", ctx);
	    span.setAttribute("title", ctx);
	    span.setAttribute("class", "props-uoc");
	    
	    // span.onclick = mapzen.whosonfirst.yesnofix.onclick;
	    
	    var el = document.createTextNode(text);
	    span.appendChild(el);

	    return span;
	},
	
	'render_link': function(link, text, ctx){

	    var anchor = document.createElement("a");
	    anchor.setAttribute("href", link);
	    anchor.setAttribute("target", "_wof");
	    var body = self.render_text(text, ctx);
	    anchor.appendChild(body);

	    return anchor;
	},

	/*
	  .trigger { display:none; padding-left: 1em; }
	  .props-content:hover .trigger { display:inline; }
	*/

	'render_trigger': function(ctx){

	    var edit = document.createTextNode("📝");	// http://emojipedia.org/memo/

	    var trigger = document.createElement("span");
	    trigger.setAttribute("trigger-id", ctx);
	    trigger.setAttribute("class", "trigger");
	    trigger.appendChild(edit);
	    
	    trigger.onclick = mapzen.whosonfirst.yesnofix.ontrigger;
	    return trigger;
	},

	'render_code': function(text, ctx){
	    
	    var code = document.createElement("code");
	    var body = self.render_text(text, ctx);
	    code.appendChild(body);
	    return code;
	},
	
	'render_timestamp': function(text, ctx){
	    var dt = new Date(parseInt(text) * 1000);
	    return self.render_text(dt.toISOString(), ctx);
	},
	
	'bucket_props': function(props){
	    
	    buckets = {};
	    
	    for (k in props){
		parts = k.split(":", 2);
		
		ns = parts[0];
		pred = parts[1];
		
		if (parts.length != 2){
		    ns = "global";
		    pred = k;
		}
		
		if (! buckets[ns]){
		    buckets[ns] = {};					
		}
		
		buckets[ns][pred] = props[k];
	    }
	    
	    return buckets;
	},
	
	'sort_bucket': function(bucket){
	    
	    var sorted = {};
	    
	    var keys = Object.keys(bucket);
	    keys = keys.sort();
	    
	    var count_keys = keys.length;
	    
	    for (var j=0; j < count_keys; j++){
		var k = keys[j];
		sorted[k] = bucket[k];
	    }
	    
	    return sorted;
	},
	
	'ontrigger': function(e) {
	    
	    var target = e.target;
	    var id = target.getAttribute("trigger-id");
	    var value = target.textContent;
	    
	    var enc_id = mapzen.whosonfirst.php.htmlspecialchars(id);
	    var enc_value = mapzen.whosonfirst.php.htmlspecialchars(value);
	    
	    //alert("you clicked " + enc_id + " whose value is \"" + enc_value + "\"");
	    
	    var parent = target.parentElement;
	    
	    if (! parent){
		// PLEASE TO MAKE ERRORS...
		return;
	    }
	    
	    var input = self.render_input(id);
	    parent.appendChild(input);
	},
	
	'render_input': function(id){
	    
	    var input = document.createElement("div");
	    input.setAttribute("id", "assert-" + id);
	    
	    var yes = document.createElement("button");
	    yes.setAttribute("data-id", id);
	    yes.setAttribute("data-assertion", 1);
	    
	    var no = document.createElement("button");
	    no.setAttribute("data-id", id);
	    no.setAttribute("data-assertion", 0);
	    
	    var fix = document.createElement("button");
	    fix.setAttribute("data-id", id);
	    fix.setAttribute("data-assertion", 0);
	    
	    var cancel = document.createElement("button");
	    cancel.setAttribute("data-id", id);

	    yes.appendChild(document.createTextNode("yes"));
	    no.appendChild(document.createTextNode("no"));
	    fix.appendChild(document.createTextNode("fix"));
	    cancel.appendChild(document.createTextNode("cancel"));
	    
	    yes.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    no.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    fix.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    cancel.onclick = mapzen.whosonfirst.yesnofix.oncancel;

	    input.appendChild(yes);
	    input.appendChild(no);
	    input.appendChild(fix);
	    input.appendChild(cancel);
	    
	    return input;
	},
	
	'onassert' : function(e){
	    
	    var target = e.target;
	    var id = target.getAttribute("data-id");
	    
	    if (! id){
		return false;
	    }
	    
	    var el = document.getElementById(id);
	    
	    if (! el){
		return false;
	    }
	    
	    var path = id;
	    var value = el.textContent;
	    var assertion = target.getAttribute("data-assertion");
	    
	    self.assert(path, value, assertion);
	    
	    alert("Okay, thanks!");
	    
	    var input = document.getElementById("assert-" + id);
	    
	    var parent = input.parentElement;
	    parent.removeChild(input);
	},
	
	'oncancel': function(e){

	    var target = e.target;
	    var id = target.getAttribute("data-id");
	    
	    if (! id){
		return false;
	    }

	    var input = document.getElementById("assert-" + id);
	    
	    var parent = input.parentElement;
	    parent.removeChild(input);
	},

	// note the lack of validation... we're assuming that kind of sanity
	// checking is happening above?
	
	'assert': function(path, value, assertion){
	    var dt = new Date();
	    assertions.push({'path': path, 'value': value, 'assertion': assertion, 'date': dt});
	},
	
	'report': function(){
	    
	    var report = [];
	    var count = assertions.length;
	    
	    for (var i=0; i < count; i++){
		
		var a = assertions[i];
		
		var row = [ a['path'], a['value'], a['assertion'], a['date'].toISOString() ];
		row = row.join(",");
		
		report.push(row);
	    }
	    
	    report = report.join("\n");
	    return report;
	},
    }
    
    return self;
    
})();
