(function() {
    var Help = function(json) {
      view.View.call(this, json);
      this.clickFocusable = true;
      this.el.addClass("help");
      this.el.append([
        '<div class="box">',
        '  <h3>Welcome to Godot-Dash</h3>',
        '  <p>',
        '    This is a port of',
        '    <a href="https://github.com/aphyr/riemann-dash">riemann-dash</a>',
        '    to <a href="http://nodejs.org">node.js</a> and',
        '    <a href="https://github.com/nodejitsu/godot">godot</a>.',
        '    It is <a href="https://github.com/jesusabdullah/godot-dash">',
        '    an open source project on GitHub</a>.',
        '  </p>',
        '  <p>',
        '    Click to select a view. Escape unfocuses. Use the arrow keys to',
        '    move a view. Use ctrl + arrow to <em>split</em> a view in the given',
        '    direction.',
        '    To edit a view, hit e. Use enter, or click `apply`, to apply your',
        '    changes. Escape cancels.',
        '    Make views bigger and smaller with the +/- keys. Pageup selects the',
        '    parent of the current view. To delete a view, use the delete key.',
        '  </p>',
        '  <p>',
        '    To save your changes to the server, press s. You can refresh the',
        '    page, or press r to reload.',
        '  </p>',
        '  <p>',
        '    Switch between workspaces either by clicking the workspace tabs,',
        '    or use the keyboard with alt-1, alt-2, etc.',
        '  </p>',
        "  <p>View is an empty space. Title is an editable text title. Fullscreen and Balloon are top-level container views; you probably won't use them. HStack and VStack are the horizontal and vertical container views; they're implicitly created by splits, but you can create them yourself for fine control. Gauge shows a single event. Grid shows a table of events. Timeseries and Flot show metrics over time--Timeseries is deprecated; Flot will probably replace it.</p>",
        '  <p>You can get more help by pressing `?` at any time.</p>',
        '</div>'
      ].join('\n'));
    }

    view.inherit(view.View, Help);
    view.Help = Help;
    view.types.Help = Help;

    Help.prototype.json = function() {
      return {
        type: 'Help',
        title: this.title
      };
    }
})();
