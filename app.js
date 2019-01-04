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
		case "merged":
			return "purple";
	}
	return "#ddd";
}

// accepts _moment()_ time
var minimalTimeDisplay = function(time) {
    return time.fromNow(true).replace("a few seconds", "0m").replace("a ", "1").replace("an", "1").replace("hours", "h").replace("hour", "h").replace("minutes", "m").replace("minute", "m").replace(" ","").replace("days","d").replace("day", "d").replace("months", "M").replace("month", "M");
}

// https://stackoverflow.com/a/35970186/4401322
function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

function invertColor(hex, bw) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
        // http://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? '#000000'
            : '#FFFFFF';
    }
    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
}

var formatPayload = function(eventType, data) {
	var out = "";
	switch (eventType) {
		case "PushEvent":
			var cr = data.payload.commits.reverse();
			for (var i = 0; i < cr.length; i++) {
				out += (function(c) {
					return `
					<div id="${c.sha}" class="commit" style="background-color: rgba(240,240,240,0.5); border-bottom: 4px solid white; padding: 10px;">
					<!-- <small data-sha="${c.sha}" class="commit-expander" style="float:right;">&lt;/&gt;</small> -->
					<a href="${c.url.replace("api.", "").replace("repos/", "").replace("commits", "commit")}" target="_" class="commit" style="font-size: 0.8em;">${c.sha.substring(0,8)} <span><i>${data.payload.ref}</i></span></a>
					<code style="display: block; padding: 10px;">${c.message}</code>
					</div>
					`;
				})(cr[i]);
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
			var action = data.payload.action === "closed" && data.payload.pull_request.merged ? "merged" : data.payload.action;

			out = `
			<span style="color: ${actionColor(action)};">${action}</span>
			<a href="${data.payload.pull_request.html_url}" target="_">(#${data.payload.number}) ${data.payload.pull_request.title}</a> 
			<span style="float: right; font-size: 0.8em;"><span style="color: green;">+${data.payload.pull_request.additions}</span>/<span style="color: red;">-${data.payload.pull_request.deletions}</span>,<span style="color: gray;">${data.payload.pull_request.changed_files}</span></span>
			<span><i>${data.payload.pull_request.base.label} < ${data.payload.pull_request.head.label}</i></span>
			`;
			for (var j = 0; j < data.payload.pull_request.labels.length; j++) {
				out += (function(l) {
					return `<small style="padding: 0.2em; border-radius: 0.2em; background-color: #${l.color}; color: ${invertColor(l.color, true)};">${l.name}</small>`;
				})(data.payload.pull_request.labels[j]);
			}
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
			out = `<h1 style="color: yellow;">PullRequestReviewEvent NOT IMPLEMENTED</h1>`;
			break;
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

var formatEventName = function(data) {
	var n = "" ; 
	var eventName = data.type;
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
	n += " " + data.type.replace("Event", "");

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
	return $(`
	<tr class="event${d.type} entity${d.actor.login}">
	<td style="color: #ccc;">
		${minimalTimeDisplay(moment(d.created_at))}
	</td>
	<td>
		<img src="${d.actor.avatar_url}" style="max-height: 1em;" />
		<a href="https://github.com/${d.actor.login}" target="_">${d.actor.login}</a>
	</td>
	<td style="text-align: right; padding-right: 5px;">
		<a href="https://github.com/${d.repo.name}" target="_">${d.repo.name}</a>
	</td>
	<td style="max-width: 500px; border-left: 3px solid #eee; padding: 5 5 5 10;">
		<span>
		${formatEventName(d)}
		<span style="color: #bbb">${d.type === "PushEvent" ? d.payload.commits.length + " commits" : ""}</span>
		</span>
	<!-- </td> -->

	<!-- <td> -->
		${formatPayload(d.type, d)}
	</td>

	<td class="details" style="font-size: 0.8em; ">
		<code style="max-height: 2em; overflow: hidden;" >${JSON.stringify(d.payload, null, 4)}</code>
	</td>
	</tr>
	`);
}

var snoopOK = function(data) {
	if ($("#response").children().length === 0) {
		$("#response").append(
				$(`
					<table>
						<thead>
						<tr>
							<th>date</th>
							<th>entity</th>
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
							.html(formatEventName(d))
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
			var row = buildRow(d);
			if (j === 0) {
				$(`#tabledata`).prepend(row)
			} else {
				$(`#tabledata > tr:nth-child(${j})`).after(buildRow(d))
			}
		})(data[i])
	}
	// $(".commit-expander").on("click", function(e) {
	// 	console.log("clik");
	// 	var csha = $(this).data("sha");
	// 	$(`#${csha}`).toggleClass("unexpanded");
	// });
};
var snoopNOTOK = function(err) {
	console.error(err);
	$(".instructions").show();
}

var doSnoop = function(query) {
	$("#response").html("");
	$("#entities").html("");
	console.log("snooping", query);
	localStorage.setItem("badhub-query", query);
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
			localStorage.setItem("badhub-apikey", apikey);
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
	var existingQ = localStorage.getItem("badhub-query");
	$("#input-query").val(existingQ);
	setupAuthorizedListeners();
	if (existingQ !== "" && existingQ !== null) {
		doSnoop(existingQ);
	}
}

$(function () {
	setupLoginListeners();
	var getKey = localStorage.getItem("badhub-apikey");
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