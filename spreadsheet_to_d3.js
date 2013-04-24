// requires center_of_path_element.js, to find center of path
// requires jQuery, because I hate dealing with the DOM


var SpreadsheetToD3 = function(dataset, options) {
    //setable options
    this.size_button_id_prefix = 'size_button_';
    this.size_button_class = 'size_button';
    this.vis_button_id_prefix = 'vis_button_';
    this.vis_button_class = 'vis_button';
    this.w = 632;
    this.h = 400;
    this.padding = 20;
    this.size_type_signifier = /^size/;
    this.action_container_id = 'sorts';
    this.indicates_a_space_in_a_label = '-';
    this.first_vis = false;
    // this array says which visualizations we want. they must match those in POSSIBLE_VISUALIZATIONS
    this.desired_visualizations = [
        'map',
        'force'
    ]

    this.options = options;
    for (key in options) {
        this[key] = options[key];
    }

    this.action_container = jQuery('#' + this.action_container_id);
    this.rows = dataset;
    this.active_size_type = false;
    this.active_visualization = false;
    this.nodes;

    this.drawGraph(this.rows);

    this.set_possible_visualizations();
    this.size_types_required = this.create_datastructure(dataset);
    this.create_size_buttons();
    this.create_visualization_buttons();

    
    this.action_container.find('#' + this.size_button_id_prefix + this.active_size_type).click();
    this.action_container.find('#' + this.vis_button_id_prefix + this.first_vis).click();
}






SpreadsheetToD3.prototype.create_visualization_buttons = function() {
    if (this.desired_visualizations.length > 1) {
        this.action_container.append(jQuery('<label>Choose Visualization</label>'));
    }
    for (var i = 0; i < this.desired_visualizations.length; i++) {
        this.create_visualization_button(this.desired_visualizations[i]);
    }
}

SpreadsheetToD3.prototype.create_visualization_button = function(type) {
    var self = this;
    var element = jQuery('<button class="' + this.vis_button_class 
            + '" id="' + this.vis_button_id_prefix + type + '">' 
            + type + '</button>');
    (function(type) {
        element.click(function() {
            self.action_container.find('.' + self.vis_button_class + '.selected').removeClass('selected');
            jQuery(this).addClass('selected');
            if (self.active_visualization) {
                self.possible_visualizations[self.active_visualization].stop();
            }
            self.active_visualization = type;
            self.possible_visualizations[type].start();
        })
    })(type);
    this.action_container.append(element);
    if (this.desired_visualizations.length < 2) {
        element.hide();
    }

}

SpreadsheetToD3.prototype.create_datastructure = function() {
    var example_row = this.rows[0];
    this.size_types_desired = {};
    for (var key in example_row) {
        if ( key.toLowerCase().match(this.size_type_signifier) ) {
            if (!this.active_size_type) {
                this.active_size_type = key;
            }
            this.size_types_desired[key] = { 'name' : key };

            var items_with_values = 0;
            for (var row in this.rows) {
                if (this.rows[row][key]) {
                    items_with_values++;
                }
            }
            var max = Math.floor(this.w / 2 / items_with_values);
            this.size_types_desired[key].scale = d3.scale.linear()
                .domain([d3.min(this.rows, function(d){return d[key];}), 
                        d3.max(this.rows, function(d){return d[key];})])
                //defining a minimum bubble size
                .range([5, max]);

            }
    }

}

SpreadsheetToD3.prototype.create_size_buttons = function() {
    var self = this;
    if (Object.keys(this.size_types_desired).length > 1) {
        this.action_container.append(jQuery('<label>Choose Data</label>'));
    }
    for (var type in this.size_types_desired) {
        var label = type.toLowerCase().replace(this.size_type_signifier, '');
        var label_pieces = label.split(this.indicates_a_space_in_a_label);
        var finished_label = '';
        for (var i = 0; i < label_pieces.length; i++) {
            var piece = label_pieces[i];
            finished_label += ' ' + piece.charAt(0).toUpperCase() + piece.slice(1);
        }
        var element = jQuery('<button class="' + this.size_button_class + '" id="' + this.size_button_id_prefix + type +'">' + finished_label + '</button>');
        (function(type, visObj) {
             element.click(function() {
                 self.action_container.find('.' + self.size_button_class + '.selected').removeClass('selected');
                 jQuery(this).addClass('selected');
                 visObj.active_size_type = type;
                 visObj.resize_circles(type);
             })
        })(type, this);
        this.action_container.append(element);
    }
    // this is taking advantage of the fact that the for loop leaves debris
    // consider doing this in a less clever way
    if (Object.keys(this.size_types_desired).length < 2) {
        element.hide();
    }
}

SpreadsheetToD3.prototype.resize_circles = function(type) {
    var self = this;
    d3.selectAll('g.circle_container circle')
        .transition()
        .duration(1000)
        .attr('r', function(d) {
            if ( d[self.active_size_type] ) {
                return self.size_types_desired[self.active_size_type].scale(
                    d[self.active_size_type]
                    );
            } else {
                return 0;
            }
        });
}

//defining svg, appending svg element to container
SpreadsheetToD3.prototype.drawGraph = function(){
    var self = this;
    this.svg = d3.select("#container")
        .append("svg")
        .attr("width", this.w)
        .attr("height", this.h);

    //setting the projetion (using albers)




    //setting up a scale for the x axis ROUNDS ( probably going to need to do this by round, i.e. X value is 1 at big dance, 2 at 32, 3 at sweet 13, etc.)
    var xScale = d3.scale.linear()
        .domain([1, 13])
        .range([this.padding, this.w - this.padding]);

    //setting up scale for the y axis, need to do this by game position
    var yScale = d3.scale.linear()
        .domain([34, 1])
        .range([this.h - this.padding, this.padding]);


    //selecting the circles and appending one for each school
    this.nodes = this.svg.selectAll("g")
        .data(this.rows)

    this.nodes
        .enter() 
        .append('g')
        .attr('class', 'circle_container')
        .attr('id', function(d, i) {
            return 'svg_container_' + i;
        })


    var circles = this.nodes
        .append('circle')
        .attr("r", function(d){
            if ( d[this.active_size_type] ) {
                return self.size_types_desired[this.active_size_type].scale(
                    d[this.active_size_type]
                    );
            } else {
                return 0;
            }
        })
    .style("fill", function(d){
        return d.color;
    })
    .style("opacity", .6)
        .attr("class", function(d) {
            return d.class;
        });

    var texts = this.nodes
        .append("text")
        .text(function(d){
            return d.label;
        })
    .attr("class", function(d){
        return d.class;
    });

    this.svg.append('text')
        .attr('id', 'tooltip')
        .classed("hidden", true);
    this.svg.selectAll("g")
        .on("mouseover", function(d) {
            //Get this bar's x/y values, then augment for the tooltip
            d3.select("#tooltip")
            .attr('transform', "translate(" + d3.event.pageX + "," + d3.event.pageY + ")")
            .style("left", (d3.event.pageX) + 20 + "px")
            .style("top", (d3.event.pageY) - 30 + "px")
            .text(d.text);
        d3.select("#tooltip").classed("hidden", false);
        })

    .on("mouseout", function() {

        //Hide the tooltip
        d3.select("#tooltip").classed("hidden", true);
    });
}

SpreadsheetToD3.prototype.set_possible_visualizations = function() {
    this.possible_visualizations = {}
    for (i in this.desired_visualizations) {
        var vis = this.desired_visualizations[i];
        if (!this.first_vis) {
            this.first_vis = vis; 
        }

        var new_vis = new PremadeVis[vis](this.nodes, this.svg, this.options);
        this.possible_visualizations[vis] = new_vis;
    }
};
