var NodeShapeType = function() {
    //this is just a namespace. maybe put helper functions here?
};

NodeShapeType.basic = function(nodes, options, app) {
    return this;
};

NodeShapeType.basic.prototype.init = function(nodes, options, app) {
    this.app = app;
    this.nodes = nodes;
    for (var option in options) {
        this[option] = options[option];
    }
    return this;
};
NodeShapeType.basic.prototype.start = function(callback) {
    if (callback) {
        callback(this);
    }
    return;
};
NodeShapeType.basic.prototype.resize = function(callback) {
    if (callback) {
        callback(this);
    }
    return;
};
NodeShapeType.basic.prototype.stop = function(callback) {
    if (callback) {
        callback(this);
    }
    return;
};

NodeShapeType.basic.prototype.end_function = function(callback) {
    this.completed++;
    console.log(this.circles[0].length)
        console.log(this.completed);
    if (this.circles[0].length === this.completed) {
        this.completed = 0;
        if ( this.app.active_visualization
                && callback) {
            callback(this);
        }
    }
};
NodeShapeType.circles = function(nodes, options, app) {
    this.init(nodes, options, app);
    this.completed = 0;

    return this;
};
NodeShapeType.circles.prototype = new NodeShapeType.basic;

NodeShapeType.circles.prototype.start = function(callback) {
    var self = this;
    this.circles = this.nodes
        .append('circle')
        .attr("r", 0)
    .style("fill", function(d){
        return d.color;
    })
    .style("opacity", .6)
        .attr("class", function(d) {
            return d.class;
        })
        .transition()
        .duration(1000)
        .attr('r', function(d) {
            if ( d[self.app.active_size_type] ) {
                return self.app
                    .size_types_desired[self.app.active_size_type]
                    .scale(
                        d[self.app.active_size_type]
                    );
            } else {
                return 0;
            }
        })
        .each('end', function() { 
            self.end_function(callback) } )
        ;
}

NodeShapeType.circles.prototype.resize = function(callback) {
    var self = this;
    this.circles
        .each(function(d) {
            d3.select(this)
                .transition()
                .duration(1000)
                .attr('r', function(d) {
                    if ( d[self.app.active_size_type] ) {
                        return self.app
                            .size_types_desired[self.app.active_size_type]
                            .scale(
                                d[self.app.active_size_type]
                            );
                    } else {
                        return 0;
                    }
                })
                .each('end', function() { self.end_function(callback) });
        });
    return this;
}

NodeShapeType.circles.prototype.stop = function(callback) {
    var self = this;
    this.circles
        .each(function() {
            d3.select(this)
                .transition()
                .duration(1000)
                .attr('r', 0)
                .each('end', function() {
                    jQuery(this).remove()
                    self.end_function(callback);
                });
        });
}
