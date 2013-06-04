// requires center_of_path_element.js, to find center of path
// requires jQuery, because I hate dealing with the DOM


var SpreadsheetToD3 = function(dataset, options) {
    //setable options
    this.size_button_id_prefix = 'size_button_';
    this.size_button_class = 'size_button';
    this.vis_button_container_id_prefix = 'vis_button_container_';
    this.vis_button_id_prefix = 'vis_button_';
    this.vis_button_class = 'vis_button';
    this.w = 632;
    this.h = 400;
    this.padding = 20;
    this.action_container_id = 'sorts';
    this.vis_container_id = 'container';
    this.first_vis = false;

    this.options = options;
    for (key in options) {
        this[key] = options[key];
    }

    this.action_container = jQuery('#' + this.action_container_id);
    this.vis_container = jQuery('<div id="vis_container"><label>Choose Visualization: </label></div>');
    this.size_container = jQuery('<div id="size_container"><label>Choose Data: </label></div>');
    this.rows = dataset;
    this.active_size_type = false;
    this.active_node_type = false;
    this.active_visualization = false;
    this.nodes;

    this.drawGraph(this.rows);
    
    this.create_scale();
    this.set_possible_visualizations();

    this.create_size_buttons();
    this.create_visualization_buttons();
    
    this.action_container.find('#' + this.vis_button_id_prefix + this.active_size_type + this.first_vis).click();
    this.action_container.find('#' + this.size_button_id_prefix + this.active_size_type).click();
}


SpreadsheetToD3.prototype.resize = function(type, callback) {
    this.active_size_type = type;
    this.possible_visualizations[this.active_visualization].sort();
    this.possible_shapes[ this.active_shape_type ].resize(callback); 
}

SpreadsheetToD3.prototype.swap_shape_type = function(new_type, callback) {
    var self = this;
    if (this.active_shape_type === new_type) {
        this.resize(this.active_size_type, callback);
    } else if (this.active_shape_type) {
        this.possible_shapes[ this.active_shape_type ].stop(function() {
            self.active_shape_type = new_type;
            self.possible_shapes[ new_type ].start(callback);
        }); 
    } else {
        this.active_shape_type = new_type;
        this.possible_shapes[ new_type ].start(callback);
    }
}



SpreadsheetToD3.prototype.create_visualization_buttons = function() {
    if (this.desired_visualizations.length > 1) {
        this.action_container.append(this.vis_container);
    }
    for (var i = 0; i < this.desired_visualizations.length; i++) {
        this.create_visualization_button(this.desired_visualizations[i]);
    }
}

SpreadsheetToD3.prototype.create_visualization_button = function(vis) {
    var self = this;
    var data_specific_vis_container = jQuery('<ul id="'
        + this.vis_button_id_prefix + vis.data + '"></ul>').hide(); 
    for (var i = 0; i < vis.visualizations.length; i++) {
        var type = vis.visualizations[i];
        var element = jQuery('<button class="' + this.vis_button_class 
                + '" id="' + this.vis_button_id_prefix + vis.data + type + '">' 
                + type + '</button>');
        (function(type) {
            element.click(function() {
                self.action_container.find('.' + self.vis_button_class + '.selected').removeClass('selected');
                jQuery(this).addClass('selected');
                if (self.active_visualization) {
                    self.possible_visualizations[self.active_visualization].stop();
                }
                self.active_visualization = type;
                //fixme PUT SWAP SHAPE TYPE HERE
                self.possible_visualizations[type].start();
            })
        })(type);
        data_specific_vis_container.append(element);
    }
    this.vis_container.append(data_specific_vis_container);
}

SpreadsheetToD3.prototype.create_scale = function() {
    for (var i = 0; i < this.desired_visualizations.length; i++) {
        var scale_key = this.desired_visualizations[i].scale_against 
            ? this.desired_visualizations[i].scale_against
            : this.desired_visualizations[i].data
        ;
        var items_with_values = 0;
        for (var row in this.rows) {
            if (this.rows[row][scale_key] && this.rows[row][scale_key] > 0) {
                items_with_values++;
            }
        }

        //var max = Math.floor(this.w / items_with_values);
        var max = Math.floor(3.5 * this.w / items_with_values);
        this.desired_visualizations[i].scale = d3.scale.linear()
            .domain([d3.min(this.rows, function(d){return parseInt(d[scale_key]);}), 
                    d3.max(this.rows, function(d){return parseInt(d[scale_key]);})])
            //defining a minimum bubble size
            .range([4, max]);
    }

}

SpreadsheetToD3.prototype.create_size_buttons = function() {
    var self = this;
    this.action_container.append(this.size_container);

    for (var i = 0; i < this.desired_visualizations.length; i++) {
        var vis = this.desired_visualizations[i];
        var element = jQuery('<button class="' + this.size_button_class 
                + '" id="' + this.size_button_id_prefix + vis.data + '">' 
                + vis.label + '</button>');
        (function(vis) {
             element.click(function() {
                 self.action_container.find('.' + self.size_button_class + '.selected').removeClass('selected');
                 jQuery(this).addClass('selected');
                 jQuery('#vis_container ul').hide()
                 jQuery('#' + self.vis_button_id_prefix + vis.data).show();
                 if (vis.visualizations.length > 1) {
                     jQuery('#vis_container').show();
                 } else {
                     jQuery('#vis_container').hide();
                 }

                 var new_vis = (vis.visualizations.indexOf(self.active_visualization) !== -1)
                    ? self.active_visualization
                    : vis.visualizations[0];

                 self.resize(vis.data, function() {
                     self.action_container.find('#' + self.vis_button_id_prefix + self.active_size_type + new_vis).click();
                 });
             })
        })(vis);

        this.size_container.append(element);

        if (!this.active_size_type) {
            this.active_size_type = vis.data;
        }
    }
    // this is taking advantage of the fact that the for loop leaves debris
    // consider doing this in a less clever way
    if (this.desired_visualizations.length < 2 && element) {
        element.hide();
    }
}

//defining svg, appending svg element to container
SpreadsheetToD3.prototype.drawGraph = function(){
    var self = this;
    this.svg = d3.select("#" + this.vis_container_id)
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


    //HERE is where i used to make circles

    var texts = this.nodes
        .append("text")
        .text(function(d){
            return d.label;
        })
        .attr("class", function(d){
            return d.class;
        })
        .style('text-anchor', 'middle')
        .style('opacity', 0)
        .style('baseline-shift', '10px');


    var tooltip = jQuery('<div id="tooltip"></div>');
    jQuery('#' + this.vis_container_id).append(tooltip);
    tooltip.addClass('hidden');

    this.svg.selectAll("g.circle_container")
        .on("mouseover", function(d) {
            dust.render(self.active_size_type, d, function(err, out) {
                if (err) {
                    console.log(err);
                }
                /*
                tooltip.animate({
                    'left': d3.event.offsetX,
                    'top': d3.event.offsetY
                }, 200);
                */
                tooltip.css('left', d3.event.pageX - self.vis_container.offset().left);
                tooltip.css('top', d3.event.pageY - self.vis_container.offset().top - self.padding );

                jQuery(tooltip).html(out);

                if ( tooltip.outerWidth() + d3.event.pageX > jQuery('body').outerWidth() ) {
                    tooltip.css('left', d3.event.pageX - tooltip.outerWidth() - self.vis_container.offset().left);
                }
                if ( tooltip.outerHeight() + d3.event.pageY > jQuery('body').outerHeight() ) {
                    tooltip.css('top', d3.event.pageY - tooltip.outerHeight() - self.vis_container.offset().top 
                        - (self.padding * 3));
                }
                tooltip.removeClass('hidden');
                
            });
        })

    .on("mouseout", function() {

        //Hide the tooltip
        tooltip.addClass('hidden');
    });
}

SpreadsheetToD3.prototype.set_possible_visualizations = function() {
    this.possible_visualizations = {}
    this.possible_shapes = {}
    this.size_types_desired = {};
    for (var i = 0; i < this.desired_visualizations.length; i++) {
        var vis = this.desired_visualizations[i];
        this.size_types_desired[vis.data] = vis;

        var tooltip_template = vis.tooltip_template 
            ? vis.tooltip_template 
            : '{text}';
        var compiled_tooltip = dust.compile(tooltip_template, vis.data);
        dust.loadSource(compiled_tooltip);


        for (var j = 0; j < vis.visualizations.length; j++) {
            var vis_type = vis.visualizations[j];
            if (!this.possible_visualizations[vis_type]) {

                var new_vis = new PremadeVis[vis_type](this.nodes, this.svg, this.options, this);
                if (!this.first_vis) {
                    this.first_vis = this.active_visualization = vis_type; 
                }

                for (var k = 0; k < new_vis.required_node_shapes.length; k++) {
                    var shape_type = new_vis.required_node_shapes[k];
                    if (!this.possible_shapes[ shape_type ] ) {
                        if (!this.first_shape) {
                            this.first_shape = shape_type;
                        }

                        this.possible_shapes[ shape_type ] = 
                            new NodeShapeType[ shape_type ](this.nodes, this.options, this); 
                    }
                }
                this.possible_visualizations[vis_type] = new_vis;
            }

        }
    }
};
