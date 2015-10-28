var JobPaginator = React.createClass({
    getImageUrl: function(filename, size) {
        return VuDLPrepUtils.getImageUrl(this.state.category, this.state.job, filename, size);
    },

    getInitialState: function() {
        return {active: false, currentPage: 0, order: []};
    },

    loadJob: function(category, job) {
        jQuery.getJSON(VuDLPrepUtils.getJobUrl(category, job, ''), null, function (data, status) {
            data.category = category;
            data.job = job;
            data.active = true;
            data.currentPage = 0;
            this.setState(data);
        }.bind(this));
    },

    nextPage: function() {
        alert('next');
    },

    prevPage: function() {
        alert('prev');
    },

    save: function() {
        alert('save');
    },

    render: function() {
        return (
            <div className={this.state.active ? '' : 'hidden'} id="paginator">
                <div className="row">
                    <div className="six col">
                        <PaginatorPreview />
                        <PaginatorZoomy />
                    </div>
                    <div className="six col">
                        <PaginatorControls paginator={this} />
                        <PaginatorList paginator={this}>{this.state.order}</PaginatorList>
                    </div>
                </div>
            </div>
        );
    }
});

var PaginatorPreview = React.createClass({
    render: function() {
        return (
            <div>Coming soon</div>
        );
    }
});

var PaginatorZoomy = React.createClass({
    render: function() {
        return (
            <div>Coming soon</div>
        );
    }
});

var PaginatorControls = React.createClass({
    prefixes: ['Front ', 'Rear '],
    labels: ['Blank', 'cover', 'fly leaf', 'pastedown', 'Frontispiece', 'Plate'],
    suffixes: [', recto', ', verso'],

    updateCurrentPageLabel: function() {
    },

    render: function() {
        return (
            <div className="controls">
                <div className="group">
                    <div className="status"></div>
                    <input type="text" id="page" onChange={this.updateCurrentPageLabel} />
                    <button onClick={this.props.paginator.prevPage}>Prev</button>
                    <button onClick={this.props.paginator.nextPage}>Next</button>
                </div>
                <div className="top">
                    <ZoomToggleButton />
                    <button className="primary" onClick={this.props.paginator.save}>Save</button>
                </div>
                <PaginatorControlGroup>{this.prefixes}</PaginatorControlGroup>
                <PaginatorControlGroup>{this.labels}</PaginatorControlGroup>
                <PaginatorControlGroup>{this.suffixes}</PaginatorControlGroup>
                <div className="toggles group">
                    <button>Toggle []</button>
                    <button>Toggle Case</button>
                    <button>Toggle Roman Numerals</button>
                </div>
                <button>Autonumber Following Pages</button>
            </div>
        );
    }
});

var PaginatorControlGroup = React.createClass({
    render: function() {
        var buttons = this.props.children.map(function (item) {
            return (
                <button key={item}>{item}</button>
            );
        });
        return (
            <div className="group">{buttons}</div>
        );
    }
});

var PaginatorList = React.createClass({
    render: function() {
        var pages = this.props.children.map(function (page, i) {
            return (
                <Thumbnail paginator={this.props.paginator} key={i} number={i}>{page}</Thumbnail>
            );
        }.bind(this));
        return (
            <div className="pageList">{pages}</div>
        );
    }
});

var Thumbnail = React.createClass({
    render: function() {
        return (
            <div className="thumbnail">
                <img src={this.props.paginator.getImageUrl(this.props.children.filename, 'thumb')} />
                <div className="number">{this.props.number + 1}</div>
                <div className="label">{this.props.children.label}</div>
            </div>
        );
    }
});

var ZoomToggleButton = React.createClass({
    getInitialState: function() {
        return {zoom: false};
    },

    render: function() {
        return (
            <button>{this.state.zoom ? 'Turn Zoom Off' : 'Turn Zoom On'}</button>
        );
    }
});