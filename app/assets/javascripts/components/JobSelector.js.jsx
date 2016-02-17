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
        this.props.app.getJSON(this.props.url, null, function (data) {
            this.setState({active: true, data: data});
        }.bind(this));
    },

    render: function() {
        var categories = [];
        var empty_categories = [];
        for (var i in this.state.data) {
            var category = this.state.data[i];
            var element = <Category app={this.props.app} onJobSelect={this.props.onJobSelect} key={category.category} data={category} />
            if (category.jobs.length > 0) {
                categories[categories.length] = element;
            } else {
                empty_categories[empty_categories.length] = element;
            }
        }
        return (
            <div className={this.state.active ? '' : 'hidden'} id="jobSelector">
                {categories}
                {empty_categories}
            </div>
        );
    }
});

var Category = React.createClass({
    checkStorage: function() {
        return typeof(window.sessionStorage) !== "undefined"
            ? "true" === window.sessionStorage.getItem("open-" + this.props.data.category)
            : false;
    },

    setStorage: function(isOpen) {
        if (typeof(window.sessionStorage) !== "undefined") {
            window.sessionStorage.setItem("open-" + this.props.data.category, isOpen ? "true" : "false")
        }
    },

    getInitialState: function() {
        return {open: this.checkStorage()};
    },

    toggle: function() {
        this.setStorage(!this.state.open);
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
        this.props.app.ajax({
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
        this.props.app.ajax({
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
        this.props.app.getJSON(this.getStatusUrl(), null, function (data) {
            this.setState(data);
            if (this.state.derivatives.building) {
                setTimeout(this.updateStatus, 1000);
            }
        }.bind(this));
    },

    getAgeString: function(minutes) {
        if (1 == minutes) {
            return "1 minute old";
        }
        if (minutes < 60) {
            return minutes + " minutes old";
        }
        var hours = Math.floor(minutes / 60);
        if (1 == hours) {
            return "1 hour old";
        }
        if (hours < 24) {
            return hours + " hours old";
        }
        var days = Math.floor(hours / 24);
        if (1 == days) {
            return "1 day old";
        }
        if (days < 7) {
            return days + " days old";
        }
        var weeks = Math.floor(days / 7);
        if (1 == weeks) {
            return "1 week old";
        }
        if (weeks < 52) {
            return weeks + " weeks old";
        }
        var years = Math.floor(weeks / 52);
        if (1 == years) {
            return "1 year old";
        }
        return years + " years old";
    },

    render: function() {
        var clickable = false;
        var clickWarning = false;
        var action = '';
        var statusText = [];
        if (typeof this.state.derivatives !== 'undefined') {
            statusText.push(this.getAgeString(this.state.minutes_since_upload));
            if (this.state.derivatives.expected === 0) {
                statusText.push('empty job');
            } else {
                var pageCount = parseInt(this.state.derivatives.expected / 3);
                statusText.push(pageCount + (pageCount > 1 ? ' pages' : ' page'));
                if (this.state.minutes_since_upload < 10) {
                    var minutes = this.state.minutes_since_upload;
                    clickWarning = "This job was updated " + minutes + " minute"
                        + (minutes != 1 ? 's' : '') + " ago. Please do not edit it"
                        + " unless you are sure all uploads have fully completed.";
                }
                if (this.state.published) {
                    if (this.state.ingesting) {
                        statusText.push('ingesting now; cannot be edited');
                    } else {
                        statusText.push('queued for ingestion; cannot be edited');
                        action = <a href="#" onClick={this.ingest}>[ingest now]</a>
                    }
                } else if (this.state.derivatives.expected === this.state.derivatives.processed) {
                    statusText.push('ready');
                    clickable = true;
                } else {
                    var build = '';
                    if (!this.state.derivatives.building) {
                        action = <a href="#" onClick={this.buildDerivatives}>[build derivatives]</a>
                    }
                    var percentDone = (100 * (this.state.derivatives.processed / this.state.derivatives.expected));
                    statusText.push('derivatives: ' + percentDone.toFixed(2) + '% built');
                    clickable = true;
                }
            }
        } else {
            statusText.push('loading...');
        }
        var link = clickable
            ? <a onClick={function () { this.handleClick(clickWarning); }.bind(this)} href="#">{this.props.children}</a>
            : <span>{this.props.children}</span>;
        return (
            <li>
                {link}
                {' [' + statusText.join(', ') + '] '}
                {action}
            </li>
        );
    }
});