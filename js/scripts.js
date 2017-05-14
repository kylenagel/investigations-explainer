var execute_pageload = function($) {

var kn_data = {
	gs_cache_file_names: [
		'cmgo_investigations_explainer_story_list'
	],
	gs_data: {},
	gs_url: 'https://docs.google.com/spreadsheets/d/1sd4iRz_xkzZEYno9UyqfZCqS_bEUEkS_xutMBZh5-TI/edit#gid=0',
	no_page_data: [],
	stylesheets: [
		'css/styles.css?version=2',
		'https://fonts.googleapis.com/css?family=Oswald',
		'https://fonts.googleapis.com/css?family=Slabo+27px',
		'https://fonts.googleapis.com/css?family=Open+Sans',
		'//host.coxmediagroup.com/cop/digital/common/fonts/font-awesome/css/font-awesome.min.css'
	],
	templates: {
		main: 'hbs/main_template.hbs',
		story_details: 'hbs/story_details_template.hbs',
		stories_list: 'hbs/stories_list_template.hbs'
	}
}

// APPEND THE MASK TO THE PAGE
$("body").append('<div id="kn_mask"></div>');

executePageLoad();

function executePageLoad() {
	getGSWorksheetIDs(kn_data.gs_url);
	appendStylesheets();
	outputMainTemplate();
	addEventListeners();
}

function appendStylesheets() {
	for (var i=0; i<kn_data.stylesheets.length; i++) {
		var cmglink = document.createElement("link");
		cmglink.rel = 'stylesheet';
		cmglink.type = 'text/css';
		cmglink.href = kn_data.stylesheets[i];
		document.getElementsByTagName("head")[0].appendChild(cmglink);
	}
}

function outputMainTemplate() {
	if (kn_data.gs_data.stories_list) {
		var data = {}
		data.content = kn_data;
		console.log(data);
		outputHandlebarsTemplate(data,kn_data.templates.main,"#kn_container");
		getStoriesData();
		outputStoriesListTemplate();
	} else {
		setTimeout(function() {
			outputMainTemplate();
		}, 200);
	}
}

function outputStoriesListTemplate() {

	// FUNCTION TO TEST IF ALL STORIES HAVE RECEIVED PAGE DATA FROM METHODE API CALL
	function storyHasDetails(element, index, arrary) {
		return element.page_data;
	}

	// SAVE TEST IF ALL STORIES HAVE PAGE DATA
	var all_stories_have_data = kn_data.gs_data.stories_list.every(storyHasDetails);

	// IF ALL STORIES HAVE PAGE DATA FROM METHODE API CALLS
	if (all_stories_have_data) {

		// REMOVE INDECES THAT HAVE NO PAGE DATA
		for (i in kn_data.gs_data.stories_list) {
			if (kn_data.gs_data.stories_list[i].page_data == 'none') {
				kn_data.no_page_data.push(kn_data.gs_data.stories_list[i]);
				kn_data.gs_data.stories_list.splice(i,1);
			}
		}

		console.log('NO PAGE DATA FOR THESE STORIES:');
		console.log(kn_data.no_page_data);

		// SORT THE DATA BY DATE, DESCENDING
		kn_data.gs_data.stories_list.sort(function(a,b) {
			a = moment(new Date(a.page_data.channel.item[0].pub_date));
			b = moment(new Date(b.page_data.channel.item[0].pub_date));
			if (a<b) {
				return 1;
			} else if (a>b) {
				return -1;
			} else {
				return 0;
			}
		});

		// OUTPUT THE TEMPLATE
		var data = {}
		data.content = kn_data.gs_data.stories_list;
		// SAVE CORRECT IMAGE TO USE FOR THIS ITEM
		for (i in data.content) {
			var q = data.content[i].page_data.channel.item[0];
			if (q.images) {
				q.show_image = q.images[0].url;
			} else if (q.videos) {
				q.show_image = q.videos[0].image.url;
			} else if (q.related_content) {
				for (r in q.related_content) {
					if (q.related_content[r].item_class == 'image') {
						q.show_image = q.related_content[r].images[0].url;
					}
				}
			}
		}
		console.log(data);
		outputHandlebarsTemplate(data,kn_data.templates.stories_list,"#kn_view");
	// IF NOT ALL STORIES HAVE PAGE DATA, RUN FUNCTION AGAIN
	} else {
		setTimeout(function() {
			outputStoriesListTemplate();
		}, 200);
	}

}

function addEventListeners() {

	// RESIZE ELEMENTS ON WINDOW RESIZE
	window.onresize = function() {
		resizeElements();
	}

	// SHOW DETAILS WHEN CLICKING READ MORE
	$(document).on("click", "#kn_stories_list .investigative_story .read_more_container", function() {
		var id = $(this).attr("data-id");
		showDetails(id);
	});

	// HIDE MASK ON X CLICK
	$(document).on("click", "#kn_story_details .kn_close_mask span", function() {
		hideMask();
	});

}

function resizeElements() {
	// GET WIDTHS
	var container_width = $("#kn_container").outerWidth();
	var window_width = window.outerWidth;
	var window_height = window.innerHeight;
	resizeStoryDetailsContainer(window_height);
}

function resizeStoryDetailsContainer(window_height) {
	var new_box_height = window_height*0.9;
	var close_mask_container_height = $("#kn_story_details .kn_close_mask").outerHeight();
	var new_body_text_height = new_box_height - close_mask_container_height;
	$("#kn_story_details").css("height",new_box_height+"px");
	$("#kn_story_details .kn_story_details_body").css("height", new_body_text_height+"px");
}

function outputHandlebarsTemplate(data,template,destination) {
	if ($(destination).length > 0) {
		$.get(template)
		//$.get('http://host.coxmediagroup.com/cop/digital/common/php/simple_get_file.php?url='+encodeURIComponent(template))
		.then(function(template) {

			Handlebars.registerHelper('parse_date',function(date) {
				return moment(new Date(date)).format('MMMM D, YYYY');
			});

			Handlebars.registerHelper('parse_gs_paragraphs', function(string) {
				string = string.split("\n");
				var return_html = '';
				for (i in string) {
					return_html += '<p>'+string[i]+'</p>';
				}
				return new Handlebars.SafeString(return_html);
			});

			Handlebars.registerHelper('get_story_excerpt', function(summary) {
				var html = $.parseHTML(summary);
				var return_paragraphs = [];
				for (i in html) {
					if (return_paragraphs.length < 4) {
						if (html[i].tagName == "P") {
							return_paragraphs.push(html[i].innerHTML);
						}
					} else {
						break;
					}
				}
				var return_html = '';
				for (i in return_paragraphs) {
					return_html += '<p>'+return_paragraphs[i]+'</p>'
				}
				return new Handlebars.SafeString(return_html);
			})

			template = Handlebars.compile(template);
			$(destination).html(template(data));
		})
	} else {
		setTimeout(function() {
			outputHandlebarsTemplate(data,template,destination);
		}, 200);
	}
}

function getStoriesData() {
	for (i in kn_data.gs_data.stories_list) {
		getUUID(kn_data.gs_data.stories_list[i].storyurl, i);
	}
}

// FUNCTION TO GET UUID OF STORIES
function getUUID(path, index) {
	// GET UUID OF PAGE WITH CALL TO PHP FILE
	$.get('php/get_uuid.php?url='+path)
	.then(function(uuid) {
		// CALL FUNCTION TO GET THE DATA ABOUT THAT STORY WITH METHODE API
		getStoryData(uuid, index);
	});
}

// FUNCTION TO GET DATA ABOUT STORY FROM METHODE API
function getStoryData(uuid, index) {
	// CALL TO METHODE API TO GET PAGE DATA
	$.ajax({
		url: 'http://host.coxmediagroup.com/cop/digital/common/cache/cacher.php?saveas=cmgo_story_data_uuid_'+uuid+'&json_url='+encodeURIComponent('http://www.whio.com/feed?id='+uuid),
		dataType: 'json',
		success: function(page_data) {
			// SAVE STORY PAGE DATA TO kn_data VARIABLE
			// IF IT RETURNED AN ITEM
			if (page_data.channel.item.length>0) {
				// ADD PAGE DATA TO THE STORIES LIST
				kn_data.gs_data.stories_list[index].page_data = page_data;
			} else {
				kn_data.gs_data.stories_list[index].page_data = 'none';
			}
		},
		error: function(a,b,c) {
			console.log(uuid);
			console.log(a);
			console.log(b);
			console.log(c);
		}
	});
}

function showDetails(id) {
	showMask();
	var data = {}
	for (i in kn_data.gs_data.stories_list) {
		if (kn_data.gs_data.stories_list[i].id == id) {
			data.content = kn_data.gs_data.stories_list[i];
		}
	}
	console.log(data);
	outputHandlebarsTemplate(data,kn_data.templates.story_details,"#kn_mask");
	for (i=500;i<3000;i+=500) {
		setTimeout(function() {
			resizeElements();
		}, i)
	}
}

function showMask() {
	$("#kn_mask").addClass("visible");
}

function hideMask() {
	$("#kn_mask").removeClass("visible");
}

// THIS FUNCTION GETS THE DATA ABOUT THE GOOGLE SHEET
// INCLUDING WHAT WE WANT, THE WORKSHEET IDs
function getGSWorksheetIDs(gsurl) {
	// THE SHEET KEY IS THE 5th INDEX WHEN SPLITTING BY "/"
	var gsKey = gsurl.split("/")[5];
	// GET THE KEY TO GET THE DATA ABOUT THE SPEADSHEET
	$.ajax({
		url: 'http://host.coxmediagroup.com/cop/digital/common/cache/cacher.php?saveas=cmgo_investigations_explainer_meta&json_url='+encodeURIComponent('https://spreadsheets.google.com/feeds/worksheets/'+gsKey+'/public/full?alt=json'),
		dataType: 'json',
		success: function(result) {
			// THIS LOOP GRABS THE WORKSHEET ID FOR EACH TAB
			// AND RUNS THE FUNCTION TO GET THE DATA IN THE TAB
			for (var i=0; i<result.feed.entry.length; i++) {
				// WORKSHEET ID IS 8th INDEX WHEN SPLITTING ID PROPERTY BY "/"
				var worksheet_id = result.feed.entry[i].id.$t.split("/")[8];
				// CALL THE FUNCTION TO GET THE DATA
				getGSData(i, kn_data.gs_cache_file_names[i], gsKey, worksheet_id);
			}
		}
	});
}

// THIS FUNCTION GETS THE DATA INSIDE THE CORRECT TAB (identified by worksheet_id)
// INSIDE THE GOOGLE SHEET
function getGSData(sheet, cache_file_name, key, worksheet_id) {
	$.ajax({
		url: 'http://host.coxmediagroup.com/cop/digital/common/cache/cacher.php?saveas='+cache_file_name+'&force_reload=true&json_url='+encodeURIComponent('https://spreadsheets.google.com/feeds/list/'+key+'/'+worksheet_id+'/public/values?alt=json'),
		dataType: 'json',
		success: function(result) {
			// IF IT'S THE FIRST SHEET
			if (sheet == 0) {
				// DO SOMETHING WITH FIRST TAB
				kn_data.gs_data.stories_list = parseGSData(result.feed.entry)
			// OR, IF IT'S THE SECOND SHEET
			} else if (sheet == 1) {
				// DO SOMETHING WITH SECOND TAB
			}
		}
	});
}

function parseGSData(d) {

	function getGSKeys(d) {
		// get keys of first index
		var keys = Object.keys(d[0]);
		var keep_keys = []
		// loop and delete keys that don't start with "gsx"
		for (var i=0; i<keys.length; i++) {
			if (keys[i].search("gsx") != -1) {
				keep_keys.push(keys[i].replace("gsx$", ""));
			}
		}
		return keep_keys;
	}

	function buildNewArray(d) {
		var keys = getGSKeys(d);
		var data = []
		for (var i=0; i<d.length; i++) {
			data.push({});
			for (var k=0; k<keys.length; k++) {
				data[data.length-1][keys[k]] = d[i]["gsx$"+keys[k]]["$t"];
			}
		}
		return data;
	}

	var data = buildNewArray(d);
	return data;

}

} // END OF execute_pageload

window.jq_shim.load_jq(execute_pageload);