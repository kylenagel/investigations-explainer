/*
NEED TO CHANGE
-- References to daytondailynews.com in charbeat call and individual story calls domain

*/


var execute_pageload = function($) {

	// INIT DATA VARIABLE
	var kn_data = {
		number_of_stories: 0,
		stories: []
	}

	// APPEND STYLESHEET
	var cmglink = document.createElement("link");
	cmglink.rel = 'stylesheet';
	cmglink.type = 'text/css';
	cmglink.href = 'css/styles.css';
	document.getElementsByTagName("head")[0].appendChild(cmglink);

	// CALL FIRST FUNCTION, TO GET STORIES DATA
	getStoriesData();

	// FUNCTION TO MAKE CALL TO CHARTBEAT TO GET TRENDING STORIES
	// THEN PASS PATHS TO FUNCTION TO GET UUIDs
	function getStoriesData() {
		// GET PAGE DOMAIN
		var domain = document.domain;
		// CALL TO CHARTBEAT TO GET TOP TRENDING STORIES ON THAT DOMAIN
		$.get('http://api.chartbeat.com/live/toppages/v3/?apikey=11a05962fa65ba821e3a53cc8c52520c&host=daytondailynews.com ')
		.then(function(result) {
			console.log(result);
			// LOOP THROUGH TRENDING PIECES
			for (i in result.pages) {
				// IF IT'S AN ARTICLE AND NOT flatpage-for-wraps
				if (result.pages[i].stats.article>0 && result.pages[i].title!='flatpage-for-wraps') {
					// ADD ONE TO NUMBER OF STORIES COUNT
					kn_data.number_of_stories++;
					// CALL FUNCTION TO GET UUID WITH PHP FILE
					getUUID(result.pages[i].path, result.pages[i].stats.visits);

				}
			}
			outputTrending();
		});
	}

	// FUNCTION TO GET UUID OF STORIES
	function getUUID(path, visits) {
		// GET UUID OF PAGE WITH CALL TO PHP FILE
		$.get('php/get_uuid.php?url='+path)
		.then(function(uuid) {
			// CALL FUNCTION TO GET THE DATA ABOUT THAT STORY WITH METHODE API
			getStoryData(uuid, visits);
		});
	}

	// FUNCTION TO GET DATA ABOUT STORY FROM METHODE API
	function getStoryData(uuid, visits) {
		// CALL TO METHODE API TO GET PAGE DATA
		$.ajax({
			url: 'http://host.coxmediagroup.com/cop/digital/common/cache/cacher.php?saveas=cmgo_story_data_uuid_'+uuid+'&json_url='+encodeURIComponent('http://www.whio.com/feed?id='+uuid),
			dataType: 'json',
			success: function(page_data) {
				page_data.visits = visits;
				// SAVE STORY PAGE DATA TO kn_data VARIABLE
				// IF IT RETURNED AN ITEM
				if (page_data.channel.item.length>0) {
					// ADD PAGE DATA TO THE STORIES LIST
					kn_data.stories.push(page_data);
					console.log(kn_data.number_of_stories);
				}
				// IF NO ITEM WAS RETURNED, REMOVE ONE FROM THE TOTAL STORIES LIST
				else {
					// ADD ONE TO NUMBER OF STORIES COUNT
					kn_data.number_of_stories--;
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

	// FUNCTION TO OUTPUT TRENDING LIST
	function outputTrending() {
		// IF THE NUMBER OF STORIES IN ARRAY MATCHES NUMBER OF STORIES ACQUIRED
		if (kn_data.number_of_stories > 0 && kn_data.number_of_stories == kn_data.stories.length) {
			console.log(kn_data.stories);
			// SORT STORIES BY VISITS
			kn_data.stories.sort(function(a,b) {
				a = a.visits;
				b = b.visits;
				if (a<b) {
					return 1;
				} else if (a>b) {
					return -1;
				} else {
					return 0;
				}
			});
			// INIT TRENDING LIST WITH SUBHEAD
			var trending_list = '<h2>What\'s trending</h2>'
			// START UL
			trending_list += '<ul>';
				// LOOK THROUGH STORIES
				for (i in kn_data.stories) {
					console.log(i);
					// SET THE IMAGE
					var image_url = ''
					if (kn_data.stories[i].channel.item[0].images) {
						image_url = kn_data.stories[i].channel.item[0].images[0].url
					} else {
						image_url = kn_data.stories[i].channel.item[0].videos[0].image.url;
					}

					// BUILD THE LIST ITEM
					trending_list += '<li>';
						trending_list += '<div class="photo_container" style="background-image:url('+image_url+')"></div>';
						trending_list += '<h3><a href="'+kn_data.stories[i].channel.item[0].link.replace('www.whio.com', 'www.daytondailynews.com')+'">'+kn_data.stories[i].channel.item[0].title+'</a></h3>'
					trending_list += '</li>';

				}
			// CLOSE THE LIST
			trending_list += '</ul>';
			// OUTPUT THE LIST
			$("#cmgo_chartbeat").html(trending_list);
		} else {
			setTimeout(function() {
				outputTrending();
			}, 200)
		}
	}

}

window.jq_shim.load_jq(execute_pageload);