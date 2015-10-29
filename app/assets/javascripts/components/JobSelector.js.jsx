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
        var newState = this.state;
        newState.active = true;
        this.setState(newState);
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
    render: function() {
        return (
            <div className="jobCategory">
                <h2>{this.props.data.category}</h2>
                <JobList app={this.props.app} onJobSelect={this.props.onJobSelect} category={this.props.data.category} data={this.props.data.jobs} />
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
    render: function() {
        return (
            <li><JobLink app={this.props.app} category={this.props.category} onJobSelect={this.props.onJobSelect}>{this.props.children}</JobLink></li>
        );
    }
});

var JobLink = React.createClass({
    getInitialState: function() {
        return {building: false};
    },

    componentDidMount: function() {
        this.updateDerivativeStatus();
    },

    handleClick: function(e) {
        this.props.onJobSelect(this.props.category, this.props.children);
    },

    getDerivUrl: function() {
        return this.props.app.getJobUrl(
            this.props.category, this.props.children, '/derivatives'
        );
    },

    buildDerivatives: function(e) {
        e.stopPropagation();
        var newState = this.state;
        newState.building = true;
        this.setState(newState);
        $.ajax({
            type: 'PUT',
            url: this.getDerivUrl(),
            contentType: 'application/json',
            data: '{}',
            success: function() { this.updateDerivativeStatus(); }.bind(this),
        });
    },

    updateDerivativeStatus: function(e) {
        if (typeof e !== 'undefined') {
            e.stopPropagation();
        }
        jQuery.getJSON(this.getDerivUrl(), null, function (data) {
            data.building = this.state.building;
            this.setState(data);
        }.bind(this));
        if (this.state.building) {
            setTimeout(this.updateDerivativeStatus, 1000);
        }
    },

    render: function() {
        var status = <span> [loading...]</span>;
        if (typeof this.state.expected !== 'undefined') {
            if (this.state.expected === this.state.processed) {
                status = <span> [ready]</span>;
            } else {
                var build = '';
                if (!this.state.building) {
                    build = <span> <a href="#" onClick={this.buildDerivatives}>[build]</a></span>
                }
                status = (
                    <span>
                        &nbsp;[derivatives: {this.state.processed} / {this.state.expected}]
                        &nbsp;<a href="#" onClick={this.updateDerivativeStatus}>[refresh]</a>
                        {build}
                    </span>
                );
            }
        }
        return (
            <span>
                <a onClick={this.handleClick} href="#">{this.props.children}</a>
                {status}
            </span>
        );
    }
});