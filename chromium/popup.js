var backgroundPage = null;
var stableRules = null;
var unstableRules = null;
var hostReg = /.*\/\/[^$/]*\//;

function toggleRuleLine(checkbox, ruleset) {
  ruleset.active = checkbox.checked;

  if (ruleset.active != ruleset.default_state) {
    localStorage[ruleset.name] = ruleset.active;
  } else {
    delete localStorage[ruleset.name];
  }
  // Now reload the selected tab of the current window.
  chrome.tabs.reload();
}

function createRuleLine(ruleset) {

  // parent block for line
  var line = document.createElement("div");
  line.className = "rule checkbox";

  // label "container"
  var label = document.createElement("label");

  // checkbox
  var checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  if (ruleset.active) {
    checkbox.setAttribute("checked", "");
  }
  checkbox.onchange = function(ev) {
    toggleRuleLine(checkbox, ruleset);
  };
  label.appendChild(checkbox);

  // favicon (from chrome's cache)
  var favicon = document.createElement("img");
  favicon.src = "chrome://favicon/";
  for (var i=0; i < ruleset.rules.length; i++) {
    var host = hostReg.exec(ruleset.rules[i].to);
    if (host) {
      favicon.src += host[0];
      break;
    }
  }
  label.appendChild(favicon);

  // label text
  var text = document.createElement("span");
  text.innerText = ruleset.name;
  if (ruleset.note.length) {
    text.title = ruleset.note;
  }
  label.appendChild(text);

  line.appendChild(label);

  return line;
}

function gotTab(tab) {
  var rulesets = backgroundPage.activeRulesets.getRulesets(tab.id);

  for (var r in rulesets) {
    var listDiv = stableRules;
    if (!rulesets[r].default_state) {
      listDiv = unstableRules;
    }
    listDiv.appendChild(createRuleLine(rulesets[r]));
    listDiv.style.position = "static";
    listDiv.style.visibility = "visible";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  backgroundPage = chrome.extension.getBackgroundPage();
  stableRules = document.getElementById("StableRules");
  unstableRules = document.getElementById("UnstableRules");
  chrome.tabs.getSelected(null, gotTab);

  // auto-translate all elements with i18n attributes
  var e = document.querySelectorAll("[i18n]");
  for (var i=0; i < e.length; i++) {
    e[i].innerHTML = chrome.i18n.getMessage(e[i].getAttribute("i18n"));
  }

  // other translations
  document.getElementById("whatIsThis").setAttribute("title", chrome.i18n.getMessage("chrome_what_is_this_title"));
});


var escapeForRegex = function( value ) {
  return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
};

$(function() {
  $('#add-rule-link').click(function() {

    chrome.tabs.getSelected(null, function(tab) {
      
      $('#add-rule-link').hide();
      $('#add-new-rule-div').show();
      var newUrl = new URI(tab.url);
      newUrl.scheme('https');
      $('#new-rule-host').val(newUrl.host());
      var oldUrl = new URI(tab.url);
      oldUrl.scheme('http');
      var oldMatcher = '^' + escapeForRegex(oldUrl.scheme() + '://' + oldUrl.host() + '/');
      $('#new-rule-regex').val(oldMatcher);
      var redirectPath = newUrl.scheme() + '://' + newUrl.host() + '/';
      $('#new-rule-redirect').val(redirectPath);
      $('#new-rule-name').val('Manual rule for ' + oldUrl.host());
      $('#add-new-rule-button').click(function() {
        var params = {
          host : $('#new-rule-host').val(),
          redirectTo : $('#new-rule-redirect').val(),
          urlMatcher : $('#new-rule-regex').val(),
        };
        backgroundPage.addNewRule(params,
          function() {
            location.reload();
          });
      });

      $('#cancel-new-rule').click(function() {
        $('#add-rule-link').show();
        $('#add-new-rule-div').hide();
      });
    });
  });
  return false;

});
