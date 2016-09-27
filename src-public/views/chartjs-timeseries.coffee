extend = (root, objs...) ->
  root[key] = value for key, value of obj for obj in objs
  root

# HTML template used to edit this view
editTemplate = _.template '<label for="title">title</label>' +
  '<input type="text" name="title" value="{{title}}" /><br />' +
  '<label for="stackMode">Stack Mode</label>' +
  '<select name="stackMode">' +
  '<option value="true" {% if(stackMode == \'true\') print(\'selected\') %}>Stacked</option>' +
  '<option value="false" {% if(stackMode == \'false\') print(\'selected\') %}>Normal</option>' +
  '</select>' +
  '<br />' +
  '<label for="tooltips">Tooltips</label>' +
  '<select name="tooltips">' +
  '<option value="metric" {% if(tooltips == \'metric\') print(\'selected\') %}>With metric</option>' +
  '<option value="simple" {% if(tooltips == \'simple\') print(\'selected\') %}>Simple</option>' +
  '<option value="false" {% if(tooltips == \'false\') print(\'selected\') %}>Disabled</option>' +
  '</select>' +
  '<br />' +
  '<label for="query">query</label>' +
  '<textarea type="text" class="query" name="query">{{ query }}</textarea><br />' +
  '<label for="timeRange">Time range (s)</label>' +
  '<input type="text" name="timeRange" value="{{timeRange}}" />' +
  '<br />' +
  '<label for="min">Min</label>' +
  '<input type="text" name="min" value="{{min}}" />' +
  '<br />' + '<label for="max">Max</label>' +
  '<input type="text" name="max" value="{{max}}" />'


class TimeseriesLine extends view.View
  defaults:
    title:       null
    query:       null
    timeRange:   30
    fontSize:    11
    fontColor:  "#444"

    max:         null
    min:         null
    stepSize:    null
    stackMode:   "false"
    lineWidth:   1

  constructor: (options) ->
    super
    settings = extend {}, @defaults, options
    @[key]   = value for key, value of settings

    # Set up HTML
    @container = $ '<div class="container"></div>'
    @canvas = $ '<canvas></canvas>'
    if @title
      @el.addClass "flot"
      @el.append '<h2></h2>'
         .append @container
      @el.find("h2").text @title
    else
      @el.replaceWith @container

    @container.append @canvas

    # Create local copies of slurred functions
    @reflowGraph  = util.slur 200, @reflowGraph
    @setGraphData = util.slur 1000, @setGraphData

    # This view can be clicked to focus on it.
    @clickFocusable = true

    # Time series state
    @series = {}
    @data =
      datasets: []

    unless options.virtual
      @reflow()
      # Initialize graph
      @setupGraph new Date
      @clockSub = clock.subscribe (t) =>
        @setGraphData()

      # Subscribe to our query
      @sub = subs.subscribe @query, (e) =>
        @trimData e.time
        @updateTime e.time
        @update e

  # Create our Flot graph
  setupGraph: (t) ->
    if @canvas.width() is 0 or @canvas.height() is 0
      if @graph?
        @graph.shutdown()
        @graph = null

    # Initialize Flot
    @canvas.empty()
    stacked   = @stackMode is "true"
    gridLines =
      lineWidth: 1
      color: "#ddd"

    options =
      responsive:          true
      maintainAspectRatio: false
      scales:
        xAxes: [{type: "time", gridLines, ticks: {@fontSize, @fontColor}}]
        yAxes: [{gridLines, stacked, ticks: {@fontSize, @fontColor}}]

    options.scales.yAxes[0].ticks.min = (parseFloat @min) if @min? and (typeof @min isnt "string" or @min.trim() isnt "")
    options.scales.yAxes[0].ticks.max = (parseFloat @max) if @max? and (typeof @max isnt "string" or @max.trim() isnt "")

    @graph = new TimeSeries @canvas, {@data, options}

  # Called as the clock advances to new times.
  updateTime: (t) ->
    @setupGraph t unless @graph?

    [axis]        = @graph.options.scales.xAxes
    axis.time.min = t - @timeRange * 1000
    axis.time.max = t
    # @refresh()

  # Re-order the data list and series index to be in sorted order by label.
  resortSeries: ->
    # Shorten labels
    hostPrefix    = strings.commonPrefix _.pluck @data.datasets, "riemannHost"
    servicePrefix = strings.commonPrefix _.pluck @data.datasets, "riemannService"

    for dataset in @data.datasets
      dataset.label = (dataset.riemannHost.substring hostPrefix.length) + " " +
                      (dataset.riemannService.substring servicePrefix.length)
      # Empty labels are expanded back to full ones.
      if dataset.label is " "
        dataset.label = dataset.riemannHost + " " + dataset.riemannService

    # Sort data series
    @data.datasets.sort (a, b) ->
      if a.label is b.label      then 0
      else if a.label > b.label  then 1
      else                           -1

    # Rebuild series index
    @series = {}
    @series[s.riemannKey] = i for s, i in @data.datasets

  # Accept events from a subscription and update the dataset.
  update: (event) ->
    controller = null
    # Get series for this host/service
    key = util.eventKey event

    # If this is a new series, add it.
    unless @series[key]?
      l      = @data.datasets.length + 1
      hue    = l * 360 / 12 + (180 * (l % 2))
      hue    = hue % 360
      scheme = new ColorScheme
      scheme.from_hue hue
            .scheme "monochromatic"
            .variation "pastel"
            .web_safe true
      colors = scheme.colors()

      series =
        riemannKey:          key
        riemannHost:         event.host or "nil"
        riemannService:      event.service or "nil"
        shadowSize:          0
        borderWidth:         @lineWidth
        pointBorderWidth:    @lineWidth
        pointHoverRadius:    10
        pointRadius:         0
        pointHitRadius:      10
        borderColor:         "##{colors[1]}"
        backgroundColor:     "##{colors[0]}"
        fill:                @stackMode is "true"
        data:                []

      @data.datasets.push series
      @resortSeries()
      controller = @graph.buildOrUpdateDatasetController series, @data.datasets.indexOf series

    index        = @series[key]
    seriesData   = @data.datasets[index].data
    controller or= (@graph.getDatasetMeta index).controller
    controller.prepareForUpdate()

    # Add event to series
    if event.state is "expired"
      seriesData.push null
    else if event.metric?
      etime = moment new Date event.time
      esecs = etime.format "s"
      label = ""
      if (esecs % 15) is 0
        label = if esecs is 0 then (etime.format "mm:ss") else etime.format ":ss"
      seriesData.push y: event.metric, x: event.time

  # Tells the Flot graph to use our current dataset.
  setGraphData: ->
    return unless @graph
    @graph.data = @data
    @graph.update()

  # Clean up old data points.
  trimData: (t) ->
    t       = t - @timeRange * 1000
    empties = false

    for dataset in @data.datasets
      # We leave one data point off the edge of the graph for continuity.
      while dataset.data.length > 1 and (dataset.data[1] is null or dataset.data[1].x < t)
        dataset.data.shift()

      # And clean up single data points if necessary.
      if dataset.data.length is 1 and (dataset.data[0] is null or dataset.data[0].x < t)
        dataset.data.shift()

      else if dataset.data.length is 0
        empties = true

    # Clean up empty datasets
    if empties
      @data.datasets = (dataset for dataset in @data.datasets when dataset.data.length isnt 0)
      @resortSeries()

  # Serialize current state to JSON
  json: ->
    extend super(),
      type:     "TimeseriesLine"
      title:     @title
      query:     @query
      min:       @min
      max:       @max
      timeRange: @timeRange
      graphType: @graphType
      stackMode: @stackMode
      tooltips:  @tooltips

  # Returns the edit form
  editForm: ->
    editTemplate this

  # Redraws graph
  refresh: ->
    @graph.update()
    @graph.render()

  # Resizes graph
  reflowGraph: ->
    if @graph
      @graph.resize()
      @refresh()

  # Called when our parent needs to resize us
  reflow: ->
    @reflowGraph()

  # When the view is deleted, remove our subscription
  delete: ->
    if @clockSub
      clock.unsubscribe @clockSub
    if @sub
      subs.unsubscribe @sub
    super


# Set up our TimeseriesLine class and register it with the view system
view.TimeseriesLine       = TimeseriesLine
view.types.TimeseriesLine = TimeseriesLine
