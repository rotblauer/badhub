var apikey = "";
var pageLimit = 3; // 10 pages is API max // 30 events per page // TODO FIXME add a user-configurable feature here

var state = {
    eventIDs: [],
    data: [],
    queryEntities: [],
    actors: [],
    repositories: [],
    eventTypes: []
};


// var eligibleData = [];
// var queryEntities = [];

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
            return "#c31cff";
    }
    return "#ddd";
};


// accepts _moment()_ time
var minimalTimeDisplay = function (time) {
    return time.fromNow(true).replace("a few seconds", "0m").replace("a ", "1").replace("an", "1").replace("hours", "h").replace("hour", "h").replace("minutes", "m").replace("minute", "m").replace(" ", "").replace("days", "d").replace("day", "d").replace("months", "M").replace("month", "M");
};

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


var md = window.markdownit({
    linkify: true,
    breaks: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, str).value;
            } catch (__) {}
        }
        return ''; // use external default escaping
    }
   });

var eventIconFromName = function(name) {
     switch (name) {
        case "PushEvent":
            return `\u{1F535}`; // ` `; // `\u{1F535}`; //`⬆️`;

        case "CreateEvent":
            return `🔰`;

        case "ForkEvent":
            return `🔀`;

        case "DeleteEvent":
            return `❌ `;

        case "WatchEvent":
            return `⭐️`;

        case "IssuesEvent":
            return `\u{1F4D3}`; //  `\u{1F4C3}`;// `🔖`;

        case "PullRequestEvent":
            return `⏪`;

        case "IssueCommentEvent":
            return `📝`;

        case "PullRequestReviewEvent":
            return `📝`;

        case "PullRequestReviewCommentEvent":
            return `\u{1F913}`; // `🖍`;

        case "CommitCommentEvent":
            return '💬';

        case "ReleaseEvent":
            return '📦';

        case "MemberEvent":
            return '🚼';

        case "GollumEvent":
            return `📜`;

     }
    return "";
};

var formatEventName = function (data) {
    var n = "";
    var eventName = data.type;
    return eventIconFromName(eventName);
    // switch (eventName) {
    //     case "PushEvent":
    //         n += `\u{1F535}`; // ` `; // `\u{1F535}`; //`⬆️`;
    //         break;
    //     case "CreateEvent":
    //         n += `🔰`;
    //         break;
    //     case "ForkEvent":
    //         n += `🔀`;
    //         break;
    //     case "DeleteEvent":
    //         n += `❌ `;
    //         break;
    //     case "WatchEvent":
    //         n += `⭐️`;
    //         break;
    //     case "IssuesEvent":
    //         n += `\u{1F4D3}`; //  `\u{1F4C3}`;// `🔖`;
    //         break;
    //     case "PullRequestEvent":
    //         n += `⏪`;
    //         break;
    //     case "IssueCommentEvent":
    //         n += `📝`;
    //         break;
    //     case "PullRequestReviewEvent":
    //         n += `📝`;
    //         break;
    //     case "PullRequestReviewCommentEvent":
    //         n += `\u{1F913}`; // `🖍`;
    //         break;
    //     case "CommitCommentEvent":
    //         n += '💬';
    //         break;
    //     case "ReleaseEvent":
    //         n += '📦';
    //         break;
    //     case "MemberEvent":
    //         n += '🚼';
    //         break;
    //     case "GollumEvent":
    //         n += `📜`;
    //         break;
    // }
    // // n += " " + data.type.replace("Event", "");

    // return n;
};

var isProjectManagement = function (data) {
    return !/^(Push|Create|Fork|Delete|Release)/igm.test(data.type);
};


var eventTypesPreferHidden = [];
var eventTypeIsPreferredHidden = function (eventType) {
    return eventTypesPreferHidden.indexOf(eventType) > -1;
};



var eventRowBG = function (data) {
    if (data.type == "DeleteEvent") {
        return "#ffebeb";
    }
    if (data.payload.push_id) {
        return "#dfedff80";
        // return "#edffff";
    }
    if (!data.payload.action) {
        return "none";
    }
    var action = data.payload.action === "closed" && data.payload.pull_request && data.payload.pull_request.merged ? "merged" : data.payload.action;
    switch (action) {
        case "created":
            if (/Comment/igm.test(data.type)) {
                return "#fffdeb";
            }
            return "#f4fff4";
        case "opened":
            return "#f4fff4";
        case "reopened":
            return "#f4fffa";
        case "edited":
            return "#fff0e9";
        case "closed":
            return "#fff1f1";
        case "published":
            return "#edfbff";
        case "merged":
            return "#f3e9ff";
    }
    return "none";
};
