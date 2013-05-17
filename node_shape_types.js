var NodeShapeType = function() {
    //this is just a namespace. maybe put helper functions here?
};

NodeShapeType.basic = function(nodes, options, app) {
    return this;
};

NodeShapeType.basic.prototype.init = function(nodes, options, app) {
    this.completed = 0;
    this.app = app;
    this.nodes = nodes;
    for (var option in options) {
        this[option] = options[option];
    }
    return this;
};
NodeShapeType.basic.prototype.start = function(callback) {
    var deferreds = [];
    var self = this;
    this.elements = 
        this.do_sizing_transform(
            this.do_removing_transform(
                this.create_element(this.nodes)
            )
            .style("fill", function(d){
                return d.color;
            })
            .style("opacity", .6)
                .attr("class", function(d) {
                    return d.class;
                })
                .transition()
                .duration(1000)
        )
        .each('start', function() {
            this.deferred = $.Deferred(); 
            deferreds.push( this.deferred );
        })
        .each('end', function() { 
            this.deferred.resolve();
        });
    jQuery.when.apply(null, deferreds).done(callback);
    return this;
};

NodeShapeType.basic.prototype.create_element = function(nodes) {
    return nodes.append(this.element_type);
}

NodeShapeType.basic.prototype.resize = function(callback) {
    var self = this;
    var deferreds = [];
    this.elements
        .each(function(d) {
            var deferred = $.Deferred(); 
            deferreds.push( deferred );
            self.do_sizing_transform(
                    d3.select(this)
                        .transition()
                        .duration(1000)
                )
                .each('end', function() { 
                    deferred.resolve();
                });
        });
    jQuery.when.apply(null, deferreds).done(callback);
    return this;
}

NodeShapeType.basic.prototype.do_sizing_transform = function(transition_element) {
    return transition_element;
}
NodeShapeType.basic.prototype.do_removing_transform = function(transition_element) {
}

NodeShapeType.basic.prototype.stop = function(callback) {
    callback = callback ? callback : function(){};
    var self = this;
    var deferreds = [];

    this.elements
        .each(function() {
            var deferred = $.Deferred(); 
            deferreds.push( deferred );
            self.do_removing_transform(
                d3.select(this)
                    .transition()
                    .duration(1000)
                    .each('end', function() {
                        deferred.resolve();
                    })
            )
        });
    jQuery.when.apply(null, deferreds).done( callback );
    return;
};




NodeShapeType.circles = function(nodes, options, app) {
    this.element_type = 'circle';
    return this.init(nodes, options, app);
};
NodeShapeType.circles.prototype = new NodeShapeType.basic;

NodeShapeType.circles.prototype.do_sizing_transform = function(transition_element) {
    var self = this;
    return transition_element
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
}
NodeShapeType.circles.prototype.do_removing_transform = function(transition_element) {
    return transition_element.attr('r', 0);
}


NodeShapeType.rectangles = function(nodes, options, app) {
    this.element_type = 'rect';
    return this.init(nodes, options, app);
};
NodeShapeType.rectangles.prototype = new NodeShapeType.basic;

NodeShapeType.rectangles.prototype.do_sizing_transform = function(transition_element) {
    var self = this;
    return transition_element
        .attr('width', function(d) {
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
        .attr('height', function(d) {
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
}
NodeShapeType.rectangles.prototype.do_removing_transform = function(transition_element) {
    return transition_element
        .attr('height', 0)
        .attr('width', 0)
}
