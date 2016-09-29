fitopts =
  min: 6
  max: 1000


class Knob extends view.View
  editTemplate: _.template '<label for="title">Title</label>' +
    '<input type="text" name="title" value="{{title}}" /><br />' +
    '<label for="query">Query</label>' +
    '<textarea type="text" name="query" class="query">{{query}}</textarea>' +
    '<label for="commaSeparateThousands">Comma Separate Thousands</label>' +
    '<input type="checkbox" name="commaSeparateThousands" {% if(commaSeparateThousands) { %} checked="checked" {% } %} /><br />' +
    '<label for="max">Maximum</label>' +
    '<input type="text" name="max" value="{{-max}}" /><br />' +
    '<label for="unit">Unit</label>' +
    '<input type="text" name="unit" value="{{unit}}" /><br />'

  defaults:
    title:       null
    query:       null

    max:         null
    unit:        null
    commaSeparateThousands: null

  constructor: (options) ->
    super
    settings = extend {}, @defaults, options
    @[key]   = value for key, value of settings

    @clickFocusable = true

    # State
    @currentEvent = null

    # Gauge.js options
    @opts = limitMax: true

    # HTML
    @el.addClass 'knob'
    @el.append '<div class="box">' +
      '<h2></h2>' +
      '<input class="knob-display" data-angleOffset=-125 data-angleArc=250 data-width="60%" data-height="60%" data-readOnly=true data-fgColor="#0CB68F" value="" data-min="0" />' +
      '<div class="metric value">?</div>' +
      '<h3></h3>' +
      '</div>'
    @box = @el.find '.box'
    @el.find('h2').text @title

    # When clicked, display event
    @box.click =>
      eventPane.show @currentEvent

    return unless @query

    reflowed = false
    value    = @el.find ".value"
    knob     = @el.find ".knob-display"
    desc     = @el.find "h3"
    max      = null
    formattr = (val) => val + (@unit or "")
    knob.knob {format: formattr}

    if @max
      max = @max

    @sub = subs.subscribe @query, (e) =>
      @currentEvent = e

      @box.attr "class", "box state " + e.state
      if e.metric
        if !@max and e.metric > max
          # Update maximum to highest value encountered so far
          max = e.metric
          knob.trigger "configure", {max, format: formattr}
        else if e.metric < max
          percentage = Math.round (e.metric/max * 100)
          # knob.val e.metric
          # knob.trigger "change"
          places = (String e.metric).split "."
          places = places[1]?.length
          ($ value: (parseFloat knob.val())).animate {value: e.metric},
            duration: 200
            easing: "swing"
            step: ->
              knob.val parseFloat (Number this.value).toFixed places or 0
                  .trigger "change"


      value.text (format.float e.metric, 2, @commaSeparateThousands) + "/" + (format.float max, 2, @commaSeparateThousands)
      value.attr "title", e.description
      desc.text e.description


      # The first time, do a full-height reflow.
      if reflowed
        value.quickfit fitopts
      else
        @reflow()
        reflowed = true

  json: ->
    extend super(),
      type: "Knob"
      title: @title
      query: @query
      commaSeparateThousands: @commaSeparateThousands
      max: @max
      unit: @unit

  editForm: =>
    @editTemplate this

  reflow: ->
    # Size metric
    value = @el.find ".value"
    value.quickfit
      min: 6
      max: 1000
      font_height_scale: 1

    # Size title
    title = @el.find "h2"
    title.quickfit fitopts

  delete: ->
    subs.unsubscribe @sub if @sub
    super


view.Knob = Knob
view.types.Knob = Knob
