var PremadeVis = function() {
    //this is just a namespace. maybe put helper functions here?
};

PremadeVis.basic = function(nodes, container, options) {
    return this;
}

PremadeVis.basic.prototype.init = function(nodes, container, options) {
    this.nodes = nodes;
    this.container = container;
    this.transition_duration = 1000;
    this.show_opacity = '0.2';
    this.hide_opacity = '0';
    for (var option in options) {
        this[option] = options[option]
    }
    this.determine_setter();
    return this;
};
PremadeVis.basic.prototype.start = function() {
    return;
}
PremadeVis.basic.prototype.stop = function() {
    return;
}
PremadeVis.basic.prototype.set_xy = function(nodes, get_function) {
    var self = this;
    self.get_function = get_function
        ? get_function
        : this.get_xy;
        
    return nodes
        .attr('x', function(d, i) {
            self.get_function(d, i)[0];
        })
        .attr('y', function(d, i) {
            self.get_function(d, i)[1];
        })
}
PremadeVis.basic.prototype.get_xy = function(node, i) {
    if (node.x && node.y) {
        return [node.x, node.y];
    } else {
        return this.get_transform_xy(node, i);
    }
}
PremadeVis.basic.prototype.get_transform_xy = function(node, i) {
    var element = this.nodes[0][i];
    var transform_string = jQuery(element).attr('transform');
    var just_the_numbers = transform_string
        .replace(/translate\(/, '')
        .replace(/\)/, '');
    return just_the_numbers.split(',');
}
PremadeVis.basic.prototype.determine_setter = function() {
    if (this.nodes[0][0].tagName === 'g') {
        //ugh
        this.set_xy = this.set_transform_xy;
    }
}

PremadeVis.basic.prototype.set_transform_xy = function(nodes, get_function) {
    var self = this;
    self.get_function = get_function
        ? get_function
        : this.get_xy;
    return nodes
        .attr('transform', function(d, i) {
            xy = self.get_function(d, i)
            return 'translate(' + xy[0] + ',' + xy[1] + ')';
        })
}

PremadeVis.map = function(nodes, container, options) {
    this.init(nodes, container, options);

    this.map_projection = this.map_projection
            .translate([this.w/2 - this.padding, this.h/2 - this.padding])
            .scale([750]),

    this.map_path = d3.geo.path()
        .projection(this.map_projection);

    //setting up the actual paths, referencing "map features" passed in as options
    this.map_elements  = this.container.selectAll("path")
        .data(this.map_features[0].features)
        //enter links the data up with the "path"
        .enter()
        .insert("path", ':first-child')
        .attr("d", this.map_path)
        .attr('class', 'state')
        .attr('id', function(d) { return d.properties.name.toLowerCase().replace(/\s+/g, ''); })
        //map styles
        .style("opacity", "0")

    return this;
}
PremadeVis.list = function(nodes, container, options, app) {
    this.init(nodes, container, options);
    this.app = app;
}
PremadeVis.list.prototype = new PremadeVis.basic;

PremadeVis.list.prototype.start = function() {
    var self = this;
    jQuery(document).resize(function() {
        self.stop()
        self.start()
    });
    this.canvas_dimensions = [
        Math.min($(window).width(), this.w), 
        Math.min($(window).height(), this.h)
    ];

    var svg_heights = [];
    var svg_widths = [];
    this.container.selectAll('g').each(function() {
        svg_heights.push(this.getBBox().height);
        svg_widths.push(this.getBBox().width);
    })

    this.node_dimensions = [
        d3.max(svg_widths),
        d3.max(svg_heights),
    ];

    this.num_columns = Math.floor(
        this.canvas_dimensions[0] / (this.node_dimensions[0] + options.padding)
    );

    this.x_pos_list = [];
    for (var i = 0; i < this.num_columns; i++) {
        this.x_pos_list.push( i * (this.node_dimensions[0] + options.padding) )
    }

    this.nodes.sort(function(a, b) {
                    return b[self.app.active_size_type]
                         - a[self.app.active_size_type];
    }).order();


    this.set_xy(
        this.nodes
            .transition()
            .duration(this.transition_duration),
        this.get_xy
    );
}

PremadeVis.list.prototype.get_xy = function(d, i) {
    var pos = i;
    var x = this.x_pos_list[( pos % this.num_columns )] + (this.node_dimensions[0] / 2);
    var y = (Math.floor( pos / this.num_columns ))
        * ( this.node_dimensions[1] + options.padding )
        + (this.node_dimensions[1]);

    return [x, y];
}

PremadeVis.list.prototype.stop = function() {
    jQuery(document).unbind('resize');
}


PremadeVis.map.prototype = new PremadeVis.basic;

PremadeVis.map.prototype.start = function() {
    var self = this;
    this.set_xy(
        this.nodes
            .transition()
            .duration(this.transition_duration),
        this.get_xy
    );
    
    this.map_elements
        .style('display', 'block')
        .transition()
        .duration(this.transition_duration)
        .style('opacity', this.show_opacity)
        .each('end', function(d) {
            self.map_elements.style('display', 'block');
        });
}

PremadeVis.map.prototype.get_xy = function(node) {
    if (node.lon && node.lat ) { 
        var xy = this.map_projection([node.lon, node.lat]);
    } else if (node.state) {   
        var state_name = node.state.toLowerCase().replace(/\s+/g, '');
        var path = jQuery('#' + state).attr('d');
        var xy = center_of_svg_path(path)
    }
    return xy;
}
PremadeVis.map.prototype.stop = function() {
    var self = this;
    this.map_elements
        .transition()
        .duration(this.transition_duration)
        .style('opacity', this.hide_opacity)
        .each('end', function(d) {
            self.map_elements.style('display', 'none');
        });
}

PremadeVis.force = function(nodes, container, options) {
    this.init(nodes, container, options);
    this.force_gravity = .08;
    this.force_charge = -50;
    this.init(nodes, container, options);
    return this;
}
PremadeVis.force.prototype = new PremadeVis.basic;

PremadeVis.force.prototype.start = function() {
    var self = this;

    if (!this.force_vis) {
        this.create_force_vis()
    }

    if (!this.nodes[0][0].x) {
        var force_nodes = this.force_vis.nodes(); 
        for (var i in force_nodes) {
            if (i === 'parentNode') {
                continue;
            }
            var node = force_nodes[i];
            var xy = this.get_transform_xy(node, i);
            node.x = parseFloat(xy[0]);
            node.y = parseFloat(xy[1]);
        }
    }

    this.force_vis.start();

    if (!this.force_drag) {
        this.create_force_drag();
    }
    this.nodes.call(this.force_drag);
};

PremadeVis.force.prototype.stop = function() {
    this.force_vis.stop();
    this.nodes.on('mousedown.drag', null);
}

PremadeVis.force.prototype.create_force_drag = function() {
    var self = this;
    this.force_drag = d3.behavior.drag();
    this.force_drag.on('drag', function(d) {
        //throw this in base as xy from event?
        this.x = d3.event.x;
        this.y = d3.event.y;
        jQuery(this).attr('transform', "translate(" + d3.event.x + "," + d3.event.y + ")");
    });
    this.force_drag.on('dragend', function() {
        self.force_vis.stop();
        self.force_vis.start();
    })
}

PremadeVis.force.prototype.create_force_vis = function() {
    var self = this;
    this.force_tick = function() {
        self.nodes
            .attr('transform', function(d, i) {
                var element = self.nodes[0][i];
                return "translate(" + element.x + "," + element.y + ")";
            });
    }

    this.force_vis = d3.layout.force()
        .nodes(this.nodes[0])
        .gravity(this.force_gravity) //.08
        .charge(this.force_charge) // -50
        .size([this.w - this.padding * 2, this.h - this.padding * 2])
        .on("tick", this.force_tick)
}

PremadeVis.force.prototype.get_xy = function(node, i) {
    var element = this.nodes[0][i];
    if (element.x && element.y) {
        return [element.x, element.y]
    }
}
