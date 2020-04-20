
var formatPayload = function (eventType, data) {
    var out = "";
    switch (eventType) {
        // ---------------------------------------------------------------------------
        // PUSH Event
        // ---------------------------------------------------------------------------
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

        // ---------------------------------------------------------------------------
        // CREATE Event
        // ---------------------------------------------------------------------------
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

        // ---------------------------------------------------------------------------
        // FORK Event
        // ---------------------------------------------------------------------------
        case "ForkEvent":
            out = `<a href="${data.payload.forkee.html_url}" target="_">${data.payload.forkee.full_name}</a>`
            break;

        // ---------------------------------------------------------------------------
        // DELETE Event
        // ---------------------------------------------------------------------------
        case "DeleteEvent":
            out = `${data.payload.ref_type}: ${data.payload.ref}`;
            break;

        // ---------------------------------------------------------------------------

        case "WatchEvent":
            break;
        // ---------------------------------------------------------------------------

        case "IssuesEvent":
            out = `
<div class="comment-header">
<div class="event-user-action-container">
      &nbsp;<span class="pr-user-login">@${data.payload.issue.user.login}</span>
			&nbsp;<strong style="color: ${actionColor(data.payload.action)};">${data.payload.action}</strong>
</div>
			<strong>${data.payload.issue.title}</strong>
			(<a href="${data.payload.issue.html_url}" target="_">#${data.payload.issue.number}</a>)
</div>
            `;
            out += `<div class="issue-body">`;
            out += md.render(data.payload.issue.body);
            out += `</div>`;
            break;
        // ---------------------------------------------------------------------------

        case "PullRequestEvent":
            var action = data.payload.action === "closed" && data.payload.pull_request.merged ? "merged" : data.payload.action;

            out = `
<div class="comment-header">
<div class="event-user-action-container">
      &nbsp;<span class="pr-user-login">@${data.payload.pull_request.user.login}</span>
			&nbsp;<strong style="color: ${actionColor(action)};">${action}</strong>
</div>
      <strong>${data.payload.pull_request.title}</strong>
      (<a href="${data.payload.pull_request.html_url}" target="_">#${data.payload.number}</a>)

`;

            for (var j = 0; j < data.payload.pull_request.labels.length; j++) {
                out += (function (l) {
                    return `&nbsp;<span><small style="padding: 0.2em; border-radius: 0.2em; background-color: #${l.color}; color: ${invertColor(l.color, true)};">${l.name}</small></span>`;
                })(data.payload.pull_request.labels[j]);
            }

            out += `
</div>
			<p>
			<span class="diff-stat"><span style="color: green;">+${data.payload.pull_request.additions}</span> / <span style="color: red;">-${data.payload.pull_request.deletions}</span> , <span style="color: gray;">${data.payload.pull_request.changed_files}</span></span>
			<span style="color: gray; "><i>${data.payload.pull_request.base.label} < ${data.payload.pull_request.head.label}</i></span>
      </p>`;

            out += `<div class="issue-body">`;
            out += md.render(data.payload.pull_request.body);
            out += `</div>`;

            break;
        // ---------------------------------------------------------------------------


        case "IssueCommentEvent":
            out = `
<!--payload-->
<div class="comment-issue-pr-payload"> 

<!--header-->
<div class="comment-header">

<div class="event-user-action-container">
      &nbsp;<span class="pr-user-login">@${data.payload.issue.user.login}</span>
</div>

<span style="color: #bbb">@</span>&nbsp;<strong>${data.payload.issue.title}</strong>
`;

            for (var j = 0; j < data.payload.issue.labels.length; j++) {
                out += (function (l) {
                    return `&nbsp;<span><small style="padding: 0.2em; border-radius: 0.2em; background-color: #${l.color}; color: ${invertColor(l.color, true)};">${l.name}</small></span>`;
                })(data.payload.issue.labels[j]);
            }

            out += `
                  &nbsp;(<a href="${data.payload.issue.html_url}" target="_">#${data.payload.issue.number}</a>)

            </div>
<!--end header-->`;

            out += `<div class="issue-body">`;
            out += md.render(data.payload.issue.body);
            out += `</div>`;

            out += `
            <div class="payload-comment">
            <a class="quote-comment-link" href="${data.payload.comment.html_url}" target="_" style="float:right;"><sup>\u{2934}</sup></a>
            <div class="issue-body">
            ${md.render(data.payload.comment.body)}
            </div>
            </div>  

</div>
			`;
            break;
        // ---------------------------------------------------------------------------



        case "PullRequestReviewEvent":
            out = `<h1 style="color: yellow;">PullRequestReviewEvent NOT IMPLEMENTED</h1>`;
            break;



        // ---------------------------------------------------------------------------

        case "PullRequestReviewCommentEvent":

            out = `
<div class="comment-issue-pr-payload">
<div class="comment-header">

<div class="event-user-action-container">
            &nbsp;(<a href="${data.payload.pull_request.html_url}" target="_">#${data.payload.pull_request.number}</a>)
            &nbsp;<span class="pr-user-login">@${data.payload.pull_request.user.login}</span>
</div>

<span style="color: #bbb">@</span> <strong>${data.payload.pull_request.title}</strong>

</div>
`;

            for (var j = 0; j < data.payload.pull_request.labels.length; j++) {
                out += (function (l) {
                    return `&nbsp;<span><small style="padding: 0.2em; border-radius: 0.2em; background-color: #${l.color}; color: ${invertColor(l.color, true)};">${l.name}</small></span>`;
                })(data.payload.pull_request.labels[j]);
            }

            out += `
<br>
<div style="padding-left: 1em;">
                <span style="color: gray; display: block; font-size: 1em;"><i>${data.payload.pull_request.base.label} < ${data.payload.pull_request.head.label}</i> </span>
</div>

<div class="payload-comment">
    <a class="quote-comment-link" href="${data.payload.comment.html_url}" target="_" style="float:right;"><sup>\u{2934}</sup></a>
    ${md.render( data.payload.comment.body)}
</div>

</div>
			`;
            break;
        // ---------------------------------------------------------------------------


        case "CommitCommentEvent":
            out = `
<div class="comment-issue-pr-payload">

<div class="comment-header">
			<span style="color: #bbb">@</span> <a href="${data.payload.comment.html_url}" target="_">link</a>
</div>

<div class="payload-comment">
    <a class="quote-comment-link" href="${data.payload.comment.html_url}" target="_" style="float:right;"><sup>\u{2934}</sup></a>
    ${md.render( data.payload.comment.body)}
</div>

</div>
			`;
            break;
        // ---------------------------------------------------------------------------

        case "ReleaseEvent":
            out = `
			<strong style="color: ${actionColor(data.payload.action)};">${data.payload.action}</strong> <a href="${data.payload.release.html_url}">${data.payload.release.tag_name}: ${data.payload.release.name}</a>
			<div>
			<code>${data.payload.release.body}
			</code>
			</div>
			`;
            break;
        // ---------------------------------------------------------------------------

        case "MemberEvent":
            out = `
			<img src="${data.payload.member.avatar_url}" style="display: inline-block; max-height: 1em; margin-right: 5px;"/>
			<a href="https://github.com/${data.payload.member.login}" target="_">${data.payload.member.login}</a>
			`;
            break;
        // ---------------------------------------------------------------------------

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
        // ---------------------------------------------------------------------------

        default:
            out = `⚠️`;
            break;

    }
    return out;
}

var times = [];

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
    if (!valueOk(d)) {
        return false;
    }
    var bg = eventRowBG(d);
    var tdbg = "";
    if (bg !== "none" && bg !== "") {
        tdbg = `background-color: ${bg};`;
    }
    var $tr = $(`<tr></tr>`);
    $tr.addClass("event-row").addClass(`even${d.type}`).addClass(`entity${d.actor.login}`);
    if (eventTypeIsPreferredHidden(d.type)) {
        $tr.addClass("hidden");
    }
    var $avatar = $(`
<td class="avatar" style="">
		<img src="${d.actor.avatar_url}" style="max-height: 2em;" />
</td>
`);
    var $actor = $(`
<td style="">
		<a href="https://github.com/${d.actor.login}" target="_">${d.actor.login}</a>
</td>
`);
    var $repo = $(`
<td style="text-align: right; padding-right: 5px;" class="repo-td">
    <a href="https://github.com/${d.repo.name}" target="_" style="display: block;">${d.repo.name}</a>
</td>
`);
    var $fmt =$(`
<td style=" ${tdbg} text-align: center;">
    <span>
    ${formatEventName(d)}
    <span style="color: #bbb">${d.type === "PushEvent" ? d.payload.commits.length : ""}</span>
    </span>
</td>`);

    var $payload = $(`<td class="apayload" >${formatPayload(d.type, d)}</td>`);

    var $time = $(`<td style="color: #ccc;">${minimalTimeDisplay(moment(d.created_at))}</td>`);

    var $details = $(`<td class="details" style="font-size: 0.8em;"></td>`);

    var $deets = $(`<!--<code style="max-height: 2em; overflow: hidden;" >${JSON.stringify(d, null, 4)}</code>-->`);

    $details.append($deets);
    $tr.append($avatar);
    $tr.append($actor);
    $tr.append($repo);
    $tr.append($fmt);
    $tr.append($payload);
    $tr.append($time);
    // $tr.append($details);
    return $tr;
};

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
    if (/CLAAssistant/igm.test(da["actor"]["login"])) {
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
							<th>\u{1F431}</th>
							<th style="text-align: left;">entity</th>
							<th style="text-align: right;">location</th>
                            <th></th>
							<th style="text-align: left;">event</th>
                            <!-- <th>info</th> -->
                            <th></th>
<!--							<th class="details">payload</th>-->
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
        if (typeof data[i] == "undefined" || data[i] === null) {
            continue;
        }
        (function (d) {

            // already have this event from some other entity
            if (state.eventIDs.indexOf(d.id) >= 0) {
                return;
            }

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
                    );
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
                    );
            }

            state.eventIDs.push(d.id);
            state.data.push(d);

            var j = insertTimesYieldsI(d.created_at);
            var row = buildRow(d);
            if (row === false) {
                console.log("row was false");
                return;
            }
            if (typeof row === "undefined") {
                console.log("row was undefined");
                return;
            }
            if (row === null) {
                console.log("row was null");
                return;
            }
            row.find(".issue-body").on("click", function () {
                console.log("issue body clicked");
                if (typeof $(this) === "undefined" || $(this) === null) {
                    return;
                }
                $(this).toggleClass("issue-body-expanded");
            });
            if (j === 0) {
                $(`#tabledata`).prepend(row);
            } else {
                $("#tabledata > tr:nth-child(" + j + ")").after(row);
            }
        })(data[i]);
    }

    return true;
};

var snoopNOTOK = function (err) {
    console.error(err);
    $(".instructions").show();
};

var queryEntity = function (q) {
     return $.ajax({
        url: `https://api.github.com/${q.resource}/events?access_token=${q.apikey}&page=${q.page}`,
        dataType: 'json',
        type: "GET",
        contentType: 'application/json',
        success: snoopOK,
        error: snoopNOTOK,
    });
};

var getResources = function(qs) {
    var deferreds = [];
    for (var i = 0; i < qs.length; i++) {
        for (var page = 1; page <= pageLimit; page++) {
            var prom = (queryEntity)({resource: qs[i], page: page, apikey: apikey});
            deferreds.push(prom);
        }
    }
    console.log("deferreds len", deferreds.length);
    return deferreds;
};

var doSnoop = function (query) {
    $("#response").empty();
    $("#entities").empty();
    $("#eventTypes").empty();
    console.log("snooping", query);
    localStorage.setItem("badhub-query", query);
    times = [];
    $(".instructions").hide();

    // set the global
    state.queryEntities = query.split(",");

    // put in array format if only one entitity
    if (state.queryEntities.length === 0) {
        if (query !== "") {
            state.queryEntities = [query];
        }
    }

    var deferreds = getResources(state.queryEntities);

    $.when(...deferreds).then(function() {
        if ( $("#all-charts").hasClass("hidden") ) {
            // nothing;
        } else {
            buildCharts();
        }
    }, function(myfail) {
        console.log("failed", myfail);
    }).catch(function(err) {
        console.log("was error", err);
    });
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
    $("#toggle-charts").on("click", function (e) {

        $("#all-charts").toggleClass("hidden");
        $("#response").toggleClass("hidden");
        $("#list-filter-palette").toggleClass("hidden");

        if ( !$("#all-charts").hasClass("hidden") ) {
            buildCharts();
        }
    });
};

var authorized = function () {
    $("#login").hide();
    $("#main").show();

    var existingQ = getValueFromURLOrStored("badhub-query");
    $("#input-query").val(existingQ);

    setupAuthorizedListeners();
    loadEventTypePrefs();

    if (existingQ !== "" && existingQ !== null) {
        doSnoop(existingQ);
    }
};

var getValueFromURLOrStored = function (lookKey) {
    var search = window.location.href;
    const hashes = search.slice(search.indexOf('?') + 1).split('&');

    const params = {};
    hashes.map(hash => {
        const [key, val] = hash.split('=');
        params[key] = decodeURIComponent(val);
    });

    if (params[lookKey]) {
        console.log("look key", lookKey, params[lookKey]);
        return params[lookKey];
    }

    return localStorage.getItem(lookKey);
};

var valueOk = function (val) {
    return (typeof val !== "undefined") && (val !== null) && (val !== "");
};

var reverseString = function (str) {
    var splitString = str.slice(1).split("");
    var reverseArray = splitString.reverse();
    return str.slice(0, 1) + reverseArray.join("");
};

var setupView = function() {

    var pref = getValueFromURLOrStored("view");
    if (!valueOk(pref)) { return; } // no preference, use coded defaults

    if (pref === "charts") {
        $("#response").addClass("hidden");
        $("#list-filter-palette").addClass("hidden");
        $("#all-charts").removeClass("hidden");

    } else if (pref === "list") {
        $("#response").removeClass("hidden");
        $("#list-filter-palette").removeClass("hidden");
        $("#all-charts").addClass("hidden");
    }
};

$(function () {
    setupLoginListeners();
    setupView();

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
