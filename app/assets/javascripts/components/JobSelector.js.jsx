var JobSelector = React.createClass({
    getInitialState: function() {
        return {active: true, data: []};
    },

    hide: function() {
        var newState = this.state;
        newState.active = false;
        this.setState(newState);
    },

    show: function() {
        this.setState(this.getInitialState());
        this.componentDidMount();
    },

    componentDidMount: function() {
        jQuery.getJSON(this.props.url, null, function (data) {
            this.setState({active: true, data: data});
        }.bind(this));
    },

    render: function() {
        var categories = this.state.data.map(function (category) {
            return (
                <Category app={this.props.app} onJobSelect={this.props.onJobSelect} key={category.category} data={category} />
            );
        }.bind(this));
        return (
            <div className={this.state.active ? '' : 'hidden'} id="jobSelector">
                {categories}
            </div>
        );
    }
});

var Category = React.createClass({
    getInitialState: function() {
        return {open: false};
    },

    toggle: function() {
        this.setState({open: !this.state.open});
    },

    render: function() {
        var header = this.props.data.jobs.length
            ? <h2><a href="#" onClick={this.toggle}>{(this.state.open ? '[ - ]' : '[+]') + ' ' + this.props.data.category}</a></h2>
            : <h2>{this.props.data.category + ' [no jobs]'}</h2>
        var joblist = this.state.open
            ? <JobList app={this.props.app} onJobSelect={this.props.onJobSelect} category={this.props.data.category} data={this.props.data.jobs} />
            : '';
        return (
            <div className="jobCategory">
                {header}
                {joblist}
            </div>
        );
    }
});

var JobList = React.createClass({
    render: function() {
        var jobs = this.props.data.map(function (job) {
            return (
                <Job app={this.props.app} category={this.props.category} onJobSelect={this.props.onJobSelect} key={this.props.category + '|' + job}>{job}</Job>
            );
        }.bind(this));
        return (
            <ul>{jobs}</ul>
        );
    }
});

var Job = React.createClass({
    getInitialState: function() {
        return {};
    },

    componentDidMount: function() {
        this.updateStatus();
    },

    handleClick: function(clickWarning) {
        if (clickWarning) {
            if (!confirm(clickWarning)) {
                return;
            }
        }
        this.props.onJobSelect(this.props.category, this.props.children);
    },

    getDerivUrl: function() {
        return this.props.app.getJobUrl(
            this.props.category, this.props.children, '/derivatives'
        );
    },

    getIngestUrl: function() {
        return this.props.app.getJobUrl(
            this.props.category, this.props.children, '/ingest'
        );
    },

    getStatusUrl: function() {
        return this.props.app.getJobUrl(
            this.props.category, this.props.children, '/status'
        );
    },

    buildDerivatives: function(e) {
        e.stopPropagation();
        $.ajax({
            type: 'PUT',
            url: this.getDerivUrl(),
            contentType: 'application/json',
            data: '{}',
            success: function() { this.updateStatus(); }.bind(this),
        });
    },

    ingest: function(e) {
        e.stopPropagation();
        if (!confirm("Are you sure? This will put a load on the server!")) {
            return;
        }
        $.ajax({
            type: 'PUT',
            url: this.getIngestUrl(),
            contentType: 'application/json',
            data: '{}',
            success: function() { this.updateStatus(); }.bind(this),
        });
    },

    updateStatus: function(e) {
        if (typeof e !== 'undefined') {
            e.stopPropagation();
        }
        jQuery.getJSON(this.getStatusUrl(), null, function (data) {
            this.setState(data);
            if (this.state.derivatives.building) {
                setTimeout(this.updateStatus, 1000);
            }
        }.bind(this));
    },

    render: function() {
        var status = <span> [loading...]</span>;
        var clickable = false;
        var clickWarning = false;
        if (typeof this.state.derivatives !== 'undefined') {
            if (this.state.derivatives.expected === 0) {
                status = <span> [empty job]</span>;
            } else if (this.state.minutes_since_upload < 10) {
                var minutes = this.state.minutes_since_upload;
                clickable = true;
                clickWarning = "This job was updated " + minutes + " minute"
                    + (minutes > 1 ? 's' : '') + " ago. Please do not edit it"
                    + " unless you are sure all uploads have fully completed.";
                status = <span> [recently updated]</span>
            } else if (this.state.published) {
                if (this.state.ingesting) {
                    status = <span> [ingesting now; cannot be edited]</span>
                } else {
                    status = <span> [queued for ingestion; cannot be edited] <a href="#" onClick={this.ingest}>[ingest now]</a></span>
                }
            } else if (this.state.derivatives.expected === this.state.derivatives.processed) {
                status = <span> [ready]</span>;
                clickable = true;
            } else {
                var build = '';
                if (!this.state.derivatives.building) {
                    build = <span> <a href="#" onClick={this.buildDerivatives}>[build]</a></span>
                }
                status = (
                    <span>
                        &nbsp;[derivatives: {this.state.derivatives.processed} / {this.state.derivatives.expected}]
                        {build}
                    </span>
                );
                clickable = true;
            }
        }
        var link = clickable
            ? <a onClick={function () { this.handleClick(clickWarning); }.bind(this)} href="#">{this.props.children}</a>
            : <span>{this.props.children}</span>;
        return (
            <li>
                {link}
                {status}
            </li>
        );
    }
});