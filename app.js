var apikey = "";
var pageLimit = 2; // 30 events per page // TODO FIXME add a user-configurable feature here

var actionColor = function (action) {
    switch (action) {
        case "created":
            return "green";
        case "opened":
            return "green";
        case "reopened":
            return "lightgreen";
        case "edited":
            return "orange";
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
var minimalTimeDisplay = function (time) {
    return time.fromNow(true).replace("a few seconds", "0m").replace("a ", "1").replace("an", "1").replace("hours", "h").replace("hour", "h").replace("minutes", "m").replace("minute", "m").replace(" ", "").replace("days", "d").replace("day", "d").replace("months", "M").replace("month", "M");
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

var formatPayload = function (eventType, data) {
    var out = "";
    switch (eventType) {
        case "PushEvent":
            var cr = data.payload.commits.reverse();
            out += `<div class="commits">`
            for (var i = 0; i < cr.length; i++) {
                out += (function (c) {
                    return `
						<div id="${c.sha}" class="commit">
						<code>*</code> <a href="${c.url.replace("api.", "").replace("repos/", "").replace("commits", "commit")}" target="_" class="commit"><code>${c.sha.substring(0, 8)}</code></a>
						<code class="commit-branch">${data.payload.ref.replace("refs/heads/", "")}</code> <code class="commit-author">${c.author.name}</code> <code class="commit-message">${c.message}</code>
						</div>
					`;
                })(cr[i]);
            }
            out += `</div>`;
            break;
        case "CreateEvent":
            out = `${data.payload.ref_type}: `
            if (data.payload.ref_type === "branch" && data.payload.pusher_type === "user" && data.payload.master_branch !== data.payload.ref) {
                // https://github.com/whilei/go-ethereum-2/compare/master...whilei:classic
                out += `<a href="https://github.com/${data.repo.name}/compare/${data.payload.master_branch}...${data.actor.login}:${data.payload.ref}" target="_">${data.payload.ref}</a>`;
            } else {
                out += `${data.payload.ref !== null ? data.payload.ref : "🗂"}`;
                if (data.payload.description !== "") {
                    out += `<p style="color: gray;">${data.payload.description}</p>`
                }
            }

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
			<strong style="color: ${actionColor(data.payload.action)};">${data.payload.action}</strong>
			<strong>${data.payload.issue.title}</strong> (<a href="${data.payload.issue.html_url}" target="_">#${data.payload.issue.number}</a>)
			`;
            break;
        case "PullRequestEvent":
            var action = data.payload.action === "closed" && data.payload.pull_request.merged ? "merged" : data.payload.action;

            out = `
			<strong style="color: ${actionColor(action)};">${action}</strong>
			<a href="${data.payload.pull_request.html_url}" target="_">(#${data.payload.number}) ${data.payload.pull_request.title}</a>
			<span class="diff-stat"><span style="color: green;">+${data.payload.pull_request.additions}</span> / <span style="color: red;">-${data.payload.pull_request.deletions}</span> , <span style="color: gray;">${data.payload.pull_request.changed_files}</span></span>
			<p>
			<span style="color: ${actionColor(action)}; "><i>${data.payload.pull_request.base.label} < ${data.payload.pull_request.head.label}</i></span>
			`;
            for (var j = 0; j < data.payload.pull_request.labels.length; j++) {
                out += (function (l) {
                    return `<span><small style="padding: 0.2em; border-radius: 0.2em; background-color: #${l.color}; color: ${invertColor(l.color, true)};">${l.name}</small></span>`;
                })(data.payload.pull_request.labels[j]);
            }
            out += `</p>`
            break;
        case "IssueCommentEvent":
            out = `

			<strong style="color: ${actionColor(data.payload.action)};">${data.payload.action} issue comment</strong>
			<span style="color: #bbb">@</span> <strong>${data.payload.issue.title}</strong> (<a href="${data.payload.issue.html_url}" target="_">#${data.payload.issue.number}</a>)

			<blockquote>
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
			<strong style="color: ${actionColor(data.payload.action)};">${data.payload.action} PR review comment</strong> <span style="color: #bbb">@</span>
			<strong>${data.payload.pull_request.title}</strong> (<a href="${data.payload.pull_request.html_url}" target="_">#${data.payload.pull_request.number}</a>) <span class="pr-user-login">@${data.payload.pull_request.user.login}</span>
			<br>
			<span style="color: gray; display: block; font-size: 1em;"><i>${data.payload.pull_request.base.label} < ${data.payload.pull_request.head.label}</i> </span>

			<blockquote>
			${data.payload.comment.body.length > 140 ? data.payload.comment.body.substring(0, 140) + " [...]" : data.payload.comment.body}
			<a href="${data.payload.comment.html_url}" target="_"><sup>link</sup></a>
			</blockquote>
			`;
            break;
        case "CommitCommentEvent":
            out = `
			<span style="color: #bbb">@</span> <a href="${data.payload.comment.html_url}" target="_">link</a>

			<blockquote>
			${data.payload.comment.body.length > 140 ? data.payload.comment.body.substring(0, 140) + "[...]" : data.payload.comment.body}
			</blockquote>

			`
            break;
        case "ReleaseEvent":
            out = `
			<strong style="color: ${actionColor(data.payload.action)};">${data.payload.action}</strong> <a href="${data.payload.release.html_url}">${data.payload.release.tag_name}: ${data.payload.release.name}</a>
			<blockquote>
			<code>${data.payload.release.body}
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
        case "GollumEvent":
            // wiki. weird name for an event.
            var cr = data.payload.pages.reverse();
            for (var i = 0; i < cr.length; i++) {
                out += (function (c) {
                    return `
					<span style="color: ${actionColor(c.action)}">${c.action}</span>
					<a href="${c.html_url}" target="_">${c.page_name}</a>
					<span><i>${c.sha.substring(0, 9)}</i></span>
					`;
                })(cr[i]);
            }
            break;
        default:
            out = `⚠️`;
            break;
    }
    return out;
}

var formatEventName = function (data) {
    var n = "";
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
            n += `\u{1F913}`; // `🖍`;
            break;
        case "CommitCommentEvent":
            n += '💬';
            break;
        case "ReleaseEvent":
            n += '📦';
            break;
        case "MemberEvent":
            n += '🚼';
            break;
        case "GollumEvent":
            n += `📜`;
            break;
    }
    // n += " " + data.type.replace("Event", "");

    return n;
};

var times = [];
var eventIDs = [];
var eventTypesPreferHidden = [];
var colors = {
    "actor": {
        "whilei": "rgba(255,0,0,0.2)"
    },
    "repo": {
        "ethereumclassic/go-ethereum": "rgba(0,255,0,0.2)"
    }
};

// https://stackoverflow.com/a/1484507/4401322
function random_color(format) {
    var rint = Math.floor(0x100000000 * Math.random());
    switch (format) {
        case 'hex':
            return '#' + ('00000' + rint.toString(16)).slice(-6).toUpperCase();
        case 'hexa':
            return '#' + ('0000000' + rint.toString(16)).slice(-8).toUpperCase();
        case 'rgb':
            return 'rgb(' + (rint & 255) + ',' + (rint >> 8 & 255) + ',' + (rint >> 16 & 255) + ')';
        case 'rgba':
            return 'rgba(' + (rint & 255) + ',' + (rint >> 8 & 255) + ',' + (rint >> 16 & 255) + ', 0.1)'; //  + (rint >> 24 & 255)/255 + ')'
        default:
            return rint;
    }
}

// this was a try to see if color associations were visually helpful at all. maybe not so much.
var getOrSaveNewColor = function (category, k) {
    return "rgba(0,0,0,0)"; // abort
    if (!colors.hasOwnProperty(category) || !colors[category].hasOwnProperty(k)) {
        c = random_color("rgba");
        saveNewColor(category, k, c);
        return c;
    }
    return colors[category][k];
}
var saveNewColor = function (category, k, v) {
    colors[category] = colors[category] || {};
    colors[category][k] = v;
    localStorage.setItem("badhub-colors", JSON.stringify(colors));
}
var loadColors = function () {
    var l = localStorage.getItem("badhub-colors");
    if (l === null || l === "") {
        return;
    }
    colors = JSON.parse(l);
};

var eventTypeIsPreferredHidden = function (eventType) {
    return eventTypesPreferHidden.indexOf(eventType) > -1;
};
var loadEventTypePrefs = function () {
    var l = localStorage.getItem("badhub-eventtypeshidden");
    if (l === null || l === "") {
        return;
    }
    eventTypesPreferHidden = JSON.parse(l);
};
var storeEventTypeHiddenPref = function (eventType) {
    var i = eventTypesPreferHidden.indexOf(eventType);
    if (i > -1) {
        eventTypesPreferHidden.splice(i, 1);
    } else {
        eventTypesPreferHidden.push(eventType);
    }
    localStorage.setItem("badhub-eventtypeshidden", JSON.stringify(eventTypesPreferHidden));
};

var insertTimesYieldsI = function (t) {
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
    return times.length - 1;
};

var buildRow = function (d) {
    return $(`
	<tr class="event${d.type} entity${d.actor.login} ${eventTypeIsPreferredHidden(d.type) ? 'hidden' : ''}">
	<td style="color: #ccc;">
		${minimalTimeDisplay(moment(d.created_at))}
	</td>
	<td class="avatar">
		<img src="${d.actor.avatar_url}" style="max-height: 2em;" />
	</td>
	<td style="min-width: 100px;">
		<a href="https://github.com/${d.actor.login}" target="_">${d.actor.login}</a>
	</td>
	<td style="min-width: 300px; text-align: right; padding-right: 5px; border-right: 6px solid ${getOrSaveNewColor("actor", d.actor.login)};">
		<a href="https://github.com/${d.repo.name}" target="_" style="display: block;">${d.repo.name}</a>
	</td>
	<td style="min-width: 2em; border-left: 6px solid ${getOrSaveNewColor("repo", d.repo.name)}; padding: 5 5 5 10;">
		<span>
		${formatEventName(d)}
		<span style="color: #bbb"><sup>${d.type === "PushEvent" ? d.payload.commits.length : ""}</sup></span>
		</span>
	</td>

	<td class="apayload">
		${formatPayload(d.type, d)}
	</td>

	<td class="details" style="font-size: 0.8em; ">
		<code style="max-height: 2em; overflow: hidden;" >${JSON.stringify(d, null, 4)}</code>
	</td>
	</tr>
	`) || true;
}

function convertMS(milliseconds) {
    var day, hour, minute, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    day = Math.floor(hour / 24);
    hour = hour % 24;
    return {
        day: day,
        hour: hour,
        minute: minute,
        seconds: seconds
    };
}

var blacklistAutomatedAuthors = [/crawler/igm, /[\W]*ci\W/igm, /\bbot\b/igm, /dependabot/igm, /codecov\-io/igm];
var blacklistAutomatedCommitMessages = [/\bdependabot\-/igm];

var isAutomatedPushEvent = function (da) {
    if (/\bbot\b/igm.test(da["actor"]["login"])) {
        return true;
    }
    if (/codecov\-io/igm.test(da["actor"]["login"])) {
        return true;
    }
    if (da["type"] !== "PushEvent") {
        return false;
    }
    for (var i = 0; i < da["payload"]["commits"].length; i++) {
        var c = da["payload"]["commits"][i];
        for (var j = 0; j < blacklistAutomatedAuthors.length; j++) {
            var re = blacklistAutomatedAuthors[j];
            if (re.test(c.author.name) || re.test(c.author.email)) {
                return true;
            }
        }
        for (var k = 0; k < blacklistAutomatedCommitMessages.length; k++) {
            var re = blacklistAutomatedCommitMessages[k];
            if (re.test(c.message)) {
                return true;
            }
        }

    }
    return false;
};

var snoopOK = function (data, textStatus, request) {
    // var eTag, xPollInterval;
    // if (+request.status === 200 || +request.status === 304) {
    // 	xPollInterval = +request.getResponseHeader("X-Poll-Interval");
    // }
    // if (+request.status === 200) {
    // 	eTag = request.getResponseHeader("ETag")
    // }

    if ($("#response").children().length === 0) {
        $("#response").append(
            $(`
					<table>
						<thead>
						<tr>
							<th>date</th>
							<th></th>
							<th>entity</th>
							<th>location</th>
							<th></th>
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

    // localStorage.setItem("data", JSON.stringify(data));
    for (var i = 0; i < data.length; i++) {
        (function (d) {

            // filter by date, leaving out old events
            // othewise all users will have same number of events since the getter is
            // governed by the pager
            var createdAt = Date.parse(d.created_at);
            var age = Date.now() - createdAt;
            if (convertMS(age).day > 14) {
                return;
            }

            if (isAutomatedPushEvent(d)) {
            	return;
            }

            // add uniq event type for filtering
            var preferredHidden = eventTypeIsPreferredHidden(d.type);
            if ($(`#eventTypes #${d.type}`).length === 0) {
                $("#eventTypes")
                    .append(
                        $(`<span></span>`)
                            .attr("id", `${d.type}`)
                            .html(formatEventName(d) + " " + d.type.replace("Event", ""))
                            .css({
                                "display": "block"
                            })
                            // .addClass("bold")
                            .addClass(`${preferredHidden ? "" : "bold"}`)
                            .on("click", function (e) {
                                $(`tr.event${d.type}`).toggleClass("hidden");
                                storeEventTypeHiddenPref(d.type);
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
                            .on("click", function (e) {
                                $(`tr.entity${d.actor.login}`).toggle();
                                $(this).toggleClass("bold");
                            })
                    )
            }
            // add row to table
            if (eventIDs.indexOf(d.id) >= 0) {
                return;
            }
            eventIDs.push(d.id);


            addEventTypeUserData(d);
            addEventTypeRepoData(d);
            addUserEventTypeData(d);

            var j = insertTimesYieldsI(d.created_at);
            var row = buildRow(d);
            if (j === 0) {
                $(`#tabledata`).prepend(row)
            } else {
                $(`#tabledata > tr:nth-child(${j})`).after(buildRow(d))
            }
        })(data[i])
    }
};
var snoopNOTOK = function (err) {
    console.error(err);
    $(".instructions").show();
}

var queryEntity = function (q) {
    $.ajax({
        url: `https://api.github.com/${q.resource}/events?access_token=${q.apikey}&page=${q.page}`,
        dataType: 'json',
        type: "GET",
        contentType: 'application/json',
        success: snoopOK,
        error: snoopNOTOK,
    });
};

var doSnoop = function (query) {
    $("#response").empty();
    $("#entities").empty();
    $("#eventTypes").empty();
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
            (queryEntity)({resource: qs[i], page: page, apikey: apikey})
        }
    }
};

var setupLoginListeners = function () {
    $("#input-enter-apikey").on("click", function () {
        apikey = $("#input-apikey").val();
        if (apikey !== "") {
            localStorage.setItem("bhak", reverseString(apikey));
            authorized();
        }
    });
};

var handleTheme = function (isDark) {
    if (isDark) {
        if (!$("body").hasClass("darktheme")) {
            $("body").addClass("darktheme")
        }
        localStorage.setItem("badhub-darktheme", "1")
    } else {
        if ($("body").hasClass("darktheme")) {
            $("body").removeClass("darktheme")
        }
        localStorage.setItem("badhub-darktheme", "")
    }
};

var setupAuthorizedListeners = function () {
    $("#input-enter-query").on("click", function () {
        console.log("clickaed");
        doSnoop($("#input-query").val());
    });
    $("#showdetails").on("click", function () {
        $(".details").toggle();
    });
    $("#eventTypes-toggleall").on("click", function () {
        console.log("did clic");
        $("#eventTypes span").each(function (i) {
            $(`.event${$(this).attr("id")}`).toggleClass("hidden");
            $(this).toggleClass("bold");
        });

        eventTypesPreferHidden = [];
        $("#eventTypes span").each(function (i) {
            if (!$(this).hasClass("bold")) {
                var t = $(this).attr("id");
                storeEventTypeHiddenPref(t);
            }
        });
    });
    $("#entities-toggleall").on("click", function () {
        console.log("did clic");
        $("#entities span").each(function (i) {
            $(`.entity${$(this).attr("id")}`).toggle();
            $(this).toggleClass("bold");
        });
    });
    $("#toggle-darktheme").on("click", function (e) {
        handleTheme(!$("body").hasClass("darktheme"));
    });
    $("#toggle-charts").on("click", function (e) {
        $(".chart-holder").toggleClass("hidden");
    });
};

var authorized = function () {
    $("#login").hide();
    $("#main").show();

    var existingQ = getValueFromURLOrStored("badhub-query");
    $("#input-query").val(existingQ);

    setupAuthorizedListeners();
    loadEventTypePrefs();
    setupCharts();

    if (existingQ !== "" && existingQ !== null) {
        doSnoop(existingQ);
    }
};

var getValueFromURLOrStored = function (lookKey) {
    var search = window.location.href;
    const hashes = search.slice(search.indexOf('?') + 1).split('&');

    const params = {};
    hashes.map(hash => {
        const [key, val] = hash.split('=')
        params[key] = decodeURIComponent(val)
    });

    if (params[lookKey]) {
        console.log("look key", lookKey, params[lookKey]);
        return params[lookKey];
    }

    return localStorage.getItem(lookKey);
};

var valueOk = function (val) {
    return (typeof val !== "undefined") && (val !== null) && (val !== "");
}

var reverseString = function (str) {
    var splitString = str.slice(1).split("");
    var reverseArray = splitString.reverse();
    return str.slice(0, 1) + reverseArray.join("");
};

$(function () {
    setupLoginListeners();

    var dark = getValueFromURLOrStored("badhub-darktheme");
    handleTheme(valueOk(dark));

    var key = getValueFromURLOrStored("bhak");
    if (valueOk(key)) {
        console.log("have key", key);
        apikey = reverseString(key);
        authorized();
    } else {
        console.log("no key", key);
        $("#login .error").show();
    }
});
