var JobPaginator = React.createClass({
    getImageUrl: function(imageNumber, size) {
        if (typeof this.state.order[imageNumber] === 'undefined') {
            return false;
        }
        filename = this.state.order[imageNumber].filename;
        return this.props.app.getImageUrl(this.state.category, this.state.job, filename, size);
    },

    getInitialState: function() {
        return {active: false, currentPage: 0, zoom: false, order: []};
    },

    loadJob: function(category, job) {
        jQuery.getJSON(this.props.app.getJobUrl(category, job, ''), null, function (data, status) {
            data.category = category;
            data.job = job;
            data.active = true;
            data.currentPage = 0;
            this.setState(data);
        }.bind(this));
    },

    setPage: function(p) {
        if (p >= 0 && p < this.state.order.length) {
            var newState = this.state;
            newState.currentPage = p;
            this.setState(newState);
        }
    },

    nextPage: function() {
        this.setPage(this.state.currentPage + 1);
    },

    prevPage: function() {
        this.setPage(this.state.currentPage - 1);
    },

    save: function() {
        alert('save');
    },

    toggleZoom: function() {
        newState = this.state;
        newState.zoom = !newState.zoom;
        this.setState(newState);
    },

    render: function() {
        var preview = this.state.zoom
            ? <PaginatorZoomy img={this.getImageUrl(this.state.currentPage, 'large')} />
            : <PaginatorPreview img={this.getImageUrl(this.state.currentPage, 'medium')} />
        return (
            <div className={this.state.active ? '' : 'hidden'} id="paginator">
                <div className="row">
                    <div className="six col">{preview}</div>
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
        var img = this.props.img
            ? <img src={this.props.img} />
            : '';
        return (
            <div className="preview">
                {img}
            </div>
        );
    }
});

var PaginatorZoomy = React.createClass({
    componentDidMount: function() {
        Zoomy.init(document.getElementById('zoomy'));
        Zoomy.load(this.props.img);
    },

    componentDidUpdate: function() {
        Zoomy.load(this.props.img);
    },

    render: function() {
        return (
            <canvas id="zoomy" width="800" height="600"></canvas>
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
                    <ZoomToggleButton paginator={this.props.paginator} />
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
                <Thumbnail selected={i === this.props.paginator.state.currentPage} paginator={this.props.paginator} key={i} number={i}>{page}</Thumbnail>
            );
        }.bind(this));
        return (
            <div className="pageList">{pages}</div>
        );
    }
});

var Thumbnail = React.createClass({
    selectPage: function() {
        this.props.paginator.setPage(this.props.number);
    },

    render: function() {
        var myClass = 'thumbnail' + (this.props.selected ? ' selected' : '');
        return (
            <div onClick={this.selectPage} className={myClass}>
                <img src={this.props.paginator.getImageUrl(this.props.number, 'thumb')} />
                <div className="number">{this.props.number + 1}</div>
                <div className="label">{this.props.children.label}</div>
            </div>
        );
    }
});

var ZoomToggleButton = React.createClass({
    render: function() {
        return (
            <button onClick={this.props.paginator.toggleZoom}>{this.props.paginator.state.zoom ? 'Turn Zoom Off' : 'Turn Zoom On'}</button>
        );
    }
});