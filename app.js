var apikey = "";
var pageLimit = 2; // 30 events per page // TODO FIXME add a user-configurable feature here

var actionColor = function(action) {
	switch (action) {
		case "created":
			return "green";
		case "opened":
			return "green";
		case "closed":
			return "red";
		case "published":
			return "green";
	}
	return "#ddd";
}

var formatPayload = function(eventType, data) {
	var out = "";
	switch (eventType) {
		case "PushEvent":
			for (var i = 0; i < data.payload.commits.length; i++) {
				var c = data.payload.commits[i];
				out = `<i>${data.payload.ref}</i> <span><a href="${c.url.replace("api.", "").replace("repos/", "").replace("commits", "commit")}" target="_" style="display: block;">* ${c.sha.substring(0,8)}</a>&nbsp;&nbsp;<code>${c.message}</code></span>
				`
			}
			break;
		case "CreateEvent":
			out = `${data.payload.ref_type}: ${data.payload.ref}`;
			break;
		case "ForkEvent":
			out = `<a href="${data.payload.forkee.html_url}" target="_">${data.payload.forkee.full_name}</a>`
			break;
		case "DeleteEvent":
			out = `${data.payload.ref_type}: ${data.payload.ref}`;
			break;
		case "WatchEvent":
			break;
		case "IssuesEvent":
			out = `
			<span style="color: ${actionColor(data.payload.action)};">${data.payload.action}</span>
			<a href="${data.payload.issue.html_url}" target="_">(#${data.payload.issue.number}) ${data.payload.issue.title}</a>
			`;
			break;
		case "PullRequestEvent":
			out = `
			<span style="color: ${actionColor(data.payload.action)};">${data.payload.action}</span>
			<a href="${data.payload.pull_request.html_url}" target="_">(#${data.payload.number}) ${data.payload.pull_request.title}</a> <i>[${data.payload.pull_request.base.label}/${data.payload.pull_request.head.label}]</i> 
			`;
			break;
		case "IssueCommentEvent":
			out = `

			<span style="color: ${actionColor(data.payload.action)};">${data.payload.action}</span> <span style="color: #bbb">@</span> <a href="${data.payload.issue.html_url}" target="_">(#${data.payload.issue.number}) ${data.payload.issue.title}</a> 

			<blockquote style="color: #aaa;">
			${data.payload.comment.body.length > 140 ? data.payload.comment.body.substring(0, 140) + " [...]" : data.payload.comment.body}
			<a href="${data.payload.comment.html_url}" target="_"><sup>link</sup></a>
			</blockquote>
			`;
			break;
		case "PullRequestReviewEvent":
		case "PullRequestReviewCommentEvent":

			out = `

			<span style="color: ${actionColor(data.payload.action)};">${data.payload.action}</span> <span style="color: #bbb">@</span> <a href="${data.payload.pull_request.html_url}" target="_">(#${data.payload.pull_request.number}) ${data.payload.pull_request.title}</a> <i>[${data.payload.pull_request.base.label}/${data.payload.pull_request.head.label}]</i> 

			<blockquote style="color: #aaa;">
			${data.payload.comment.body.length > 140 ? data.payload.comment.body.substring(0, 140) + " [...]" : data.payload.comment.body}
			<a href="${data.payload.comment.html_url}" target="_"><sup>link</sup></a>
			</blockquote>
			`;
			break;
		case "CommitCommentEvent":
			out = `
			<span style="color: #bbb">@</span> <a href="${data.payload.comment.html_url}" target="_">link</a> 

			<blockquote style="color: #aaa;">
			${data.payload.comment.body.length > 140 ? data.payload.comment.body.substring(0, 140) + "[...]" : data.payload.comment.body}
			</blockquote>

			`	
			break;
		case "ReleaseEvent":
			out = `
			<span style="color: ${actionColor(data.payload.action)};">${data.payload.action}</span> <a href="${data.payload.release.html_url}">${data.payload.release.tag_name}: ${data.payload.release.name}</a>
			<blockquote>
			<code>
			${data.payload.release.body}
			</code>
			</blockquote>
			`	
			break;
		case "MemberEvent":
			out = `
			<img src="${data.payload.member.avatar_url}" style="display: inline-block; max-height: 1em; margin-right: 5px;"/>
			<a href="https://github.com/${data.payload.member.login}" target="_">${data.payload.member.login}</a>
			`
			break;
		default:
			out = `⚠️`;
			break;
	}
	return out;
}

var formatEventName = function(eventName) {
	var n = "" ; 
	switch (eventName) {
		case "PushEvent":
			n += `⬆️`;
			break;
		case "CreateEvent":
			n += `🔰`;
			break;
		case "ForkEvent":
			n += `🔀`;
			break;
		case "DeleteEvent":
			n += `❌ `;
			break;
		case "WatchEvent":
			n += `⭐️`;
			break;
		case "IssuesEvent":
			n += `🔖`;
			break;
		case "PullRequestEvent":
			n += `⏪`;
			break;
		case "IssueCommentEvent":
			n += `📝`;
			break;
		case "PullRequestReviewEvent":
			n += `📝`;
			break;
		case "PullRequestReviewCommentEvent":
			n += `🖍`;
			break;
		case "CommitCommentEvent":
			n += '💬';
			break;
		case "ReleaseEvent":
			n += '🔊';
			break;
		case "MemberEvent":
			n += '🚼';
			break;
	}
	n += " " + eventName.replace("Event", "");
	return n;
};

var times = [];
var eventIDs = [];

var insertTimesYieldsI = function(t) {
	var didInsert = 0;
	if (times.length === 0) {
		times.push(t);
		return didInsert;
	}
	var m = moment(t);
	for (var i = 0; i < times.length; i++) {
		if (m.isAfter(times[i])) {
			times.splice(i, 0, m);
			didInsert = i;
			return didInsert;
		}
	}
	times.push(t);
	return times.length -1;
};

var buildRow = function(d) {
	return $(`<tr class="event${d.type} entity${d.actor.login}">
	<td>
		<img src="${d.actor.avatar_url}" style="max-height: 1em;" />
		<a href="https://github.com/${d.actor.login}" target="_">${d.actor.login}</a>
	</td>
	<td style="color: #ccc;">
		${moment(d.created_at).fromNow()}
	</td>
	<td style="text-align: right; padding-right: 5px;">
		<a href="https://github.com/${d.repo.name}" target="_">${d.repo.name}</a>
	</td>
	<td style="max-width: 500px; border-left: 3px solid #eee; padding: 5 5 5 10;">
		<span>${formatEventName(d.type)}</span>
	<!-- </td> -->

	<!-- <td> -->
		${formatPayload(d.type, d)}
	</td>

	<td class="details" style="font-size: 0.8em; ">
		<code style="max-height: 2em; overflow: hidden;" >${JSON.stringify(d.payload, null, 4)}</code>
	</td>
	</tr>`);
}

var snoopOK = function(data) {
	if ($("#response").children().length === 0) {
		$("#response").append(
				$(`
					<table>
						<thead>
						<tr>
							<th>entity</th>
							<th>date</th>
							<th>location</th>
							<th>event</th>
							<!-- <th>info</th> -->
							<th class="details">payload</th>
						</tr>
						</thead>
						<tbody id="tabledata">
						</tbody>
					</table>
				`)
		);
	}
	for (var i = 0; i < data.length; i++) {
		(function(d) {
			// add uniq event type for filtering
			if ($(`#eventTypes #${d.type}`).length === 0) {
				$("#eventTypes")
					.append(
						$(`<span></span>`)
							.attr("id", `${d.type}`)
							.html(formatEventName(d.type))
							.css({
								"display": "block"
							})
							.addClass("bold")
							.on("click", function(e) {
								$(`.event${d.type}`).toggle();
								$(this).toggleClass("bold");
							})
					)
			}
			if ($(`#entities #${d.actor.login}`).length === 0) {
				$("#entities")
					.append(
						$("<span></span>")
							.attr("id", `${d.actor.login}`)
							.html(`${d.actor.login}`)
							.css({
								"display": "block"
							})
							.addClass("bold")
							.on("click", function(e) {
								$(`.entity${d.actor.login}`).toggle();
								$(this).toggleClass("bold");
							})
					)
			}
			// add row to table
			if (eventIDs.indexOf(d.id) >= 0) {
				return;
			}
			eventIDs.push(d.id);
			var j = insertTimesYieldsI(d.created_at);
			if (j === 0) {
				$(`#tabledata`)
					.prepend(
						buildRow(d)
					)
			} else {
				$(`#tabledata > tr:nth-child(${j})`)
					.after(
						buildRow(d)
					)
			}
		})(data[i])
	}
};
var snoopNOTOK = function(err) {
	console.error(err);
	$(".instructions").show();
}

var doSnoop = function(query) {
	$("#response").html("");
	$("#entities").html("");
	console.log("snooping", query);
	localStorage.setItem("gh-man-snoop-query", query);
	times = [];
	$(".instructions").hide();
	var qs = query.split(",");
	if (qs.length === 0) {
		if (query !== "") {
			qs = [query];
		}
	}
	for (var i = 0; i < qs.length; i++) {
		for (var page = 1; page <= pageLimit; page++) {
			(function(q) {
				$.ajax({
					url: `https://api.github.com/${q}/events?access_token=${apikey}&page=${page}`,
					dataType: 'json',
					type: "GET",
					// type: 'POST',
					contentType: 'application/json',
					// data: JSON.stringify(data),
					success: snoopOK,
					error: snoopNOTOK,
				});
			})(qs[i])
		}

	}
};

var setupLoginListeners = function() {
	$("#input-enter-apikey").on("click", function() {
		apikey = $("#input-apikey").val();
		if (apikey !== "") {
			localStorage.setItem("gh-man-snoop-apikey", apikey);
			authorized();
		}
	});
};

var setupAuthorizedListeners = function() {
	$("#input-enter-query").on("click", function() {
		console.log("clickaed");
		doSnoop($("#input-query").val());
	});
	$("#showdetails").on("click", function() {
		$(".details").toggle();
	});
	$("#eventTypes-toggleall").on("click", function() {
		console.log("did clic");
		$("#eventTypes span").each(function(i) {
			$(`.event${$(this).attr("id")}`).toggle();
			$(this).toggleClass("bold");
		});
	});
	$("#entities-toggleall").on("click", function() {
		console.log("did clic");
		$("#entities span").each(function(i) {
			$(`.entity${$(this).attr("id")}`).toggle();
			$(this).toggleClass("bold");
		});
	});
};

var authorized = function() {
	$("#login").hide();
	$("#main").show();
	var existingQ = localStorage.getItem("gh-man-snoop-query");
	$("#input-query").val(existingQ);
	setupAuthorizedListeners();
	if (existingQ !== "" && existingQ !== null) {
		doSnoop(existingQ);
	}
}

$(function () {
	setupLoginListeners();
	var getKey = localStorage.getItem("gh-man-snoop-apikey");
	if (getKey === null || getKey === "") {
		$("#login .error").show();
	} else {
		apikey = getKey;
		authorized();
	}

	// var pathname = window.location.hash;
	// $(".this-location").text(window.location.host);
	// var hosts = pathname.substring(1).split(",");
	// for (var i = 0; i < hosts.length; i++) {
	// 	(function(h) {
	// 		console.log(h);
	// 		dataLoop(h);
	// 		setInterval(function() {
	// 			dataLoop(h);
	// 		}, refereshInterval);
	// 	})(hosts[i]);
});