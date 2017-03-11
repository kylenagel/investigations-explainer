<?php

	$url = $_GET['url'];

	$tags = get_meta_tags($url);

	$uuid = $tags['eomportal-uuid'];

	echo $uuid;

?>